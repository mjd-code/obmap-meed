---
id: ENG-DRIFT-001
title: Log Penyelarasan Perbedaan Kode dan Asumsi (Doc Drift Log)
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-META-004
  - ENG-RULES-001
source_of_truth: git status, git log
---

# Log Penyelarasan Asumsi vs Realitas Kode

## Ringkasan 3 Baris
- Mencatat seluruh selisih antara materi instruksi/dokumen lama dengan kondisi riil kode sumber saat ini.
- Memastikan fakta kode menjadi satu-satunya sumber kebenaran teknis tanpa asumsi yang tertinggal.
- Menjadi panduan mitigasi saat memperbarui konfigurasi build, penamaan paket, atau struktur folder.

---

## 1. Daftar Perbedaan yang Ditemukan (Drift Register)

| ID Drift | Item / Asumsi Lama | Realitas Kode Aktual | Analisis & Status Tindakan |
| :--- | :--- | :--- | :--- |
| **DRFT-001** | Nama repositori diasumsikan `obmap-mdst`. | Nama repositori dan path kerja adalah `obmap-meed`. Nilai `package.json` bernilai `vite_react_shadcn_ts`. | **Diselaraskan.** Dokumentasi menggunakan `obmap-meed`. `package.json` diusulkan untuk diperbarui namanya pada fase pembersihan. |
| **DRFT-002** | Folder bersama bernama `src/shared/`. | Folder bersama telah dipindahkan menjadi `src/global/`. Subfolder `shared/` kini berstatus privat di dalam masing-masing domain (`src/domains/*/shared/`). | **Diselaraskan.** Seluruh referensi dokumentasi diwajibkan menggunakan `@/global/...`. |
| **DRFT-003** | Algoritma Timeline berbasis tanggal pembuatan note (`node.time`). | Algoritma Timeline telah direfaktor menjadi berbasis hierarki struktur file/folder vault (`timeline.ts`), di mana milestone adalah anak langsung dan detail adalah keturunannya. | **Diselaraskan.** Spesifikasi layout engine mencatat tata letak berbasis hierarki direktori. |
| **DRFT-004** | Komponen graf masih memiliki file legacy ganda (misal `BacklinksPanel.tsx` dan `GraphBacklinksPanel.tsx`). | Telah dilakukan migrasi ke komponen berawalan domain (`Graph*`), namun beberapa file lama masih tersisa di disk. | **Dicatat.** Terdaftar di `tech-debt-register.md` sebagai target pembersihan berkas stale. |
| **DRFT-005** | Test runner diasumsikan Bun test. | Test suite dikonfigurasi resmi dengan **Vitest v3** (`npm test` menjalankan `vitest run`). | **Diselaraskan.** Perintah resmi pada dokumentasi pengujian adalah `npm test` atau `npx vitest run`. |

---

## Terkait
- [Aturan Repositori](repository-rules.md)
- [Riwayat Evolusi](../00-meta/changelog.md)