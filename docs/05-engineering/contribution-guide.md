---
id: DOC-ENG-005
title: Panduan Kontribusi Pengembang & AI Agent ObMap v2.0
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.2.0
last_reviewed: 2026-11-20
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
- Membedakan jalur kontribusi **Core Platform** (`src/domains/`) dengan jalur **Plugin & Tema Eksternal** (`@app/sdk` di `docs/07-developers/`).

---

## 1. Setup Lingkungan Lokal
1. Instal dependensi proyek (`bun install` atau `npm install`) serta pastikan berkas environment lokal Supabase terkonfigurasi.
2. Jalankan server pengembangan di port `8080`: `bun run dev` (atau `npm run dev`).
3. Jalankan baseline test sebelum menyentuh kode: `npx vitest run`.

---

## 2. Alur Eksekusi Perubahan Core Platform (3 Jalur Development)
Pilih salah satu dari **3 Jalur Resmi Development** sesuai sifat tugas:
1. **Track 1 — Spec-Driven (`docs/ → main-app`):** Buka [`docs/02-planning/README.md`](../02-planning/README.md), ambil langkah `[NEXT]`/`[PLANNED]` (`STEP-01.1`–`05.4`), baca PRD/SRS/ADR terkait, lalu implementasikan di `src/domains/` mengikuti [`domain-map.md`](../03-architecture/domain-map.md) & [`coding-standards.md`](coding-standards.md).
2. **Track 2 — Mockup-Incubated (`src/prototype → 1:1 main-app → Isolated Snapshot → docs/`):**
   - *Phase 2A:* Rancang & uji iterasi UI/UX dinamis di `src/prototype/` dengan state in-memory deterministik **100% *zero-backend*** (0 impor Supabase/Auth/storage backend).
   - *Phase 2B:* Migrasikan front-end **1:1 secara identik** ke `src/domains/` lalu sambungkan layanan backend nyata.
   - *Phase 2C:* Bekukan mockup final ke `src/prototype/snapshots/<stage-id>/` agar tetap dapat diakses lewat pemilih snapshot di `/prototype`.
3. **Track 3 — Direct Rapid Experiment (`main-app experiment → docs/ sync`):** Lakukan iterasi langsung di `src/domains/` saat diperlukan validasi teknis cepat, lalu sinkronkan perubahan desain/kontrak ke `docs/` begitu tervalidasi.
4. **Verifikasi & Penutupan Atomik (Rule 11):** Jalankan `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, dan `npm run build`; perbarui status langkah di `docs/02-planning/README.md`, `docs/_machine/*.json`, serta **3 berkas changelog wajib** (`docs/_machine/changelog.jsonl`, `docs/changelogs/YYYY-MM.md`, `docs/changelogs/README.md`).

---

## 3. Kontribusi Ekstensi & Tema Komunitas (`@app/sdk`)
Pengembang pihak ketiga yang ingin menambahkan *workspace view*, widget dashboard, *export adapter*, solver graf kustom, atau tema visual tidak perlu mengubah kode inti di `src/domains/` — rujuk langsung [Portal Developer `@app/sdk`](../07-developers/README.md).

---

## Terkait
- [Playbook Eksekusi Step-by-Step (`../02-planning/README.md`)](../02-planning/README.md)
- [Aturan Repositori (`repository-rules.md`)](repository-rules.md)
- [Portal Developer `@app/sdk` (`../07-developers/README.md`)](../07-developers/README.md)
