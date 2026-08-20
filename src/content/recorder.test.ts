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
      testId: 'save-flow',
      id: undefined,
      role: 'button',
      accessibleName: 'Salvar fluxo',
      css: 'button',
    });
  });

  it('creates a unique fallback path for repeated elements', () => {
    document.body.innerHTML = `
      <nav><a href="/first">Primeiro</a><a href="/second">Segundo</a></nav>
    `;
    const link = document.querySelectorAll('a')[1];

    expect(buildSelectorCandidates(link).css).toBe('a:nth-of-type(2)');
  });
});
