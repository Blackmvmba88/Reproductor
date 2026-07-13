export type CatalogResponse<T> = { tracks: T[]; confidence: number; evidence: string[]; warnings: string[]; fallbackReason: string | null };

export async function loadCatalog<T>(signal?: AbortSignal): Promise<CatalogResponse<T>> {
  const response = await fetch('/player/library.json', { signal, cache: 'no-cache', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !Array.isArray((body as { tracks?: unknown }).tracks)) throw new Error('Catalog response has an invalid shape');
  const catalog = body as Partial<CatalogResponse<T>> & { tracks: T[] };
  return { tracks: catalog.tracks, confidence: Number(catalog.confidence ?? 0.5), evidence: Array.isArray(catalog.evidence) ? catalog.evidence : [], warnings: Array.isArray(catalog.warnings) ? catalog.warnings : [], fallbackReason: catalog.fallbackReason ?? null };
}
