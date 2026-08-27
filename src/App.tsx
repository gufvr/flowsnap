import styled from 'styled-components';
import { AppFooter } from './components/AppFooter';
import { BrandHeader } from './components/BrandHeader';
import { RecordedStepsList } from './components/RecordedStepsList';
import { RecordingButton } from './components/RecordingButton';
import { StatusBanner } from './components/StatusBanner';
import { useRecordingState } from './hooks/useRecordingState';
import { useRecordedSteps } from './hooks/useRecordedSteps';
import { closeSidePanel } from './services/closeSidePanel';

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
`;

const Content = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const RecordingCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const StepCount = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.small};
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.dangerText};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.4;
  text-align: center;
`;

export function App() {
  const { isRecording, isLoading, error, toggleRecording } =
    useRecordingState();
  const {
    steps,
    isLoading: areStepsLoading,
    pendingMutation,
    feedback: stepsFeedback,
    removeStep,
    editStepDescription,
    moveStep,
    clearSteps,
  } = useRecordedSteps();
  const stepCountLabel =
    steps.length === 1 ? '1 passo capturado' : `${steps.length} passos capturados`;

  return (
    <Panel>
      <BrandHeader onClose={closeSidePanel} />
      <Content>
        <RecordingCard aria-label="Controle de gravação">
          <StatusBanner isRecording={isRecording} isLoading={isLoading} />
          <StepCount>{stepCountLabel}</StepCount>
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
          <RecordingButton
            isRecording={isRecording}
            isLoading={isLoading}
            onClick={toggleRecording}
          />
        </RecordingCard>
        <RecordedStepsList
          steps={steps}
          isLoading={areStepsLoading}
          pendingMutation={pendingMutation}
          feedback={stepsFeedback}
          onDeleteStep={removeStep}
          onEditStep={editStepDescription}
          onMoveStep={moveStep}
          onClearSteps={clearSteps}
        />
      </Content>
      <AppFooter />
    </Panel>
  );
}
