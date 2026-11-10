---
id: DOC-FEAT-001
title: Tabel Master Katalog Fitur (Master Feature Catalog)
type: feature
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.1.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-FEAT-000
  - DOC-PLAN-001
  - DOC-PLAN-007
source_of_truth: src/domains/
---

# Tabel Master Katalog Fitur ObMap

## Ringkasan 3 Baris
- Daftar master terverifikasi seluruh fitur produk yang ditautkan ke kode sumber aktual.
- Mengelompokkan kapabilitas berdasarkan domain dan status implementasi objektif.
- Memastikan tidak ada klaim fitur fiktif di luar apa yang terbukti di dalam kode.

---

## Tabel Master Fitur Sistem

| ID Fitur | Nama Fitur | Domain | Path Kode Sumber Utama | Persona Terkait | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FEAT-VAULT-001` | Multi-Strategy Storage (FS/IDB/Cloud) | `vault` | `src/domains/vault/shared/services/VaultManager.ts` | `PER-01` | `[IMPLEMENTED]` |
| `FEAT-VAULT-002` | Accumulative Import (Merge/Skip/Rename) | `vault` | `src/domains/vault/shared/services/ImportExportService.ts`| `PER-01` | `[IMPLEMENTED]` |
| `FEAT-VAULT-003` | Auto-save Indicator & Journaling | `vault` | `src/domains/vault/components/VaultAutoSaveIndicator.tsx` | `PER-01` | `[IMPLEMENTED]` |
| `FEAT-EDIT-001`  | CodeMirror 6 Live Preview & Syntax | `editor` | `src/domains/editor/shared/cm/setup.ts` | `PER-01`, `PER-04` | `[IMPLEMENTED]` |
| `FEAT-EDIT-002`  | Collapsible Properties Frontmatter | `editor` | `src/domains/editor/components/PropertiesPanel.tsx` | `PER-01` | `[IMPLEMENTED]` |
| `FEAT-EDIT-003`  | Floating Table of Contents & Folding | `editor` | `src/domains/editor/headings/` | `PER-01` | `[IMPLEMENTED]` |
| `FEAT-GRAPH-001` | Deterministic Multi-Solvers (Tree/Org/Brace) | `graph` | `src/domains/graph/shared/utils/treeLayouts.ts` | `PER-01`, `PER-03` | `[IMPLEMENTED]` |
| `FEAT-GRAPH-002` | Hierarchical Timeline Flow | `graph` | `src/domains/graph/shared/utils/timeline.ts` | `PER-02` | `[IMPLEMENTED]` |
| `FEAT-GRAPH-003` | Ishikawa Fishbone Cause-and-Effect | `graph` | `src/domains/graph/shared/utils/fishbone.ts` | `PER-03` | `[IMPLEMENTED]` |
| `FEAT-GRAPH-004` | Living Canvas (Dust & Glow Flow) | `graph` | `src/domains/graph/shared/utils/cosmicAtmosphere.ts` | `PER-01` | `[IMPLEMENTED]` |
| `FEAT-GRAPH-005` | Floating Contextual Gear Toolbar | `graph` | `src/domains/graph/components/GraphContextualToolbar.tsx` | `PER-01`, `PER-03` | `[IMPLEMENTED]` |
| `FEAT-GRAPH-006` | Dynamic Anti-Collision Bounding Box | `graph` | `src/domains/graph/shared/utils/textLayout.ts` | `PER-01` | `[PARTIAL]` |
| `FEAT-GRAPH-007` | Tree Table Analytical Spreadsheet View | `graph` | `src/domains/graph/` | `PER-03` | `[PLANNED]` |
| `FEAT-VCS-001`   | In-Browser Micro-Revisions & Stash | `vcs` | `src/domains/vcs/shared/api/VcsBranchStashService.ts` | `PER-04` | `[IMPLEMENTED]` |
| `FEAT-VCS-002`   | Interactive 3-Way Merge Modal | `vcs` | `src/domains/vcs/components/VcsInteractiveMergeModal.tsx`| `PER-04` | `[IMPLEMENTED]` |
| `FEAT-COLLAB-001`| Instant Public Knowledge Portal (`/p/*`) | `public-reader`| `src/domains/public-reader/components/PublicReaderView.tsx`| `PER-02`, `PER-05` | `[IMPLEMENTED]` |
| `FEAT-COLLAB-002`| Granular File/Folder RLS Permissions | `collaboration`| `supabase/migrations/20261031000000_v4_collaboration_and_publishing.sql` | `PER-04`, `PER-06` | `[PARTIAL]` |
| `FEAT-COLLAB-003`| Real-time Multiplayer CRDT (Yjs) | `collaboration`| `src/domains/collaboration/` | `PER-04` | `[PLANNED]` |
| `FEAT-META-001`  | Aho-Corasick Fast Mention Indexing | `metadata` | `src/domains/metadata/shared/api/mentions.worker.ts` | `PER-01` | `[IMPLEMENTED]` |
| `FEAT-WORK-001`  | Dockable Workspace Leaves & Split Engine | `workspace` | `src/domains/workspace/shared/stores/useWorkspaceStore.ts` | `PER-01` | `[IMPLEMENTED]` |


---

## Terkait
- [Panduan Indeks Fitur](README.md)
- [Matriks Keterlacakan Kebutuhan](../02-planning/traceability-matrix.md)