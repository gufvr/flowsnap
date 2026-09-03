import type { ElementTextAssertionStepDescription } from '../stepDescriptionTypes';
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from './resolveDescriptionTarget';

interface ElementTextAssertionDescriptionInput extends DescriptionTargetInput {
  expectedText?: string;
}

const TARGET_LABELS = {
  button: 'o botão',
  link: 'o link',
  field: 'o campo',
  checkbox: 'a caixa de seleção',
  radio: 'a opção',
  select: 'o seletor',
  element: 'o elemento',
} as const;

export function createElementTextAssertionDescription(
  input: ElementTextAssertionDescriptionInput,
): ElementTextAssertionStepDescription {
  const { target, source } = resolveDescriptionTarget(input);
  const label = TARGET_LABELS[target.type];
  const expectedText = input.expectedText?.trim();
  const expectedLabel = expectedText
    ? ` o texto exato "${expectedText}"`
    : ' o texto exato esperado';

  return {
    action: 'elementTextAssertion',
    target,
    source,
    text: target.name
      ? `Verificou que ${label} "${target.name}" tem${expectedLabel}`
      : `Verificou que ${label} tem${expectedLabel}`,
    locale: 'pt-BR',
  };
}
