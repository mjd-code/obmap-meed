---
id: DOC-ARCH-ADR-0008
title: ADR-0008 — Penambahan Domain `dashboard` (`/vaults`) & Derived Frontmatter Views
type: adr
status: [PLANNED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0001
  - DOC-ARCH-ADR-0002
  - DOC-PLAN-000
source_of_truth: src/App.tsx, src/pages/Landing.tsx, src/domains/vault/
---

# ADR-0008: Domain `dashboard` (`/vaults`) & 5 Derived Markdown Views

## Ringkasan 3 Baris
- Memisahkan antarmuka komposisi beranda dan produktivitas pasca-login ke dalam domain ke-13 **`src/domains/dashboard/`** pada rute `/vaults`.
- Menegakkan prinsip **Derived Views**: seluruh tampilan *Grid/List*, *Knowledge Tree*, *Kanban*, *Calendar/Timeline*, dan *Analytics* dibaca dan ditulis balik langsung ke berkas `.md` + YAML frontmatter.
- Memperbaiki *drift* lama (`DRFT-007`) dengan memindahkan redirect pasca-autentikasi pada `src/pages/Landing.tsx` dari `/app` ke `/vaults`.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-14 — Implementasi di `STEP-02.1`).
- **Konteks:** Saat ini pengguna yang sudah login di `src/pages/Landing.tsx` langsung diarahkan ke `/app` (kanvas editor), sedangkan `AGENTS.md` mencatat `/vaults` sebagai rute Dashboard utama dan `VaultCard.tsx`/`VaultModeSelector.tsx` berada tercampur bersama logika driver penyimpanan di `src/domains/vault/`. Selain itu, ObMap membutuhkan pengalaman manajemen proyek ala Notion tanpa melanggar prinsip plaintext Obsidian.

---

## 2. Keputusan Arsitektur Terkunci (`STEP-02.1`)
1. **Domain Terpisah ke-13:** Bangun `src/domains/dashboard/` berisi `DashboardOrchestrator.tsx`, `DashboardWidgetRegistry.ts`, `useDashboardController.ts`, serta sub-komponen deklaratif (`<= 300` baris per file). Domain `src/domains/vault/` difokuskan murni pada abstraksi CRUD driver penyimpanan dan manajemen keanggotaan vault.
2. **Lima View Derivatif Tanpa Proprietary JSON:**
   - *Content-First Grid/List*: navigasi cepat vault lokal (`FS API`/`IDB`) & cloud.
   - *Knowledge Hierarchy Tree*: penjelajahan struktur folder & catatan berstatus *evergreen/seedling*.
   - *Task-Centric Kanban*: mengelompokkan catatan berdasarkan properti YAML `status`, `assignee`, `due`, serta checklist Markdown (`- [ ]`). Mutasi kartu di papan menulis balik langsung ke YAML frontmatter berkas terkait.
   - *Time-Oriented Calendar / Timeline*: membaca tanggal `due`, `published_at`, atau `timeline_date` dari frontmatter.
   - *Productivity & Learning Analytics*: metrik aktivitas sunting, jumlah sitasi masuk, & ringkasan progres LMS DAG.
3. **Integrasi Community Feed & Quota:** `/vaults` menampilkan widget *Following Scholars Feed* dari domain `community`, antrean *Knowledge Merge Requests* dari `vcs`, serta bilah penggunaan kuota dinamis DB pada Stage 3.
4. **Routing Redirect:** Daftarkan `/vaults` di `src/App.tsx` terlindungi `ReleaseStageGate` + `approved`, dan ubah target redirect pengguna terautentikasi di `Landing.tsx` ke `/vaults`.

---

## 3. Konsekuensi
- Berkas `.md` pengguna tetap 100% portabel ketika disinkronkan via folder lokal atau Git.
- Menghindari god-component di beranda berkat pemisahan `DashboardWidgetRegistry.ts` yang juga berfungsi sebagai *Extension Point* bagi `@obmap/sdk` (`ADR-0012`).

---

## Terkait
- [Peta 13 Domain (`../domain-map.md`)](../domain-map.md)
- [ADR-0002: CodeMirror 6 & Isolated YAML](ADR-0002-codemirror-6-markdown-editor.md)
- [Playbook Eksekusi (`../../02-planning/README.md`)](../../02-planning/README.md)
