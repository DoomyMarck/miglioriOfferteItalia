import { useEffect, useMemo, useState } from "react";
import type { SearchResult, SourceError } from "@shared/types";
import { fetchSources, searchOffers, type SourceInfo } from "./api";

type SortDirection = "asc" | "desc";

const STORAGE_KEYS = {
  shoppingList: "moi-shopping-list",
  selectedSources: "moi-selected-sources",
};

export function App() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [errors, setErrors] = useState<SourceError[]>([]);
  const [shoppingList, setShoppingList] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetchSources()
      .then((items) => {
        setSources(items);
        const fromStorage = localStorage.getItem(STORAGE_KEYS.selectedSources);
        if (!fromStorage) {
          setSelectedSources(items.map((s) => s.id));
          return;
        }
        const parsed = JSON.parse(fromStorage) as string[];
        setSelectedSources(parsed.length ? parsed : items.map((s) => s.id));
      })
      .catch(() => setMessage("Errore caricamento sorgenti"));

    const savedList = localStorage.getItem(STORAGE_KEYS.shoppingList);
    if (savedList) {
      setShoppingList(JSON.parse(savedList) as SearchResult[]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.selectedSources, JSON.stringify(selectedSources));
  }, [selectedSources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.shoppingList, JSON.stringify(shoppingList));
  }, [shoppingList]);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const pA = a.price ?? Number.POSITIVE_INFINITY;
      const pB = b.price ?? Number.POSITIVE_INFINITY;
      return sortDirection === "asc" ? pA - pB : pB - pA;
    });
  }, [results, sortDirection]);

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors([]);

    try {
      const response = await searchOffers(query, selectedSources);
      setResults(response.results);
      setErrors(response.errors);
      if (response.results.length === 0) {
        setMessage("Nessun risultato trovato per la ricerca.");
      }
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Errore inatteso");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSource(id: string) {
    setSelectedSources((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function addToShoppingList(item: SearchResult) {
    setShoppingList((current) => {
      const exists = current.some((entry) => entry.title === item.title && entry.source === item.source);
      if (exists) return current;
      return [...current, item];
    });
  }

  function removeFromShoppingList(item: SearchResult) {
    setShoppingList((current) => current.filter((entry) => !(entry.title === item.title && entry.source === item.source)));
  }

  return (
    <div className="page">
      <header>
        <p className="eyebrow">MVP price scraper</p>
        <h1>Migliori Offerte Italia</h1>
      </header>

      <form className="search-card" onSubmit={onSearch}>
        <label htmlFor="query">Keyword prodotto/offerta</label>
        <div className="row">
          <input
            id="query"
            value={query}
            minLength={2}
            maxLength={60}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="es. pasta, coca cola"
            required
          />
          <button type="submit" disabled={loading || selectedSources.length === 0}>
            {loading ? "Ricerca..." : "Cerca"}
          </button>
        </div>

        <fieldset>
          <legend>Sorgenti</legend>
          <div className="source-grid">
            {sources.map((source) => (
              <label key={source.id}>
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source.id)}
                  onChange={() => toggleSource(source.id)}
                />
                {source.label}
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      {message && <p className="message">{message}</p>}

      {errors.length > 0 && (
        <section className="errors">
          <h2>Problemi sorgenti</h2>
          <ul>
            {errors.map((error) => (
              <li key={`${error.source}-${error.message}`}>
                <strong>{error.source}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="results-card">
        <div className="section-head">
          <h2>Risultati ({sortedResults.length})</h2>
          <button type="button" onClick={() => setSortDirection((s) => (s === "asc" ? "desc" : "asc"))}>
            Ordina prezzo: {sortDirection === "asc" ? "crescente" : "decrescente"}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sorgente</th>
                <th>Titolo</th>
                <th>Prezzo</th>
                <th>Valido da</th>
                <th>Valido a</th>
                <th>Link</th>
                <th>Scraped at</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => (
                <tr key={`${result.source}-${result.title}-${result.url}`}>
                  <td>{result.source}</td>
                  <td>{result.title}</td>
                  <td>{result.price !== undefined ? `${result.price.toFixed(2)} ${result.currency ?? "EUR"} ${result.unit ?? ""}` : "-"}</td>
                  <td>{result.valid_from ?? "-"}</td>
                  <td>{result.valid_to ?? "-"}</td>
                  <td>
                    <a href={result.url} target="_blank" rel="noreferrer">
                      Apri
                    </a>
                  </td>
                  <td>{new Date(result.scraped_at).toLocaleString("it-IT")}</td>
                  <td>
                    <button type="button" onClick={() => addToShoppingList(result)}>
                      Aggiungi alla lista
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="shopping-card">
        <h2>Lista della spesa ({shoppingList.length})</h2>
        {shoppingList.length === 0 ? (
          <p>Ancora vuota.</p>
        ) : (
          <ul>
            {shoppingList.map((item) => (
              <li key={`${item.source}-${item.title}-shopping`}>
                <span>
                  {item.title} - {item.price ? `${item.price.toFixed(2)} EUR` : "prezzo non disponibile"}
                </span>
                <button type="button" onClick={() => removeFromShoppingList(item)}>
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
