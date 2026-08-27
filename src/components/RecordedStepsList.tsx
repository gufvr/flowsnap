import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type {
  RecordedStepMutation,
  RecordedStepsFeedback,
} from '../hooks/useRecordedSteps';
import {
  getRecordedStepId,
  getRecordedStepReference,
} from '../shared/recordedStepIdentity';
import { InlineConfirmation } from './InlineConfirmation';
import { RecordedStepItem } from './RecordedStepItem';

interface RecordedStepsListProps {
  steps: readonly unknown[];
  isLoading: boolean;
  pendingMutation?: RecordedStepMutation;
  feedback?: RecordedStepsFeedback;
  onDeleteStep?: (stepIndex: number) => Promise<boolean>;
  onEditStep?: (
    stepIndex: number,
    text: string,
    expectedReference: string,
    expectedId?: string,
  ) => Promise<boolean>;
  onClearSteps?: () => Promise<boolean>;
}

type Confirmation =
  | {
      type: 'delete';
      stepIndex: number;
      stepReference: string;
      trigger: HTMLButtonElement;
    }
  | { type: 'clear'; stepCount: number; trigger: HTMLButtonElement };

interface EditingStep {
  stepIndex: number;
  stepReference: string;
  expectedId?: string;
  trigger: HTMLButtonElement;
}

const Card = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Count = styled.span`
  min-width: 28px;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.background};
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 600;
  text-align: center;
`;

const ClearButton = styled.button`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.dangerText};
  background: transparent;
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

const Viewport = styled.div`
  max-height: min(48vh, 420px);
  overflow-y: auto;
  padding: 2px 4px 2px 0;
`;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.xl};
`;

const Feedback = styled.p`
  padding: ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.45;
  text-align: center;
`;

const OperationFeedback = styled.p<{ $error?: boolean }>`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme, $error }) =>
    $error ? theme.colors.dangerText : theme.colors.successText};
  font-size: 0.75rem;
  line-height: 1.4;
`;

function getStepKey(step: unknown, index: number) {
  if (
    typeof step === 'object' &&
    step !== null &&
    'id' in step &&
    typeof step.id === 'string'
  ) {
    return `${step.id}-${index}`;
  }

  return `step-${index}`;
}

function getStepReference(step: unknown, index: number) {
  try {
    return `${index}:${JSON.stringify(step)}`;
  } catch {
    return getStepKey(step, index);
  }
}

