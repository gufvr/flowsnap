import { useMemo } from 'react';
import { copyText } from '../services/copyText';
import {
  downloadTextFile,
  type TextFileDownload,
} from '../services/downloadTextFile';
import { generatePlaywrightTest } from '../shared/playwright/generatePlaywrightTest';
import { GeneratedCodePanel } from './GeneratedCodePanel';

interface PlaywrightCodePanelProps {
  steps: readonly unknown[];
  onClose: () => void;
  onCopy?: (text: string) => Promise<void>;
  onDownload?: (download: TextFileDownload) => void;
}

export function PlaywrightCodePanel({
  steps,
  onClose,
  onCopy = copyText,
  onDownload = downloadTextFile,
}: PlaywrightCodePanelProps) {
  const result = useMemo(() => generatePlaywrightTest(steps), [steps]);

  return (
    <GeneratedCodePanel
      id="playwright-code"
      title="Código Playwright"
      previewLabel="Prévia do código Playwright"
      copiedMessage="Código Playwright copiado"
      downloadedMessage="Arquivo Playwright baixado"
      downloadFileName="flowsnap-playwright.spec.ts"
      result={result}
      onClose={onClose}
      onCopy={onCopy}
      onDownload={onDownload}
    />
  );
}
