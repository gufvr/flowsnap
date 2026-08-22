import type { RecordedFieldValue } from '../recordingTypes';
import type { FieldFillStepDescription } from '../stepDescriptionTypes';
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from './resolveDescriptionTarget';

const MAX_VALUE_PREVIEW_LENGTH = 80;

export interface FieldFillDescriptionInput extends DescriptionTargetInput {
  value: RecordedFieldValue;
}

function getTargetLabel(targetName?: string) {
  return targetName ? `o campo "${targetName}"` : 'um campo';
}

function getValuePreview(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_VALUE_PREVIEW_LENGTH);
}

export function createFieldFillDescription({
  value,
  ...targetInput
}: FieldFillDescriptionInput): FieldFillStepDescription {
  const { target, source } = resolveDescriptionTarget(targetInput);
  const targetLabel = getTargetLabel(target.name);
  let text: string;

  if (value.kind === 'protected') {
    text = `Preencheu ${targetLabel} com um valor protegido`;
  } else if (!value.value) {
    text = `Limpou ${targetLabel}`;
  } else {
    text = `Preencheu ${targetLabel} com "${getValuePreview(value.value)}"`;
  }

  return {
    action: 'fieldFill',
    target,
    source,
    text,
    locale: 'pt-BR',
  };
}
