import styled from 'styled-components';

interface RecordingButtonProps {
  isRecording: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const Button = styled.button<{ $isRecording: boolean }>`
  width: 100%;
  min-height: 48px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.onAccent};
  background: ${({ theme, $isRecording }) =>
    $isRecording ? theme.colors.danger : theme.colors.success};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 120ms ease,
    filter 120ms ease;

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
`;

export function RecordingButton({
  isRecording,
  isLoading,
  onClick,
}: RecordingButtonProps) {
  return (
    <Button
      type="button"
      $isRecording={isRecording}
      disabled={isLoading}
      onClick={onClick}
    >
      {isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
    </Button>
  );
}
