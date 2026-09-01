const fixtureRoot = 'http://127.0.0.1:4174/';

function testIdSelector(value: string) {
  return {
    recommended: {
      strategy: 'testId',
      value,
      attribute: 'data-testid',
    },
    alternatives: [],
  };
}

const recordedFlow = [
  {
    schemaVersion: 5,
    type: 'field-fill',
    url: fixtureRoot,
    timestamp: 1,
    selectors: testIdSelector('username'),
    value: { kind: 'plain', value: 'flowsnap-user' },
  },
  {
    schemaVersion: 6,
    type: 'selection-change',
    url: fixtureRoot,
    timestamp: 2,
    selectors: testIdSelector('newsletter'),
    control: { kind: 'checkbox', checked: true },
  },
  {
    schemaVersion: 6,
    type: 'selection-change',
    url: fixtureRoot,
    timestamp: 3,
    selectors: testIdSelector('profile-qa'),
    control: { kind: 'radio', checked: true },
  },
  {
    schemaVersion: 6,
    type: 'selection-change',
    url: fixtureRoot,
    timestamp: 4,
    selectors: testIdSelector('country'),
    control: {
      kind: 'select',
      multiple: false,
      selection: {
        kind: 'plain',
        options: [{ value: 'brazil', label: 'Brazil' }],
      },
    },
  },
  {
    schemaVersion: 7,
    type: 'range-change',
    url: fixtureRoot,
    timestamp: 5,
    selectors: testIdSelector('experience-range'),
    value: { kind: 'plain', value: '13' },
  },
  {
    schemaVersion: 8,
    type: 'color-change',
    url: fixtureRoot,
    timestamp: 6,
    selectors: testIdSelector('color-input'),
    value: { kind: 'plain', value: '#613cb9' },
  },
  {
    schemaVersion: 5,
    type: 'field-fill',
    url: fixtureRoot,
    timestamp: 7,
    selectors: testIdSelector('command'),
    value: { kind: 'plain', value: 'run' },
  },
  {
    schemaVersion: 6,
    type: 'key-press',
    url: fixtureRoot,
    timestamp: 8,
    key: 'Enter',
    selectors: testIdSelector('command'),
  },
  {
    schemaVersion: 4,
    type: 'click',
    url: fixtureRoot,
    timestamp: 9,
    selectors: testIdSelector('complete-flow'),
  },
  {
    schemaVersion: 9,
    type: 'navigation',
    url: `${fixtureRoot}#complete`,
    timestamp: 10,
    fromUrl: fixtureRoot,
    toUrl: `${fixtureRoot}#complete`,
    trigger: 'fragment',
  },
] as const;

const tabUrl = `${fixtureRoot}tab.html`;
const tabNavigationFlow = [
  {
    schemaVersion: 4,
    type: 'click',
    url: tabUrl,
    timestamp: 1,
    selectors: testIdSelector('tab-first'),
  },
  {
    schemaVersion: 4,
    type: 'focus-navigation',
    url: tabUrl,
    timestamp: 2,
    direction: 'forward',
    selectors: testIdSelector('tab-second'),
  },
  {
    schemaVersion: 4,
    type: 'click',
    url: tabUrl,
    timestamp: 3,
    selectors: testIdSelector('tab-complete'),
  },
  {
    schemaVersion: 9,
    type: 'navigation',
    url: `${tabUrl}#complete`,
    timestamp: 4,
    fromUrl: tabUrl,
    toUrl: `${tabUrl}#complete`,
    trigger: 'fragment',
  },
] as const;

const reloadUrl = `${fixtureRoot}reload.html`;
const reloadNavigationFlow = [
  {
    schemaVersion: 10,
    type: 'navigation',
    url: reloadUrl,
    timestamp: 1,
    fromUrl: reloadUrl,
    toUrl: reloadUrl,
    trigger: 'reload',
  },
  {
    schemaVersion: 4,
    type: 'click',
    url: reloadUrl,
    timestamp: 2,
    selectors: testIdSelector('reload-complete'),
  },
  {
    schemaVersion: 9,
    type: 'navigation',
    url: `${reloadUrl}#complete`,
    timestamp: 3,
    fromUrl: reloadUrl,
    toUrl: `${reloadUrl}#complete`,
    trigger: 'fragment',
  },
] as const;

const historyCurrentUrl = `${fixtureRoot}history.html?stage=current`;
const historyOriginUrl = `${fixtureRoot}history.html?stage=origin`;
const historyNavigationFlow = [
  {
    schemaVersion: 9,
    type: 'navigation',
    url: historyOriginUrl,
    timestamp: 1,
    fromUrl: historyCurrentUrl,
    toUrl: historyOriginUrl,
    trigger: 'history-traversal',
  },
  {
    schemaVersion: 4,
    type: 'click',
    url: historyOriginUrl,
    timestamp: 2,
    selectors: testIdSelector('history-complete'),
  },
  {
    schemaVersion: 9,
    type: 'navigation',
    url: `${historyOriginUrl}#complete`,
    timestamp: 3,
    fromUrl: historyOriginUrl,
    toUrl: `${historyOriginUrl}#complete`,
    trigger: 'fragment',
  },
] as const;

export const exportValidationFlows = [
  { name: 'recorded-flow', steps: recordedFlow },
  { name: 'tab-navigation', steps: tabNavigationFlow },
  { name: 'reload-navigation', steps: reloadNavigationFlow },
  { name: 'history-navigation', steps: historyNavigationFlow },
] as const;

const exactUrlAssertion = `${fixtureRoot}?flow=url-assertion#verified`;
const urlAssertionFlow = [
  {
    schemaVersion: 11,
    id: 'url-assertion',
    type: 'assertion',
    url: exactUrlAssertion,
    timestamp: 1,
    assertion: {
      kind: 'url',
      operator: 'equals',
      expected: exactUrlAssertion,
    },
    description: {
      action: 'urlAssertion',
      text: 'Verificou a URL da fixture exportada',
      locale: 'pt-BR',
    },
  },
] as const;

export const playwrightOnlyValidationFlows = [
  { name: 'url-assertion', steps: urlAssertionFlow },
] as const;
