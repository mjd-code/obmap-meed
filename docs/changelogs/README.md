---
id: DOC-CHLOG-000
title: Modular Changelog Hub & Mandatory AI Agent Update Protocol
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-META-000
  - DOC-META-004
  - DOC-META-005
  - DOC-CHLOG-001
  - DOC-CHLOG-002
source_of_truth: docs/_machine/changelog.jsonl
---

# Modular Changelog Hub & LLM Agent Protocol

## Ringkasan 3 Baris
- Sistem changelog dua lapis yang dirancang efisien token untuk LLM sekaligus terstruktur rapi bagi manusia: stream JSONL ringan (`docs/_machine/changelog.jsonl`) dan log sharded bulanan (`docs/changelogs/YYYY-MM.md`).
- Setiap AI agent atau developer **WAJIB** mencatat setiap perubahan kode, migrasi SQL, konfigurasi, atau arsitektur dokumentasi sebelum menutup sesi kerja (diatur oleh `AGENTS.md` Rule 11).
- Riwayat Wave 1–3 disimpan terpisah pada [Arsip Wave 1–3](archive-wave-1-to-3.md) agar pembacaan konteks terbaru tidak terbebani data historis.

---

## 1. Arsitektur 3 Lapis (Token-Efficient Design)

| Lapis | Lokasi Berkas | Konsumen Utama | Cara Kerja & Efisiensi |
| :---: | :--- | :--- | :--- |
| **L1 (Fast Machine Index)** | `docs/_machine/changelog.jsonl` | AI Agents / CI Scripts | Format JSON Lines *append-only*. LLM cukup membaca `10–20` baris terakhir (`< 500` token) untuk memahami konteks perubahan terkini. |
| **L2 (Sharded Monthly Detail)** | `docs/changelogs/YYYY-MM.md` | Engineers & Deep-Context LLMs | Rincian teknis terstruktur per bulan (`CHG-YYYYMMDD-NNN`). Arsip lama dipisah di `archive-wave-1-to-3.md`. |
| **L3 (Rolling Top-10 Summary)** | Tabel §2 di dokumen ini | Human & Agent Entrypoint | Ringkasan 10 perubahan terbaru agar navigasi awal tidak perlu membuka berkas lain. |

---

## 2. Rolling Top-10 Recent Changes

