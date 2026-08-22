interface ClipboardWriter {
  writeText: (text: string) => Promise<void>;
}

export async function copyText(
  text: string,
  clipboard: ClipboardWriter | null | undefined = globalThis.navigator?.clipboard,
) {
  if (!clipboard) {
    throw new Error('A área de transferência não está disponível.');
  }

  await clipboard.writeText(text);
}
