import type { InteractionKey } from '../recordingTypes';
import type {
  KeyPressStepDescription,
  StepTargetType,
} from '../stepDescriptionTypes';
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from './resolveDescriptionTarget';

const TARGET_PHRASES: Record<
  StepTargetType,
  { named: string; unnamed: string }
> = {
  button: { named: 'no botão', unnamed: 'em um botão' },
  link: { named: 'no link', unnamed: 'em um link' },
  field: { named: 'no campo', unnamed: 'em um campo' },
  checkbox: {
    named: 'na caixa de seleção',
    unnamed: 'em uma caixa de seleção',
  },
  radio: { named: 'na opção', unnamed: 'em uma opção' },
  select: { named: 'no seletor', unnamed: 'em um seletor' },
  element: { named: 'no elemento', unnamed: 'em um elemento' },
};

export interface KeyPressDescriptionInput extends DescriptionTargetInput {
  key: InteractionKey;
  modifiers?: { shift?: boolean };
}

export function createKeyPressDescription({
  key,
  modifiers,
  ...targetInput
}: KeyPressDescriptionInput): KeyPressStepDescription {
  const { target, source } = resolveDescriptionTarget(targetInput);
  const keyLabel = modifiers?.shift ? `Shift+${key}` : key;
  const targetPhrase = TARGET_PHRASES[target.type];
  const text = target.name
    ? `Pressionou ${keyLabel} ${targetPhrase.named} "${target.name}"`
    : target.type === 'element'
      ? `Pressionou ${keyLabel}`
      : `Pressionou ${keyLabel} ${targetPhrase.unnamed}`;

  return {
    action: 'keyPress',
    target,
    source,
    text,
    locale: 'pt-BR',
  };
}
