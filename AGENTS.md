# AGENTS.md — ObMap System Guidelines for AI Coding Agents

## 1. Stack & Runtime
- **Frontend:** React 18 SPA + Vite 5 + TypeScript 5 + Tailwind CSS + Radix UI (shadcn).
- **Graph & Editor:** react-force-graph-2d, D3.js (forces), CodeMirror 6 (isolated YAML).
- **Backend/Storage:** Supabase (Auth, RLS, Storage), Local IndexedDB, File System Access API.
- **Routing:** react-router-dom (`/` landing, `/vaults` dashboard `[SHELL ROUTED — full UI STEP-02.1]`, `/app` workspace, `/explore`, `/:username` & `/@:username` community profile/reader `[IMPLEMENTED — hard cutover replacing legacy /p/* without redirect]`).

## 2. Essential Commands
- Dev Server: `bun run dev` (or `npm run dev`) at port 8080.
- Production Build: `bun run build` (or `npm run build`).
- Automated Tests: `npx vitest run` (Do NOT use `bun test` due to Node/browser mock compatibility).
- Linting: `npm run lint`.

## 3. Domain-Driven Structure (`src/domains/`)
- Current 12 Isolated Domains: `admin`, `auth`, `collaboration`, `community` *(refactored from `public-reader` in `STEP-01.2`)*, `editor`, `graph`, `metadata`, `settings`, `sync`, `vault`, `vcs`, `workspace`. Target 13 Domains (v2.0): add `dashboard` (`STEP-02.1`).
- Pattern per domain: `<Domain>Orchestrator.tsx`, `components/`, `shared/{api,hooks,stores,utils}`.
- Global Shared Code: `src/global/{api,components,hooks,stores,types,ui,utils}`.
- Path Aliasing: Always import internal modules using `@/` alias (e.g. `@/domains/*`, `@/global/*`).

## 4. Absolute Architectural Rules (DO NOT VIOLATE)
1. **No Refactoring Without Prompt:** Do NOT delete or minify packages, files, or existing features.
2. **Deterministic Graph Solvers:** Only Free-Force runs continuous D3 simulation. Mindmap, Org, Timeline, and Fishbone are deterministic solvers with pinned node coordinates (`layoutCategory.ts`).
3. **Pure Zustand Actions:** Workspace mutations must go through pure action functions (`vaultSessionActions.ts`), never React context providers.
4. **Database & Migrations:** Recreate or update schemas strictly via byte-for-byte migrations in `supabase/migrations/`. Grant table access to `authenticated` and `service_role` explicitly.
5. **Private Storage Buckets:** All uploads to `vault-media` or `avatars` must reside in the user's UUID folder and be accessed via `createSignedUrl`, NEVER `getPublicUrl`.
6. **Isolated Frontmatter:** Markdown body editor must remain clean; edit YAML properties exclusively via collapsible `EditorPropertiesPanel.tsx`.
7. **Headless Controller Pattern (Anti-God Component):** Komponen kompleks (>300 baris atau memadukan >3 hooks/stores) DILARANG mencampur logika dan JSX. Wajib dipisah menjadi:
   - **Domain Orchestrator** (`<Domain>Orchestrator.tsx`): Menghubungkan domain ke workspace & tab context.
   - **View Component** (`<Feature>.tsx`): Murni JSX/styling deklaratif (~50–150 baris).
   - **Headless Controller Hook** (`use<Feature>Controller.ts`): Menampung seluruh `useEffect`, `useMemo`, store subscriptions, dan event handlers tanpa merender markup.
8. **Single Source of Truth & Unidirectional Store Sync:** Dilarang menduplikasi state store ke dalam `useState` lokal UI (gunakan *derived state* atau selector Zustand langsung). Dilarang membuat *cyclic bidirectional `useEffect`* antar-store; gunakan *Unidirectional Action Dispatch* dan *previous-value ref guard* (`prevPropRef`) untuk sinkronisasi prop eksternal.
9. **Hierarchical Store Bridge (Global <-> Leaf):** Setiap *per-leaf store* (`LeafGraphConfigStore`, `LeafGraphInteractionStore`) wajib menerapkan *Write-Through & Broadcast Bridge* terhadap store globalnya (`useGraphStore`, `globalGraphInteractionStore`) agar preferensi tetap tersimpan dan perubahan dari Settings langsung terefleksi di seluruh tab aktif.
10. **Zero-Regression Headless Extraction & Canvas Frame Invalidation:** Ekstraksi *God Component* ke pola Headless Controller adalah operasi isomorfik perilaku (paritas fitur 100%, tanpa memangkas `useEffect`, filter, atau opsi UI). Setiap mutasi visual pada komponen Canvas2D statis (`cooldownTicks === 0`) wajib memicu `graphRef.current?.refresh?.()` secara reaktif.
11. **Mandatory LLM Changelog & Documentation Sync Protocol:** Every AI agent completing any code modification, SQL migration, configuration change, or architectural doc update MUST execute these 3 atomic updates in the same turn before finishing:
   - Append 1 valid JSON line to `docs/_machine/changelog.jsonl` (`{"id":"CHG-YYYYMMDD-NNN","date":"YYYY-MM-DD","type":"...","stage":"...","domains":[...],"summary":"...","files":[...],"verified":"..."}`).
   - Add a structured entry to `docs/changelogs/YYYY-MM.md` following `docs/changelogs/_template.md`.
   - Update the *Rolling Top-10 Recent Changes* table in `docs/changelogs/README.md`.

## 5. Documentation Source of Truth
- Master Architecture & Product Blueprint (v2.0): `docs/00-meta/00-0-master-blueprint.md`
- Quo Vadis v2.0 Execution Plan & Readiness Audit: `docs/00-meta/00-2-quovadis.md`
- Step-by-Step Gradual Execution Queue: `docs/02-planning/README.md` and `docs/02-planning/roadmap.md`
- Modular Changelog Hub & Machine Stream: `docs/changelogs/README.md` and `docs/_machine/changelog.jsonl`
- Developer SDK & Theme Authoring Portal: `docs/07-developers/README.md`
- System Portal: `docs/README.md` and `docs/SUMMARY.md`
- Master Feature Catalog: `docs/04-features/feature-catalog.md` and `docs/_machine/features.json`
- Domain Map: `docs/03-architecture/domain-map.md` and `docs/_machine/domains.json`
- Tech Debt & Drift Registers: `docs/05-engineering/tech-debt-register.md` and `docs/05-engineering/doc-drift-log.md`
- Coding Standards: `docs/05-engineering/coding-standards.md`
- Documentation Index: `llms.txt` and `docs/_machine/docs-index.json`
