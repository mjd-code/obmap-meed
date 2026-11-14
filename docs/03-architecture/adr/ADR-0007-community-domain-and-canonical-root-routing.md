---
id: DOC-ARCH-ADR-0007
title: ADR-0007 — Refactor Domain `public-reader` → `community` dan Hard Cutover Rute `/:username`
type: adr
status: [PLANNED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0001
  - DOC-ARCH-ADR-0010
  - DOC-PLAN-000
source_of_truth: src/App.tsx, src/domains/public-reader/, src/domains/settings/
---

# ADR-0007: Refactor `public-reader` → `community` & Hard Cutover Root `/:username`

## Ringkasan 3 Baris
- Mengunci keputusan arsitektur untuk mengganti nama dan memindahkan seluruh modul `src/domains/public-reader/` menjadi **`src/domains/community/`** (`CommunityOrchestrator.tsx`).
- Menetapkan **hard cutover** mematikan langsung seluruh rute `/p/*` di `src/App.tsx` tanpa redirect transisi dan menggantikannya dengan pola root kanonik `/:username` dan `/@:username`.
- Menambahkan perlindungan tabrakan slug (`RESERVED_SLUGS`) pada urutan routing SPA, layanan `ProfileService.ts`, serta constraint PostgreSQL.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-14 — Implementasi di `STEP-01.2` & `STEP-03.1`).
- **Konteks:** Implementasi Wave 1–3 menempatkan pembaca publik pada `src/domains/public-reader/` dengan URL `/p/:username/:vaultSlug`. Dalam visi ObMap v2.0 (jejaring sosial cendekiawan bergaya Wikipedia × LinkedIn × ResearchGate), alamat `/p/*` bersifat non-kanonik dan memecah batas domain antara *public reader* dan fitur sosial (`/explore`, profil `/:username`, *Follow*, *Scholarly Feed*).

---

## 2. Opsi yang Dipertimbangkan
1. **Mempertahankan `public-reader/` dan membuat domain ke-14 `social/` + redirect `/p/*`:** Ditolak karena menciptakan duplikasi kanvas pembaca publik di dua domain sekaligus memperpanjang kode routing legacy.
2. **Menyatukan seluruh kapabilitas sosial & reader ke `src/domains/community/` + Hard Cutover `/p/*` (Dipilih):** Menghasilkan topologi **13 bounded domains** yang bersih, menyatukan `InteractiveGraph`/`MarkdownReader` ke dalam satu orkestrator, dan mematikan utang teknis `/p/*` sejak Stage 1.

---

## 3. Keputusan Teknis Terkunci (`STEP-01.2`)
1. **Refaktor Struktur Domain:** Pindahkan `src/domains/public-reader/{PublicReaderOrchestrator.tsx,components/*,shared/*}` ke `src/domains/community/` dengan orkestrator utama `CommunityOrchestrator.tsx`.
2. **Router Root Namespace (`src/App.tsx`):** Hapus seluruh rute `/p/:username/:vaultSlug/:noteSlug`, `/p/:username/:vaultSlug`, dan `/p/:vaultSlug`. Daftarkan setelah rute statis sistem (`/`, `/auth`, `/install`, `/admin`, `/vaults`, `/app`, `/explore`):
   - `/:username` & `/@:username`
   - `/:username/:vaultSlug` & `/@:username/:vaultSlug`
   - `/:username/:vaultSlug/:noteSlug` & `/@:username/:vaultSlug/:noteSlug`
3. **Proteksi 3-Lapis `RESERVED_SLUGS`:** Blokir `app`, `vaults`, `auth`, `admin`, `explore`, `install`, `settings`, `api`, `assets`, `p`, `pricing`, `docs`, `help`, `legal`, `about`, `login`, `signup` di router React, `ProfileService.ts`, dan constraint `CHECK` PostgreSQL.
4. **Canonical Handle Normalization:** Baik `/@handle` maupun `/handle` menunjuk entitas `profiles.username = 'handle'` yang identik dan memancarkan `<link rel="canonical">`.

---

## 4. Konsekuensi & Verifikasi
- Seluruh komponen reader publik (`PublicReaderBreadcrumbs`, `InteractiveGraph`, `MarkdownReader`, dll.) mengikuti pola Headless Controller (`<= 300` baris).
- `publicUrlHelper.ts` diperbarui untuk memancarkan `/:username/:vaultSlug/:noteSlug` secara konsisten di modal bagikan dan tombol sitasi.

---

## Terkait
- [Peta 13 Domain (`../domain-map.md`)](../domain-map.md)
- [Playbook Eksekusi (`../../02-planning/README.md`)](../../02-planning/README.md)
- [Quo Vadis v2.0 §6](../../00-meta/00-2-quovadis.md)
