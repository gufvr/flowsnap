import { describe, expect, it } from 'vitest';
import { createClickMessage } from './recorder';

describe('createClickMessage', () => {
  it('creates schema 4 recordings with a persisted description', () => {
    const button = document.createElement('button');
    button.textContent = 'Entrar';
    document.body.append(button);

    const message = createClickMessage(button);

    expect(message).toMatchObject({
      type: 'RECORDED_CLICK',
      payload: {
        schemaVersion: 4,
        element: { tagName: 'button', text: 'Entrar' },
        description: {
          action: 'click',
          target: { type: 'button', name: 'Entrar' },
          source: 'accessibleName',
          text: 'Clicou no botão "Entrar"',
          locale: 'pt-BR',
        },
      },
    });
  });
});
