---
id: ENG-RULES-001
title: Aturan Baku Rekayasa Repositori ObMap
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - ARCH-DOM-001
  - ARCH-STRUCT-001
  - ENG-DRIFT-001
source_of_truth: src/
---

# Aturan Baku Repositori (Engineering Rules)

## Ringkasan 3 Baris
- Aturan arsitektur dan konvensi penulisan kode yang berlaku mengikat untuk pengembang manusia dan AI coding agent.
- Membedakan secara eksplisit antara pola yang terbukti di kode (`[OBSERVED]`) dan panduan perbaikan yang diusulkan (`[PROPOSED]`).
- Menjaga isolasi antar-domain, integritas skema database, dan performa render React.

---

## 1. Aturan Terbukti di Kode (`[OBSERVED]`)

### A. Batas Domain dan Pola Akses Impor
1. **Aturan Satu Arah Global:** Komponen di `src/domains/*` diperbolehkan mengimpor utilitas dan UI dari `@/global/*`. Sebaliknya, `src/global/*` DILARANG KERAS mengimpor apa pun dari `src/domains/*`.
2. **Orchestrator Façade:** Akses lintas domain wajib melalui file Orchestrator domain bersangkutan (`<Domain>Orchestrator.tsx`), bukan mengimpor berkas internal privat di `src/domains/<domain>/components/`.
3. **Path Alias Resmi:** Seluruh impor lokal wajib menggunakan path alias `@/...`. Dilarang menggunakan *relative climbing path* berlebihan seperti `../../../../`.

### B. Konvensi Penamaan Berkas
1. Komponen di dalam domain wajib diberi prefiks nama domain:
   - `Graph*` (contoh: `GraphCanvas.tsx`, `GraphColorEngineControls.tsx`)
   - `Workspace*` (contoh: `WorkspaceFileExplorerTree.tsx`, `WorkspaceRibbon.tsx`)
   - `Vault*` (contoh: `VaultCard.tsx`, `VaultStorageControls.tsx`)
   - `Vcs*` (contoh: `VcsBranchSelector.tsx`, `VcsPanel.tsx`)
   - `Editor*` (contoh: `EditorMarkdownView.tsx`, `EditorPropertiesPanel.tsx`)

### C. State Management & Re-render Waterfall
1. **Zustand Murni:** State workspace dan mutasi dokumen wajib menggunakan store Zustand melalui aksi murni (`vaultSessionActions.ts`), dilarang menggunakan React Context Provider untuk data hierarki yang sering berubah.
2. **Leaf-Scoped Interaction:** Engine interaksi graf wajib di-scope per leaf ID menggunakan factory `createGraphInteractionStore(initialLayout)` untuk menghindari polusi state lintas tab.

### D. Skema Database & Supabase Migrations
1. **Integritas SQL:** Dilarang membuat skema SQL paralel secara ad-hoc. Sumber kebenaran mutlak skema adalah berkas di `supabase/migrations/`.
2. **Hak Akses RLS & Grant:** Setiap tabel baru wajib menyertakan `GRANT` eksplisit kepada role `authenticated` dan `service_role`.
3. **Storage Buckets:** Bucket storage (`avatars`, `vault-media`) dikelola melalui tool storage Supabase dengan akses signed URL, bukan public URL.

---

## 2. Aturan yang Diusulkan (`[PROPOSED]`)

1. **Batas Ukuran Berkas:** Maksimal 300 baris per berkas komponen. Berkas god-component yang melampaui 600 baris (`GraphWorkspaceControls.tsx`, `GraphCanvas.tsx`) wajib dipecah menjadi sub-komponen terfokus.
2. **Eliminasi Berkas Stale:** Menghapus komponen legacy tanpa prefiks domain yang fungsinya telah digantikan sepenuhnya.
3. **Siklus Hidup Dokumentasi:** Setiap penambahan atau perubahan fitur fungsional (`FEAT`) wajib memperbarui `docs/04-features/feature-catalog.md` dan `_machine/features.json`.

---

## Terkait
- [Peta Domain](../03-architecture/domain-map.md)
- [Glosarium](../00-meta/glossary.md)
- [Log Perbedaan Kode](doc-drift-log.md)