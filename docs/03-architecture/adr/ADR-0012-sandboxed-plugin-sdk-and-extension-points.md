---
id: DOC-ARCH-ADR-0012
title: ADR-0012 — Ekosistem Ekstensi `@obmap/sdk` Ber-Sandbox, Permission Manifest & 12 Extension Points
type: adr
status: [PLANNED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0001
  - DOC-ARCH-ADR-0011
  - DOC-DEV-000
  - DOC-DEV-004
source_of_truth: src/domains/settings/shared/api/pluginRegistry.ts, src/domains/workspace/
---

# ADR-0012: `@obmap/sdk` Ber-Sandbox & 12 Extension Points Terstandar

## Ringkasan 3 Baris
- Berevolusi dari `src/domains/settings/shared/api/pluginRegistry.ts` menjadi SDK publik terversi **`@obmap/sdk`** yang memungkinkan komunitas memperluas ObMap tanpa mengubah kode sumber inti.
- Menerapkan model keamanan **Zero-Trust Sandbox** berbasis Web Worker / Iframe CSP ketat, *Permission Manifest* eksplisit (`vault:read`, `vault:write`, `network`, `ui:only`), serta *Enterprise Allowlist* per organisasi.
- Menstandardisasi **12 Extension Points** dan menyediakan portal dokumentasi developer resmi di `docs/07-developers/`.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-14 — Dokumentasi SDK tersedia di Wave `G6`; implementasi runtime di `STEP-05.3`).
- **Konteks:** Kekuatan utama Obsidian terletak pada komunitas pengembang ekstensinya. ObMap sudah memiliki embrio registry internal (`pluginRegistry.ts`, `WorkspaceViewRegistry.tsx`, `CommandRegistry.ts`, `registerConfigSections.ts`), namun kode pihak ketiga yang berjalan langsung di main DOM thread berisiko mencuri token Supabase, memodifikasi DOM secara sembarangan, atau merusak performa `60 FPS` kanvas.

---

## 2. Keputusan Arsitektur Terkunci (`STEP-05.3`)
1. **Isolasi Eksekusi Sandbox (No Direct Core Mutation):**
   - Ekstensi pihak ketiga dijalankan di **Web Worker terisolasi** untuk logika data/background, dan **Sandbox Iframe dengan `sandbox="allow-scripts"` + Content Security Policy ketat** untuk panel UI kustom, berkomunikasi melalui saluran RPC terstruktur (`postMessage` dengan schema validasi).
   - Ekstensi komunitas **dilarang** mengakses langsung `window`, `localStorage`, kunci Supabase Auth, atau DOM di luar mount container yang dialokasikan.
2. **Deklarasi `manifest.json` & Permission Manifest:**
   - Setiap ekstensi mendeklarasikan cakupan izin granular (`ui:only`, `vault:read`, `vault:write`, `graph:read`, `metadata:read`, `network:<allowlisted-domain>`). Pengguna maupun Org Admin menyetujui izin sebelum aktivasi; Team/Enterprise hanya menjalankan plugin pada **Allowlist Organisasi**.
3. **Dua Belas Extension Points Resmi `@obmap/sdk`:**
   - *Workspace & Nav:* `WorkspaceViewRegistry`, `DashboardWidgetRegistry`, `CommandRegistry`, `Ribbon / StatusBar`.
   - *Config & Schema:* `ConfigSectionRegistry`, `FrontmatterSchemaProvider`.
   - *Editor & Reader:* `CodeMirror6Extension`, `MarkdownPostProcessor`, `SlashCommandProvider`.
   - *Graph & Export:* `GraphLayoutSolver`, `GraphThemeDecorator`, `ExportAdapter`.

---

## 3. Verifikasi & Dokumentasi Pengembang
- Panduan lengkap pengembang eksternal tersedia di [Portal Developer (`docs/07-developers/README.md`)](../../07-developers/README.md), termasuk panduan cepat, spesifikasi 12 extension point, dan model ancaman sandbox.

---

## Terkait
- [Portal Developer `@obmap/sdk` (`../../07-developers/README.md`)](../../07-developers/README.md)
- [Model Keamanan Sandbox (`../../07-developers/security-and-sandbox.md`)](../../07-developers/security-and-sandbox.md)
- [Referensi 12 Extension Points (`../../07-developers/extension-points-reference.md`)](../../07-developers/extension-points-reference.md)
