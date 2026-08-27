import { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  MAX_STEP_DESCRIPTION_LENGTH,
  normalizeStepDescriptionText,
  validateStepDescriptionText,
} from '../shared/descriptions/descriptionOverride';

interface RecordedStepEditorProps {
  stepNumber: number;
  initialValue: string;
  isSaving?: boolean;
  onSave: (text: string) => Promise<boolean>;
  onCancel: () => void;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  font-weight: 600;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 76px;
  resize: vertical;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  line-height: 1.4;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`;

const Details = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.dangerText};
  font-size: 0.75rem;
`;

const Count = styled.span<{ $invalid: boolean }>`
  margin-left: auto;
  color: ${({ theme, $invalid }) =>
    $invalid ? theme.colors.dangerText : theme.colors.textMuted};
  font-size: 0.75rem;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme, $primary }) =>
    $primary ? theme.colors.onAccent : theme.colors.text};
  background: ${({ theme, $primary }) =>
    $primary ? theme.colors.success : theme.colors.surface};
  border: 1px solid
    ${({ theme, $primary }) => ($primary ? theme.colors.success : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export function RecordedStepEditor({
  stepNumber,
  initialValue,
  isSaving = false,
  onSave,
  onCancel,
}: RecordedStepEditorProps) {
  const [value, setValue] = useState(initialValue);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const countId = `${fieldId}-count`;
  const validation = validateStepDescriptionText(value);
  const normalizedInitialValue = normalizeStepDescriptionText(initialValue);
  const normalizedLength = normalizeStepDescriptionText(value).length;
  const isUnchanged =
    validation.valid && validation.text === normalizedInitialValue;
  const error = validation.valid ? undefined : validation.error;

  useEffect(() => {
    textarea.current?.focus();
    textarea.current?.select();
  }, []);

  return (
    <Form
      aria-label={`Editar descrição do passo ${stepNumber}`}
      aria-busy={isSaving}
      onSubmit={(event) => {
        event.preventDefault();
        if (!validation.valid || isUnchanged || isSaving) return;
        void onSave(validation.text);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        onCancel();
      }}
    >
      <Label htmlFor={fieldId}>Descrição do passo {stepNumber}</Label>
      <Textarea
        ref={textarea}
        id={fieldId}
        value={value}
        disabled={isSaving}
        aria-invalid={Boolean(error)}
        aria-describedby={`${error ? `${errorId} ` : ''}${countId}`}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      <Details>
        {error && (
          <ErrorMessage id={errorId} role="alert">
            {error}
          </ErrorMessage>
        )}
        <Count
          id={countId}
          $invalid={normalizedLength > MAX_STEP_DESCRIPTION_LENGTH}
        >
          {normalizedLength}/{MAX_STEP_DESCRIPTION_LENGTH}
        </Count>
      </Details>
      <Actions>
        <Button type="button" disabled={isSaving} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          $primary
          disabled={!validation.valid || isUnchanged || isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </Actions>
    </Form>
  );
}
