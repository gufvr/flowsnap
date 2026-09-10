import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';
import { PrivacyNotice, RECORDING_PRIVACY_NOTICE_ID } from './PrivacyNotice';
import { theme } from '../styles/theme';

describe('PrivacyNotice', () => {
  it('discloses local processing and links to the packaged privacy policy', () => {
    render(
      <ThemeProvider theme={theme}>
        <PrivacyNotice />
      </ThemeProvider>,
    );

    const notice = screen.getByLabelText('Privacidade da gravação');
    expect(notice).toHaveAttribute('id', RECORDING_PRIVACY_NOTICE_ID);
    expect(notice).toHaveTextContent(
      'O FlowSnap registra interações, informações da página, URLs e valores não sensíveis localmente no navegador.',
    );
    expect(notice).toHaveTextContent(
      'Campos sensíveis reconhecidos são protegidos.',
    );

    const policyLink = screen.getByRole('link', {
      name: 'Saiba como seus dados são tratados (abre em uma nova aba)',
    });
    expect(policyLink).toHaveAttribute('href', '/privacy.html');
    expect(policyLink).toHaveAttribute('target', '_blank');
    expect(policyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
