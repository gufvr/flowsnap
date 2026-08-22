import styled from 'styled-components';
import { resolveStepDescription } from '../shared/descriptions/resolveStepDescription';

interface RecordedStepItemProps {
  step: unknown;
}

const Item = styled.li`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.45;

  &::marker {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 700;
  }
`;

export function RecordedStepItem({ step }: RecordedStepItemProps) {
  const description = resolveStepDescription(step);

  return <Item>{description.text}</Item>;
}
