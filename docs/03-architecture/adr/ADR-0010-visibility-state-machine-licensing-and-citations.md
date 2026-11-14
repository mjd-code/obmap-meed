---
id: DOC-ARCH-ADR-0010
title: ADR-0010 — State Machine Visibilitas 4-Tahap, Lisensi CC BY-SA 4.0 & Protokol Sitasi Terverifikasi
type: adr
status: [PLANNED]
owner: Principal Software Architect & CPO
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0005
  - DOC-ARCH-ADR-0007
  - DOC-ARCH-ADR-0009
source_of_truth: src/domains/collaboration/, src/domains/metadata/, src/domains/vcs/
---

# ADR-0010: State Machine Visibilitas, `CC BY-SA 4.0` & Sitasi Lintas-Vault

## Ringkasan 3 Baris
- Menetapkan 4 state visibilitas eksplisit vault (`Private`, `Shared`, `Public Unlisted`, `Public Listed`) dengan dukungan pengecualian per-catatan `visibility: private` di YAML frontmatter.
- Mengunci **`CC BY-SA 4.0`** sebagai lisensi default vault publik guna mendorong sitasi ilmiah serta legalitas *Fork & Knowledge Merge Request*, disertai kurasi manual *Verified Scholar* di `/admin`.
- Menstandardisasi sintaks tautan federated `[[@username/vaultSlug/noteSlug]]` yang diindeks Web Worker dan direkam dalam tabel `cross_vault_citations`.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-14 — Implementasi di `STEP-01.4`, `03.1`, `03.2`, `03.3`).
- **Konteks:** Jejaring sosial cendekiawan membutuhkan kejelasan hukum ketika seseorang mengutip atau mem-*fork* catatan publik, sekaligus jaminan absolut bahwa catatan privat di dalam vault yang sama tidak pernah bocor keluar.

---

## 2. Keputusan Arsitektur Terkunci
1. **Four-State Visibility State Machine (`STEP-01.4`):**
   - `Private` (default): hanya `owner_id`; media bucket privat wajib `createSignedUrl`; `noindex`.
   - `Shared`: kolaborator `vault_members` dan pemegang token `share_links` ber-expiry; `noindex`.
   - `Public Unlisted`: dapat diakses pembaca anonim via URL langsung selama pemilik berstatus `approved`; `noindex`.
   - `Public Listed`: tayang di `/:username` dan terindeks pada `/explore`, Sitemap XML, serta `Schema.org/ScholarlyArticle`.
   - Catatan tunggal bermetadata YAML `visibility: private` **selalu** dikecualikan dari bundle API publik dan graf reader `community`.
2. **Lisensi Default `CC BY-SA 4.0` & Kurasi Manual Scholar (`STEP-01.4` & `03.1`):**
   - Setiap vault yang berubah menjadi `Public Unlisted` atau `Public Listed` secara otomatis menetapkan metadata `license: CC BY-SA 4.0` bila belum didefinisikan eksplisit oleh penulis di frontmatter.
   - Penyematan lencana *Verified Scholar / Educator / Institution* pada profil `/:username` dikendalikan eksklusif melalui **kurasi manual oleh Admin di `/admin`** (`scholar_verifications`), bukan otorisasi email otomatis di fase awal.
3. **Federated Cross-Vault Citations & Fork/MR (`STEP-03.2`–`03.3`):**
   - `mentions.worker.ts` mem-parsing `[[@username/vaultSlug/noteSlug]]` sebagai tautan lintas-pengguna dan merekam ke `cross_vault_citations`.
   - Skema YAML epistemic standar (`epistemic_status`, `confidence`, `doi`, `references`) melengkapi tombol *"Cite this Note"* (APA, MLA, IEEE, BibTeX, ObMap Wikilink).
   - Kolaborasi terbuka memakai *Fork to My Vault* → sunting di workspace → ajukan *Knowledge Merge Request* (`vcsDiffEngine.ts` + atribut penulis asli `CC BY-SA 4.0`).

---

## 3. Verifikasi & Keamanan
- Konten publik dan anotasi paragraf disanitasi menggunakan `rehype-sanitize` sebelum dirender di `src/domains/community/`.

---

## Terkait
- [ADR-0005: In-Browser VCS](ADR-0005-in-browser-vcs-for-markdown-collaboration.md)
- [ADR-0007: Community Domain & Canonical Routing](ADR-0007-community-domain-and-canonical-root-routing.md)
- [Collaboration & Publishing (`../collaboration-and-publishing.md`)](../collaboration-and-publishing.md)
