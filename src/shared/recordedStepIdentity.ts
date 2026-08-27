export function getRecordedStepId(step: unknown) {
  if (
    typeof step === 'object' &&
    step !== null &&
    'id' in step &&
    typeof step.id === 'string'
  ) {
    return step.id;
  }

  return undefined;
}

export function getRecordedStepReference(step: unknown) {
  try {
    const serialized = JSON.stringify(step);
    return serialized === undefined ? undefined : serialized;
  } catch {
    return undefined;
  }
}
