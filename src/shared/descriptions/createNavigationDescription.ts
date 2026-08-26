import type {
  DocumentNavigationTrigger,
  NavigationTrigger,
} from '../recordingTypes';
import type { NavigationStepDescription } from '../stepDescriptionTypes';

const MAX_DESTINATION_LENGTH = 200;

export interface NavigationDescriptionInput {
  fromUrl?: string;
  toUrl?: string;
  trigger?: NavigationTrigger | DocumentNavigationTrigger;
}

function formatDestination(fromUrl?: string, toUrl?: string) {
  if (!toUrl) return undefined;

  try {
    const destination = new URL(toUrl);
    const origin = fromUrl ? new URL(fromUrl).origin : undefined;
    const displayValue =
      origin === destination.origin
        ? `${destination.pathname}${destination.search}${destination.hash}`
        : destination.href;

    return displayValue.slice(0, MAX_DESTINATION_LENGTH);
  } catch {
    return toUrl.trim().slice(0, MAX_DESTINATION_LENGTH) || undefined;
  }
}

export function createNavigationDescription({
  fromUrl,
  toUrl,
  trigger,
}: NavigationDescriptionInput): NavigationStepDescription {
  const destination = formatDestination(fromUrl, toUrl);
  let text: string;

  if (trigger === 'reload') {
    text = destination
      ? `Recarregou "${destination}"`
      : 'Recarregou a página';
  } else if (trigger === 'history-traversal') {
    text = destination
      ? `Navegou pelo histórico para "${destination}"`
      : 'Navegou pelo histórico';
  } else {
    text = destination
      ? `Navegou para "${destination}"`
      : 'Navegou para uma nova URL';
  }

  return { action: 'navigation', text, locale: 'pt-BR' };
}
