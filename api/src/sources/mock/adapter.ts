import type { SearchResult, SourceAdapter } from "../../types";

function buildMockResult(query: string, idx: number): SearchResult {
  const price = Number((1.2 + idx * 0.75).toFixed(2));
  const units = ["€/kg", "€/l", "€/pz"];
  return {
    source: "mock",
    title: `${query} - Offerta Mock ${idx + 1}`,
    price,
    currency: "EUR",
    unit: units[idx % units.length],
    valid_from: "2026-03-01",
    valid_to: "2026-03-15",
    url: `https://example.mock/offerte/${idx + 1}`,
    scraped_at: new Date().toISOString(),
  };
}

export const mockAdapter: SourceAdapter = {
  id: "mock",
  label: "Mock Offers",
  supports: { search: true },
  async search(query: string): Promise<SearchResult[]> {
    return Array.from({ length: 8 }, (_, idx) => buildMockResult(query, idx));
  },
};
