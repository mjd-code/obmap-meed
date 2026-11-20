---
id: DOC-PLAN-005
title: Katalog Persona Pengguna & Matriks Skenario ObMap v2.0
type: planning
status: [IMPLEMENTED]
owner: Chief Product Officer & UX Lead
version: 2.1.0
last_reviewed: 2026-11-20
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
| **`PER-02`** | **Dosen / Guru / Pengurus `Academy`** *(Educator & Curriculum Admin)* | Pilar 4, 2 | Menyusun **Living Pedagogical & Competence Tree** (*Falsafah → Kurikulum → Silabus → RPS → Tugas*), mengatur aturan Lapisan 2–3 di `.app/config.json`, & meninjau *Living Student Sub-Nodes* (`KMR`). | `/app` (`Academy`), `/vaults`, `/:username/:vaultSlug` (`course`) |
| **`PER-03`** | **Konsultan & Pemikir Visual** | Pilar 3 | Memetakan akar masalah dengan *Fishbone*, *Mindmap*, *Timeline*, & 4 *Helicopter Views* untuk presentasi *Pitch Mode* dan ekspor PDF/SVG. | `/`, `/app` (`Atlas`), `/vaults` |
| **`PER-04`** | **Knowledge Architect & Editor Publikasi (`Studio`)** | Pilar 2, 3, 5 | Mengkurasi artikel/buku/ADR via **Mode `Studio`** + wajib 4 Helicopter Views (*Cards* galeri, *Table* SEO, *Graph* *internal link clusters*, *Diagram* outline), serta *Visual Diff/KMR* bersama tim. | `/vaults`, `/app` (`Studio`), Drawer *"Share · Access · Versions"* |
| **`PER-05`** | **Pembaca Publik & Murid (`Student`)** | Pilar 1, 4 | Menjelajahi `/explore`, mengikuti kursus *Presentation Lens `course`*, mencatat di *Living Student Sub-Nodes*, dan mem-*fork* catatan `CC BY-SA 4.0`. | `/explore`, `/:username/:vaultSlug`, `/app` |
| **`PER-06`** | **System / Platform Admin** *(Superadmin)* | Infrastruktur & Tata Kelola | Mengontrol *ReleaseStageGate*, menyetujui pendaftar Stage 2 **individual**, atur **harga & kuota dinamis**, melakukan **kurasi *Verified Scholar* & promosi `Community Presets → Core Presets`**. | `/admin`, `audit_logs` |
| **`PER-07`** | **Kreator Pengetahuan Publik** *(Scholar / Public Thinker)* | Pilar 2, 1 | Mengkurasi portofolio di `/:username` (*atlas / publication / course / template*), menerbitkan **Vault atau Folder/File-Node secara granular**, dan menumbuhkan *Impact Index*. | `/:username` (+ *"Full Account Settings →"*), `community` |
| **`PER-08`** | **Kepala Lab Riset / Admin Kampus** | Pilar 3, 5, 4 | Mengelola Teamspaces institusi, mengunci kebijakan `.app/config.json` (*Org-Lock*), mengontrol *seat* tim, & meninjau allowlist plugin **`@app/sdk`** / kebijakan BYO-AI. | `/vaults`, `/settings`, `/admin` |
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
