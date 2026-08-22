import type {
  FocusNavigationStepDescription,
  StepTargetType,
} from "../stepDescriptionTypes";
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from "./resolveDescriptionTarget";

const NAMED_ACTIONS: Record<StepTargetType, string> = {
  button: "Navegou para o botão",
  link: "Navegou para o link",
  field: "Navegou para o campo",
  checkbox: "Navegou para a caixa de seleção",
  radio: "Navegou para a opção",
  select: "Navegou para o seletor",
  element: "Navegou para o elemento",
};

const UNNAMED_ACTIONS: Record<StepTargetType, string> = {
  button: "Navegou para um botão",
  link: "Navegou para um link",
  field: "Navegou para um campo",
  checkbox: "Navegou para uma caixa de seleção",
  radio: "Navegou para uma opção",
  select: "Navegou para um seletor",
  element: "Navegou para um elemento",
};

function formatDescription(targetType: StepTargetType, targetName?: string) {
  if (!targetName) return UNNAMED_ACTIONS[targetType];
  return `${NAMED_ACTIONS[targetType]} "${targetName}"`;
}

export function createFocusNavigationDescription(
  input: DescriptionTargetInput,
): FocusNavigationStepDescription {
  const { target, source } = resolveDescriptionTarget(input);

  return {
    action: "focusNavigation",
    target,
    source,
    text: formatDescription(target.type, target.name),
    locale: "pt-BR",
  };
}
