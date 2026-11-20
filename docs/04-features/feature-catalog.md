---
id: DOC-FEAT-001
title: Master Feature Catalog v2.0 (`FEAT-*`)
type: feature
status: [PARTIAL]
owner: Chief Product Officer & Principal Architect
version: 2.2.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-FEAT-000
  - DOC-META-000
  - DOC-META-002
  - DOC-PLAN-000
  - DOC-ARCH-002
source_of_truth: src/domains/, supabase/migrations/
---

# Master Feature Catalog (`FEAT-*`)

## Ringkasan 3 Baris
- Katalog terpadu seluruh fitur aktif (`[IMPLEMENTED]`), parsial (`[PARTIAL]`), terencana (`[PLANNED]`), dan visi (`[VISION]`) lintas 13 domain di atas **6 Sistem Referensi** (*Obsidian, Nodus Research, XMind, Notion, Wikipedia, LinkedIn × ResearchGate × GitHub*).
- Mencerminkan konstitusi arsitektur baru: **4 Workspace Modes** (`Freeform`, `Atlas`, `Studio`, `Academy` + `Community Presets`), **`Deep Explorer`** (*Graph, Diagram, Table, Cards* + pengelompokan dinamis), **Single `.app/config.json`**, **Unified Essential VCS + Granular `AS & WITH` Drawer**, **Academy 3-Layer Competence Tree**, **Unified Adaptive `<SettingsHub />` (*Dual Navigator* + 3 Kategori `Account → Workspace → Vault`)**, **3 Development Tracks** (+ `/prototype` Snapshots), dan **`@app/sdk`**.
- Menegaskan batas fokus bahwa seluruh fitur *Derived Views* melayani pengetahuan, riset, editorial, dan pembelajaran (bukan papan tugas proyek korporat ala Trello/Asana/ClickUp).

---

## 1. Fitur Inti Workspace, Editor, Graph, Lens & Storage

