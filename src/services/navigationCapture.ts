import { createNavigationDescription } from '../shared/descriptions/createNavigationDescription';
import type {
  NavigationTrigger,
  RecordedNavigation,
} from '../shared/recordingTypes';

export type SameDocumentNavigationSource = 'fragment' | 'history-api';

export interface SameDocumentNavigationDetails {
  url: string;
  timeStamp: number;
  transitionQualifiers?: readonly string[];
}

export function resolveNavigationTrigger(
  source: SameDocumentNavigationSource,
  transitionQualifiers: readonly string[] = [],
): NavigationTrigger {
  return transitionQualifiers.includes('forward_back')
    ? 'history-traversal'
    : source;
}

export function createRecordedNavigation(
  fromUrl: string,
  details: SameDocumentNavigationDetails,
  source: SameDocumentNavigationSource,
): RecordedNavigation {
  const trigger = resolveNavigationTrigger(
    source,
    details.transitionQualifiers,
  );

  return {
    schemaVersion: 9,
    id: crypto.randomUUID(),
    type: 'navigation',
    url: details.url,
    timestamp: details.timeStamp,
    fromUrl,
    toUrl: details.url,
    trigger,
    description: createNavigationDescription({
      fromUrl,
      toUrl: details.url,
      trigger,
    }),
  };
}
