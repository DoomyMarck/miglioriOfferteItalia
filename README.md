# Migliori Offerte Italia (MVP)

Web app MVP pubblicabile su Azure Static Web Apps per ricerca offerte con scraping server-side "gentile" da pagine pubbliche.

## Cosa fa

- Frontend React + Vite (`app/`)
- API Azure Functions (`api/`)
- Tipi/normalizzazione condivisi (`shared/`)
- Endpoint:
  - `GET /api/health` -> `{ ok: true }`
  - `GET /api/sources` -> elenco sorgenti attive
  - `GET /api/search?query=pasta&sources=esselunga,mock`
- Lista spesa salvata in `localStorage`
- Preferenze sorgenti salvate in `localStorage`

## Compliance e limiti MVP

- Nessun bypass di CAPTCHA, login, paywall.
- User-Agent esplicito: `PriceCompareBot/0.1 (+contact email placeholder)`.
- Timeout 10s, retry con backoff (2 tentativi extra).
- Rate limit semplice:
  - per IP su API search
  - per dominio sorgente (1 req/sec)
- Cache in memoria 5 minuti su `(query,sources)`.
- Se una sorgente e troppo dinamica/non parseabile: errore `Source not supported yet`.

## Struttura

- `app/`: frontend Vite + React
- `api/`: Azure Functions HTTP
- `shared/`: type e normalizers
- `README.md`

## Local development

Prerequisiti:

- Node.js 20+
- Azure Functions Core Tools (`func`)
- SWA CLI (installata da dependency dev root)

Comandi:

```bash
npm install
npm run dev
npm run dev:swa
```

Note:

- `npm run dev` avvia solo frontend su Vite.
- `npm run dev:swa` avvia frontend + API insieme con Static Web Apps CLI.

## Test

```bash
npm run test
```

Copertura MVP:

- normalizzazione prezzo/unita
- parser base Esselunga su HTML fixture

## Deploy su Azure Static Web Apps

1. Crea un repository GitHub con questa struttura.
2. In Azure Portal: **Create resource** -> **Static Web App**.
3. Collega il repo GitHub e branch principale.
4. Build details:
   - App location: `app`
   - Api location: `api`
   - Output location: `dist`
5. Salva e completa il provisioning.

Variabili ambiente:

- Nessuna obbligatoria per questo MVP.

`staticwebapp.config.json` e in `app/public/` (copiato nel build output).

## Aggiungere una nuova sorgente

1. Crea cartella `api/src/sources/<nome>/`.
2. Aggiungi:
   - `selectors.ts` con selettori CSS resilienti
   - `adapter.ts` che implementa `SourceAdapter`
3. Registra adapter in `api/src/sources/index.ts`.
4. Gestisci fallback con `SourceNotSupportedError` se sito dinamico o non supportato nel tempo MVP.

Template rapido:

```ts
import type { SourceAdapter } from "../../types";

export const newSourceAdapter: SourceAdapter = {
  id: "newsource",
  label: "New Source",
  supports: { search: true },
  async search(query: string) {
    return [];
  },
};
```

## Checklist se sito dinamico (fuori MVP)

- Conferma robots.txt e ToS.
- Verifica se il contenuto e server-rendered o JS-rendered.
- Se JS-rendered, valutare Playwright in worker separato.
- Mantieni rate limiting e timeout severi.
- Evita scraping aggressivo e parallelismo elevato.
