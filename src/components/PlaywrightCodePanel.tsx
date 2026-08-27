import { useMemo } from 'react';
import { copyText } from '../services/copyText';
import { generatePlaywrightTest } from '../shared/playwright/generatePlaywrightTest';
import { GeneratedCodePanel } from './GeneratedCodePanel';

interface PlaywrightCodePanelProps {
  steps: readonly unknown[];
  onClose: () => void;
  onCopy?: (text: string) => Promise<void>;
}

export function PlaywrightCodePanel({
  steps,
  onClose,
  onCopy = copyText,
}: PlaywrightCodePanelProps) {
  const result = useMemo(() => generatePlaywrightTest(steps), [steps]);

  return (
    <GeneratedCodePanel
      id="playwright-code"
      title="Código Playwright"
      previewLabel="Prévia do código Playwright"
      copiedMessage="Código Playwright copiado"
      result={result}
      onClose={onClose}
      onCopy={onCopy}
    />
  );
}
