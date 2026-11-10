# AGENTS.md — ObMap System Guidelines for AI Coding Agents

## 1. Stack & Runtime
- **Frontend:** React 18 SPA + Vite 5 + TypeScript 5 + Tailwind CSS + Radix UI (shadcn).
- **Graph & Editor:** react-force-graph-2d, D3.js (forces), CodeMirror 6 (isolated YAML).
- **Backend/Storage:** Supabase (Auth, RLS, Storage), Local IndexedDB, File System Access API.
- **Routing:** react-router-dom (`/` landing, `/vaults` dashboard, `/app` workspace, `/p/*` reader).

## 2. Essential Commands
- Dev Server: `bun run dev` (or `npm run dev`) at port 8080.
- Production Build: `bun run build` (or `npm run build`).
- Automated Tests: `npx vitest run` (Do NOT use `bun test` due to Node/browser mock compatibility).
- Linting: `npm run lint`.

## 3. Domain-Driven Structure (`src/domains/`)
- 12 Isolated Domains: `admin`, `auth`, `collaboration`, `editor`, `graph`, `metadata`, `public-reader`, `settings`, `sync`, `vault`, `vcs`, `workspace`.
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

## 5. Documentation Source of Truth
- System Portal: `docs/README.md`
- Master Feature Catalog: `docs/04-features/feature-catalog.md` and `_machine/features.json`
- Domain Map: `docs/03-architecture/domain-map.md` and `_machine/domains.json`
- Tech Debt Register: `docs/05-engineering/tech-debt-register.md`
- Documentation Index: `llms.txt` and `_machine/docs-index.json`