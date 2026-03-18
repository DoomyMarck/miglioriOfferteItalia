import type { SearchResult, SourceAdapter } from "../../types";
import { SourceNotSupportedError } from "../../lib/errors";
import { fetchHtml } from "../../lib/http";
import { extractPromotionsFromHtml } from "./parser";

const ENTRY_URL = "https://www.esselunga.it/it-it/promozioni/volantini.html";
const MAX_DEEP_LINKS = 5;

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

export const esselungaAdapter: SourceAdapter = {
  id: "esselunga",
  label: "Esselunga Volantini",
  supports: { search: true },
  categories: [
    { id: "pasta",     label: "Pasta",     emoji: "🍝" },
    { id: "pane",      label: "Pane",      emoji: "🍞" },
    { id: "carne",     label: "Carne",     emoji: "🥩" },
    { id: "pesce",     label: "Pesce",     emoji: "🐟" },
    { id: "latticini", label: "Latticini", emoji: "🥛" },
    { id: "verdura",   label: "Verdura",   emoji: "🥦" },
    { id: "frutta",    label: "Frutta",    emoji: "🍎" },
    { id: "bevande",   label: "Bevande",   emoji: "🧃" },
    { id: "dolci",     label: "Dolci",     emoji: "🍬" },
    { id: "igiene",    label: "Igiene",    emoji: "🧴" },
  ],
  async search(query: string): Promise<SearchResult[]> {
    const normalizedQuery = normalizeQuery(query);
    const entryHtml = await fetchHtml(ENTRY_URL);
    const promotions = extractPromotionsFromHtml(ENTRY_URL, entryHtml);

    if (promotions.length === 0) {
      // TODO: if this persists, site is likely dynamic and requires browser automation outside MVP scope.
      throw new SourceNotSupportedError();
    }

    const directMatches = promotions.filter((promo) => promo.title.toLowerCase().includes(normalizedQuery));

    if (directMatches.length > 0) {
      return directMatches.map((promo) => ({
        source: "esselunga",
        title: promo.title,
        currency: "EUR",
        valid_from: promo.valid_from,
        valid_to: promo.valid_to,
        url: promo.url,
        scraped_at: new Date().toISOString(),
      }));
    }

    const deepResults: SearchResult[] = [];
    for (const promo of promotions.slice(0, MAX_DEEP_LINKS)) {
      try {
        const deepHtml = await fetchHtml(promo.url);
        if (deepHtml.toLowerCase().includes(normalizedQuery)) {
          deepResults.push({
            source: "esselunga",
            title: `${promo.title} (volantino match)` ,
            currency: "EUR",
            valid_from: promo.valid_from,
            valid_to: promo.valid_to,
            url: promo.url,
            scraped_at: new Date().toISOString(),
          });
        }
      } catch {
        // Skip single deep-link errors and continue with remaining links.
      }
    }

    return deepResults;
  },
};
