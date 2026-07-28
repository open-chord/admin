# Source layout

- `app/` — application-level state and navigation contracts.
- `components/` — reusable application chrome and composition components.
- `features/` — self-contained product areas such as library, imports, lyrics, and settings.
- `shared/` — small UI primitives and framework-independent helpers.
- `api.ts` — the server boundary; UI components do not build API URLs themselves.
- `types.ts` — transport and catalog models shared by features.

`App.tsx` is intentionally limited to orchestration: loading data, selecting the active view, and connecting feature callbacks.
