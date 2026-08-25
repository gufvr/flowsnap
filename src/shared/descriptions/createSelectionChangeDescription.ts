import type { RecordedSelectionControl } from '../recordingTypes';
import type { SelectionChangeStepDescription } from '../stepDescriptionTypes';
import {
  resolveDescriptionTarget,
  type DescriptionTargetInput,
} from './resolveDescriptionTarget';

export interface SelectionChangeDescriptionInput
  extends DescriptionTargetInput {
  control: RecordedSelectionControl;
}

function namedTarget(name: string | undefined, fallback: string) {
  return name ? `"${name}"` : fallback;
}

export function createSelectionChangeDescription({
  control,
  ...targetInput
}: SelectionChangeDescriptionInput): SelectionChangeStepDescription {
  const { target, source } = resolveDescriptionTarget(targetInput);
  let text: string;

  if (control.kind === 'checkbox') {
    const action = control.checked ? 'Marcou' : 'Desmarcou';
    text = `${action} a caixa de seleção ${namedTarget(target.name, 'sem nome')}`;
  } else if (control.kind === 'radio') {
    text = `Selecionou a opção ${namedTarget(target.name, 'sem nome')}`;
  } else {
    const selectTarget = target.name
      ? `no seletor "${target.name}"`
      : 'em um seletor';

    if (control.selection.kind === 'protected') {
      text = `Selecionou um valor protegido ${selectTarget}`;
    } else if (control.selection.options.length === 0) {
      text = target.name
        ? `Limpou a seleção do seletor "${target.name}"`
        : 'Limpou a seleção de um seletor';
    } else if (control.selection.options.length === 1) {
      const [{ label, value }] = control.selection.options;
      text = `Selecionou "${label || value}" ${selectTarget}`;
    } else {
      text = `Selecionou ${control.selection.options.length} opções ${selectTarget}`;
    }
  }

  return {
    action: 'selectionChange',
    target,
    source,
    text,
    locale: 'pt-BR',
  };
}
