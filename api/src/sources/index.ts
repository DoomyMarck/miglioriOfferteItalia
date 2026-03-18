import type { Category, SourceAdapter } from "../types";
import { esselungaAdapter } from "./esselunga/adapter";
import { mockAdapter } from "./mock/adapter";

const registry = new Map<string, SourceAdapter>([
  [esselungaAdapter.id, esselungaAdapter],
  [mockAdapter.id, mockAdapter],
]);

export function getEnabledSources(ids: string[]): SourceAdapter[] {
  if (ids.length === 0) return Array.from(registry.values());
  return ids.map((id) => registry.get(id)).filter((source): source is SourceAdapter => Boolean(source));
}

export function getCategories(ids: string[]): Category[] {
  const sources = getEnabledSources(ids);
  const seen = new Set<string>();
  const result: Category[] = [];
  for (const source of sources) {
    for (const cat of source.categories) {
      if (!seen.has(cat.id)) {
        seen.add(cat.id);
        result.push(cat);
      }
    }
  }
  return result;
}

export function listSources(): Array<Pick<SourceAdapter, "id" | "label" | "supports">> {
  return Array.from(registry.values()).map((source) => ({
    id: source.id,
    label: source.label,
    supports: source.supports,
  }));
}
