import type { RecordedFieldValue } from '../recordingTypes';
import type { RangeChangeStepDescription } from '../stepDescriptionTypes';
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from './resolveDescriptionTarget';

export interface RangeChangeDescriptionInput extends DescriptionTargetInput {
  value: RecordedFieldValue;
}

function getTargetLabel(targetName?: string) {
  return targetName
    ? `o controle deslizante "${targetName}"`
    : 'um controle deslizante';
}

export function createRangeChangeDescription({
  value,
  ...targetInput
}: RangeChangeDescriptionInput): RangeChangeStepDescription {
  const { target, source } = resolveDescriptionTarget(targetInput);
  const targetLabel = getTargetLabel(target.name);
  const text =
    value.kind === 'protected'
      ? `Ajustou ${targetLabel} para um valor protegido`
      : `Ajustou ${targetLabel} para "${value.value}"`;

  return {
    action: 'rangeChange',
    target,
    source,
    text,
    locale: 'pt-BR',
  };
}
