import 'styled-components';
import type { AppTheme } from './styles/theme';

declare module 'styled-components' {
  // Module augmentation requires an interface so styled-components can merge the theme type.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
