import { describe, expect, it } from "vitest";
import { extractPromotionsFromHtml } from "../src/sources/esselunga/parser";

const sampleHtml = `
<section>
  <article>
    <h3>Volantino Marzo</h3>
    <p>Valido dal 01/03/2026 al 15/03/2026</p>
    <a href="/it-it/promozioni/offerte-marzo.html">Scopri tutte le offerte</a>
  </article>
</section>
`;

describe("esselunga parser", () => {
  it("extracts promotions from html", () => {
    const data = extractPromotionsFromHtml("https://www.esselunga.it", sampleHtml);

    expect(data.length).toBe(1);
    expect(data[0].title).toContain("Volantino Marzo");
    expect(data[0].url).toBe("https://www.esselunga.it/it-it/promozioni/offerte-marzo.html");
    expect(data[0].valid_from).toBe("2026-03-01");
  });
});