| Feature ID | Nama Fitur | Domain | Status | Verified Source of Truth / Target Step |
| :--- | :--- | :--- | :---: | :--- |
| **`FEAT-EDITOR-001`** | CodeMirror 6 Markdown Editor + Isolated YAML Properties | `editor` | `[IMPLEMENTED]` | `src/domains/editor/` (`EditorMarkdownView.tsx`, `EditorFormatToolbar.tsx`, `EditorPropertiesPanel.tsx`) |
| **`FEAT-GRAPH-001`** | Multi-Solver Deterministik (*Diagram View*: Mindmap, Org + Compact Matrix, Timeline, Fishbone) & Free-Force (*Graph View*) | `graph` | `[IMPLEMENTED]` | `src/domains/graph/` (`layoutCategory.ts`, `compositeLayoutEngine.ts`, `treeLayouts.ts`, `mindmap.ts`, `fishbone.ts`, `timeline.ts`, `GraphCanvas.tsx`) |
| **`FEAT-GRAPH-002`** | Headless Canvas Governance, Rigid Block Collision Isolation, Unified Floating Dock & Frame Invalidation | `graph` | `[IMPLEMENTED]` | `useGraphCanvasController.ts`, `GraphFloatingDock.tsx`, `collisionResolver.ts`, `ADR-0006` |
| **`FEAT-GRAPH-008`** | Solver `argument-map`, `citation-tree`, & `competence-dag`; Pitch Mode; PDF/SVG/OPML Export | `graph` | `[PLANNED]` | Target `STEP-05.2` (`Stage 3`) |
| **`FEAT-LENS-001`** | Workspace Modes (`Freeform`, `Atlas`, `Studio`, `Academy`) & **`Deep Explorer`** (4 lensa visual *Graph, Diagram, Table, Cards* + pengelompokan dinamis *Hierarchy/Properties/Tags/Backlinks/Keywords* — *Virtual Grouping* & *Structural Refactoring*; runnable di `Settings Hub > Workspace > Deep Explorer` & Tab Workspace) | `workspace`, `dashboard`, `graph`, `settings` | `[PLANNED]` | `.app/config.json` (`mode`), `DashboardOrchestrator.tsx`, `STEP-02.1`, `UI-STEP-07` |
| **`FEAT-META-001`** | Indexing Wikilinks, Backlinks & Metadata via Web Worker (`Aho-Corasick`) | `metadata` | `[IMPLEMENTED]` | `src/domains/metadata/` (`mentions.worker.ts`, `aho-corasick.ts`, `MetadataCache.ts`) |
| **`FEAT-AI-001`** | Native **BYO-AI & Local AI** (Ollama / WebLLM / BYOK Local RAG) & Referensi/Sitasi/PDF (*Nodus DNA*) | `metadata`, `settings`, `editor` | `[VISION]` | Integrasi *Settings Hub > Workspace > Appearance & Accessibility / Extensions* & `.app/config.json` (`STEP-05.3`) |
| **`FEAT-VAULT-001`** | Multi-Strategy Storage (`FS Access API`, `IndexedDB`, `Cloud`, ZIP Export) & **Single `.app/config.json`** | `vault`, `settings` | `[IMPLEMENTED]` | `VaultManager.ts`, `VaultConfigFile.ts` (sentralisasi `.app/config.json` dengan fallback `.vk/`/`.obmap/`) |
| **`FEAT-WORK-001`** | Multi-Pane Workspace Shell, Command Palette (`Ctrl/Cmd+K`), Tab Bar bersih (tanpa *Quick Share*/*Quick View Lens*) & Tab `Deep Explorer` | `workspace` | `[IMPLEMENTED]` / `[PLANNED]` | `WorkspaceOrchestrator.tsx`, `WorkspaceViewRegistry.tsx`, `CommandRegistry.ts`, `useVaultLifecycle.ts`, `UI-STEP-07` |
| **`FEAT-VCS-001`** | *Essential VCS*: Snapshot, Visual Diff (MD/YAML/Node Structure), Branch, Fork, Co-Presence, & Knowledge Merge Request | `vcs` | `[IMPLEMENTED]` / `[PARTIAL]` | `vcsDiffEngine.ts`, `VcsInteractiveMergeModal.tsx`, `VcsCreateMergeRequestModal.tsx`, `VcsCoPresenceAvatars.tsx` |

---

## 2. Fitur Kolaborasi Granular, Community, Academy 3-Lapis, Unified `<SettingsHub />`, Track 2 Prototype & SDK

| Feature ID | Nama Fitur | Domain | Status | Target Step & Kebijakan Terkunci |
| :--- | :--- | :--- | :---: | :--- |
| **`FEAT-AUTH-001`** | ReleaseStageGate (`Stage 1–3`) & Individual Per-User Approval Queue | `auth`, `admin` | `[IMPLEMENTED]` | `STEP-01.3` — `ReleaseStageService.ts`, `AuthProtectedRoute.tsx`, `AdminReleaseStageBar.tsx`, V4.2 SQL |
| **`FEAT-COLLAB-001`** | Vault & **Node-Level** Collaborators (`Give Access AS & WITH`: peran umum + peran `Academy`, CRUD, time-window) | `collaboration`, `vault` | `[PARTIAL]` | `CollabDocumentSharePopover.tsx`, `CollabBulkPublishModal.tsx`, `access.node_overrides` di `.app/config.json` |
| **`FEAT-COLLAB-004`** | Unified **"Share · Access · Versions" Drawer** (`Publish AS & WITH`, `Give Access AS & WITH`, `Versions/Diff/KMR`) Vault & Node Level + `CC BY-SA 4.0` | `collaboration`, `auth`, `vcs` | `[IMPLEMENTED]` / `[PLANNED]` | `STEP-01.4` (`policyEngine.ts`, `can_access_resource()`, 4 visibility states + `visibility: private`), eskalasi penuh Drawer di `/app` |
| **`FEAT-COLLAB-003`** | Real-Time Multiplayer CRDT (Yjs) Multi-Cursor | `collaboration`, `sync` | `[VISION]` | `STEP-04.3` — Team/Lab Stage 3 tanpa memutus offline driver |
| **`FEAT-COLLAB-005`** | Organization Teamspaces, Seat Management & Admin-Locked `.app/config.json` Policies | `collaboration`, `admin` | `[VISION]` | `STEP-04.2` — Paket Team/Enterprise |
| **`FEAT-COMM-001`** | Community Reader, Presentation Lenses (`atlas`, `publication`, `course`, `template`) & Hard Cutover `/:username` | `community` | `[IMPLEMENTED]` | `STEP-01.2` (`CommunityOrchestrator.tsx`, `RESERVED_SLUGS`) + node-level publishing `node_overrides` |
| **`FEAT-SOC-001`** | Scholar Profile (`/:username`, kontrol ringan + *"Full Account Settings →"*), `/explore` (+ **`Community Presets`**) & *Verified Scholar* Admin | `community`, `admin` | `[VISION]` | `STEP-03.1` — Lencana kurasi manual & promosi `Community Presets → Core Presets` di `/admin` |
| **`FEAT-SOC-002`** | Federated Citations `[[@user/vault/note]]`, Epistemic YAML & Cite Exporter (`Allow Citation`) | `community`, `metadata` | `[VISION]` | `STEP-03.2` — Ekspor APA/MLA/IEEE/BibTeX |
| **`FEAT-SOC-003`** | *Fork to My Vault* (`Allow Fork`), Cross-User *Knowledge Merge Request* & Block-Hash Paragraph Annotations | `community`, `vcs` | `[VISION]` | `STEP-03.3` — Terintegrasi Drawer *"Share · Access · Versions"* |
| **`FEAT-DASH-001`** | Dashboard Hub (`/vaults`) dengan Knowledge *Derived Views* (*Table*, *Cards*, *Tree*, *Lightweight Kanban/Calendar*) & Preset Picker (`Atlas`/`Studio`/`Academy`/`Freeform`) | `dashboard` | `[VISION]` | `STEP-02.1` — Domain ke-13 (bukan board proyek korporat) |
| **`FEAT-GROWTH-001`** | Landing Page 6-DNA & In-Memory Live Sandbox (`< 65KB`) | `pages`, `vault` | `[PARTIAL]` | `STEP-02.2` — `src/pages/Landing.tsx` + *Zero-Friction Core Presets* `< 90s` |
| **`FEAT-GROWTH-002`** | Five-Stage Hybrid Onboarding & Sandbox Migration | `auth`, `workspace` | `[PLANNED]` | `STEP-02.3` — Splash + Skip → Migrasi ke Core Preset |
| **`FEAT-BILL-001`** | Dynamic Admin-Managed Plans/Quotas & **Xendit/Midtrans** First Checkout | `admin`, `supabase` | `[VISION]` | `STEP-04.1`–`04.2` — Tabel `plans`/`plan_quotas` di `/admin`, **Xendit/Midtrans** lalu Stripe |
| **`FEAT-SET-001`** | **Single Adaptive `<SettingsHub />`** (*Workspace Tab* vs *Complete Full Page*, tanpa *inline nav rail* & tombol tab-bar *Quick Share*/*Quick View Lens*), **Dual Navigator** (*Interactive Breadcrumb Navigator* + Floating Dropdown Outline & *Synchronized Right Sidebar*), 3 Kategori **`Account → Workspace → Vault`** (*Workspace Preset* w/ Mini-Helps & Impact Preview, *`.app/config.json` Raw Inspector* w/ Real-Time Validation & Help, *Deep Explorer*, *Appearance*, *Visual Engine*, 5 Vault sub-settings) | `settings`, `graph`, `workspace` | `[IMPLEMENTED]` / `[PLANNED]` | `STEP-01.5`, `UI-STEP-01..02`, `UI-STEP-07` (`SettingsHub.tsx`, `useThemeStore.ts`) |
| **`FEAT-PROTO-001`** | Track 2 **Zero-Backend Prototype Sandbox** (`src/prototype/three-pillar/`) & **Versioned UI/UX Snapshot Catalog** (`src/prototype/snapshots/<stage-id>/`) | `prototype`, `pages` | `[IMPLEMENTED]` | Rute `/prototype` (`ThreePillarPrototypePage.tsx`); *in-memory deterministic mock state* 100% terisolasi dari backend |
| **`FEAT-LMS-001`** | **`Academy` Living Competence Tree (3 Lapisan Evolusi)**: *Falsafah → Tugas* DAG, **Living Student Sub-Nodes**, Rules per Node, & Exam Focus Screen | `graph`, `community`, `settings` | `[VISION]` | `STEP-05.1` — Disimpan terpusat di blok `academy` dalam `.app/config.json` + 5 state progres (`locked → mastered`) |
| **`FEAT-EXT-001`** | Sandboxed **`@app/sdk`** (Worker/Iframe CSP), Permission Manifest, Scoped CSS & 12 Extension Points | `settings` | `[PARTIAL]` | `STEP-05.3` — Membaca blok `extensions` & `schema` pada `.app/config.json` (kompatibel `@vk/sdk`) |

---

## Terkait
- [Master Blueprint v2.0 (`../00-meta/00-0-master-blueprint.md`)](../00-meta/00-0-master-blueprint.md)
- [Playbook Eksekusi Step-by-Step (`../02-planning/README.md`)](../02-planning/README.md)
- [Visi & Arsitektur Academy 3-Lapis (`../06-lms/lms-vision.md`)](../06-lms/lms-vision.md)
- [Kolaborasi Granular & Essential VCS (`../03-architecture/collaboration-and-publishing.md`)](../03-architecture/collaboration-and-publishing.md)
- [System Requirements Specification (`../02-planning/srs.md`)](../02-planning/srs.md)
