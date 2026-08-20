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

export function App() {
  const { isRecording, isLoading, toggleRecording } = useRecordingState();

  return (
    <Panel>
      <BrandHeader />
      <RecordingCard aria-label="Controle de gravação">
        <StatusBanner isRecording={isRecording} isLoading={isLoading} />
        <RecordingButton
          isRecording={isRecording}
          isLoading={isLoading}
          onClick={toggleRecording}
        />
      </RecordingCard>
    </Panel>
  );
}
