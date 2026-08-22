import { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface InlineConfirmationProps {
  label: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.dangerSoft};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Message = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.dangerText};
  font-size: 0.75rem;
  line-height: 1.4;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button<{ $danger?: boolean }>`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme, $danger }) =>
    $danger ? theme.colors.onAccent : theme.colors.text};
  background: ${({ theme, $danger }) =>
    $danger ? theme.colors.danger : theme.colors.surface};
  border: 1px solid
    ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export function InlineConfirmation({
  label,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: InlineConfirmationProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const messageId = `${label.toLocaleLowerCase('pt-BR').replace(/\W+/g, '-')}-message`;

  useEffect(() => {
    cancelButton.current?.focus();
  }, []);

  return (
    <Container
      role="group"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        onCancel();
      }}
    >
      <Message id={messageId}>{message}</Message>
      <Actions>
        <Button
          ref={cancelButton}
          type="button"
          aria-describedby={messageId}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          $danger
          aria-describedby={messageId}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </Actions>
    </Container>
  );
}
