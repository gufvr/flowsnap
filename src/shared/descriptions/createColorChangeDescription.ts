import type { RecordedFieldValue } from '../recordingTypes';
import type { ColorChangeStepDescription } from '../stepDescriptionTypes';
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from './resolveDescriptionTarget';

export interface ColorChangeDescriptionInput extends DescriptionTargetInput {
  value: RecordedFieldValue;
}

function getNamedTarget(targetName?: string) {
  return targetName ? `no seletor de cor "${targetName}"` : 'em um seletor de cor';
}

export function createColorChangeDescription({
  value,
  ...targetInput
}: ColorChangeDescriptionInput): ColorChangeStepDescription {
  const { target, source } = resolveDescriptionTarget(targetInput);
  const namedTarget = getNamedTarget(target.name);
  const text =
    value.kind === 'protected'
      ? `Selecionou um valor protegido ${namedTarget}`
      : `Selecionou a cor "${value.value}" ${namedTarget}`;

  return {
    action: 'colorChange',
    target,
    source,
    text,
    locale: 'pt-BR',
  };
}
