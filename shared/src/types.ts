export type Category = {
  id: string;
  label: string;
  emoji: string;
};

export type CategoriesResponse = {
  categories: Category[];
};

export type SearchResult = {
  source: string;
  title: string;
  price?: number;
  currency?: "EUR";
  unit?: string;
  valid_from?: string;
  valid_to?: string;
  url: string;
  scraped_at: string;
};

export interface SourceAdapter {
  id: string;
  label: string;
  supports: { search: boolean };
  categories: Category[];
  search(query: string): Promise<SearchResult[]>;
}

export type SourceDescriptor = Pick<SourceAdapter, "id" | "label" | "supports">;

export type SourceError = {
  source: string;
  message: string;
};

export type SearchResponse = {
  query: string;
  sources: string[];
  results: SearchResult[];
  errors: SourceError[];
  cached: boolean;
};
