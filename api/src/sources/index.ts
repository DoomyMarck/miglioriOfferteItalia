import type { SourceAdapter } from "../types";
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

export function listSources(): Array<Pick<SourceAdapter, "id" | "label" | "supports">> {
  return Array.from(registry.values()).map((source) => ({
    id: source.id,
    label: source.label,
    supports: source.supports,
  }));
}
