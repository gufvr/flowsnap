import styled from 'styled-components';
import { RecordedStepItem } from './RecordedStepItem';

interface RecordedStepsListProps {
  steps: readonly unknown[];
  isLoading: boolean;
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

export function RecordedStepsList({
  steps,
  isLoading,
}: RecordedStepsListProps) {
  const countLabel = steps.length === 1 ? '1 passo' : `${steps.length} passos`;

  return (
    <Card aria-labelledby="recorded-steps-title">
      <Header>
        <Title id="recorded-steps-title">Passos gravados</Title>
        <Count aria-label={countLabel} aria-live="polite">
          {steps.length}
        </Count>
      </Header>

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
              />
            ))}
          </List>
        </Viewport>
      )}
    </Card>
  );
}
