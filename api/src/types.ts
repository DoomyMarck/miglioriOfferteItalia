export type Category = {
  id: string;
  label: string;
  emoji: string;
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

export type SourceError = {
  source: string;
  message: string;
};
