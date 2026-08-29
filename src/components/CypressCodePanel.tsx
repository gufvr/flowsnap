import { useMemo } from 'react';
import { copyText } from '../services/copyText';
import {
  downloadTextFile,
  type TextFileDownload,
} from '../services/downloadTextFile';
import { generateCypressTest } from '../shared/cypress/generateCypressTest';
import { GeneratedCodePanel } from './GeneratedCodePanel';

interface CypressCodePanelProps {
  steps: readonly unknown[];
  onClose: () => void;
  onCopy?: (text: string) => Promise<void>;
  onDownload?: (download: TextFileDownload) => void;
}

export function CypressCodePanel({
  steps,
  onClose,
  onCopy = copyText,
  onDownload = downloadTextFile,
}: CypressCodePanelProps) {
  const result = useMemo(() => generateCypressTest(steps), [steps]);

  return (
    <GeneratedCodePanel
      id="cypress-code"
      title="Código Cypress"
      previewLabel="Prévia do código Cypress"
      copiedMessage="Código Cypress copiado"
      downloadedMessage="Arquivo Cypress baixado"
      downloadFileName="flowsnap-cypress.cy.ts"
      result={result}
      onClose={onClose}
      onCopy={onCopy}
      onDownload={onDownload}
    />
  );
}
