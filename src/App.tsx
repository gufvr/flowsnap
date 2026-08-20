import styled from 'styled-components';
import { BrandHeader } from './components/BrandHeader';
import { RecordingButton } from './components/RecordingButton';
import { StatusBanner } from './components/StatusBanner';
import { useRecordingState } from './hooks/useRecordingState';

const Panel = styled.main`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
`;

const RecordingCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
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
  const { isRecording, isLoading, stepCount, error, toggleRecording } =
    useRecordingState();

  return (
    <Panel>
      <BrandHeader />
      <RecordingCard aria-label="Controle de gravação">
        <StatusBanner isRecording={isRecording} isLoading={isLoading} />
        <StepCount>{stepCount} cliques capturados</StepCount>
        {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
        <RecordingButton
          isRecording={isRecording}
          isLoading={isLoading}
          onClick={toggleRecording}
        />
      </RecordingCard>
    </Panel>
  );
}
