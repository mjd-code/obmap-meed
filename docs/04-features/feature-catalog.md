---
id: DOC-FEAT-001
title: Master Feature Catalog ObMap v2.0
type: feature
status: [PARTIAL]
owner: Chief Product Officer & Principal Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-FEAT-000
  - DOC-META-000
  - DOC-PLAN-000
  - DOC-ARCH-002
source_of_truth: src/domains/, supabase/migrations/
---

# Master Feature Catalog ObMap v2.0 (`FEAT-*`)

## Ringkasan 3 Baris
- Katalog terpadu seluruh fitur aktif (`[IMPLEMENTED]`), parsial (`[PARTIAL]`), terencana (`[PLANNED]`), dan visi (`[VISION]`) di seluruh 13 domain target ObMap v2.0.
- Seluruh path sumber daya telah diselaraskan dengan codebase Wave 3 (`layoutCategory.ts`, `src/domains/workspace/useVaultLifecycle.ts`, `20261031000000_v4_collaboration_and_publishing.sql`, dan registry `src/domains/settings/`).
- Mencantumkan kaitan fitur ke tahap rilis (`Stage 1–3`), tier dinamis (`plans` di `/admin`), dan ID langkah implementasi (`STEP-01.1`–`05.4`).

---

## 1. Fitur Inti Workspace, Editor, Graph & Storage (Baseline Wave 1–3)

| Feature ID | Nama Fitur | Domain | Status | Verified Source of Truth / Target Step |
| :--- | :--- | :--- | :---: | :--- |
| **`FEAT-EDITOR-001`** | CodeMirror 6 Markdown Editor + Isolated YAML Properties | `editor` | `[IMPLEMENTED]` | `src/domains/editor/` (`EditorMarkdownView.tsx`, `EditorPropertiesPanel.tsx`) |
| **`FEAT-GRAPH-001`** | Multi-Solver Deterministik (Mindmap, Org, Timeline, Fishbone) & Free-Force | `graph` | `[IMPLEMENTED]` | `src/domains/graph/` (`layoutCategory.ts`, `mindmap.ts`, `fishbone.ts`, `timeline.ts`, `GraphCanvas.tsx`) |
| **`FEAT-GRAPH-002`** | Headless Canvas Governance, Subtree Override & Frame Invalidation | `graph` | `[IMPLEMENTED]` | `useGraphCanvasController.ts`, `GraphWorkspaceControls.tsx`, `ADR-0006` |
| **`FEAT-GRAPH-008`** | Solver `argument-map` & `citation-tree`, Pitch Mode, PDF/SVG/OPML Export | `graph` | `[PLANNED]` | Target `STEP-05.2` (`Stage 3`) |
| **`FEAT-META-001`** | Indexing Wikilinks & Backlinks Web Worker (`Aho-Corasick`) | `metadata` | `[IMPLEMENTED]` | `src/domains/metadata/` (`mentions.worker.ts`, `aho-corasick.ts`, `MetadataCache.ts`) |
| **`FEAT-VAULT-001`** | Multi-Strategy Storage (`FS Access API`, `IndexedDB`, `Cloud`, ZIP Export) | `vault` | `[IMPLEMENTED]` | `src/domains/vault/` (`VaultManager.ts`, `FileSystemService.ts`, `IndexedDbVaultDriver.ts`, `CloudVaultService.ts`, `ImportExportService.ts`) |
| **`FEAT-WORK-001`** | Multi-Pane Workspace Shell, Command Palette & Vault Lifecycle | `workspace` | `[IMPLEMENTED]` | `src/domains/workspace/` (`WorkspaceOrchestrator.tsx`, `WorkspaceViewRegistry.tsx`, `shared/api/CommandRegistry.ts`, `shared/hooks/useVaultLifecycle.ts`) |
| **`FEAT-VCS-001`** | In-Browser VCS Diff, Merge Modal & Co-Presence Avatars | `vcs` | `[IMPLEMENTED]` | `src/domains/vcs/` (`vcsDiffEngine.ts`, `VcsInteractiveMergeModal.tsx`, `VcsCreateMergeRequestModal.tsx`, `VcsCoPresenceAvatars.tsx`) |

---

## 2. Fitur Kolaborasi, Stage Gate, Dashboard, Community, Billing & Ekstensibilitas

