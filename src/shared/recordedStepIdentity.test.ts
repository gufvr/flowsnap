import { describe, expect, it } from 'vitest';
import {
  getRecordedStepId,
  getRecordedStepReference,
} from './recordedStepIdentity';

describe('recordedStepIdentity', () => {
  it('reads stable ids and snapshots legacy records', () => {
    expect(getRecordedStepId({ id: 'step-1' })).toBe('step-1');
    expect(getRecordedStepId({ type: 'click' })).toBeUndefined();
    expect(getRecordedStepReference({ type: 'click', value: 1 })).toBe(
      '{"type":"click","value":1}',
    );
  });

  it('fails safely for values that cannot be serialized', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(getRecordedStepReference(circular)).toBeUndefined();
    expect(getRecordedStepReference(undefined)).toBeUndefined();
  });
});
