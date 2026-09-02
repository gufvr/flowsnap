import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { App } from '../../App';
import { theme } from '../../styles/theme';

export function renderSidePanel() {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>,
  );
}

