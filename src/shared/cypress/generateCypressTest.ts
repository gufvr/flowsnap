import { resolveStepDescription } from '../descriptions/resolveStepDescription';
import {
  formatCypressJavaScriptString,
  resolveCypressLocator,
} from './formatCypressLocator';

export interface CypressGenerationResult {
  code: string;
  totalSteps: number;
  supportedSteps: number;
  unsupportedSteps: number;
}

interface GeneratedStep {
  supported: boolean;
  command: string;
  safeDescription?: string;
  usesLabelHelper?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function todo(message: string, safeDescription?: string): GeneratedStep {
  return {
    supported: false,
    command: `// TODO FlowSnap: ${message}`,
    ...(safeDescription ? { safeDescription } : {}),
  };
}

function supportedCommand(
  command: string,
  usesLabelHelper: boolean,
): GeneratedStep {
  return { supported: true, command, usesLabelHelper };
}

function generateClick(step: unknown) {
  const locator = resolveCypressLocator(step);
  return locator
    ? supportedCommand(`${locator.expression}.click();`, locator.usesLabelHelper)
    : todo('seletor compatível com Cypress indisponível para este clique.');
}

function generateFieldFill(step: Record<string, unknown>) {
  const value = step.value;
  if (!isRecord(value)) {
    return todo('valor do preenchimento indisponível.');
  }

  if (value.kind === 'protected') {
    return todo(
      'informe o valor protegido manualmente antes de executar este passo.',
      'Preencheu um campo com valor protegido',
    );
  }

  if (value.kind !== 'plain') {
    return todo('valor do preenchimento inválido.');
  }

  if (value.truncated === true) {
    return todo(
      'o valor gravado foi truncado e precisa ser revisado.',
      'Preenchimento com valor truncado',
    );
  }

  if (typeof value.value !== 'string') {
    return todo('valor do preenchimento indisponível.');
  }

  const locator = resolveCypressLocator(step);
  if (!locator) {
    return todo(
      'seletor compatível com Cypress indisponível para este preenchimento.',
    );
  }

  const command = value.value
    ? `${locator.expression}.clear().type(${formatCypressJavaScriptString(value.value)}, { parseSpecialCharSequences: false });`
    : `${locator.expression}.clear();`;
  return supportedCommand(command, locator.usesLabelHelper);
}

function generateSelection(step: Record<string, unknown>) {
  const control = step.control;
  if (!isRecord(control)) {
    return todo('estado final da seleção indisponível.');
  }

  const selection =
    control.kind === 'select' && isRecord(control.selection)
      ? control.selection
      : undefined;
  if (selection?.kind === 'protected') {
    return todo(
      'informe a seleção protegida manualmente antes de executar este passo.',
      'Selecionou um valor protegido',
    );
  }
  if (selection?.kind === 'plain' && selection.truncated === true) {
    return todo(
      'a seleção gravada foi truncada e precisa ser revisada.',
      'Seleção com valores truncados',
    );
  }

  const locator = resolveCypressLocator(step);
  if (!locator) {
    return todo(
      'seletor compatível com Cypress indisponível para esta seleção.',
    );
  }

  if (control.kind === 'checkbox' && typeof control.checked === 'boolean') {
    const action = control.checked ? 'check' : 'uncheck';
    return supportedCommand(
      `${locator.expression}.${action}();`,
      locator.usesLabelHelper,
    );
  }

  if (control.kind === 'radio' && control.checked === true) {
    return supportedCommand(
      `${locator.expression}.check();`,
      locator.usesLabelHelper,
    );
  }

  if (control.kind !== 'select' || !selection) {
    return todo('controle de seleção não reconhecido.');
  }

  if (selection.kind !== 'plain' || !Array.isArray(selection.options)) {
    return todo('estado final do seletor indisponível.');
  }

  const values = selection.options.map((option) =>
    isRecord(option) && typeof option.value === 'string'
      ? option.value
      : undefined,
  );
  if (values.some((value) => value === undefined)) {
    return todo('opções selecionadas inválidas.');
  }

  const selectedValues = values as string[];
  if (control.multiple === true) {
    const formattedValues = selectedValues
      .map(formatCypressJavaScriptString)
      .join(', ');
    return supportedCommand(
      `${locator.expression}.select([${formattedValues}]);`,
      locator.usesLabelHelper,
    );
  }

  if (control.multiple !== false || selectedValues.length !== 1) {
    return todo('estado final do seletor simples não pode ser reproduzido.');
  }

  return supportedCommand(
    `${locator.expression}.select(${formatCypressJavaScriptString(selectedValues[0])});`,
    locator.usesLabelHelper,
  );
}

function getProtectedDeferredDescription(
  step: Record<string, unknown>,
  protectedDescription: string,
  truncatedDescription: string,
) {
  const value = step.value;
  if (!isRecord(value)) return undefined;
  if (value.kind === 'protected') return protectedDescription;
  if (value.kind === 'plain' && value.truncated === true) {
    return truncatedDescription;
  }

  return undefined;
}

function generateStep(step: unknown): GeneratedStep {
  if (!isRecord(step) || typeof step.type !== 'string') {
    return todo('registro incompleto ou malformado.');
  }

  if (step.type === 'click') return generateClick(step);
  if (step.type === 'field-fill') return generateFieldFill(step);
  if (step.type === 'selection-change') return generateSelection(step);
  if (step.type === 'focus-navigation') {
    return todo('a exportação de navegação por Tab fica para a Release 1B.');
  }
  if (step.type === 'key-press') {
    return todo('a exportação de teclas fica para a Release 1B.');
  }
  if (step.type === 'navigation') {
    return todo('a exportação de navegação fica para a Release 1B.');
  }
  if (step.type === 'range-change') {
    return todo(
      'a exportação de controles range fica para a Release 1C.',
      getProtectedDeferredDescription(
        step,
        'Ajustou um controle range para um valor protegido',
        'Ajustou um controle range com valor truncado',
      ),
    );
  }
  if (step.type === 'color-change') {
    return todo(
      'a exportação de seletores de cor fica para a Release 1C.',
      getProtectedDeferredDescription(
        step,
        'Selecionou um valor de cor protegido',
        'Selecionou um valor de cor truncado',
      ),
    );
  }

  return todo('tipo de ação ainda não suportado.');
}

function sanitizeComment(text: string) {
  return text.replace(/[\r\n\u2028\u2029]+/g, ' ').trim();
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveInitialUrl(steps: readonly unknown[]) {
  for (const step of steps) {
    if (!isRecord(step)) continue;
    if (step.type === 'navigation' && isHttpUrl(step.fromUrl)) {
      return step.fromUrl;
    }
    if (isHttpUrl(step.url)) return step.url;
  }

  return undefined;
}

export function generateCypressTest(
  steps: readonly unknown[],
): CypressGenerationResult {
  const generatedSteps = steps.map(generateStep);
  const supportedSteps = generatedSteps.filter(
    ({ supported }) => supported,
  ).length;
  const usesLabelHelper = generatedSteps.some(
    ({ supported, usesLabelHelper }) => supported && usesLabelHelper,
  );
  const initialUrl = resolveInitialUrl(steps);
  const initialCommand = initialUrl
    ? `cy.visit(${formatCypressJavaScriptString(initialUrl)});`
    : '// TODO FlowSnap: defina a URL inicial antes de executar o teste.';
  const stepBlocks = generatedSteps.map((generatedStep, index) => {
    const description = sanitizeComment(
      generatedStep.safeDescription ??
        resolveStepDescription(steps[index]).text,
    );
    return [
      `    // Passo ${index + 1}: ${description}`,
      `    ${generatedStep.command}`,
    ].join('\n');
  });
  const body = [
    `    ${initialCommand}`,
    ...stepBlocks.flatMap((block) => ['', block]),
  ];

  return {
    code: [
      ...(usesLabelHelper
        ? [
            'function getByLabel(label: RegExp) {',
            '  return cy.contains("label", label).then(($label) => {',
            '    const control = ($label[0] as HTMLLabelElement).control;',
            '    if (!control) {',
            '      throw new Error("FlowSnap: label sem controle associado");',
            '    }',
            '',
            '    return cy.wrap(control);',
            '  });',
            '}',
            '',
          ]
        : []),
      'describe("fluxo gravado pelo FlowSnap", () => {',
      '  it("reproduz o fluxo gravado", () => {',
      ...body,
      '  });',
      '});',
    ].join('\n'),
    totalSteps: steps.length,
    supportedSteps,
    unsupportedSteps: steps.length - supportedSteps,
  };
}
