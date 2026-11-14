---
id: DOC-META-004
title: Riwayat Perubahan dan Evolusi Arsitektur (Index Pointer)
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-META-005
  - DOC-CHLOG-000
  - ENG-DRIFT-001
source_of_truth: docs/_machine/changelog.jsonl
---

# Log Evolusi Sistem (Indeks Changelog)

## Ringkasan 3 Baris
- Sejak v2.0 (2026-11-14), pencatatan changelog aktif dimigrasikan ke sistem modular yang efisien token di `docs/changelogs/` dan stream mesin `docs/_machine/changelog.jsonl`.
- Dokumen ini dipertahankan untuk menjaga kompatibilitas tautan lama (`DOC-META-004`) sekaligus menjadi penunjuk langsung ke log aktif.
- Riwayat rinci Wave 1, Wave 2, dan Wave 3 terdokumentasi di [Arsip Wave 1–3](../changelogs/archive-wave-1-to-3.md).

---

## Navigasi Changelog Aktif

| Kebutuhan Pembacaan | Lokasi Target | Deskripsi |
| :--- | :--- | :--- |
| **LLM Fast Context (Token-Efficient)** | `docs/_machine/changelog.jsonl` | Baca 10–20 baris JSON terakhir untuk mengetahui perubahan terbaru secara instan |
| **Hub Changelog & SOP Wajib Agen** | [Modular Changelog Hub](../changelogs/README.md) | Ringkasan *Rolling Top-10* dan prosedur update wajib 3-langkah bagi setiap AI agent |
| **Log Bulanan Berjalan** | [November 2026](../changelogs/2026-11.md) | Catatan perubahan terstruktur bulan berjalan (`CHG-YYYYMMDD-NNN`) |
| **Arsip Historis Wave 1–3** | [Arsip Wave 1–3](../changelogs/archive-wave-1-to-3.md) | Milestone restrukturisasi DDD Wave 1–3 (`vRestruct1.0.0` s/d `vRestruct1.3.5`) |

---

## Terkait
- [Modular Changelog Hub](../changelogs/README.md)
- [Master Blueprint v2.0](00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-2-quovadis.md)
- [Log Perbedaan Kode (Doc Drift Log)](../05-engineering/doc-drift-log.md)
