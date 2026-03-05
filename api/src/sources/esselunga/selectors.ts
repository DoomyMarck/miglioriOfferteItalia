export const esselungaSelectors = {
  promoAnchors: [
    'a[href*="offerte"]',
    'a[href*="volantino"]',
    'a[href*="promozioni"]',
  ],
  titleCandidates: ["h2", "h3", ".title", ".card-title", "strong"],
  dateRegex: /(\d{1,2}[\\/-]\d{1,2}[\\/-]\d{2,4})/g,
};
