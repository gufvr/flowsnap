import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadTextFile } from './downloadTextFile';

describe('downloadTextFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads the exact TypeScript content and releases temporary resources', () => {
    const code = 'test("fluxo", async () => {});';
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob).toBeInstanceOf(Blob);
      return 'blob:flowsnap-test';
    });
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    downloadTextFile(
      { content: code, fileName: 'flowsnap-playwright.spec.ts' },
      {
        Blob,
        document,
        URL: { createObjectURL, revokeObjectURL },
      },
    );

    const blob = createObjectURL.mock.calls[0][0];
    const clickedAnchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob).toHaveProperty('size', code.length);
    expect(blob).toHaveProperty('type', 'text/typescript;charset=utf-8');
    expect(clickedAnchor).toMatchObject({
      download: 'flowsnap-playwright.spec.ts',
      href: 'blob:flowsnap-test',
    });
    expect(clickedAnchor?.isConnected).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:flowsnap-test');
  });

  it('rejects unsafe names before creating an object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:unsafe');

    expect(() =>
      downloadTextFile(
        { content: 'code', fileName: '../unsafe.spec.ts' },
        {
          Blob,
          document,
          URL: { createObjectURL, revokeObjectURL: vi.fn() },
        },
      ),
    ).toThrow('O nome do arquivo para download é inválido.');
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('releases the object URL and surfaces click failures', () => {
    const revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('Download blocked');
    });

    expect(() =>
      downloadTextFile(
        { content: 'code', fileName: 'flowsnap-cypress.cy.ts' },
        {
          Blob,
          document,
          URL: {
            createObjectURL: () => 'blob:blocked',
            revokeObjectURL,
          },
        },
      ),
    ).toThrow('Download blocked');
    expect(document.querySelector('a[download="flowsnap-cypress.cy.ts"]'))
      .not.toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:blocked');
  });
});
