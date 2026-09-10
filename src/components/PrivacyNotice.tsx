import styled from 'styled-components';

export const RECORDING_PRIVACY_NOTICE_ID = 'recording-privacy-notice';

const Notice = styled.aside`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.75rem;
  line-height: 1.5;
  text-align: center;
`;

const PolicyLink = styled.a`
  display: inline-block;
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accentHover};
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

export function PrivacyNotice() {
  return (
    <Notice id={RECORDING_PRIVACY_NOTICE_ID} aria-label="Privacidade da gravação">
      <p>
        O FlowSnap registra interações, informações da página, URLs e
        valores não sensíveis localmente no navegador. Campos sensíveis
        reconhecidos são protegidos.
      </p>
      <PolicyLink
        href="/privacy.html"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Saiba como seus dados são tratados (abre em uma nova aba)"
      >
        Saiba como seus dados são tratados
      </PolicyLink>
    </Notice>
  );
}
