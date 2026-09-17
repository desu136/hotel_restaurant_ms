import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadImage } from '@/lib/upload-image';

describe('uploadImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects non-image files before calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    await expect(uploadImage(file)).rejects.toThrow('Only image files are allowed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects files larger than 5MB', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    await expect(uploadImage(file)).rejects.toThrow('Image must be 5MB or smaller');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the Cloudinary URL on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { url: 'https://res.cloudinary.com/demo/image.jpg' } }),
      })
    );
    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    await expect(uploadImage(file)).resolves.toBe('https://res.cloudinary.com/demo/image.jpg');
  });

  it('surfaces the API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Image upload is not configured' }),
      })
    );
    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    await expect(uploadImage(file)).rejects.toThrow('Image upload is not configured');
  });
});
