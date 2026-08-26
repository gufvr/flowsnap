import { describe, expect, it } from 'vitest';
import { createNavigationDescription } from './createNavigationDescription';

describe('createNavigationDescription', () => {
  it('uses a relative destination for same-origin navigation', () => {
    expect(
      createNavigationDescription({
        fromUrl: 'https://example.com/products?page=1',
        toUrl: 'https://example.com/checkout?step=2#payment',
        trigger: 'history-api',
      }),
    ).toEqual({
      action: 'navigation',
      text: 'Navegou para "/checkout?step=2#payment"',
      locale: 'pt-BR',
    });
  });

  it('describes traversal through the browser history', () => {
    expect(
      createNavigationDescription({
        fromUrl: 'https://example.com/current',
        toUrl: 'https://example.com/previous',
        trigger: 'history-traversal',
      }).text,
    ).toBe('Navegou pelo histórico para "/previous"');
  });

  it('describes a full document reload', () => {
    expect(
      createNavigationDescription({
        fromUrl: 'https://example.com/account',
        toUrl: 'https://example.com/account',
        trigger: 'reload',
      }).text,
    ).toBe('Recarregou "/account"');
  });

  it('falls back safely when the destination is incomplete', () => {
    expect(createNavigationDescription({}).text).toBe(
      'Navegou para uma nova URL',
    );
    expect(
      createNavigationDescription({
        toUrl: 'rota-local',
        trigger: 'fragment',
      }).text,
    ).toBe('Navegou para "rota-local"');
  });
});