| Feature ID | Nama Fitur | Domain | Status | Target Step & Kebijakan Terkunci |
| :--- | :--- | :--- | :---: | :--- |
| **`FEAT-AUTH-001`** | ReleaseStageGate (`Stage 1–3`) & Individual Per-User Approval Queue | `auth`, `admin` | `[IMPLEMENTED]` | `STEP-01.3` (`CHG-20261114-004`) — `ReleaseStageService.ts`, `AuthProtectedRoute.tsx`, `AdminReleaseStageBar.tsx`, V4.2 SQL |
| **`FEAT-COLLAB-001`** | Vault Members & Share / Bulk Publish Popover | `collaboration`, `vault` | `[PARTIAL]` | `CollabDocumentSharePopover.tsx`, `CollabBulkPublishModal.tsx`, `VaultMemberService.ts`, `20261031000000_v4_collaboration_and_publishing.sql` |
| **`FEAT-COLLAB-004`** | PolicyEngine RBAC + 4 State Visibilitas + `visibility: private` + Unified Share | `collaboration`, `auth` | `[IMPLEMENTED]` | `STEP-01.4` (`CHG-20261114-004`) — `policyEngine.ts`, `can_access_resource()`, `CC BY-SA 4.0` default |
| **`FEAT-COLLAB-003`** | Real-Time Multiplayer CRDT (Yjs) Multi-Cursor | `collaboration`, `sync` | `[VISION]` | `STEP-04.3` — Team/Lab Stage 3 tanpa memutus offline driver |
| **`FEAT-COLLAB-005`** | Organization Teamspaces, Seat Management & Admin-Locked Policies | `collaboration`, `admin` | `[VISION]` | `STEP-04.2` — Paket Team/Enterprise |
| **`FEAT-COMM-001`** | Community Reader (`public-reader` → `community`) & Hard Cutover `/:username` | `community` | `[IMPLEMENTED]` | `STEP-01.2` (`CHG-20261114-003`) — Matikan `/p/*`, refaktor `CommunityOrchestrator`, `RESERVED_SLUGS` |
| **`FEAT-SOC-001`** | Scholar Profile (`/:username`), `/explore`, Follow & Manual *Verified Scholar* | `community`, `admin` | `[VISION]` | `STEP-03.1` — Lencana kurasi manual Admin di `/admin` (`CC BY-SA 4.0`) |
| **`FEAT-SOC-002`** | Federated Citations `[[@user/vault/note]]`, Epistemic YAML & Cite Exporter | `community`, `metadata` | `[VISION]` | `STEP-03.2` — Ekspor APA/MLA/IEEE/BibTeX |
| **`FEAT-SOC-003`** | Fork to My Vault, Cross-User Knowledge Merge Request & Paragraph Annotations | `community`, `vcs` | `[VISION]` | `STEP-03.3` — Memakai `vcsDiffEngine.ts` + hash blok paragraf |
| **`FEAT-DASH-001`** | Dashboard Hub (`/vaults`) dengan 5 Derived Views Markdown/YAML & Feed | `dashboard` | `[VISION]` | `STEP-02.1` — Domain baru ke-13 + alihkan redirect login ke `/vaults` |
| **`FEAT-GROWTH-001`** | Landing Page 5-DNA & In-Memory Live Sandbox (`< 65KB`) | `pages`, `vault` | `[PARTIAL]` | `STEP-02.2` — `src/pages/Landing.tsx` + CTA adaptif stage |
| **`FEAT-GROWTH-002`** | Five-Stage Hybrid Onboarding & Sandbox Migration | `auth`, `workspace` | `[PLANNED]` | `STEP-02.3` — Splash + Skip → Sandbox transfer → Survey → Coach Marks |
| **`FEAT-BILL-001`** | Dynamic Admin-Managed Plans/Quotas & **Xendit/Midtrans** First Checkout | `admin`, `supabase` | `[VISION]` | `STEP-04.1`–`04.2` — Tabel `plans`/`plan_quotas` di `/admin`, **Xendit/Midtrans** lalu Stripe |
| **`FEAT-SET-001`** | 6-Layer Cascading Config (`ConfigService`, `Local/CloudConfigStore`) & Unified Theme Engine | `settings`, `graph` | `[IMPLEMENTED]` | `STEP-01.5` (`CHG-20261114-004`) — `resolveCascadingConfig`, Org-Lock, `--ob-*` DOM↔Canvas2D + `refresh()` |
| **`FEAT-LMS-001`** | Interactive Graph LMS, `prerequisites` DAG & Skill Tree Progress | `graph`, `community` | `[VISION]` | `STEP-05.1` — State *Locked / Available / Mastered* + kuis |
| **`FEAT-EXT-001`** | Sandboxed `@obmap/sdk` (Worker/Iframe CSP), Permission Manifest & 12 Hooks | `settings` | `[PARTIAL]` | `STEP-05.3` — Berevolusi dari `pluginRegistry.ts`, `schemaRegistry.ts`, `registerConfigSections.ts` |

---

## Terkait
- [Playbook Eksekusi Step-by-Step (`../02-planning/README.md`)](../02-planning/README.md)
- [Peta 13 Domain (`../03-architecture/domain-map.md`)](../03-architecture/domain-map.md)
- [System Requirements Specification (`../02-planning/srs.md`)](../02-planning/srs.md)
