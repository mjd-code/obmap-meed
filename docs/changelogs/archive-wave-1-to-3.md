---
id: DOC-CHLOG-001
title: Arsip Changelog Wave 1 sampai Wave 3 (2026-11-05 s/d 2026-11-09)
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-CHLOG-000
  - DOC-META-004
  - ENG-DRIFT-001
source_of_truth: git log
---

# Arsip Changelog Wave 1–3 (Baseline Historis)

## Ringkasan 3 Baris
- Menyimpan catatan lengkap evolusi arsitektur dari prototipe terpusat menuju arsitektur 12 domain DDD pada Wave 1, Wave 2, dan Wave 3.
- Dipisahkan dari log bulanan aktif (`docs/changelogs/YYYY-MM.md`) agar konteks AI agent tetap ringan.
- Menjadi rujukan historis migrasi folder `src/core/` & `src/shared/` ke `src/domains/` & `src/global/`.

---

## 1. Garis Waktu Historis Wave 1–3

### `vRestruct1.3.0–1.3.5 (Wave 3)` (2026-11-09) — `[IMPLEMENTED]`
- **Migrasi Domain Modular Penuh:** Memindahkan 108 berkas legacy dari `src/core/*` dan `src/shared/*` ke 12 domain terisolasi di `src/domains/*`.
- **Penerapan Orchestrator Pattern & Headless Controllers:** Setiap domain dilengkapi `<Domain>Orchestrator.tsx`; ekstraksi bertahap komponen besar ke `use*Controller.ts` (`TD-001`, `TD-002`, `TD-003`, `TD-004`, `TD-006`, `TD-007` tuntas dengan `OVER_300=0`).
- **Konsolidasi Global UI & Stores:** Memusatkan komponen atomik shadcn/ui dan utilitas umum di `src/global/`.

### `vRestruct1.2.x (Wave 2)` (2026-11-08) — `[IMPLEMENTED]`
- **Engine Visual & Multi-Model Layout:** Pemisahan algoritma deterministik Mindmap, Org Chart, Timeline, Fishbone, dan Free-Force (`layoutCategory.ts`).
- **Color Engine Terpadu:** Pengenalan palette generator kedalaman hierarki, mode kategorikal, dan efek *Living Canvas Atmosphere*.

### `vRestruct1.0.0–1.1.0 (Wave 1)` (2026-11-05) — `[IMPLEMENTED]`
- **Sistem Event Domain:** Pengenalan event domain untuk reaktivitas state lintas komponen tanpa *re-render waterfall*.
- **Multi-Tenant Supabase & VCS:** Migrasi skema database kolaborasi V4 (`20261031000000_v4_collaboration_and_publishing.sql`), sistem branch mikro, dan portal pembaca awal `/p/:username/:vaultSlug`.

---

## Terkait
- [Modular Changelog Hub](README.md)
- [Log Perubahan November 2026](2026-11.md)
- [Log Perbedaan Kode (Doc Drift Log)](../05-engineering/doc-drift-log.md)
