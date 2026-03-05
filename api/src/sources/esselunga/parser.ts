import { load } from "cheerio";
import { esselungaSelectors } from "./selectors";

export type ParsedPromo = {
  title: string;
  url: string;
  valid_from?: string;
  valid_to?: string;
};

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function parseDates(text: string): { valid_from?: string; valid_to?: string } {
  const matches = text.match(esselungaSelectors.dateRegex) ?? [];
  if (matches.length < 1) return {};

  const normalize = (value: string): string => {
    const [dd, mm, yy] = value.split(/[\/-]/);
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };

  return {
    valid_from: matches[0] ? normalize(matches[0]) : undefined,
    valid_to: matches[1] ? normalize(matches[1]) : undefined,
  };
}

export function extractPromotionsFromHtml(baseUrl: string, html: string): ParsedPromo[] {
  const $ = load(html);
  const dedupe = new Map<string, ParsedPromo>();

  for (const selector of esselungaSelectors.promoAnchors) {
    $(selector).each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const absoluteUrl = new URL(href, baseUrl).toString();
      const rowText = cleanText($(el).closest("article, li, div, section").text());
      const fallbackTitle = cleanText($(el).text()) || "Volantino/Promozione";
      const titleFromBlock = esselungaSelectors.titleCandidates
        .map((tSelector) => cleanText($(el).closest("article, li, div, section").find(tSelector).first().text()))
        .find(Boolean);

      const title = titleFromBlock || fallbackTitle;
      if (!title || title.length < 3) return;

      const parsedDates = parseDates(rowText);
      dedupe.set(absoluteUrl, {
        title,
        url: absoluteUrl,
        ...parsedDates,
      });
    });
  }

  return Array.from(dedupe.values());
}
