import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { copyText } from '../services/copyText';
import { formatRecordedStepSelectors } from '../shared/selectors/formatRecordedStepSelectors';

const FEEDBACK_DURATION_MS = 2000;

interface CopyAllSelectorsButtonProps {
  steps: readonly unknown[];
  onCopy?: (text: string) => Promise<void>;
}

type CopyStatus = 'idle' | 'copying' | 'success' | 'error';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const Button = styled.button`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.focus};
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

const SuccessFeedback = styled.span`
  color: ${({ theme }) => theme.colors.successText};
  font-size: 0.75rem;
`;

const ErrorFeedback = styled.span`
  color: ${({ theme }) => theme.colors.dangerText};
  font-size: 0.75rem;
`;

export function CopyAllSelectorsButton({
  steps,
  onCopy = copyText,
}: CopyAllSelectorsButtonProps) {
  const formatted = useMemo(() => formatRecordedStepSelectors(steps), [steps]);
  const [status, setStatus] = useState<CopyStatus>('idle');
  const [copiedCount, setCopiedCount] = useState(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isCopying = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      clearTimeout(feedbackTimer.current);
    };
  }, []);

  async function handleCopy() {
    if (!formatted.text || isCopying.current) return;

    clearTimeout(feedbackTimer.current);
    isCopying.current = true;
    setStatus('copying');

    try {
      await onCopy(formatted.text);
      if (!isMounted.current) return;

      setCopiedCount(formatted.selectorCount);
      setStatus('success');
      feedbackTimer.current = setTimeout(
        () => setStatus('idle'),
        FEEDBACK_DURATION_MS,
      );
    } catch {
      if (isMounted.current) setStatus('error');
    } finally {
      isCopying.current = false;
    }
  }

  const successMessage =
    copiedCount === 1
      ? '1 seletor copiado'
      : `${copiedCount} seletores copiados`;

  return (
    <Container>
      <Button
        type="button"
        disabled={!formatted.text || status === 'copying'}
        onClick={handleCopy}
      >
        {status === 'copying' ? 'Copiando...' : 'Copiar seletores'}
      </Button>

      {status === 'success' && (
        <SuccessFeedback role="status" aria-live="polite">
          {successMessage}
        </SuccessFeedback>
      )}
      {status === 'error' && (
        <ErrorFeedback role="alert">
          Não foi possível copiar os seletores
        </ErrorFeedback>
      )}
    </Container>
  );
}
