import { resolveStepDescription } from '../descriptions/resolveStepDescription';
import { resolveRecommendedSelector } from '../selectors/resolveRecommendedSelector';
import {
  formatJavaScriptString,
  formatPlaywrightLocator,
} from './formatPlaywrightLocator';

export interface PlaywrightGenerationResult {
  code: string;
  totalSteps: number;
  supportedSteps: number;
  unsupportedSteps: number;
}

interface GeneratedStep {
  supported: boolean;
  command: string;
  safeDescription?: string;
  usesNativeInputHelper?: boolean;
  usesPlaywrightExpect?: boolean;
}

type NativeInputType = 'range' | 'color';

const INTERACTION_KEYS = [
  'Enter',
  'Space',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInteractionKey(
  value: unknown,
): value is (typeof INTERACTION_KEYS)[number] {
  return (
    typeof value === 'string' &&
    INTERACTION_KEYS.includes(value as (typeof INTERACTION_KEYS)[number])
  );
}

function todo(message: string, safeDescription?: string): GeneratedStep {
  return {
    supported: false,
    command: `// TODO FlowSnap: ${message}`,
    ...(safeDescription ? { safeDescription } : {}),
  };
}

function resolveLocator(step: unknown) {
  const selector = resolveRecommendedSelector(step);
  return selector ? formatPlaywrightLocator(selector) : undefined;
}

function generateClick(step: unknown) {
  const locator = resolveLocator(step);
  return locator
    ? { supported: true, command: `await ${locator}.click();` }
    : todo('seletor recomendado indisponível para este clique.');
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

  const locator = resolveLocator(step);
  return locator
    ? {
        supported: true,
        command: `await ${locator}.fill(${formatJavaScriptString(value.value)});`,
      }
    : todo('seletor recomendado indisponível para este preenchimento.');
}

function generateSelection(step: Record<string, unknown>) {
  const control = step.control;
  if (!isRecord(control)) {
    return todo('estado final da seleção indisponível.');
  }

  const protectedSelection =
    control.kind === 'select' && isRecord(control.selection)
      ? control.selection
      : undefined;
  if (protectedSelection?.kind === 'protected') {
    return todo(
      'informe a seleção protegida manualmente antes de executar este passo.',
      'Selecionou um valor protegido',
    );
  }
  if (
    protectedSelection?.kind === 'plain' &&
    protectedSelection.truncated === true
  ) {
    return todo(
      'a seleção gravada foi truncada e precisa ser revisada.',
      'Seleção com valores truncados',
    );
  }

  const locator = resolveLocator(step);
  if (!locator) {
    return todo('seletor recomendado indisponível para esta seleção.');
  }

  if (control.kind === 'checkbox' && typeof control.checked === 'boolean') {
    return {
      supported: true,
      command: `await ${locator}.setChecked(${control.checked});`,
    };
  }

  if (control.kind === 'radio' && control.checked === true) {
    return {
      supported: true,
      command: `await ${locator}.setChecked(true);`,
    };
  }

  if (control.kind !== 'select' || !isRecord(control.selection)) {
    return todo('controle de seleção não reconhecido.');
  }

  const selection = control.selection;
  if (selection.kind !== 'plain') {
    return todo('estado final do seletor indisponível.');
  }

  if (!Array.isArray(selection.options)) {
    return todo('opções selecionadas indisponíveis.');
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
    return {
      supported: true,
      command: `await ${locator}.selectOption([${selectedValues
        .map(formatJavaScriptString)
        .join(', ')}]);`,
    };
  }

  if (control.multiple !== false || selectedValues.length !== 1) {
    return todo('estado final do seletor simples não pode ser reproduzido.');
  }

  return {
    supported: true,
    command: `await ${locator}.selectOption(${formatJavaScriptString(selectedValues[0])});`,
  };
}

function generateKeyPress(step: Record<string, unknown>) {
  if (!isInteractionKey(step.key)) {
    return todo('tecla de interação não reconhecida.');
  }

  const locator = resolveLocator(step);
  if (!locator) {
    return todo('seletor recomendado indisponível para esta tecla.');
  }

  const hasShift = isRecord(step.modifiers) && step.modifiers.shift === true;
  const key = hasShift ? `Shift+${step.key}` : step.key;
  return {
    supported: true,
    command: `await ${locator}.press(${formatJavaScriptString(key)});`,
  };
}

function generateFocusNavigation(step: Record<string, unknown>) {
  if (step.direction !== 'forward' && step.direction !== 'backward') {
    return todo('direção da navegação por Tab indisponível.');
  }

  const key = step.direction === 'backward' ? 'Shift+Tab' : 'Tab';
  return {
    supported: true,
    command: `await page.keyboard.press(${formatJavaScriptString(key)});`,
  };
}

function generateNavigation(step: Record<string, unknown>) {
  if (step.trigger === 'reload') {
    return { supported: true, command: 'await page.reload();' };
  }

  if (typeof step.toUrl !== 'string' || !step.toUrl.trim()) {
    return todo('URL final da navegação indisponível.');
  }

  return {
    supported: true,
    command: `await page.waitForURL(${formatJavaScriptString(step.toUrl)});`,
  };
}

function hasValidatedUniqueRecommendedSelector(
  step: Record<string, unknown>,
) {
  if (!isRecord(step.selectors) || !isRecord(step.selectors.recommended)) {
    return false;
  }

  const recommended = step.selectors.recommended;
  const validation = recommended.validation;
  return (
    recommended.isUnique === true &&
    isRecord(validation) &&
    validation.status === 'valid' &&
    validation.matchCount === 1 &&
    validation.matchesTarget === true
  );
}

function generateElementVisibilityAssertion(step: Record<string, unknown>) {
  const assertion = step.assertion;
  if (
    step.schemaVersion !== 12 ||
    !isRecord(assertion) ||
    assertion.kind !== 'element' ||
    assertion.operator !== 'visible'
  ) {
    return todo('verificação de visibilidade incompleta ou inválida.');
  }

  if (!hasValidatedUniqueRecommendedSelector(step)) {
    return todo(
      'seletor recomendado único e validado indisponível para esta verificação de visibilidade.',
    );
  }

  const locator = resolveLocator(step);
  if (!locator) {
    return todo(
      'seletor recomendado inválido para esta verificação de visibilidade.',
    );
  }

  return {
    supported: true,
    command: `await expect(${locator}).toBeVisible();`,
    usesPlaywrightExpect: true,
  };
}

const INVALID_ELEMENT_TEXT_ASSERTION_DESCRIPTION =
  'Verificou o texto exato de um elemento inválido ou incompleto';

function invalidElementTextAssertion() {
  return todo(
    'verificação de texto exato incompleta ou inválida.',
    INVALID_ELEMENT_TEXT_ASSERTION_DESCRIPTION,
  );
}

function isValidExactText(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 && normalized.length <= 200 && value === normalized;
}

function generateElementTextAssertion(step: Record<string, unknown>) {
  const assertion = step.assertion;
  if (
    step.schemaVersion !== 13 ||
    !isRecord(assertion) ||
    assertion.kind !== 'element' ||
    assertion.operator !== 'text-equals' ||
    !isValidExactText(assertion.expected) ||
    !hasValidatedUniqueRecommendedSelector(step)
  ) {
    return invalidElementTextAssertion();
  }

  const locator = resolveLocator(step);
  if (!locator) return invalidElementTextAssertion();

  return {
    supported: true,
    command: `await expect(${locator}).toHaveText(${formatJavaScriptString(assertion.expected)}, { useInnerText: true });`,
    usesPlaywrightExpect: true,
  };
}

function generateUrlAssertion(step: Record<string, unknown>) {
  const assertion = step.assertion;
  if (
    step.schemaVersion !== 11 ||
    !isRecord(assertion) ||
    assertion.kind !== 'url' ||
    assertion.operator !== 'equals' ||
    typeof assertion.expected !== 'string' ||
    assertion.expected !== assertion.expected.trim() ||
    !isHttpUrl(assertion.expected)
  ) {
    return todo('verificação exata de URL incompleta ou inválida.');
  }

  return {
    supported: true,
    command: `await expect(page).toHaveURL(${formatJavaScriptString(assertion.expected)});`,
    usesPlaywrightExpect: true,
  };
}

function isValidNativeInputValue(value: string, inputType: NativeInputType) {
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

  if (value.truncated === true) {
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

  const locator = resolveLocator(step);
  if (!locator) {
    return todo(`seletor recomendado indisponível para este ${controlLabel}.`);
  }

  return {
    supported: true,
    command: `await setNativeInputValue(${locator}, ${formatJavaScriptString(value.value)}, ${formatJavaScriptString(inputType)});`,
    usesNativeInputHelper: true,
  };
}

function generateStep(step: unknown): GeneratedStep {
  if (!isRecord(step) || typeof step.type !== 'string') {
    return todo('registro incompleto ou malformado.');
  }

  if (step.type === 'click') return generateClick(step);
  if (step.type === 'field-fill') return generateFieldFill(step);
  if (step.type === 'selection-change') return generateSelection(step);
  if (step.type === 'key-press') return generateKeyPress(step);
  if (step.type === 'focus-navigation') {
    return generateFocusNavigation(step);
  }
  if (step.type === 'navigation') return generateNavigation(step);
  if (step.type === 'range-change') {
    return generateNativeInputChange(step, 'range');
  }
  if (step.type === 'color-change') {
    return generateNativeInputChange(step, 'color');
  }
  if (step.type === 'assertion') {
    if (step.schemaVersion === 13) {
      return generateElementTextAssertion(step);
    }
    if (step.schemaVersion === 12) {
      return generateElementVisibilityAssertion(step);
    }
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

export function generatePlaywrightTest(
  steps: readonly unknown[],
): PlaywrightGenerationResult {
  const generatedSteps = steps.map(generateStep);
  const usesNativeInputHelper = generatedSteps.some(
    ({ usesNativeInputHelper }) => usesNativeInputHelper,
  );
  const usesPlaywrightExpect = generatedSteps.some(
    ({ usesPlaywrightExpect }) => usesPlaywrightExpect,
  );
  const supportedSteps = generatedSteps.filter(
    ({ supported }) => supported,
  ).length;
  const initialUrl = resolveInitialUrl(steps);
  const initialCommand = initialUrl
    ? `await page.goto(${formatJavaScriptString(initialUrl)});`
    : '// TODO FlowSnap: defina a URL inicial antes de executar o teste.';
  const stepBlocks = generatedSteps.map((generatedStep, index) => {
    const description = sanitizeComment(
      generatedStep.safeDescription ??
        resolveStepDescription(steps[index]).text,
    );
    return [
      `  // Passo ${index + 1}: ${description}`,
      `  ${generatedStep.command}`,
    ].join('\n');
  });
  const body = [
    `  ${initialCommand}`,
    ...stepBlocks.flatMap((block) => ['', block]),
  ];
  const imports = [
    'test',
    ...(usesPlaywrightExpect ? ['expect'] : []),
    ...(usesNativeInputHelper ? ['type Locator'] : []),
  ];

  return {
    code: [
      `import { ${imports.join(', ')} } from "@playwright/test";`,
      ...(usesNativeInputHelper
        ? [
            '',
            'async function setNativeInputValue(',
            '  locator: Locator,',
            '  value: string,',
            '  expectedType: "range" | "color",',
            ') {',
            '  await locator.evaluate(',
            '    (element, nextValue) => {',
            '      if (',
            '        !(element instanceof HTMLInputElement) ||',
            '        element.type !== nextValue.expectedType',
            '      ) {',
            '        throw new Error(`FlowSnap: expected input[type="${nextValue.expectedType}"]`);',
            '      }',
            '',
            '      const valueSetter = Object.getOwnPropertyDescriptor(',
            '        HTMLInputElement.prototype,',
            '        "value",',
            '      )?.set;',
            '      if (!valueSetter) {',
            '        throw new Error("FlowSnap: native input value setter unavailable");',
            '      }',
            '',
            '      valueSetter.call(element, nextValue.value);',
            '      element.dispatchEvent(new Event("input", { bubbles: true }));',
            '      element.dispatchEvent(new Event("change", { bubbles: true }));',
            '    },',
            '    { value, expectedType },',
            '  );',
            '}',
          ]
        : []),
      '',
      'test("fluxo gravado pelo FlowSnap", async ({ page }) => {',
      ...body,
      '});',
    ].join('\n'),
    totalSteps: steps.length,
    supportedSteps,
    unsupportedSteps: steps.length - supportedSteps,
  };
}
