import { describe, expect, it } from 'vitest';
import { validateSelectorCandidate } from './selectorValidation';

describe('validateSelectorCandidate', () => {
  it('marks a candidate as valid when it only matches the target', () => {
    document.body.innerHTML = '<button data-testid="save">Salvar</button>';
    const button = document.querySelector('button')!;

    expect(
      validateSelectorCandidate(
        {
          strategy: 'testId',
          attribute: 'data-testid',
          value: 'save',
          score: 100,
        },
        button,
      ),
    ).toMatchObject({
      isUnique: true,
      validation: {
        status: 'valid',
        matchCount: 1,
        matchesTarget: true,
      },
    });
  });

  it('marks a candidate as ambiguous when it matches the target and siblings', () => {
    document.body.innerHTML = `
      <button data-testid="action">Salvar</button>
      <button data-testid="action">Cancelar</button>
    `;
    const target = document.querySelector('button')!;

    expect(
      validateSelectorCandidate(
        {
          strategy: 'testId',
          attribute: 'data-testid',
          value: 'action',
          score: 100,
        },
        target,
      ),
    ).toMatchObject({
      isUnique: false,
      validation: {
        status: 'ambiguous',
        matchCount: 2,
        matchesTarget: true,
      },
    });
  });

  it('marks a candidate as invalid when it resolves to a different element', () => {
    document.body.innerHTML = `
      <button class="first">Primeiro</button>
      <button class="target">Alvo</button>
    `;
    const target = document.querySelector('.target')!;

    expect(
      validateSelectorCandidate(
        { strategy: 'css', value: '.first', score: 40 },
        target,
      ).validation,
    ).toEqual({
      status: 'invalid',
      matchCount: 1,
      matchesTarget: false,
    });
  });

  it('handles an invalid CSS selector without interrupting the recording', () => {
    document.body.innerHTML = '<button>Alvo</button>';
    const target = document.querySelector('button')!;

    expect(
      validateSelectorCandidate(
        { strategy: 'css', value: 'button[', score: 40 },
        target,
      ).validation,
    ).toEqual({
      status: 'invalid',
      matchCount: 0,
      matchesTarget: false,
    });
  });

  it('rejects text that belongs to a label instead of the target input', () => {
    document.body.innerHTML = `
      <label for="email">E-mail</label>
      <input id="email" type="email" />
    `;
    const input = document.querySelector('input')!;

    expect(
      validateSelectorCandidate(
        { strategy: 'text', value: 'E-mail', score: 60 },
        input,
      ).validation,
    ).toMatchObject({
      status: 'invalid',
      matchesTarget: false,
    });
  });

  it('validates a role using its accessible name', () => {
    document.body.innerHTML = '<button aria-label="Salvar fluxo"></button>';
    const button = document.querySelector('button')!;

    expect(
      validateSelectorCandidate(
        {
          strategy: 'role',
          role: 'button',
          name: 'Salvar fluxo',
          value: 'button:Salvar fluxo',
          score: 90,
        },
        button,
      ),
    ).toMatchObject({
      isUnique: true,
      validation: {
        status: 'valid',
        matchCount: 1,
        matchesTarget: true,
      },
    });
  });
});