| ID Perubahan | Tanggal | Scope / Domain | Ringkasan Perubahan | Status Verifikasi | Log Detail |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `CHG-20261120-004` | 2026-11-20 | `docs`, `meta`, `planning`, `architecture`, `features`, `engineering`, `lms`, `developers`, `settings` | Docs alignment `v2.2.0` (`43` berkas, `src/` & arsip utuh): **3 Jalur Development** (Track 1 Spec-Driven, Track 2 *Zero-Backend* `src/prototype/` → 1:1 `main-app` → `src/prototype/snapshots/<stage-id>/` di `/prototype`, Track 3 Direct Experiment → `docs/`), migrasi *Helicopter View* → **`Deep Explorer`** (4 lensa visual + pengelompokan dinamis, `Settings Hub > Workspace > Deep Explorer` & Tab Workspace), **Single Adaptive `<SettingsHub />`** (*Dual Navigator*: *Interactive Breadcrumb* + *Synchronized Right Sidebar*; tanpa *Quick Share*/*Quick View Lens* tab-bar & tanpa *inline nav rail*; 3 Kategori `Account → Workspace → Vault` incl. `Workspace Preset` Impact Preview & `.app/config.json Raw Inspector`), `UI-STEP-07`, & sync `docs/_machine/*.json` | `git grep` (`EXIT=1`) ; JSON/JSONL parse + `docs-index` valid ; Top-10 = 10 ; spot-check lulus | [2026-11.md](2026-11.md) |
| `CHG-20261120-003` | 2026-11-20 | `prototype`, `ui`, `editor`, `settings` | Perombakan UI/UX Decluttering (`src/prototype/three-pillar/`): **Instagram-Style 3-Zone Header** (*Explore/Profile/Editor* kiri, *Sidra* tengah, 1 User Menu Popover kanan), hapus `EditorHelicopterBar`/`EditorSideInspectionPane`/`PrototypeSettingsHubModal`, **Pin/Unpin & No-Blur Sidebars** + **Obsidian Vault Switcher Footer** di dasar Left & Right Sidebar, **Single Adaptive `<PrototypeSettingsHub />`** (*Full Page* di App Scope, *Workspace Tab* di Editor), `QuickSharePopover` & `QuickLensViewPopover`, serta fix clipping mobile `<380px` pada `Share · Access · Versions` | `tsc` + `eslint` (0 err) + 172 Vitest + `vite build` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261120-002` | 2026-11-20 | `prototype`, `ui`, `editor`, `community`, `lms`, `settings` | Penyelarasan mockup 3-Pilar (`src/prototype/three-pillar/`) ke Konstitusi Sidra `v2.1.0`: 4 Workspace Modes (`Freeform`, `Atlas`, `Studio`, `Academy`) & 4 Helicopter Views (*Graph, Diagram, Table, Cards*), Restructure Virtual vs Physical Sync, single central `.app/config.json` (7 blok) & `@app/sdk`, Unified **Share · Access · Versions** (Vault/Node `Publish`/`Collaborate`/`Visual Diff`/`KMR`), Academy 5-lapis + *Living Student Sub-Nodes*, Explore Lens + *Fork with Preset*, & 3-Scope Contextual Settings Hub (tanpa mengubah `src/domains/`) | `tsc` + `eslint` (0 err) + 172 Vitest + `vite build` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261120-001` | 2026-11-20 | `docs`, `meta`, `planning`, `architecture`, `features`, `engineering`, `lms`, `developers` | Holistic upgrade `docs/` & `llms.txt` (`v2.1.0`): integrasi **Nodus Research** (6-System DNA), Explicit Non-Goal (*anti project-board bloat*), Filosofi/Motto/6 Prinsip Inti/3 Level Pengguna, Workspace Modes & 4 Helicopter Views (*Graph, Diagram, Table, Cards*), Restructure Virtual vs Structural, Single Central `.app/config.json` (7 blok) & `@app/sdk`, Academy 3-Layer Tree, Vault+Node `AS & WITH` + `"Share · Access · Versions"` Drawer, 3-Scope Settings Escalation, & BYO-AI/Local AI roadmap | JSON/JSONL valid ; path `docs-index` valid ; `git grep` & `git status` bersih (`src/` & arsip utuh) | [2026-11.md](2026-11.md) |
| `CHG-20261117-003` | 2026-11-17 | `graph` | Fix mode *With Text*: link menempel ke radius lingkaran dot di semua layout (`drawLink`, `unboxedNodeLayout`), posisi teks `auto` (*bawah dot* di Knowledge Graph, *samping luar dot* anti-tabrak cabang di Mindmap) + kustom `GraphLabelPositionControl`, indikator collapse bahu dot, wrap maks 2 baris (~200px) tanpa potong huruf, & hit-area khusus dot | `tsc` + 172 Vitest + `vite build` + `eslint` (0 err) + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261117-002` | 2026-11-17 | `graph` | Fix penuh *Only Node* / *With Text* / *With Label + Text* (sinkron `useGraphEngineStore.showLabels`, `buildPaintSignature`, & *reactive redraw* `nodeCanvasObjectMode` `ForceGraph2D`), hapus mode `Note AST` & ikon/panel `Smart Inspector`, serta pindahkan kustomisasi `Style & Format` per-node ke popover terintegrasi di `ContextualToolbar` | `tsc` + 171 Vitest + `vite build` + `eslint` (0 new) + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261117-001` | 2026-11-17 | `graph`, `settings`, `workspace`, `editor`, `community`, `global` | Thin modern scrollbar global/panel, fix *Only Node* vs *With Text* vs *With Label + Text* (hilangkan bayangan kotak di `"apik2"`), tombol khusus `Smart Inspector` di dock atas, hapus double sidebar Settings, *push/slide-out* Left Explorer & Right Settings sidebar + kontrol mobile tab bar, dan solusi scroll keyboard mobile/tablet (`useVisualViewport` + `100dvh` + `pb-[45vh]`) | `tsc` + 171 Vitest + `vite build` + `eslint` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-011` | 2026-11-16 | `graph` | Overhaul layout komposit multi-layer XMind: depth lokal per-parent + Compact Matrix 6-kolom `org-chart`, `timeline` *center-anchored* + gutter trunk & baseline clearance proxy, routing link `timeline`/bus-bar `org-chart`, *Smart Flow* berbasis `anchorIsLeft`, & `resolveBlockAABBCollisions` blok kaku | `eslint` + `tsc` + 169 Vitest + `vite build` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-010` | 2026-11-16 | `graph`, `app` | Unifikasi `GraphQuickCanvasBar` + `GraphWorkspaceControls` → `GraphFloatingDock` (*Centered Mega-Menu Card*, 6 cluster, toggle `Smart Inspector` di cluster `Zoom`, guard `Free-Force`), relokasi `GraphCanvasUtilityDock` ke kanan bawah, & hapus 4 file lama | `tsc` + `eslint` (0 err) + 167 Vitest + `vite build` + `<=300` baris | [2026-11.md](2026-11.md) |
| `CHG-20261116-009` | 2026-11-16 | `auth`, `collaboration`, `community`, `settings`, `vault`, `global` | Wave 1 Security Hardening (5 temuan Supabase: `search_path`, RLS `profiles` + RPC kolaborator/publik, RLS `username_redirects` + RPC point-lookup, & `vault-media` folder binding) + perbaikan menyeluruh rute `/@:username` & `/:username` | `tsc` + 167 Vitest + `vite build` + `eslint` | [2026-11.md](2026-11.md) |

---

## 3. Mandatory Agent Update SOP (Wajib Dieksekusi Tiap Perubahan)

Setiap kali AI agent menyelesaikan perubahan kode, skema database, konfigurasi, atau dokumentasi arsitektural, jalankan **3 langkah atomik** berikut:

1. **Append ke Machine Stream (`docs/_machine/changelog.jsonl`):**
   Tambahkan tepat **1 baris JSON valid** di akhir berkas dengan skema:
   `{"id":"CHG-YYYYMMDD-NNN","date":"YYYY-MM-DD","type":"feat|fix|refactor|docs|db|perf|chore","stage":"stage_1_partner|stage_2_community_beta|stage_3_commercial_ga|infra","domains":["..."],"summary":"...","files":["..."],"verified":"npx vitest run | tsc | docs"}`
2. **Tambahkan Entri ke Log Bulanan (`docs/changelogs/YYYY-MM.md`):**
   Salin struktur ringkas dari [`_template.md`](_template.md). Jika berkas bulan berjalan belum ada, buat berkas baru dengan front-matter `DOC-CHLOG-NNN`.
3. **Perbarui Tabel Rolling Top-10 (§2 di dokumen ini):**
   Sisipkan entri baru di baris teratas tabel dan pertahankan maksimal 10 entri terbaru.

---

## Terkait
- [Master Blueprint v2.0](../00-meta/00-0-master-blueprint.md)
- [Quo Vadis v2.0 Execution Plan](../00-meta/00-2-quovadis.md)
- [Log Evolusi Sistem (Legacy Index)](../00-meta/changelog.md)
- [Template Entri Changelog](_template.md)
