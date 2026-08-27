import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const FEEDBACK_DURATION_MS = 2000;

export interface GeneratedCodeResult {
  code: string;
  totalSteps: number;
  supportedSteps: number;
  unsupportedSteps: number;
}

interface GeneratedCodePanelProps {
  id: string;
  title: string;
  previewLabel: string;
  copiedMessage: string;
  result: GeneratedCodeResult;
  onClose: () => void;
  onCopy: (text: string) => Promise<void>;
}

type CopyStatus = 'idle' | 'copying' | 'success' | 'error';

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.small};

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  line-height: 1.4;
`;

const CodePreview = styled.pre`
  max-height: 320px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  overflow: auto;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
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

const Feedback = styled.span<{ $error?: boolean }>`
  color: ${({ theme, $error }) =>
    $error ? theme.colors.dangerText : theme.colors.successText};
  font-size: 0.75rem;
`;

function formatSummary(
  supportedSteps: number,
  totalSteps: number,
  unsupportedSteps: number,
) {
  const stepsLabel = totalSteps === 1 ? 'passo exportado' : 'passos exportados';
  const todoLabel = unsupportedSteps === 1 ? 'marcado' : 'marcados';
  return `${supportedSteps} de ${totalSteps} ${stepsLabel}; ${unsupportedSteps} ${todoLabel} como TODO.`;
}

export function GeneratedCodePanel({
  id,
  title,
  previewLabel,
  copiedMessage,
  result,
  onClose,
  onCopy,
}: GeneratedCodePanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isCopying = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    titleRef.current?.focus();

    return () => {
      isMounted.current = false;
      clearTimeout(feedbackTimer.current);
    };
  }, []);

  async function handleCopy() {
    if (isCopying.current) return;

    clearTimeout(feedbackTimer.current);
    isCopying.current = true;
    setCopyStatus('copying');

    try {
      await onCopy(result.code);
      if (!isMounted.current) return;

      setCopyStatus('success');
      feedbackTimer.current = setTimeout(
        () => setCopyStatus('idle'),
        FEEDBACK_DURATION_MS,
      );
    } catch {
      if (isMounted.current) setCopyStatus('error');
    } finally {
      isCopying.current = false;
    }
  }

  const titleId = `${id}-title`;

  return (
    <Panel
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <Header>
        <div>
          <Title ref={titleRef} id={titleId} tabIndex={-1}>
            {title}
          </Title>
          <Summary aria-live="polite">
            {formatSummary(
              result.supportedSteps,
              result.totalSteps,
              result.unsupportedSteps,
            )}
          </Summary>
        </div>
        <Button type="button" onClick={onClose}>
          Fechar
        </Button>
      </Header>

      <CodePreview aria-label={previewLabel}>
        <code>{result.code}</code>
      </CodePreview>

      <Actions>
        <Button
          type="button"
          disabled={copyStatus === 'copying'}
          onClick={handleCopy}
        >
          {copyStatus === 'copying' ? 'Copiando...' : 'Copiar código'}
        </Button>
      </Actions>

      {copyStatus === 'success' && (
        <Feedback role="status" aria-live="polite">
          {copiedMessage}
        </Feedback>
      )}
      {copyStatus === 'error' && (
        <Feedback $error role="alert">
          Não foi possível copiar o código
        </Feedback>
      )}
    </Panel>
  );
}
