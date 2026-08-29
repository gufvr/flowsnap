export interface TextFileDownload {
  content: string;
  fileName: string;
}

interface DownloadEnvironment {
  Blob: typeof Blob;
  document: Document;
  URL: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;
}

const TYPESCRIPT_MIME_TYPE = 'text/typescript;charset=utf-8';
const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,127}$/i;

function isSafeFileName(fileName: string) {
  return SAFE_FILE_NAME.test(fileName) && !fileName.includes('..');
}

export function downloadTextFile(
  { content, fileName }: TextFileDownload,
  environment: DownloadEnvironment = {
    Blob: globalThis.Blob,
    document: globalThis.document,
    URL: globalThis.URL,
  },
) {
  if (!isSafeFileName(fileName)) {
    throw new Error('O nome do arquivo para download é inválido.');
  }

  if (
    !environment.Blob ||
    !environment.document?.body ||
    typeof environment.URL?.createObjectURL !== 'function' ||
    typeof environment.URL?.revokeObjectURL !== 'function'
  ) {
    throw new Error('O download de arquivos não está disponível.');
  }

  const blob = new environment.Blob([content], { type: TYPESCRIPT_MIME_TYPE });
  const objectUrl = environment.URL.createObjectURL(blob);
  const anchor = environment.document.createElement('a');
  anchor.download = fileName;
  anchor.href = objectUrl;
  anchor.hidden = true;
  environment.document.body.append(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    environment.URL.revokeObjectURL(objectUrl);
  }
}
