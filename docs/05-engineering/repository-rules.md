---
id: DOC-ENG-002
title: Aturan Repositori, Konvensi Branch & Checklist PR ObMap v2.0
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.2.0
last_reviewed: 2026-11-20
audience: engineering
related:
  - DOC-ENG-001
  - DOC-ENG-004
  - DOC-ENG-005
  - DOC-PLAN-000
  - DOC-CHLOG-000
source_of_truth: AGENTS.md, src/domains/
---

# Aturan Repositori & Checklist Pull Request (`Repository Rules`)

## Ringkasan 3 Baris
- Menggantikan daftar *god-component split* lawas (yang seluruhnya telah `[IMPLEMENTED]` pada `TD-001`, `TD-002`, `TD-007` dengan `OVER_300=0`) menjadi aturan tata kelola repositori berkelanjutan bagi **13 domain target v2.0**.
- Menetapkan syarat komposisi direktori, aturan *No Refactoring Without Prompt*, perlindungan arsip historis (`docs/00-meta/00-1-quovadis.md`), dan imutabilitas arsip snapshot UI/UX (`src/prototype/snapshots/<stage-id>/`).
- Mendefinisikan *Definition of Done (DoD)* wajib untuk setiap commit atau PR yang masuk ke cabang utama.

---

## 1. Aturan Struktur Repositori & Integritas Fitur
1. **Zero Unsolicited Deletion:** Dilarang menghapus paket, fitur aktif, atau berkas arsip historis (`00-1-quovadis.md`) tanpa instruksi eksplisit.
2. **Kepatuhan Batas Domain (`12 → 13 Domains`):**
   - Kode aktif saat ini memiliki 12 domain di `src/domains/`.
   - Refaktor `public-reader/` → `community/` dijalankan terisolasi dalam `STEP-01.2` (bersamaan *hard cutover* `/p/*` → `/:username`).
   - Penambahan domain ke-13 `dashboard/` dijalankan terisolasi dalam `STEP-02.1` (`/vaults`).
3. **Batas Ukuran Komponen (`OVER_300 = 0`):** Setiap berkas `.tsx` di `src/domains/*/components/` dijaga `<= 300` baris. Logika non-UI diekstrak ke `shared/hooks/use*Controller.ts`, `shared/stores/`, atau `shared/utils/`.
4. **Konvensi Perintah Verifikasi (`AGENTS.md` §2):**
   - Pengujian: Wajib `npx vitest run` *(jangan gunakan `bun test` karena kompatibilitas mock DOM/browser)*.
   - Lint & Build: `npm run lint` dan `npm run build` (atau `bun run build`).
5. **Tata Kelola `src/prototype/` & Imutabilitas Snapshot (Track 2):**
   - Direktori `src/prototype/` hanya berisi mockup *zero-backend* (*in-memory deterministic mock state*; 0 panggilan runtime Supabase/Auth/storage backend).
   - Direktori berversi `src/prototype/snapshots/<stage-id>/` bersifat **imutabel (*read-only archive*)** sebagai dokumentasi visual hidup di rute `/prototype`; dilarang merusak atau menghapus snapshot historis tanpa instruksi eksplisit.

---

## 2. Checklist Wajib Pull Request (PR Definition of Done)
Setiap PR dari kontributor manusia maupun AI agent wajib mencentang seluruh poin berikut sebelum *merge*:
- [ ] Perubahan terpetakan pada salah satu jalur development resmi (**Track 1** `STEP-XX.Y` di `docs/02-planning/README.md`, **Track 2** Prototype/Snapshot, atau **Track 3** eksperimen tersinkron) maupun perbaikan bug terverifikasi.
- [ ] Seluruh komponen `.tsx` baru/diubah mematuhi pola Headless Controller (`<= 300` baris, `OVER_300=0`).
- [ ] Bila melalui **Track 2**: mockup `src/prototype/` lolos audit zero-backend; fase migrasi 1:1 menjaga paritas visual identik ke `src/domains/` serta membekukan arsip snapshot ke `src/prototype/snapshots/<stage-id>/`.
- [ ] Bila melalui **Track 3**: hasil eksperimen `main-app` yang lolos validasi telah disinkronkan kembali ke `docs/`.
- [ ] `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, dan `npm run build` lulus tanpa error/regresi.
- [ ] Jika terdapat migrasi SQL baru di `supabase/migrations/`: hak akses `authenticated`/`service_role` eksplisit dan uji RLS multi-tenant ditambahkan.
- [ ] Tidak ada hardcode harga/kuota paket maupun penggunaan `getPublicUrl` untuk bucket privat.
- [ ] Pembaruan dokumentasi & **3 pembaruan changelog atomik Rule 11** (`docs/_machine/changelog.jsonl`, `docs/changelogs/YYYY-MM.md`, `docs/changelogs/README.md`) sudah dilakukan pada PR yang sama.

---

## Terkait
- [Standar Penulisan Kode (`coding-standards.md`)](coding-standards.md)
- [Panduan Kontribusi (`contribution-guide.md`)](contribution-guide.md)
- [Modular Changelog Hub (`../changelogs/README.md`)](../changelogs/README.md)
