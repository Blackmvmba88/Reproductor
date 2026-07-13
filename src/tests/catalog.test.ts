import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCatalog } from '../api/catalog';

afterEach(() => vi.unstubAllGlobals());

describe('catalog API', () => {
  it('validates and normalizes a healthy response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tracks: [{ id: 'one' }], confidence: 1, evidence: ['verified'] }) }));
    await expect(loadCatalog<{ id: string }>()).resolves.toMatchObject({ tracks: [{ id: 'one' }], confidence: 1, warnings: [] });
  });

  it('rejects malformed data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ songs: [] }) }));
    await expect(loadCatalog()).rejects.toThrow('invalid shape');
  });
});
