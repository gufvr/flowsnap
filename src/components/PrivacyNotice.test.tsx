import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';
import { PrivacyNotice, RECORDING_PRIVACY_NOTICE_ID } from './PrivacyNotice';
import {
  LOCAL_PRIVACY_POLICY_PATH,
  PUBLIC_PRIVACY_POLICY_URL,
} from '../config/privacyPolicy';
import { theme } from '../styles/theme';

describe('PrivacyNotice', () => {
  it('discloses local processing and links to the public and packaged policies', () => {
    render(
      <ThemeProvider theme={theme}>
        <PrivacyNotice />
      </ThemeProvider>,
    );

    const notice = screen.getByLabelText('Privacidade da gravação');
    expect(notice).toHaveAttribute('id', RECORDING_PRIVACY_NOTICE_ID);
    expect(notice).toHaveTextContent(
      'O StepScript registra interações, informações da página, URLs e valores não sensíveis localmente no navegador.',
    );
    expect(notice).toHaveTextContent(
      'Campos sensíveis reconhecidos são protegidos.',
    );

    const publicPolicyLink = screen.getByRole('link', {
      name: 'Saiba como seus dados são tratados online (abre em uma nova aba)',
    });
    expect(publicPolicyLink).toHaveAttribute(
      'href',
      PUBLIC_PRIVACY_POLICY_URL,
    );
    expect(publicPolicyLink).toHaveAttribute('target', '_blank');
    expect(publicPolicyLink).toHaveAttribute('rel', 'noopener noreferrer');

    const localPolicyLink = screen.getByRole('link', {
      name: 'Abrir cópia local da política de privacidade (abre em uma nova aba)',
    });
    expect(localPolicyLink).toHaveAttribute('href', LOCAL_PRIVACY_POLICY_PATH);
    expect(localPolicyLink).toHaveAttribute('target', '_blank');
    expect(localPolicyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