export function RecordedStepsList({
  steps,
  isLoading,
  pendingMutation,
  feedback,
  onDeleteStep,
  onEditStep,
  onClearSteps,
}: RecordedStepsListProps) {
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [editingStep, setEditingStep] = useState<EditingStep>();
  const [localFeedback, setLocalFeedback] = useState<RecordedStepsFeedback>();
  const title = useRef<HTMLHeadingElement>(null);
  const countLabel = steps.length === 1 ? '1 passo' : `${steps.length} passos`;
  const areMutationsDisabled = Boolean(pendingMutation);
  const isConfirmationStale = confirmation
    ? confirmation.type === 'clear'
      ? confirmation.stepCount !== steps.length
      : confirmation.stepReference !==
        getStepReference(steps[confirmation.stepIndex], confirmation.stepIndex)
    : false;
  const activeConfirmation = isConfirmationStale ? undefined : confirmation;
  const isOwnEditPending =
    pendingMutation?.type === 'edit' &&
    pendingMutation.stepIndex === editingStep?.stepIndex;
  const isEditingStale = editingStep
    ? !isOwnEditPending &&
      editingStep.stepReference !==
        getRecordedStepReference(steps[editingStep.stepIndex])
    : false;
  const activeEditingStep = isEditingStale ? undefined : editingStep;
  const areMutationTriggersDisabled =
    areMutationsDisabled ||
    Boolean(activeConfirmation) ||
    Boolean(activeEditingStep);

  useEffect(() => {
    if (!isConfirmationStale) return;

    title.current?.focus();
    const resetConfirmation = window.setTimeout(
      () => setConfirmation(undefined),
      0,
    );

    return () => window.clearTimeout(resetConfirmation);
  }, [isConfirmationStale]);

  useEffect(() => {
    if (!isEditingStale) return;

    title.current?.focus();
    const resetEditing = window.setTimeout(() => {
      setEditingStep(undefined);
      setLocalFeedback({
        type: 'error',
        message: 'A lista de passos foi atualizada. Abra a edição novamente.',
      });
    }, 0);

    return () => window.clearTimeout(resetEditing);
  }, [isEditingStale]);

  function restoreTriggerFocus(trigger: HTMLButtonElement) {
    window.setTimeout(() => trigger.focus(), 0);
  }

  function cancelConfirmation() {
    if (!confirmation) return;

    const { trigger } = confirmation;
    setConfirmation(undefined);
    restoreTriggerFocus(trigger);
  }

  function cancelEditing() {
    if (!editingStep) return;

    const { trigger } = editingStep;
    setEditingStep(undefined);
    restoreTriggerFocus(trigger);
  }

  async function saveEditing(text: string) {
    if (!editingStep || !onEditStep) return false;

    const requestedEdit = editingStep;
    const success = await onEditStep(
      requestedEdit.stepIndex,
      text,
      requestedEdit.stepReference,
      requestedEdit.expectedId,
    );

    if (success) {
      setEditingStep(undefined);
      restoreTriggerFocus(requestedEdit.trigger);
    }

    return success;
  }

  function confirmMutation() {
    if (!confirmation) return;

    const requestedMutation = confirmation;
    setConfirmation(undefined);
    title.current?.focus();

    if (requestedMutation.type === 'delete') {
      void onDeleteStep?.(requestedMutation.stepIndex);
      return;
    }

    void onClearSteps?.();
  }

  const pendingMessage =
    pendingMutation?.type === 'delete'
      ? `Excluindo passo ${pendingMutation.stepIndex + 1}...`
      : pendingMutation?.type === 'edit'
        ? `Salvando descrição do passo ${pendingMutation.stepIndex + 1}...`
      : pendingMutation?.type === 'clear'
        ? 'Limpando passos...'
        : undefined;
  const clearConfirmationMessage =
    activeConfirmation?.type === 'clear'
      ? activeConfirmation.stepCount === 1
        ? 'Limpar o passo gravado? Esta ação não pode ser desfeita.'
        : `Limpar todos os ${activeConfirmation.stepCount} passos? Esta ação não pode ser desfeita.`
      : undefined;

  return (
    <Card
      aria-labelledby="recorded-steps-title"
      aria-busy={areMutationsDisabled}
    >
      <Header>
        <Title ref={title} id="recorded-steps-title" tabIndex={-1}>
          Passos gravados
        </Title>
        <HeaderActions>
          {steps.length > 0 && onClearSteps && (
            <ClearButton
              type="button"
              disabled={areMutationTriggersDisabled}
              onClick={(event) =>
                setConfirmation({
                  type: 'clear',
                  stepCount: steps.length,
                  trigger: event.currentTarget,
                })
              }
            >
              Limpar tudo
            </ClearButton>
          )}
          <Count aria-label={countLabel} aria-live="polite">
            {steps.length}
          </Count>
        </HeaderActions>
      </Header>

      {activeConfirmation?.type === 'clear' && (
        <InlineConfirmation
          label="Confirmar limpeza dos passos"
          message={clearConfirmationMessage ?? ''}
          confirmLabel="Limpar tudo"
          onConfirm={confirmMutation}
          onCancel={cancelConfirmation}
        />
      )}

      {pendingMessage && (
        <OperationFeedback role="status" aria-live="polite">
          {pendingMessage}
        </OperationFeedback>
      )}
      {feedback && (
        <OperationFeedback
          $error={feedback.type === 'error'}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'success' ? 'polite' : undefined}
        >
          {feedback.message}
        </OperationFeedback>
      )}
      {!feedback && localFeedback && (
        <OperationFeedback $error role="alert">
          {localFeedback.message}
        </OperationFeedback>
      )}

      {isLoading ? (
        <Feedback role="status">Carregando passos...</Feedback>
      ) : steps.length === 0 ? (
        <Feedback>Nenhum passo gravado ainda.</Feedback>
      ) : (
        <Viewport aria-label="Lista de passos gravados">
          <List>
            {steps.map((step, index) => (
              <RecordedStepItem
                key={getStepKey(step, index)}
                step={step}
                stepNumber={index + 1}
                areMutationsDisabled={areMutationTriggersDisabled}
                isEditOpen={activeEditingStep?.stepIndex === index}
                isEditSaving={
                  pendingMutation?.type === 'edit' &&
                  pendingMutation.stepIndex === index
                }
                isDeleteConfirmationOpen={
                  activeConfirmation?.type === 'delete' &&
                  activeConfirmation.stepIndex === index
                }
                onRequestDelete={
                  onDeleteStep
                    ? (trigger) =>
                        setConfirmation({
                          type: 'delete',
                          stepIndex: index,
                          stepReference: getStepReference(step, index),
                          trigger,
                        })
                    : undefined
                }
                onRequestEdit={
                  onEditStep
                    ? (trigger) => {
                        const stepReference = getRecordedStepReference(step);
                        if (stepReference === undefined) {
                          setLocalFeedback({
                            type: 'error',
                            message: 'Este passo não pode ser editado.',
                          });
                          return;
                        }

                        setLocalFeedback(undefined);
                        setEditingStep({
                          stepIndex: index,
                          stepReference,
                          expectedId: getRecordedStepId(step),
                          trigger,
                        });
                      }
                    : undefined
                }
                onSaveEdit={saveEditing}
                onCancelEdit={cancelEditing}
                onConfirmDelete={confirmMutation}
                onCancelDelete={cancelConfirmation}
              />
            ))}
          </List>
        </Viewport>
      )}
    </Card>
  );
}
