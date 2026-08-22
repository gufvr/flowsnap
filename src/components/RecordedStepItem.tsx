import styled from 'styled-components';
import { resolveStepDescription } from '../shared/descriptions/resolveStepDescription';
import { formatSelector } from '../shared/selectors/formatSelector';
import { resolveRecommendedSelector } from '../shared/selectors/resolveRecommendedSelector';
import { CopySelectorButton } from './CopySelectorButton';
import { InlineConfirmation } from './InlineConfirmation';

interface RecordedStepItemProps {
  step: unknown;
  stepNumber: number;
  isDeleteConfirmationOpen?: boolean;
  areMutationsDisabled?: boolean;
  onRequestDelete?: (trigger: HTMLButtonElement) => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
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
  flex: 1;
  min-width: 0;
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.75rem;
  overflow-wrap: anywhere;
`;

const StepActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
`;

const DeleteButton = styled.button`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.dangerText};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.danger};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export function RecordedStepItem({
  step,
  stepNumber,
  isDeleteConfirmationOpen = false,
  areMutationsDisabled = false,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
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
        <StepActions>
          <CopySelectorButton
            selector={formattedSelector}
            stepNumber={stepNumber}
          />
          {onRequestDelete && (
            <DeleteButton
              type="button"
              aria-label={`Excluir passo ${stepNumber}`}
              disabled={areMutationsDisabled}
              onClick={(event) => onRequestDelete(event.currentTarget)}
            >
              Excluir
            </DeleteButton>
          )}
        </StepActions>
      </SelectorRow>
      {isDeleteConfirmationOpen && onConfirmDelete && onCancelDelete && (
        <InlineConfirmation
          label={`Confirmar exclusão do passo ${stepNumber}`}
          message={`Excluir o passo ${stepNumber}? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir passo"
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </Item>
  );
}
