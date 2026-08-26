import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRecordedDocumentNavigation,
  createRecordedNavigation,
  resolveDocumentNavigationTrigger,
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

  it.each([
    ['reload', [], 'reload'],
    ['link', [], 'document'],
    ['typed', ['forward_back'], 'history-traversal'],
  ] as const)(
    'classifies committed %s navigation with qualifiers %j as %s',
    (transitionType, qualifiers, expected) => {
      expect(
        resolveDocumentNavigationTrigger(transitionType, qualifiers),
      ).toBe(expected);
    },
  );

  it('creates a schema 10 document reload without persisting documentId', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000010',
    );

    const navigation = createRecordedDocumentNavigation(
      'https://example.com/account',
      {
        documentId: 'document-10',
        url: 'https://example.com/account',
        timeStamp: 456,
        transitionType: 'reload',
        transitionQualifiers: [],
      },
    );

    expect(navigation).toEqual({
      schemaVersion: 10,
      id: '00000000-0000-4000-8000-000000000010',
      type: 'navigation',
      url: 'https://example.com/account',
      timestamp: 456,
      fromUrl: 'https://example.com/account',
      toUrl: 'https://example.com/account',
      trigger: 'reload',
      description: {
        action: 'navigation',
        text: 'Recarregou "/account"',
        locale: 'pt-BR',
      },
    });
    expect(navigation).not.toHaveProperty('documentId');
    expect(navigation).not.toHaveProperty('selectors');
  });
});
