import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { InMemoryTtlCache } from "../lib/cache";
import { SourceNotSupportedError } from "../lib/errors";
import { isIpAllowed } from "../lib/ipRateLimit";
import { getEnabledSources } from "../sources";
import type { SearchResult, SourceError } from "../types";

const SEARCH_CACHE = new InMemoryTtlCache<{ results: SearchResult[]; errors: SourceError[] }>(5 * 60_000);

function getClientIp(request: HttpRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

function parseSources(rawSources: string | null): string[] {
  if (!rawSources) return [];
  return rawSources
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function validateQuery(query: string | null): string | null {
  if (!query) return "query is required";
  const trimmed = query.trim();
  if (trimmed.length < 2) return "query must be at least 2 characters";
  if (trimmed.length > 60) return "query must be at most 60 characters";
  return null;
}

async function runSourceSearch(query: string, sourceIds: string[], context: InvocationContext) {
  const selectedSources = getEnabledSources(sourceIds);
  const errors: SourceError[] = [];
  const results: SearchResult[] = [];

  await Promise.all(
    selectedSources.map(async (adapter) => {
      try {
        const sourceResults = await adapter.search(query);
        results.push(...sourceResults);
      } catch (error) {
        const message = error instanceof SourceNotSupportedError ? "Source not supported yet" : "Source failed";
        context.log(`source=${adapter.id} error=${error instanceof Error ? error.message : "unknown"}`);
        errors.push({ source: adapter.id, message });
      }
    }),
  );

  return { results, errors };
}

app.http("search", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "search",
  handler: async (request: HttpRequest, context: InvocationContext) => {
    const query = request.query.get("query")?.trim() ?? null;
    const sourceIds = parseSources(request.query.get("sources"));
    const ip = getClientIp(request);

    const validationError = validateQuery(query);
    if (validationError) {
      return {
        status: 400,
        jsonBody: { error: validationError },
      };
    }

    if (!isIpAllowed(ip)) {
      return {
        status: 429,
        jsonBody: { error: "Too many requests" },
      };
    }

    const cacheKey = `${query}|${sourceIds.sort().join(",") || "all"}`;
    const cached = SEARCH_CACHE.get(cacheKey);
    if (cached) {
      return {
        status: 200,
        jsonBody: {
          query,
          sources: sourceIds,
          results: cached.results,
          errors: cached.errors,
          cached: true,
        },
      };
    }

    const search = await runSourceSearch(query!, sourceIds, context);
    SEARCH_CACHE.set(cacheKey, search);

    return {
      status: 200,
      jsonBody: {
        query,
        sources: sourceIds,
        results: search.results,
        errors: search.errors,
        cached: false,
      },
    };
  },
});
