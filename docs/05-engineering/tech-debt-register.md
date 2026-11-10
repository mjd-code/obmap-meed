---
id: DOC-ENG-003
title: Register Hutang Teknis Sistem (Technical Debt Register)
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.1.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ENG-001
  - DOC-ENG-002
source_of_truth: src/
---

# Register Hutang Teknis (Technical Debt Register)

## Ringkasan 3 Baris
- Katalog aktif hutang teknis (`TD-NNN`) yang teridentifikasi dari audit kode sumber.
- Menetapkan tingkat keparahan, lokasi berkas, dampak arsitektur, dan usulan solusi mitigasi.
- Menjadi backlog prioritas perbaikan pada horizon rilis berikutnya.

---

## Daftar Item Hutang Teknis Aktif

| ID TD | Nama Masalah | Lokasi Berkas | Dampak Arsitektur | Prioritas | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TD-001` | God Component: Graph Workspace Controls | `src/domains/graph/components/GraphWorkspaceControls.tsx` | File ~750 baris dengan tanggung jawab ganda (styling, solver, atmosphere). | Tinggi | `[PARTIAL]` |
| `TD-002` | God Component: Graph Canvas Controller | `src/domains/graph/components/GraphCanvas.tsx` | File >1.000 baris; logika gesture, paint loop, dan DOM overlay bercampur. | Tinggi | `[PARTIAL]` |
| `TD-003` | God Service: Vault Manager | `src/domains/vault/shared/services/VaultManager.ts` | Terlalu banyak memegang state sinkronisasi, fallback IDB, dan session token. | Sedang | `[PLANNED]` |
| `TD-004` | Regresi Assertasi Pengujian Vault Rename | `src/domains/vault/__tests__/VaultManager.test.ts` | Test mengharapkan `true`, method mengembalikan `{ success: true }`. | Rendah | `[PARTIAL]` |
| `TD-005` | Untyped Supabase Client Shim | `src/shared/lib/untypedSupabase.ts` | Tipe basis data Supabase out-of-sync dengan migrasi V4 SQL. | Sedang | `[PLANNED]` |
| `TD-006` | Bounding Box Collision pada Mode Fishbone/Timeline | `src/domains/graph/shared/utils/textLayout.ts` | Teks simpul yang sangat panjang berpotensi tumpang tindih pada zoom rapat. | Sedang | `[PARTIAL]` |

---

## Terkait
- [Strategi Pengujian Perangkat Lunak](testing-strategy.md)
- [Peta Jalan Pengembangan Produk](../02-planning/roadmap.md)