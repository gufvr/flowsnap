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
  usesCypressPress?: boolean;
  usesNativeInputHelper?: boolean;
}

type NativeInputType = 'range' | 'color';

interface GenerationContext {
  previousStep?: unknown;
  previousGenerated?: GeneratedStep;
}

const CYPRESS_KEY_CONSTANTS: Record<string, string> = {
  Enter: 'Cypress.Keyboard.Keys.ENTER',
  Space: 'Cypress.Keyboard.Keys.SPACE',
  Escape: 'Cypress.Keyboard.Keys.ESC',
  ArrowUp: 'Cypress.Keyboard.Keys.UP',
  ArrowDown: 'Cypress.Keyboard.Keys.DOWN',
  ArrowLeft: 'Cypress.Keyboard.Keys.LEFT',
  ArrowRight: 'Cypress.Keyboard.Keys.RIGHT',
};

const NAVIGATION_TRIGGERS = new Set([
  'fragment',
  'history-api',
  'history-traversal',
  'document',
  'reload',
]);

const CAUSAL_STEP_TYPES = new Set([
  'click',
  'field-fill',
  'selection-change',
  'focus-navigation',
  'key-press',
]);

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
  usesLabelHelper = false,
  usesCypressPress = false,
  usesNativeInputHelper = false,
): GeneratedStep {
  return {
    supported: true,
    command,
    usesLabelHelper,
    usesCypressPress,
    usesNativeInputHelper,
  };
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

function hasShiftModifier(step: Record<string, unknown>) {
  return isRecord(step.modifiers) && step.modifiers.shift === true;
}

function generateFocusNavigation(step: Record<string, unknown>) {
  if (step.direction === 'backward') {
    return todo(
      'Shift+Tab ainda não pode ser reproduzido com segurança pelo Cypress core.',
    );
  }

  if (step.direction !== 'forward') {
    return todo('direção da navegação por Tab indisponível.');
  }

  const locator = resolveCypressLocator(step);
  const command = [
    'cy.press(Cypress.Keyboard.Keys.TAB);',
    ...(locator ? [`${locator.expression}.should("have.focus");`] : []),
  ].join('\n');
  return supportedCommand(command, locator?.usesLabelHelper, true);
}

function generateKeyPress(step: Record<string, unknown>) {
  if (hasShiftModifier(step)) {
    return todo(
      'teclas com Shift ainda não podem ser reproduzidas com segurança pelo Cypress core.',
    );
  }

  const key = typeof step.key === 'string'
    ? CYPRESS_KEY_CONSTANTS[step.key]
    : undefined;
  if (!key) return todo('tecla de interação não reconhecida.');

  const locator = resolveCypressLocator(step);
  if (!locator) {
    return todo('seletor compatível com Cypress indisponível para esta tecla.');
  }

  return supportedCommand(
    [`${locator.expression}.focus();`, `cy.press(${key});`].join('\n'),
    locator.usesLabelHelper,
    true,
  );
}

function isValidNativeInputValue(
  value: string,
  inputType: NativeInputType,
) {
  if (inputType === 'color') return /^#[\da-f]{6}$/i.test(value);

  return value.trim() !== '' && Number.isFinite(Number(value));
}

function generateNativeInputChange(
  step: Record<string, unknown>,
  inputType: NativeInputType,
) {
  const value = step.value;
  const controlLabel = inputType === 'range' ? 'controle range' : 'seletor de cor';

  if (!isRecord(value)) {
    return todo(`valor do ${controlLabel} indisponível.`);
  }

  if (value.kind === 'protected') {
    return todo(
      `informe o valor protegido do ${controlLabel} manualmente antes de executar este passo.`,
      inputType === 'range'
        ? 'Ajustou um controle range para um valor protegido'
        : 'Selecionou um valor de cor protegido',
    );
  }

  if (value.kind !== 'plain') {
    return todo(`valor do ${controlLabel} inválido.`);
  }

  if (value.kind === 'plain' && value.truncated === true) {
    return todo(
      `o valor gravado do ${controlLabel} foi truncado e precisa ser revisado.`,
      inputType === 'range'
        ? 'Ajustou um controle range com valor truncado'
        : 'Selecionou um valor de cor truncado',
    );
  }

  if (
    typeof value.value !== 'string' ||
    !isValidNativeInputValue(value.value, inputType)
  ) {
    return todo(`valor do ${controlLabel} inválido.`);
  }

  const locator = resolveCypressLocator(step);
  if (!locator) {
    return todo(
      `seletor compatível com Cypress indisponível para este ${controlLabel}.`,
    );
  }

  return supportedCommand(
    `setNativeInputValue(${locator.expression}, ${formatCypressJavaScriptString(value.value)}, ${formatCypressJavaScriptString(inputType)});`,
    locator.usesLabelHelper,
    false,
    true,
  );
}

function wasNavigationProducedByPreviousStep(
  step: Record<string, unknown>,
  context: GenerationContext,
) {
  if (!context.previousGenerated?.supported || !isRecord(context.previousStep)) {
    return false;
  }

  return (
    typeof context.previousStep.type === 'string' &&
    CAUSAL_STEP_TYPES.has(context.previousStep.type) &&
    isHttpUrl(context.previousStep.url) &&
    isHttpUrl(step.fromUrl) &&
    context.previousStep.url === step.fromUrl
  );
}

function generateNavigation(
  step: Record<string, unknown>,
  context: GenerationContext,
) {
  if (!isHttpUrl(step.toUrl)) {
    return todo('URL final da navegação indisponível ou inválida.');
  }

  if (typeof step.trigger !== 'string' || !NAVIGATION_TRIGGERS.has(step.trigger)) {
    return todo('origem da navegação não reconhecida.');
  }

  const formattedUrl = formatCypressJavaScriptString(step.toUrl);
  if (wasNavigationProducedByPreviousStep(step, context)) {
    const message =
      step.trigger === 'reload'
        ? '// FlowSnap: recarregamento produzido pelo passo anterior.'
        : '// FlowSnap: navegação produzida pelo passo anterior.';
    return supportedCommand(
      `${message}\ncy.url().should("eq", ${formattedUrl});`,
    );
  }

  if (step.trigger === 'reload') {
    return supportedCommand('cy.reload();');
  }

  const historyFallback =
    step.trigger === 'history-traversal'
      ? '// FlowSnap: direção do histórico não persistida; reproduzindo o destino diretamente.\n'
      : '';
  return supportedCommand(`${historyFallback}cy.visit(${formattedUrl});`);
}

function generateUrlAssertion(step: Record<string, unknown>) {
  const assertion = step.assertion;
  if (
    step.schemaVersion === 12 &&
    isRecord(assertion) &&
    assertion.kind === 'element' &&
    assertion.operator === 'visible'
  ) {
    return todo(
      'a exportação de verificações de visibilidade ainda não é suportada.',
    );
  }
  if (
    step.schemaVersion !== 11 ||
    !isRecord(assertion) ||
    assertion.kind !== 'url' ||
    assertion.operator !== 'equals' ||
    typeof assertion.expected !== 'string' ||
    assertion.expected !== assertion.expected.trim() ||
    !isHttpUrl(assertion.expected)
  ) {
    return todo(
      'verificação exata de URL incompleta ou inválida.',
      'Verificou uma URL inválida ou incompleta',
    );
  }

  return supportedCommand(
    `cy.url().should("eq", ${formatCypressJavaScriptString(assertion.expected)});`,
  );
}

function generateStep(
  step: unknown,
  context: GenerationContext = {},
): GeneratedStep {
  if (!isRecord(step) || typeof step.type !== 'string') {
    return todo('registro incompleto ou malformado.');
  }

  if (step.type === 'click') return generateClick(step);
  if (step.type === 'field-fill') return generateFieldFill(step);
  if (step.type === 'selection-change') return generateSelection(step);
  if (step.type === 'focus-navigation') return generateFocusNavigation(step);
  if (step.type === 'key-press') return generateKeyPress(step);
  if (step.type === 'navigation') return generateNavigation(step, context);
  if (step.type === 'range-change') {
    return generateNativeInputChange(step, 'range');
  }
  if (step.type === 'color-change') {
    return generateNativeInputChange(step, 'color');
  }
  if (step.type === 'assertion') {
    return generateUrlAssertion(step);
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
  const generatedSteps: GeneratedStep[] = [];
  steps.forEach((step, index) => {
    generatedSteps.push(
      generateStep(step, {
        previousStep: steps[index - 1],
        previousGenerated: generatedSteps[index - 1],
      }),
    );
  });
  const supportedSteps = generatedSteps.filter(
    ({ supported }) => supported,
  ).length;
  const usesLabelHelper = generatedSteps.some(
    ({ supported, usesLabelHelper }) => supported && usesLabelHelper,
  );
  const usesCypressPress = generatedSteps.some(
    ({ supported, usesCypressPress }) => supported && usesCypressPress,
  );
  const usesNativeInputHelper = generatedSteps.some(
    ({ supported, usesNativeInputHelper }) =>
      supported && usesNativeInputHelper,
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
    const command = generatedStep.command
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n');
    return [
      `    // Passo ${index + 1}: ${description}`,
      command,
    ].join('\n');
  });
  const body = [
    `    ${initialCommand}`,
    ...stepBlocks.flatMap((block) => ['', block]),
  ];

  return {
    code: [
      ...(usesCypressPress
        ? ['// Requer Cypress 15.3+ para cy.press().', '']
        : []),
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
      ...(usesNativeInputHelper
        ? [
            'function setNativeInputValue(',
            '  locator: Cypress.Chainable<JQuery<HTMLElement>>,',
            '  value: string,',
            '  expectedType: "range" | "color",',
            ') {',
            '  return locator',
            '    .then(($elements) => {',
            '      const element = $elements[0];',
            '      const InputConstructor =',
            '        element.ownerDocument.defaultView?.HTMLInputElement;',
            '      if (',
            '        !InputConstructor ||',
            '        !(element instanceof InputConstructor) ||',
            '        element.type !== expectedType',
            '      ) {',
            '        throw new Error(`FlowSnap: expected input[type="${expectedType}"]`);',
            '      }',
            '',
            '      const valueSetter = Object.getOwnPropertyDescriptor(',
            '        InputConstructor.prototype,',
            '        "value",',
            '      )?.set;',
            '      if (!valueSetter) {',
            '        throw new Error("FlowSnap: native input value setter unavailable");',
            '      }',
            '',
            '      valueSetter.call(element, value);',
            '    })',
            '    .trigger("input")',
            '    .trigger("change");',
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
