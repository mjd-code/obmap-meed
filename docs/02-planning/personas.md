---
id: DOC-PLAN-005
title: Katalog Persona Pengguna & Matriks Skenario ObMap v2.0
type: planning
status: [IMPLEMENTED]
owner: Chief Product Officer & UX Lead
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-VIS-004
  - DOC-PLAN-001
  - DOC-PLAN-002
source_of_truth: docs/00-meta/00-0-master-blueprint.md
---

# Katalog Persona Pengguna & Matriks Skenario ObMap v2.0

## Ringkasan 3 Baris
- Mengidentifikasi sembilan persona pengguna utama (`PER-01` s/d `PER-09`) yang mencakup pengguna PKM privat, tim kolaborasi, pendidik LMS, cendekiawan jaringan sosial `/:username`, hingga administrator platform.
- Memetakan kebutuhan fungsional, *pain points*, izin akses (`PolicyEngine`), dan interaksi lintas tahapan rilis (`Stage 1`–`Stage 3`) per persona.
- Menjadi acuan langsung bagi alur *Personalization Survey* saat onboarding, template Dashboard `/vaults`, serta desain UX konsol `/admin`.

---

## 1. Direktori Persona (`PER-01` s/d `PER-09`)

| ID Persona | Peran & Segmen | Pilar Utama | Tujuan Inti di ObMap | Permukaan Utama |
| :--- | :--- | :--- | :--- | :--- |
| **`PER-01`** | **Peneliti Akademik** *(Doctoral / Independent Researcher)* | Pilar 3, 5 | Mensintesis literatur berformat `.md`, memakai *Argument Map* & *Citation Tree*, menyematkan metadata `epistemic_status`/`doi`, dan mengutip lintas vault (`[[@user/vault/note]]`). | `/app`, `/:username`, Cite Exporter |
| **`PER-02`** | **Dosen / Instruktur LMS** *(Educator & Course Author)* | Pilar 4, 2 | Menyusun kurikulum berbentuk graf prasyarat (`prerequisites` DAG), menerbitkan modul kuliah interaktif di `/:username`, serta memantau penguasaan siswa. | `/app`, `/vaults`, `/:username/:vaultSlug` |
| **`PER-03`** | **Konsultan Bisnis & Strategi** | Pilar 3 | Memetakan akar masalah dengan *Fishbone*, *Mindmap*, dan *Timeline* deterministik yang rapi untuk dipresentasikan dalam *Pitch Mode* dan diekspor PDF/SVG. | `/`, `/app`, `/vaults` (Kanban/Timeline) |
| **`PER-04`** | **Product & Engineering Lead** | Pilar 3, 5 | Mengelola ADR teknis, spesifikasi proyek Markdown, tampilan Kanban/Calendar derivatif di `/vaults`, dan ulasan perubahan via VCS Merge Request bersama tim. | `/vaults`, `/app`, `/app` (VCS) |
| **`PER-05`** | **Pembaca Publik & Pembelajar Mandiri** | Pilar 1, 4 | Menemukan konstelasi topik terkurasi di `/explore` tanpa login, memahami relasi konsep lewat dual-pane reader, serta mem-*fork* catatan `CC BY-SA 4.0`. | `/explore`, `/:username/:vaultSlug` |
| **`PER-06`** | **System / Platform Admin** *(Superadmin)* | Infrastruktur & Tata Kelola | Mengontrol *ReleaseStageGate*, menyetujui pendaftar Stage 2 **secara individual per-user**, mengonfigurasi **harga & kuota paket secara dinamis**, dan melakukan **kurasi manual *Verified Scholar***. | `/admin`, `audit_logs` |
| **`PER-07`** | **Kreator Pengetahuan Publik** *(Scholar / Public Thinker)* | Pilar 2, 1 | Membangun portofolio intelektual hidup di `/:username`, mempublikasikan vault terbuka (`CC BY-SA 4.0`), dan menumbuhkan *Impact Index* berbasis sitasi asli. | `/:username`, `community`, Analytics |
| **`PER-08`** | **Kepala Lab Riset / Admin Kampus** | Pilar 3, 5, 4 | Mengelola Teamspaces institusi, menegakkan konfigurasi terkunci organisasi (*Org-Lock Policy*), mengontrol *seat* tim, serta meninjau allowlist plugin `@obmap/sdk`. | `/vaults`, `/admin` (Org Teamspaces) |
| **`PER-09`** | **Kontributor Terbuka & Peer Reviewer** | Pilar 5, 1 | Mem-*fork* vault pengetahuan publik, memperbaiki atau memperkaya catatan, mengajukan *Knowledge Merge Request*, dan memberi anotasi kritis di tingkat paragraf. | `/:username/:vaultSlug`, `vcs` |

---

## 2. Matriks Skenario Akses Lintas Tahap & Role (`Role × Scenario`)

| State / Peran Sesi | Landing & Sandbox (`/`) | Approval & Akses (`/vaults`, `/app`) | Komunitas & Profil (`/:username`) | Monetisasi & Konfigurasi (`/admin`, `/settings`) |
| :--- | :--- | :--- | :--- | :--- |
| **Anonim / Guest (`PER-05`)** | Sandbox in-memory gratis tanpa akun | Redirect ke `/auth` | Baca profil `approved` & vault `Public Listed` / `Shared` link | Hanya switcher tema lokal |
| **Pending Approval (`Stage 2`)** | Karya Sandbox tersimpan sementara untuk migrasi | Ditahan pada **Waitlist Status Card** hingga Admin approve di `/admin` | Dapat membaca karya publik orang lain; profil sendiri belum aktif | Belum dapat menerbitkan vault |
| **Partner Pilot (`Stage 1`)** | Akses cepat via `partner_invitations` | Akses penuh `/vaults` & `/app` | Sesuai visibilitas vault partner | Kuota pilot terkelola Admin |
| **Free Scholar (`PER-01/05/07`)** | Penuh + Migrasi Sandbox | Local Vaults tak terbatas + Cloud dasar dinamis | `/:username` penuh, *Cite*, *Fork*, & *Merge Request* (`CC BY-SA 4.0`) | Checkout **Xendit/Midtrans** saat upgrade |
| **Pro / Team Admin (`PER-03/04/08`)** | Penuh + Preset Tim | 5 views Dashboard + Teamspaces + *Org-Lock* + CRDT | Custom domain / analitik / kurasi tim | Seat management & kuota dinamis DB |
| **Platform Superadmin (`PER-06`)** | Akses telemetry & preview stage | Opsional (tercatat di `audit_logs`) | **Kurasi manual *Verified Scholar*** & moderasi DMCA/etik | **Approval per-user Stage 2**, edit **`plans`/`plan_quotas` dinamis**, kupon |

---

## Terkait
- [Master Blueprint v2.0 §4.2](../00-meta/00-0-master-blueprint.md)
- [Lima Pilar Use-Case](../01-visions/use-case-pillars.md)
- [Product Requirements Document (`prd.md`)](prd.md)
- [Business Requirements Document (`brd.md`)](brd.md)
