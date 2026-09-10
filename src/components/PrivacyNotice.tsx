import styled from 'styled-components';
import {
  LOCAL_PRIVACY_POLICY_PATH,
  PUBLIC_PRIVACY_POLICY_URL,
} from '../config/privacyPolicy';

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

const PolicyLinks = styled.p`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export function PrivacyNotice() {
  return (
    <Notice id={RECORDING_PRIVACY_NOTICE_ID} aria-label="Privacidade da gravação">
      <p>
        O FlowSnap registra interações, informações da página, URLs e
        valores não sensíveis localmente no navegador. Campos sensíveis
        reconhecidos são protegidos.
      </p>
      <PolicyLinks>
        <PolicyLink
          href={PUBLIC_PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Saiba como seus dados são tratados online (abre em uma nova aba)"
        >
          Saiba como seus dados são tratados
        </PolicyLink>
        <span aria-hidden="true">·</span>
        <PolicyLink
          href={LOCAL_PRIVACY_POLICY_PATH}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir cópia local da política de privacidade (abre em uma nova aba)"
        >
          Cópia local
        </PolicyLink>
      </PolicyLinks>
    </Notice>
  );
}
