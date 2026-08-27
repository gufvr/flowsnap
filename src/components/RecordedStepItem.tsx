import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { resolveStepDescription } from '../shared/descriptions/resolveStepDescription';
import { formatSelector } from '../shared/selectors/formatSelector';
import { resolveRecommendedSelector } from '../shared/selectors/resolveRecommendedSelector';
import { CopySelectorButton } from './CopySelectorButton';
import { InlineConfirmation } from './InlineConfirmation';
import { RecordedStepEditor } from './RecordedStepEditor';

interface RecordedStepItemProps {
  step: unknown;
  stepNumber: number;
  isDeleteConfirmationOpen?: boolean;
  isEditOpen?: boolean;
  isEditSaving?: boolean;
  areMutationsDisabled?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  shouldFocusAfterMove?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRequestEdit?: (trigger: HTMLButtonElement) => void;
  onSaveEdit?: (text: string) => Promise<boolean>;
  onCancelEdit?: () => void;
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

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

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

const EditButton = styled(DeleteButton)`
  color: ${({ theme }) => theme.colors.text};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.success};
  }
`;

const ReorderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const MoveButton = styled(EditButton)`
  flex: 1;
`;

export function RecordedStepItem({
  step,
  stepNumber,
  isDeleteConfirmationOpen = false,
  isEditOpen = false,
  isEditSaving = false,
  areMutationsDisabled = false,
  canMoveUp = false,
  canMoveDown = false,
  shouldFocusAfterMove = false,
  onMoveUp,
  onMoveDown,
  onRequestEdit,
  onSaveEdit,
  onCancelEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: RecordedStepItemProps) {
  const item = useRef<HTMLLIElement>(null);
  const description = resolveStepDescription(step);
  const recommendedSelector = resolveRecommendedSelector(step);
  const formattedSelector = recommendedSelector
    ? formatSelector(recommendedSelector)
    : undefined;

  useEffect(() => {
    if (shouldFocusAfterMove) item.current?.focus();
  }, [shouldFocusAfterMove, stepNumber]);

  return (
    <Item ref={item} tabIndex={-1}>
      {isEditOpen && onSaveEdit && onCancelEdit ? (
        <RecordedStepEditor
          stepNumber={stepNumber}
          initialValue={description.text}
          isSaving={isEditSaving}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <Description>{description.text}</Description>
      )}
      <SelectorRow>
        <SelectorPreview>
          {formattedSelector ?? 'Seletor indisponível'}
        </SelectorPreview>
        <StepActions>
          <CopySelectorButton
            selector={formattedSelector}
            stepNumber={stepNumber}
          />
          {onMoveUp && onMoveDown && (
            <ReorderActions
              role="group"
              aria-label={`Reordenar passo ${stepNumber}`}
            >
              <MoveButton
                type="button"
                aria-label={`Mover passo ${stepNumber} para cima`}
                disabled={areMutationsDisabled || !canMoveUp}
                onClick={onMoveUp}
              >
                Subir
              </MoveButton>
              <MoveButton
                type="button"
                aria-label={`Mover passo ${stepNumber} para baixo`}
                disabled={areMutationsDisabled || !canMoveDown}
                onClick={onMoveDown}
              >
                Descer
              </MoveButton>
            </ReorderActions>
          )}
          {onRequestEdit && (
            <EditButton
              type="button"
              aria-label={`Editar descrição do passo ${stepNumber}`}
              disabled={areMutationsDisabled}
              onClick={(event) => onRequestEdit(event.currentTarget)}
            >
              Editar
            </EditButton>
          )}
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
