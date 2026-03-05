import type { SearchResponse } from "@shared/types";

export type SourceInfo = {
  id: string;
  label: string;
  supports: { search: boolean };
};

export async function fetchSources(): Promise<SourceInfo[]> {
  const res = await fetch("/api/sources");
  if (!res.ok) throw new Error("Unable to load sources");
  const body = (await res.json()) as { sources: SourceInfo[] };
  return body.sources;
}

export async function searchOffers(query: string, sourceIds: string[]): Promise<SearchResponse> {
  const params = new URLSearchParams({ query });
  if (sourceIds.length > 0) params.set("sources", sourceIds.join(","));

  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Search failed");
  }

  return (await res.json()) as SearchResponse;
}
