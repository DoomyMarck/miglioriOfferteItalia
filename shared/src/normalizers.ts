import type { SearchResult } from "./types.js";

export function normalizePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const normalized = raw
    .replace(/\s+/g, "")
    .replace(/€/g, "")
    .replace(/,/g, ".")
    .match(/\d+(\.\d{1,2})?/);

  return normalized ? Number(normalized[0]) : undefined;
}

export function normalizeUnit(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.toLowerCase().match(/€\s*\/\s*(kg|g|l|ml|pz|pezzo|pezzi)/);
  if (!match) return undefined;
  const unit = match[1] === "pezzo" || match[1] === "pezzi" ? "pz" : match[1];
  return `€/${unit}`;
}

export function isoDateOrUndefined(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (!match) return undefined;

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];

  return `${year}-${month}-${day}`;
}

export function withScrapedAt(partial: Omit<SearchResult, "scraped_at">): SearchResult {
  return {
    ...partial,
    scraped_at: new Date().toISOString(),
  };
}
