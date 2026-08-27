import styled from 'styled-components';

const Footer = styled.footer`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg}
    ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.6875rem;
  line-height: 1.65;
  text-align: center;
`;

const GithubIcon = styled.svg`
  width: 14px;
  height: 14px;
  margin-right: 4px;
  vertical-align: -2px;
`;

const AuthorLink = styled.a`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  text-decoration: none;
  transition: color 120ms ease;

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

export function AppFooter() {
  return (
    <Footer>
      <p>
        © 2026 FlowSnap. Todos os direitos reservados.
        <br />
        <GithubIcon
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.28-.36 6.72-1.61 6.72-7.25A5.65 5.65 0 0 0 19.22 3.3 5.58 5.58 0 0 0 19.13 1S17.95.64 15 2.48a13.38 13.38 0 0 0-7 0C5.05.64 3.87 1 3.87 1a5.58 5.58 0 0 0-.09 2.3A5.65 5.65 0 0 0 2.28 7.25c0 5.63 3.44 6.88 6.72 7.25A4.8 4.8 0 0 0 8 18v4" />
          <path d="M8 19c-3 .92-3-1.5-4-2" />
        </GithubIcon>
        Desenvolvido por{' '}
        <AuthorLink
          href="https://github.com/gufvr"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub de Gustavo Favero (abre em uma nova aba)"
        >
          Gustavo Favero
        </AuthorLink>
      </p>
    </Footer>
  );
}
