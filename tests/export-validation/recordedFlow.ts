const fixtureUrl = 'http://127.0.0.1:4174/';

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

export const recordedFlow = [
  {
    schemaVersion: 5,
    type: 'field-fill',
    url: fixtureUrl,
    timestamp: 1,
    selectors: testIdSelector('username'),
    value: { kind: 'plain', value: 'flowsnap-user' },
  },
  {
    schemaVersion: 6,
    type: 'selection-change',
    url: fixtureUrl,
    timestamp: 2,
    selectors: testIdSelector('newsletter'),
    control: { kind: 'checkbox', checked: true },
  },
  {
    schemaVersion: 6,
    type: 'selection-change',
    url: fixtureUrl,
    timestamp: 3,
    selectors: testIdSelector('profile-qa'),
    control: { kind: 'radio', checked: true },
  },
  {
    schemaVersion: 6,
    type: 'selection-change',
    url: fixtureUrl,
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
    url: fixtureUrl,
    timestamp: 5,
    selectors: testIdSelector('experience-range'),
    value: { kind: 'plain', value: '13' },
  },
  {
    schemaVersion: 8,
    type: 'color-change',
    url: fixtureUrl,
    timestamp: 6,
    selectors: testIdSelector('color-input'),
    value: { kind: 'plain', value: '#613cb9' },
  },
  {
    schemaVersion: 5,
    type: 'field-fill',
    url: fixtureUrl,
    timestamp: 7,
    selectors: testIdSelector('command'),
    value: { kind: 'plain', value: 'run' },
  },
  {
    schemaVersion: 6,
    type: 'key-press',
    url: fixtureUrl,
    timestamp: 8,
    key: 'Enter',
    selectors: testIdSelector('command'),
  },
  {
    schemaVersion: 4,
    type: 'click',
    url: fixtureUrl,
    timestamp: 9,
    selectors: testIdSelector('complete-flow'),
  },
  {
    schemaVersion: 9,
    type: 'navigation',
    url: `${fixtureUrl}#complete`,
    timestamp: 10,
    fromUrl: fixtureUrl,
    toUrl: `${fixtureUrl}#complete`,
    trigger: 'fragment',
  },
] as const;
