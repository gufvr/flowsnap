import { describe, expect, it } from 'vitest';
import { buildSelectorCandidates } from './recorder';

describe('buildSelectorCandidates', () => {
  it('prioritizes test id and accessible button information', () => {
    document.body.innerHTML = `
      <main>
        <button data-testid="save-flow">Salvar fluxo</button>
      </main>
    `;
    const button = document.querySelector('button')!;

    expect(buildSelectorCandidates(button)).toEqual({
      recommended: {
        strategy: 'testId',
        value: 'save-flow',
        score: 100,
        isUnique: true,
      },
      alternatives: [
        {
          strategy: 'role',
          value: 'button:Salvar fluxo',
          score: 90,
          isUnique: true,
        },
        {
          strategy: 'css',
          value: 'button',
          score: 40,
          isUnique: true,
        },
        {
          strategy: 'text',
          value: 'Salvar fluxo',
          score: 60,
          isUnique: false,
        },
      ],
    });
  });

  it('creates a unique fallback path for repeated elements', () => {
    document.body.innerHTML = `
      <nav><a href="/first">Primeiro</a><a href="/second">Segundo</a></nav>
    `;
    const link = document.querySelectorAll('a')[1];

    const analysis = buildSelectorCandidates(link);

    expect(
      [analysis.recommended, ...analysis.alternatives].find(
        ({ strategy }) => strategy === 'css',
      )?.value,
    ).toBe('a:nth-of-type(2)');
  });
});
