import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRecordedNavigation,
  resolveNavigationTrigger,
} from './navigationCapture';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('navigationCapture', () => {
  it.each([
    ['fragment', [], 'fragment'],
    ['history-api', [], 'history-api'],
    ['history-api', ['forward_back'], 'history-traversal'],
    ['fragment', ['forward_back'], 'history-traversal'],
  ] as const)(
    'classifies %s with qualifiers %j as %s',
    (source, qualifiers, expected) => {
      expect(resolveNavigationTrigger(source, qualifiers)).toBe(expected);
    },
  );

  it('creates a schema 9 navigation without selectors or history state', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000009',
    );

    const navigation = createRecordedNavigation(
      'https://example.com/#forms',
      {
        url: 'https://example.com/#buttons',
        timeStamp: 123,
        transitionQualifiers: [],
      },
      'fragment',
    );

    expect(navigation).toEqual({
      schemaVersion: 9,
      id: '00000000-0000-4000-8000-000000000009',
      type: 'navigation',
      url: 'https://example.com/#buttons',
      timestamp: 123,
      fromUrl: 'https://example.com/#forms',
      toUrl: 'https://example.com/#buttons',
      trigger: 'fragment',
      description: {
        action: 'navigation',
        text: 'Navegou para "/#buttons"',
        locale: 'pt-BR',
      },
    });
    expect(navigation).not.toHaveProperty('selectors');
    expect(navigation).not.toHaveProperty('state');
  });
});
