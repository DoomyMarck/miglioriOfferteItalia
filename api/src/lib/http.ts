import { fetch } from "undici";
import { waitForDomainSlot } from "./domainLimiter";

const USER_AGENT = "PriceCompareBot/0.1 (+contact email placeholder)";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export async function fetchHtml(url: string): Promise<string> {
  const parsed = new URL(url);
  await waitForDomainSlot(parsed.hostname);

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        const backoffMs = 300 * (attempt + 1) ** 2;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Fetch failed");
}
