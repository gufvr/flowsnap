import { resolveStepDescription } from '../descriptions/resolveStepDescription';
import { formatSelector } from './formatSelector';
import { resolveRecommendedSelector } from './resolveRecommendedSelector';

export interface FormattedRecordedStepSelectors {
  text: string;
  selectorCount: number;
}

export function formatRecordedStepSelectors(
  steps: readonly unknown[],
): FormattedRecordedStepSelectors {
  const entries = steps.flatMap((step, index) => {
    const selector = resolveRecommendedSelector(step);
    if (!selector) return [];

    const description = resolveStepDescription(step);
    return [
      `${index + 1}. ${description.text}\n   Seletor: ${formatSelector(selector)}`,
    ];
  });

  return {
    text:
      entries.length > 0
        ? `FlowSnap — seletores gravados\n\n${entries.join('\n\n')}`
        : '',
    selectorCount: entries.length,
  };
}
