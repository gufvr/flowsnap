import styled from 'styled-components';
import { resolveStepDescription } from '../shared/descriptions/resolveStepDescription';
import { formatSelector } from '../shared/selectors/formatSelector';
import { resolveRecommendedSelector } from '../shared/selectors/resolveRecommendedSelector';
import { CopySelectorButton } from './CopySelectorButton';

interface RecordedStepItemProps {
  step: unknown;
  stepNumber: number;
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

const Description = styled.p`
  margin: 0;
`;

const SelectorRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const SelectorPreview = styled.code`
  min-width: 0;
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.75rem;
  overflow-wrap: anywhere;
`;

export function RecordedStepItem({
  step,
  stepNumber,
}: RecordedStepItemProps) {
  const description = resolveStepDescription(step);
  const recommendedSelector = resolveRecommendedSelector(step);
  const formattedSelector = recommendedSelector
    ? formatSelector(recommendedSelector)
    : undefined;

  return (
    <Item>
      <Description>{description.text}</Description>
      <SelectorRow>
        <SelectorPreview>
          {formattedSelector ?? 'Seletor indisponível'}
        </SelectorPreview>
        <CopySelectorButton
          selector={formattedSelector}
          stepNumber={stepNumber}
        />
      </SelectorRow>
    </Item>
  );
}
