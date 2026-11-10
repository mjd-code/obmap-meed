---
id: DOC-PLAN-007
title: Matriks Keterlacakan Kebutuhan (Requirements Traceability Matrix)
type: planning
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-PLAN-001
  - DOC-PLAN-003
  - DOC-PLAN-005
  - DOC-FEAT-000
source_of_truth: src/
---

# Matriks Keterlacakan Kebutuhan (Traceability Matrix)

## Ringkasan 3 Baris
- Menautkan persona pengguna (`PER`) ke kebutuhan fungsional (`FR`), fitur katalog (`FEAT`), berkas kode sumber, dan pengujian unit.
- Menjamin tidak ada fitur yang dibangun tanpa justifikasi kebutuhan persona pengguna.
- Memudahkan audit cakupan pengujian otomatis terhadap setiap modul perangkat lunak.

---

## Tabel Keterlacakan Menyeluruh

| Persona | ID FR | ID Fitur | Komponen / Berkas Kode Sumber | Verifikasi Pengujian | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PER-01` | `FR-VAULT-001` | `FEAT-VAULT-001` | `src/domains/vault/shared/services/VaultManager.ts` | `VaultManager.test.ts` | `[IMPLEMENTED]` |
| `PER-01` | `FR-EDIT-001` | `FEAT-EDIT-001` | `src/domains/editor/shared/cm/setup.ts` | CodeMirror unit test | `[IMPLEMENTED]` |
| `PER-01` | `FR-GRAPH-001` | `FEAT-GRAPH-001` | `src/domains/graph/shared/utils/networkLayouts.ts` | `newLayouts.test.ts` | `[IMPLEMENTED]` |
| `PER-02` | `FR-GRAPH-001` | `FEAT-GRAPH-002` | `src/domains/graph/shared/utils/timeline.ts` | `timeline.test.ts` | `[IMPLEMENTED]` |
| `PER-02` | `FR-COLLAB-001`| `FEAT-COLLAB-001`| `src/domains/public-reader/PublicReaderOrchestrator.tsx` | Route integration check | `[IMPLEMENTED]` |
| `PER-03` | `FR-GRAPH-001` | `FEAT-GRAPH-003` | `src/domains/graph/shared/utils/fishbone.ts` | `fishbone.test.ts` | `[IMPLEMENTED]` |
| `PER-04` | `FR-VCS-001`   | `FEAT-VCS-001`   | `src/domains/vcs/components/VcsInteractiveMergeModal.tsx`| `vcsDiffEngine.ts` unit | `[IMPLEMENTED]` |
| `PER-05` | `FR-COLLAB-001`| `FEAT-COLLAB-002`| `src/domains/public-reader/components/PublicReaderView.tsx`| Anon browser verification | `[IMPLEMENTED]` |
| `PER-06` | `FR-VAULT-002` | `FEAT-VAULT-002` | `supabase/migrations/20261031000000_v4_collaboration_and_publishing.sql` | Migration SQL linting | `[IMPLEMENTED]` |

---

## Terkait
- [Kebutuhan Fungsional (SRS)](srs.md)
- [Profil Persona Pengguna](personas.md)
- [Katalog Fitur Master](../04-features/feature-catalog.md)