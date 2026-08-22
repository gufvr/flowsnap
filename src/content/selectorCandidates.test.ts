import { describe, expect, it } from 'vitest';
import {
  buildSelectorCandidates,
  isLikelyDynamicId,
} from './selectorCandidates';

function findCandidate(
  analysis: ReturnType<typeof buildSelectorCandidates>,
  strategy: string,
) {
  return [analysis.recommended, ...analysis.alternatives].find(
    (candidate) => candidate.strategy === strategy,
  );
}

describe('buildSelectorCandidates', () => {
  it('preserves and prioritizes each supported test attribute', () => {
    document.body.innerHTML = `
      <button
        data-testid="save-flow"
        data-cy="save-button"
        data-test="save-action"
      >Salvar fluxo</button>
    `;
    const button = document.querySelector('button')!;
    const analysis = buildSelectorCandidates(button);
    const testIdCandidates = [analysis.recommended, ...analysis.alternatives].filter(
      ({ strategy }) => strategy === 'testId',
    );

    expect(testIdCandidates).toEqual([
      {
        strategy: 'testId',
        value: 'save-flow',
        score: 100,
        isUnique: true,
        attribute: 'data-testid',
      },
      {
        strategy: 'testId',
        value: 'save-button',
        score: 98,
        isUnique: true,
        attribute: 'data-cy',
      },
      {
        strategy: 'testId',
        value: 'save-action',
        score: 96,
        isUnique: true,
        attribute: 'data-test',
      },
    ]);
  });

  it('creates a label candidate for an explicit label association', () => {
    document.body.innerHTML = `
      <label for="email-field">E-mail</label>
      <input id="email-field" type="email" />
    `;
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'label')).toEqual({
      strategy: 'label',
      value: 'E-mail',
      score: 85,
      isUnique: true,
    });
  });

  it('creates a label candidate for a wrapped control', () => {
    document.body.innerHTML = `
      <label>
        Senha
        <input type="password" />
      </label>
    `;
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'label')).toMatchObject({
      strategy: 'label',
      value: 'Senha',
      isUnique: true,
    });
  });

  it('penalizes and explains an id that looks generated', () => {
    document.body.innerHTML = `
      <input id="input-1787356814282" />
    `;
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'id')).toEqual({
      strategy: 'id',
      value: 'input-1787356814282',
      score: 30,
      isUnique: true,
      warnings: ['dynamic-id'],
    });
  });

  it('keeps a human-readable unique id at its regular score', () => {
    document.body.innerHTML = '<input id="username" />';
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'id')).toEqual({
      strategy: 'id',
      value: 'username',
      score: 80,
      isUnique: true,
      warnings: undefined,
    });
  });

  it('creates a unique fallback path for repeated elements', () => {
    document.body.innerHTML = `
      <nav><a href="/first">Primeiro</a><a href="/second">Segundo</a></nav>
    `;
    const link = document.querySelectorAll('a')[1];

    expect(findCandidate(buildSelectorCandidates(link), 'css')?.value).toBe(
      'a:nth-of-type(2)',
    );
  });
});

describe('implicit input roles', () => {
  it.each([
    ['button', 'button'],
    ['image', 'button'],
    ['reset', 'button'],
    ['submit', 'button'],
    ['checkbox', 'checkbox'],
    ['email', 'textbox'],
    ['tel', 'textbox'],
    ['text', 'textbox'],
    ['url', 'textbox'],
    ['number', 'spinbutton'],
    ['radio', 'radio'],
    ['range', 'slider'],
    ['search', 'searchbox'],
  ])('maps input type=%s to the %s role', (type, role) => {
    document.body.innerHTML = `
      <input type="${type}" aria-label="Campo ${type}" />
    `;
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'role')).toEqual({
      strategy: 'role',
      value: `${role}:Campo ${type}`,
      score: 90,
      isUnique: true,
    });
  });

  it.each([
    'color',
    'date',
    'datetime-local',
    'file',
    'hidden',
    'month',
    'password',
    'time',
    'week',
  ])('does not create an implicit role for input type=%s', (type) => {
    document.body.innerHTML = `
      <input type="${type}" aria-label="Campo ${type}" />
    `;
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'role')).toBeUndefined();
  });

  it.each(['email', 'search', 'tel', 'text', 'url'])(
    'maps input type=%s with a list attribute to the combobox role',
    (type) => {
      document.body.innerHTML = `
        <input type="${type}" list="options" aria-label="Campo ${type}" />
        <datalist id="options"><option value="Opção" /></datalist>
      `;
      const input = document.querySelector('input')!;

      expect(findCandidate(buildSelectorCandidates(input), 'role')).toEqual({
        strategy: 'role',
        value: `combobox:Campo ${type}`,
        score: 90,
        isUnique: true,
      });
    },
  );

  it.each([
    ['number', 'spinbutton'],
    ['range', 'slider'],
  ])(
    'keeps the %s input role as %s when it has a list attribute',
    (type, role) => {
      document.body.innerHTML = `
        <input type="${type}" list="options" aria-label="Campo ${type}" />
        <datalist id="options"><option value="10" /></datalist>
      `;
      const input = document.querySelector('input')!;

      expect(findCandidate(buildSelectorCandidates(input), 'role')).toMatchObject({
        value: `${role}:Campo ${type}`,
        isUnique: true,
      });
    },
  );

  it('treats a missing input type as text', () => {
    document.body.innerHTML = '<input aria-label="Nome" />';
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'role')).toMatchObject({
      value: 'textbox:Nome',
      isUnique: true,
    });
  });

  it('treats a missing input type with list as a combobox', () => {
    document.body.innerHTML = `
      <input list="names" aria-label="Nome" />
      <datalist id="names"><option value="Ada" /></datalist>
    `;
    const input = document.querySelector('input')!;

    expect(findCandidate(buildSelectorCandidates(input), 'role')).toMatchObject({
      value: 'combobox:Nome',
      isUnique: true,
    });
  });
});

describe('isLikelyDynamicId', () => {
  it.each([
    '550e8400-e29b-41d4-a716-446655440000',
    'input-1787356814282',
    'a8f50c2e83bf4abc',
    'ember1234',
    'react-select-42',
    ':r0:',
  ])('detects %s as dynamic', (id) => {
    expect(isLikelyDynamicId(id)).toBe(true);
  });

  it.each(['username', 'password', 'login-button', 'address-line-2'])(
    'keeps %s as stable',
    (id) => {
      expect(isLikelyDynamicId(id)).toBe(false);
    },
  );
});
