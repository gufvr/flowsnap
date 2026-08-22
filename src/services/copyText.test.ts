import { describe, expect, it, vi } from 'vitest';
import { copyText } from './copyText';

describe('copyText', () => {
  it('writes text to the provided clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await copyText('role=button;name=Entrar', { writeText });

    expect(writeText).toHaveBeenCalledWith('role=button;name=Entrar');
  });

  it('surfaces clipboard write failures', async () => {
    const error = new Error('Clipboard blocked');
    const writeText = vi.fn().mockRejectedValue(error);

    await expect(copyText('css=button', { writeText })).rejects.toBe(error);
  });

  it('reports when the clipboard API is unavailable', async () => {
    await expect(copyText('css=button', null)).rejects.toThrow(
      'A área de transferência não está disponível.',
    );
  });
});
