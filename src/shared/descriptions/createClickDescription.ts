import type {
  ClickStepDescription,
  StepTargetType,
} from "../stepDescriptionTypes";
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from "./resolveDescriptionTarget";

const NAMED_ACTIONS: Record<StepTargetType, string> = {
  button: "Clicou no botão",
  link: "Clicou no link",
  field: "Clicou no campo",
  checkbox: "Clicou na caixa de seleção",
  radio: "Clicou na opção",
  select: "Clicou no seletor",
  element: "Clicou no elemento",
};

const UNNAMED_ACTIONS: Record<StepTargetType, string> = {
  button: "Clicou em um botão",
  link: "Clicou em um link",
  field: "Clicou em um campo",
  checkbox: "Clicou em uma caixa de seleção",
  radio: "Clicou em uma opção",
  select: "Clicou em um seletor",
  element: "Clicou em um elemento",
};

export type ClickDescriptionInput = DescriptionTargetInput;

function formatDescription(targetType: StepTargetType, targetName?: string) {
  if (!targetName) return UNNAMED_ACTIONS[targetType];
  return `${NAMED_ACTIONS[targetType]} "${targetName}"`;
}

export function createClickDescription(
  input: ClickDescriptionInput,
): ClickStepDescription {
  const { target, source } = resolveDescriptionTarget(input);

  return {
    action: "click",
    target,
    source,
    text: formatDescription(target.type, target.name),
    locale: "pt-BR",
  };
}
