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
