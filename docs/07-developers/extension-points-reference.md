---
id: DOC-DEV-002
title: Referensi 12 Extension Points Standar `@obmap/sdk`
type: developer
status: [PLANNED]
owner: Principal Software Architect & Developer Ecosystem Lead
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-DEV-000
  - DOC-DEV-001
  - DOC-DEV-003
  - DOC-DEV-004
  - DOC-ARCH-ADR-0012
source_of_truth: src/domains/settings/shared/api/, src/domains/workspace/, src/domains/graph/
---

# Referensi 12 Extension Points Standar (`@obmap/sdk`)

## Ringkasan 3 Baris
- Katalog teknis **12 titik perluasan resmi** (`Extension Points`) untuk Workspace, Dashboard `/vaults`, Konfigurasi, Editor CodeMirror 6, Kanvas Graf Canvas2D, serta Ekspor Data.
- Memetakan setiap extension point terhadap registry sumber daya internal yang telah ada di kode (`WorkspaceViewRegistry.tsx`, `CommandRegistry.ts`, `configRegistry.ts`, `schemaRegistry.ts`, `pluginRegistry.ts`).
- Menetapkan izin minimal (*minimum required permission*) agar prinsip *least privilege* terjaga.

---

## Tabel Referensi Lengkap 12 Extension Points

| # | Nama Extension Point | Fondasi Kode Aktual / Target | Kegunaan & Kemampuan | Izin Minimum (`manifest.json`) |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **`WorkspaceViewRegistry`** | `src/domains/workspace/WorkspaceViewRegistry.tsx` | Menambah tipe tab/panel kustom di shell multi-pane `/app` dalam Iframe CSP terisolasi. | `ui:only` |
| 2 | **`DashboardWidgetRegistry`** | `src/domains/dashboard/DashboardWidgetRegistry.ts` `[PLANNED]` | Menambah kartu metrik, pelacak riset, atau ringkasan tugas pada hub `/vaults`. | `ui:only` + `vault:read` |
| 3 | **`CommandRegistry`** | `src/domains/workspace/shared/api/CommandRegistry.ts` | Mendaftarkan aksi pada Command Palette dan pengikat pintasan keyboard global. | `ui:only` |
| 4 | **`ConfigSectionRegistry`** | `src/domains/settings/shared/api/{configRegistry,registerConfigSections}.ts` | Menambah panel setting terisolasi berdasar JSON Schema yang otomatis mendukung *6-Layer Override & Org-Lock*. | `ui:only` |
| 5 | **`FrontmatterSchemaProvider`** | `src/domains/settings/shared/api/schemaRegistry.ts` | Mendefinisikan properti YAML kustom, validator, serta autocomplete pada `EditorPropertiesPanel.tsx`. | `metadata:read` |
| 6 | **`CodeMirror6Extension`** | `src/domains/editor/components/EditorMarkdownView.tsx` | Menambah dekorasi garis, linter sintaks, atau gutter widget aman tanpa mengganggu Markdown asli. | `vault:read` (atau `vault:write` untuk mutasi) |
| 7 | **`SlashCommandProvider`** | `src/domains/editor/` | Menambah entri menu `/command` untuk penyisipan template blok Markdown/frontmatter cepat. | `vault:write` |
| 8 | **`MarkdownPostProcessor`** | `src/domains/community/` & mode baca editor | Memodifikasi tampilan blok kode kustom (mis. diagram spesifik domain) lewat AST yang melewati `rehype-sanitize`. | `ui:only` + `vault:read` |
| 9 | **`GraphLayoutSolver`** | `src/domains/graph/shared/utils/layoutCategory.ts` | Mendaftarkan algoritma tata letak deterministik baru (`(nodes, edges, opts) => NodeCoords[]`) yang berjalan di Worker/sandbox agar bebas lag. | `graph:read` |
| 10 | **`GraphThemeDecorator`** | `src/domains/graph/shared/utils/{theme,atmosphereConfig}.ts` | Menambahkan preset palet token Canvas2D, badge simpul, atau mode atmosfer terikat pada `refresh()`. | `ui:only` + `graph:read` |
| 11 | **`ExportAdapter`** | `src/domains/vault/shared/api/ImportExportService.ts` & modul ekspor | Mengonversi struktur catatan dan koordinat graf deterministik ke format tujuan baru (LaTeX, Anki, CSV, dll.). | `vault:read` + `graph:read` |
| 12 | **`Ribbon / StatusBar`** | `src/domains/workspace/WorkspaceOrchestrator.tsx` | Menyematkan ikon aksi cepat pada bilah samping serta indikator status ringkas pada bilah bawah `/app`. | `ui:only` |

---

## Ketentuan Kompatibilitas & Versi
- **Stabilitas API:** Seluruh tipe input/output `Extension Points` mengikuti Semantic Versioning `2.x`.
- **Non-Blocking Graph Contract (`NFR-001`):** Implementasi `GraphLayoutSolver` dilarang menahan main UI thread; seluruh perhitungan koordinat bersifat sinkron-cepat deterministik di sandbox agar target `60 FPS` pada `2.000` node tetap terjaga.

---

## Terkait
- [Portal Pengembang (`README.md`)](README.md)
- [SDK Quickstart Guide (`plugin-sdk-quickstart.md`)](plugin-sdk-quickstart.md)
- [Theme Authoring Guide (`theme-authoring-guide.md`)](theme-authoring-guide.md)
- [Security & Sandbox (`security-and-sandbox.md`)](security-and-sandbox.md)
