import type { UrlAssertionStepDescription } from '../stepDescriptionTypes';

const MAX_DISPLAY_URL_LENGTH = 200;

export interface UrlAssertionDescriptionInput {
  expectedUrl?: string;
}

function formatExpectedUrl(expectedUrl?: string) {
  if (!expectedUrl) return undefined;

  try {
    const url = new URL(expectedUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;

    return `${url.pathname}${url.search}${url.hash}`.slice(
      0,
      MAX_DISPLAY_URL_LENGTH,
    );
  } catch {
    return undefined;
  }
}

export function createUrlAssertionDescription({
  expectedUrl,
}: UrlAssertionDescriptionInput): UrlAssertionStepDescription {
  const displayUrl = formatExpectedUrl(expectedUrl);

  return {
    action: 'urlAssertion',
    text: displayUrl
      ? `Verificou que a URL é "${displayUrl}"`
      : 'Verificou a URL atual',
    locale: 'pt-BR',
  };
}
