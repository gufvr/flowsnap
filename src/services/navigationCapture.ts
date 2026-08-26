import { createNavigationDescription } from '../shared/descriptions/createNavigationDescription';
import type {
  DocumentNavigationTrigger,
  NavigationTrigger,
  RecordedDocumentNavigation,
  RecordedNavigation,
} from '../shared/recordingTypes';

export type SameDocumentNavigationSource = 'fragment' | 'history-api';

export interface SameDocumentNavigationDetails {
  url: string;
  timeStamp: number;
  transitionQualifiers?: readonly string[];
}

export interface CommittedDocumentNavigationDetails
  extends SameDocumentNavigationDetails {
  documentId: string;
  transitionType: string;
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

export function resolveDocumentNavigationTrigger(
  transitionType: string,
  transitionQualifiers: readonly string[] = [],
): DocumentNavigationTrigger {
  if (transitionType === 'reload') return 'reload';

  return transitionQualifiers.includes('forward_back')
    ? 'history-traversal'
    : 'document';
}

export function createRecordedDocumentNavigation(
  fromUrl: string,
  details: CommittedDocumentNavigationDetails,
): RecordedDocumentNavigation {
  const trigger = resolveDocumentNavigationTrigger(
    details.transitionType,
    details.transitionQualifiers,
  );

  return {
    schemaVersion: 10,
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
