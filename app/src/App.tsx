import { useEffect, useMemo, useState } from "react";
import type { SearchResult, SourceError } from "@shared/types";
import { fetchSources, searchOffers, type SourceInfo } from "./api";

type SortDirection = "asc" | "desc";
type ThemeMode = "sunrise" | "slate";
type ShoppingEntry = { item: SearchResult; qty: number };

const STORAGE_KEYS = {
  shoppingList: "moi-shopping-list",
  selectedSources: "moi-selected-sources",
  themeMode: "moi-theme-mode",
};

export function App() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [errors, setErrors] = useState<SourceError[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [message, setMessage] = useState<string>("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("sunrise");

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
      setShoppingList(JSON.parse(savedList) as ShoppingEntry[]);
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.themeMode);
    if (savedTheme === "sunrise" || savedTheme === "slate") {
      setThemeMode(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.selectedSources, JSON.stringify(selectedSources));
  }, [selectedSources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.shoppingList, JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem(STORAGE_KEYS.themeMode, themeMode);
  }, [themeMode]);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const pA = a.price ?? Number.POSITIVE_INFINITY;
      const pB = b.price ?? Number.POSITIVE_INFINITY;
      return sortDirection === "asc" ? pA - pB : pB - pA;
    });
  }, [results, sortDirection]);

  const sourceLabelById = useMemo(() => {
    return sources.reduce<Record<string, string>>((acc, source) => {
      acc[source.id] = source.label;
      return acc;
    }, {});
  }, [sources]);

  const groupedShoppingList = useMemo(() => {
    const groups = new Map<string, ShoppingEntry[]>();
    for (const entry of shoppingList) {
      const bucket = groups.get(entry.item.source) ?? [];
      bucket.push(entry);
      groups.set(entry.item.source, bucket);
    }
    return Array.from(groups.entries());
  }, [shoppingList]);

  const shoppingTotal = useMemo(() => {
    return shoppingList.reduce((acc, e) => acc + (e.item.price ?? 0) * e.qty, 0);
  }, [shoppingList]);

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
      const idx = current.findIndex((e) => e.item.title === item.title && e.item.source === item.source);
      if (idx !== -1) {
        const next = [...current];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...current, { item, qty: 1 }];
    });
  }

  function decrementShoppingList(item: SearchResult) {
    setShoppingList((current) => {
      const idx = current.findIndex((e) => e.item.title === item.title && e.item.source === item.source);
      if (idx === -1) return current;
      const entry = current[idx];
      if (entry.qty <= 1) return current.filter((_, i) => i !== idx);
      const next = [...current];
      next[idx] = { ...entry, qty: entry.qty - 1 };
      return next;
    });
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">MVP price scraper</p>
          <h1>Migliori Offerte Italia</h1>
        </div>
        <div className="theme-switch" role="group" aria-label="Selettore tema">
          <button
            type="button"
            className={themeMode === "sunrise" ? "active" : ""}
            onClick={() => setThemeMode("sunrise")}
          >
            Tema Alba
          </button>
          <button
            type="button"
            className={themeMode === "slate" ? "active" : ""}
            onClick={() => setThemeMode("slate")}
          >
            Tema Ardesia
          </button>
        </div>
      </header>

      <div className="content-layout">
        <main className="main-column">
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
                {loading && <span className="spinner" aria-hidden="true" />}
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
                      <td>{sourceLabelById[result.source] ?? result.source}</td>
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
                          Aggiungi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <aside className="shopping-sidebar">
          <section className="shopping-card">
            <h2>Lista della spesa ({shoppingList.reduce((a, e) => a + e.qty, 0)})</h2>
            {shoppingList.length === 0 ? (
              <p>Ancora vuota.</p>
            ) : (
              <div className="shopping-groups">
                {groupedShoppingList.map(([source, entries]) => {
                  const sourceTotal = entries.reduce((acc, e) => acc + (e.item.price ?? 0) * e.qty, 0);
                  return (
                    <div className="shopping-group" key={source}>
                      <h3>{sourceLabelById[source] ?? source}</h3>
                      <ul>
                        {entries.map((entry) => (
                          <li key={`${entry.item.source}-${entry.item.title}-shopping`}>
                            <span>
                              {entry.item.title}
                              <small>{entry.item.price ? `${(entry.item.price * entry.qty).toFixed(2)} EUR` : "prezzo non disponibile"}</small>
                            </span>
                            <div className="qty-controls">
                              <button type="button" onClick={() => decrementShoppingList(entry.item)}>−</button>
                              <span>{entry.qty}</span>
                              <button type="button" onClick={() => addToShoppingList(entry.item)}>+</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="subtotal">Subtotale: {sourceTotal.toFixed(2)} EUR</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="shopping-total">
              <span>Totale spesa</span>
              <strong>{shoppingTotal.toFixed(2)} EUR</strong>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
