import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    min-width: 280px;
    min-height: 100%;
    margin: 0;
  }

  body {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  p {
    margin: 0;
  }
`;
