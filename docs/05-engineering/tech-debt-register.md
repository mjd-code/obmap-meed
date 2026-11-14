---
id: DOC-ENG-003
title: Register Hutang Teknis Sistem (Technical Debt Register)
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.3.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-ENG-001
  - DOC-ENG-004
source_of_truth: src/
---

# Register Hutang Teknis (Technical Debt Register)

## Ringkasan 3 Baris
- Katalog aktif hutang teknis (`TD-NNN`) yang teridentifikasi dari audit kode sumber.
- Menetapkan tingkat keparahan, lokasi berkas, dampak arsitektur, dan usulan solusi mitigasi terperinci.
- Menjadi backlog prioritas perbaikan pada horizon rilis Horizon 1 (Stabilisasi & Dekomposisi).

---

## Daftar Item Hutang Teknis Aktif

| ID TD | Nama Masalah | Lokasi Berkas | Dampak Arsitektur | Prioritas | Status | Rencana Solusi / Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TD-001` | God Component: Graph Workspace Controls | `src/domains/graph/components/GraphWorkspaceControls.tsx` | File ~750 baris dengan tanggung jawab ganda (styling, solver, atmosphere). | Tinggi | `[IMPLEMENTED]` | Dipisahkan ke `useGraphWorkspaceControlsController.ts` dan sub-panel terfokus (`GraphWorkspaceControls.tsx` kini 137 baris). |
| `TD-002` | God Component: Graph Canvas | `src/domains/graph/components/GraphCanvas.tsx` | File ~1.240 baris; logika gesture, paint loop, ResizeObserver, dan DOM overlay bercampur. | Tinggi | `[IMPLEMENTED]` | Diterapkan pola **Headless Controller** via `useGraphCanvasController.ts` (`GraphCanvas.tsx` kini 125 baris). |
| `TD-003` | God Service: Vault Manager | `src/domains/vault/shared/api/VaultManager.ts` | Terlalu banyak memegang state sinkronisasi, hidrasi folder, dan statistik. | Sedang | `[IMPLEMENTED]` | Diekstrak ke `vaultFolderHydrator.ts` dan `vaultStatsCalculator.ts`. |
| `TD-004` | Regresi Assertasi Pengujian Vault Rename | `src/domains/vault/__tests__/VaultManager.test.ts` | Test mengharapkan nilai boolean murni `true`, padahal method mengembalikan `{ success: true }`. | Rendah | `[IMPLEMENTED]` | Diperbarui assertasi test menjadi `expect(result.success).toBe(true)` (97/97 test hijau). |
| `TD-005` | Untyped Supabase Client Shim | `src/global/api/untypedSupabase.ts` | Tipe basis data Supabase out-of-sync dengan migrasi SQL V4. | Sedang | `[IMPLEMENTED]` | Regenerasi penuh tipe 17 tabel/RPC/enum di `supabaseTypes.ts` + migrasi V4.1 (`20261114000000_v4_1_step_01_1_and_01_2_schema_and_reserved_slugs.sql`), 12 caller berpindah ke `supabaseClient.ts`, dan `untypedSupabase.ts` dikonversi menjadi re-export bertipe (`STEP-01.1`, `CHG-20261114-003`). |
| `TD-006` | Bounding Box Collision pada Mode Fishbone/Timeline | `src/domains/graph/shared/utils/textLayout.ts` | Teks simpul yang sangat panjang berpotensi tumpang tindih pada zoom rapat. | Sedang | `[IMPLEMENTED]` | Ditambahkan deteksi `boxesOverlap`, margin dinamis berbasis kedalaman, dan kompensasi tinggi kartu di `fishbone.ts` & `timeline.ts`. |
| `TD-007` | Akumulasi God Components Lintas Domain (`>300` baris) | `src/domains/*/components/*.tsx` | Puluhan komponen di domain `graph`, `editor`, `workspace`, `collaboration`, `settings`, `vault`, `vcs`, `public-reader`, `auth`, `admin`, dan `sync` mencampur JSX dengan logika state/efek. | Tinggi | `[IMPLEMENTED]` | Ekstraksi bertahap (Fase 2–4) ke pola **Headless Controller Hook** (`shared/hooks/use*Controller.ts`) dan sub-view deklaratif. Seluruh 157 berkas `.tsx` di `src/domains/*/components/` kini berada di bawah batas <= 300 baris (`OVER_300=0`). |

---

## Terkait
- [Standar Penulisan Kode](coding-standards.md)
- [Strategi Pengujian Perangkat Lunak](testing-strategy.md)
- [Peta Jalan Pengembangan Produk](../02-planning/roadmap.md)