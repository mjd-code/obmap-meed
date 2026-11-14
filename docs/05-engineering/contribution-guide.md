---
id: DOC-ENG-005
title: Panduan Kontribusi Pengembang & AI Agent ObMap v2.0
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-ENG-001
  - DOC-ENG-002
  - DOC-ENG-004
  - DOC-PLAN-000
  - DOC-DEV-000
source_of_truth: AGENTS.md, docs/02-planning/README.md
---

# Panduan Kontribusi Pengembang & AI Agent (`Contribution Guide`)

## Ringkasan 3 Baris
- Alur kerja praktis bagi developer inti, kontributor open-source, dan AI coding agent dalam menyiapkan lingkungan kerja serta mengeksekusi tugas di ObMap v2.0.
- Menghubungkan langsung alur pengembangan kode bertahap ke [Playbook Eksekusi Step-by-Step (`docs/02-planning/README.md`)](../02-planning/README.md) agar prioritas selalu jelas.
- Membedakan jalur kontribusi **Core Platform** (`src/domains/`) dengan jalur **Plugin & Tema Eksternal** (`@obmap/sdk` di `docs/07-developers/`).

---

## 1. Setup Lingkungan Lokal
1. Instal dependensi proyek (`bun install` atau `npm install`) serta pastikan berkas environment lokal Supabase terkonfigurasi.
2. Jalankan server pengembangan di port `8080`: `bun run dev` (atau `npm run dev`).
3. Jalankan baseline test sebelum menyentuh kode: `npx vitest run`.

---

## 2. Alur Eksekusi Perubahan Core Platform
1. **Ambil Tugas Dari Antrean Resmi:** Buka [`docs/02-planning/README.md`](../02-planning/README.md), periksa langkah berstatus `[NEXT]` atau `[PLANNED]` berikutnya (`STEP-01.1` s/d `STEP-05.4`), dan baca dokumen PRD/SRS/ADR yang tertaut.
2. **Terapkan Standar DDD & Headless Controller:** Ikuti aturan domain di [`domain-map.md`](../03-architecture/domain-map.md) dan [`coding-standards.md`](coding-standards.md).
3. **Verifikasi Sebelum Commit:** Jalankan `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, dan `npm run build`.
4. **Sinkronisasi Dokumentasi & Changelog (Rule 11):** Setiap penyelesaian langkah wajib memperbarui status `STEP-XX.Y` di `docs/02-planning/README.md`, `docs/_machine/*.json` (bila arsitektur/fitur berubah), serta **3 berkas changelog wajib** (`docs/_machine/changelog.jsonl`, `docs/changelogs/YYYY-MM.md`, `docs/changelogs/README.md`).

---

## 3. Kontribusi Ekstensi & Tema Komunitas (`@obmap/sdk`)
Pengembang pihak ketiga yang ingin menambahkan *workspace view*, widget dashboard, *export adapter*, solver graf kustom, atau tema visual tidak perlu mengubah kode inti di `src/domains/` — rujuk langsung [Portal Developer `@obmap/sdk`](../07-developers/README.md).

---

## Terkait
- [Playbook Eksekusi Step-by-Step (`../02-planning/README.md`)](../02-planning/README.md)
- [Aturan Repositori (`repository-rules.md`)](repository-rules.md)
- [Portal Developer `@obmap/sdk` (`../07-developers/README.md`)](../07-developers/README.md)
