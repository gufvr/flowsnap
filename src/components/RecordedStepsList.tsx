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
import { CopyAllSelectorsButton } from './CopyAllSelectorsButton';
import { CypressCodePanel } from './CypressCodePanel';
import { InlineConfirmation } from './InlineConfirmation';
import { PlaywrightCodePanel } from './PlaywrightCodePanel';
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
  onMoveStep?: (fromIndex: number, toIndex: number) => Promise<boolean>;
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

interface MoveFocusRequest {
  toIndex: number;
  stepReference: string;
}

type CodePanelKind = 'cypress' | 'playwright';

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
  margin-bottom: ${({ theme }) => theme.spacing.sm};
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

const ListActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
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

const GenerateButton = styled(ClearButton)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.focus};
  }
`;

const GeneratorLogo = styled.img`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
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
  onMoveStep,
  onClearSteps,
}: RecordedStepsListProps) {
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [editingStep, setEditingStep] = useState<EditingStep>();
  const [localFeedback, setLocalFeedback] = useState<RecordedStepsFeedback>();
  const [moveFocusRequest, setMoveFocusRequest] = useState<MoveFocusRequest>();
  const [activeCodePanel, setActiveCodePanel] = useState<CodePanelKind>();
  const title = useRef<HTMLHeadingElement>(null);
  const playwrightTrigger = useRef<HTMLButtonElement>(null);
  const cypressTrigger = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (steps.length > 0 || !activeCodePanel) return;

    title.current?.focus();
    const closePanel = window.setTimeout(() => setActiveCodePanel(undefined), 0);
    return () => window.clearTimeout(closePanel);
  }, [activeCodePanel, steps.length]);

  function restoreTriggerFocus(trigger: HTMLButtonElement) {
    window.setTimeout(() => trigger.focus(), 0);
  }

  function cancelConfirmation() {
    if (!confirmation) return;

    const { trigger } = confirmation;
    setConfirmation(undefined);
    restoreTriggerFocus(trigger);
  }

  function closeCodePanel(kind: CodePanelKind) {
    setActiveCodePanel(undefined);
    window.setTimeout(() => {
      const trigger =
        kind === 'playwright' ? playwrightTrigger.current : cypressTrigger.current;
      if (trigger?.isConnected) {
        trigger.focus();
      } else {
        title.current?.focus();
      }
    }, 0);
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

  async function moveStep(fromIndex: number, toIndex: number) {
    if (!onMoveStep) return;

    const stepReference = getRecordedStepReference(steps[fromIndex]);
    if (stepReference === undefined) {
      setLocalFeedback({
        type: 'error',
        message: 'Este passo não pode ser movimentado.',
      });
      return;
    }

    setLocalFeedback(undefined);
    const success = await onMoveStep(fromIndex, toIndex);
    if (success) setMoveFocusRequest({ toIndex, stepReference });
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
      : pendingMutation?.type === 'move'
        ? `Movendo passo ${pendingMutation.fromIndex + 1} para a posição ${pendingMutation.toIndex + 1}...`
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
          <Count aria-label={countLabel} aria-live="polite">
            {steps.length}
          </Count>
        </HeaderActions>
      </Header>

      {steps.length > 0 && (
        <ListActions role="group" aria-label="Ações dos passos gravados">
          <CopyAllSelectorsButton steps={steps} />
          <GenerateButton
            ref={playwrightTrigger}
            type="button"
            aria-expanded={activeCodePanel === 'playwright'}
            aria-controls="playwright-code-panel"
            onClick={() => setActiveCodePanel('playwright')}
          >
            <GeneratorLogo
              src="/icons/playwright-logo.svg"
              alt=""
              aria-hidden="true"
            />
            Gerar Playwright
          </GenerateButton>
          <GenerateButton
            ref={cypressTrigger}
            type="button"
            aria-expanded={activeCodePanel === 'cypress'}
            aria-controls="cypress-code-panel"
            onClick={() => setActiveCodePanel('cypress')}
          >
            <GeneratorLogo
              src="/icons/cypress-logo.svg"
              alt=""
              aria-hidden="true"
            />
            Gerar Cypress
          </GenerateButton>
          {onClearSteps && (
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
        </ListActions>
      )}

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
                canMoveUp={index > 0}
                canMoveDown={index < steps.length - 1}
                shouldFocusAfterMove={
                  moveFocusRequest?.toIndex === index &&
                  moveFocusRequest.stepReference ===
                    getRecordedStepReference(step)
                }
                onMoveUp={
                  onMoveStep ? () => void moveStep(index, index - 1) : undefined
                }
                onMoveDown={
                  onMoveStep ? () => void moveStep(index, index + 1) : undefined
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

      {activeCodePanel === 'playwright' && steps.length > 0 && (
        <div id="playwright-code-panel">
          <PlaywrightCodePanel
            steps={steps}
            onClose={() => closeCodePanel('playwright')}
          />
        </div>
      )}
      {activeCodePanel === 'cypress' && steps.length > 0 && (
        <div id="cypress-code-panel">
          <CypressCodePanel
            steps={steps}
            onClose={() => closeCodePanel('cypress')}
          />
        </div>
      )}
    </Card>
  );
}
