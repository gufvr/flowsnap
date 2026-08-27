import { useMemo } from 'react';
import { copyText } from '../services/copyText';
import { generateCypressTest } from '../shared/cypress/generateCypressTest';
import { GeneratedCodePanel } from './GeneratedCodePanel';

interface CypressCodePanelProps {
  steps: readonly unknown[];
  onClose: () => void;
  onCopy?: (text: string) => Promise<void>;
}

export function CypressCodePanel({
  steps,
  onClose,
  onCopy = copyText,
}: CypressCodePanelProps) {
  const result = useMemo(() => generateCypressTest(steps), [steps]);

  return (
    <GeneratedCodePanel
      id="cypress-code"
      title="Código Cypress"
      previewLabel="Prévia do código Cypress"
      copiedMessage="Código Cypress copiado"
      result={result}
      onClose={onClose}
      onCopy={onCopy}
    />
  );
}
