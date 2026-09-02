import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createRecorderController } from '../../content/recorder';
import { createChromeExtensionHarness } from '../../test/chromeExtensionHarness';
import { createPracticePage } from '../support/practicePage';
import { renderSidePanel } from '../support/renderSidePanel';
import { useRecordingFlowTestContext } from '../support/recordingFlowTestContext';

describe('integrated recording flow', () => {
  const context = useRecordingFlowTestContext();

  it('records and deduplicates same-document navigation in the active top frame', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );

    context.harness.emitReferenceFragmentUpdated(
      'https://qapracticehub.com/#buttons',
      { timeStamp: 10 },
    );
    context.harness.emitHistoryStateUpdated(
      'https://qapracticehub.com/products?view=grid',
      { timeStamp: 20 },
    );
    context.harness.emitHistoryStateUpdated(
      'https://qapracticehub.com/#forms',
      { timeStamp: 30, transitionQualifiers: ['forward_back'] },
    );
    context.harness.emitReferenceFragmentUpdated(
      'https://qapracticehub.com/#forms',
      { timeStamp: 31, transitionQualifiers: ['forward_back'] },
    );
    context.harness.emitHistoryStateUpdated(
      'https://qapracticehub.com/ignored-frame',
      { frameId: 2, timeStamp: 40 },
    );

    expect(
      await screen.findByText('Navegou para "/#buttons"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Navegou para "/products?view=grid"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Navegou pelo histórico para "/#forms"'),
    ).toBeInTheDocument();
    expect(screen.getByText('3 passos capturados')).toBeInTheDocument();
    expect(screen.getAllByText('Seletor indisponível')).toHaveLength(3);

    const storedSteps = context.harness.getLocalValues().recordedSteps as Array<{
      fromUrl: string;
      toUrl: string;
      trigger: string;
    }>;
    expect(
      storedSteps.map(({ fromUrl, toUrl, trigger }) => ({
        fromUrl,
        toUrl,
        trigger,
      })),
    ).toEqual([
      {
        fromUrl: 'https://qapracticehub.com/#forms',
        toUrl: 'https://qapracticehub.com/#buttons',
        trigger: 'fragment',
      },
      {
        fromUrl: 'https://qapracticehub.com/#buttons',
        toUrl: 'https://qapracticehub.com/products?view=grid',
        trigger: 'history-api',
      },
      {
        fromUrl: 'https://qapracticehub.com/products?view=grid',
        toUrl: 'https://qapracticehub.com/#forms',
        trigger: 'history-traversal',
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    const installedHarness = context.harness;
    const readsBeforeStoppedNavigation = installedHarness.localGet.mock.calls.length;
    context.harness.emitReferenceFragmentUpdated(
      'https://qapracticehub.com/#stopped',
    );
    await waitFor(() => {
      expect(installedHarness.localGet).toHaveBeenCalledTimes(
        readsBeforeStoppedNavigation + 1,
      );
      expect(installedHarness.getLocalValues().recordedSteps).toHaveLength(3);
    });
  });

  it('records complete navigation and reload while resuming capture in each document', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );

    context.harness.emitCommitted('https://qapracticehub.com/account', {
      documentId: 'document-account',
      timeStamp: 100,
      transitionType: 'link',
    });
    const accountController = createRecorderController((message) =>
      context.harness?.sendFromTab(message),
    );
    context.harness.connectRecorder(accountController);
    context.practicePage = createPracticePage(accountController);
    context.harness.emitDOMContentLoaded('https://qapracticehub.com/account', {
      documentId: 'document-account',
      timeStamp: 110,
    });

    expect(
      await screen.findByText('Navegou para "/account"'),
    ).toBeInTheDocument();
    await waitFor(() => expect(accountController.isActive).toBe(true));
    await user.click(context.practicePage.login);
    expect(
      await screen.findByText('Clicou no botão "Login"'),
    ).toBeInTheDocument();

    context.harness.emitCommitted('https://qapracticehub.com/account', {
      documentId: 'document-reload',
      timeStamp: 200,
      transitionType: 'reload',
    });
    context.practicePage.root.remove();
    const reloadController = createRecorderController((message) =>
      context.harness?.sendFromTab(message),
    );
    context.harness.connectRecorder(reloadController);
    context.practicePage = createPracticePage(reloadController);
    context.harness.emitCompleted('https://qapracticehub.com/account', {
      documentId: 'document-reload',
      timeStamp: 220,
    });

    expect(
      await screen.findByText('Recarregou "/account"'),
    ).toBeInTheDocument();
    await waitFor(() => expect(reloadController.isActive).toBe(true));
    await user.click(context.practicePage.username);

    expect(
      await screen.findByText('Clicou no campo "Username"'),
    ).toBeInTheDocument();
    expect(screen.getByText('4 passos capturados')).toBeInTheDocument();
    expect(context.harness.executeScript).toHaveBeenCalledTimes(3);
    expect(context.harness.getLocalValues().recordingState).toMatchObject({
      isRecording: true,
      currentUrl: 'https://qapracticehub.com/account',
      currentDocumentId: 'document-reload',
      recorderDocumentId: 'document-reload',
    });
    expect(
      (
        context.harness.getLocalValues().recordedSteps as Array<{
          schemaVersion: number;
          type: string;
        }>
      ).map(({ schemaVersion, type }) => ({ schemaVersion, type })),
    ).toEqual([
      { schemaVersion: 10, type: 'navigation' },
      { schemaVersion: 4, type: 'click' },
      { schemaVersion: 10, type: 'navigation' },
      { schemaVersion: 4, type: 'click' },
    ]);
  });
});

