---
id: DOC-ENG-003
title: Register Hutang Teknis Sistem (Technical Debt Register)
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.2.0
last_reviewed: 2026-11-12
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
| `TD-001` | God Component: Graph Workspace Controls | `src/domains/graph/components/GraphWorkspaceControls.tsx` | File ~750 baris dengan tanggung jawab ganda (styling, solver, atmosphere). | Tinggi | `[PARTIAL]` | Pisahkan menjadi panel independen: `GraphLayoutSection.tsx`, `GraphColorSection.tsx`, dan `GraphAtmosphereSection.tsx`. |
| `TD-002` | God Component: Graph Canvas | `src/domains/graph/components/GraphCanvas.tsx` | File ~1.240 baris; logika gesture, paint loop, ResizeObserver, dan DOM overlay bercampur. | Tinggi | `[PLANNED]` | Terapkan pola **Headless Controller**: ekstrak seluruh logika ke `useGraphCanvasController.ts`, jadikan `GraphCanvas.tsx` murni View (~80 baris). |
| `TD-003` | God Service: Vault Manager | `src/domains/vault/shared/services/VaultManager.ts` | Terlalu banyak memegang state sinkronisasi, fallback IDB, dan session token. | Sedang | `[PLANNED]` | Ekstrak adapter penyimpanan ke driver terisolasi: `IndexedDbDriver.ts`, `SupabaseDriver.ts`, dan `FileSystemDriver.ts`. |
| `TD-004` | Regresi Assertasi Pengujian Vault Rename | `src/domains/vault/__tests__/VaultManager.test.ts` | Test mengharapkan nilai boolean murni `true`, padahal method mengembalikan `{ success: true }`. | Rendah | `[PARTIAL]` | Perbarui assertasi test menjadi `expect(result.success).toBe(true)`. |
| `TD-005` | Untyped Supabase Client Shim | `src/shared/lib/untypedSupabase.ts` | Tipe basis data Supabase out-of-sync dengan migrasi SQL V4. | Sedang | `[PLANNED]` | Regenerasi skema TypeScript Supabase dari migrasi resmi dan terapkan di client. |
| `TD-006` | Bounding Box Collision pada Mode Fishbone/Timeline | `src/domains/graph/shared/utils/textLayout.ts` | Teks simpul yang sangat panjang berpotensi tumpang tindih pada zoom rapat. | Sedang | `[PARTIAL]` | Tambahkan margin dinamis berbasis kedalaman dan batasi lebar kartu node (`maxWidth: 160px`). |

---

## Terkait
- [Standar Penulisan Kode](coding-standards.md)
- [Strategi Pengujian Perangkat Lunak](testing-strategy.md)
- [Peta Jalan Pengembangan Produk](../02-planning/roadmap.md)