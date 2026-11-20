---
id: DOC-PLAN-004
title: Statement of Work (SoW) & Paket Pengiriman ObMap v2.0
type: planning
status: [PLANNED]
owner: Principal Software Architect & Project Lead
version: 2.2.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-META-005
  - DOC-PLAN-000
  - DOC-PLAN-006
  - DOC-CHLOG-000
source_of_truth: docs/02-planning/README.md, docs/00-meta/00-2-quovadis.md
---

# Statement of Work (SoW) & Paket Pengiriman ObMap v2.0

## Ringkasan 3 Baris
- Mendefinisikan ruang lingkup pekerjaan (*Work Breakdown Structure*), batasan eksekusi, kriteria serah terima (*Acceptance Criteria*), dan tata kelola perubahan untuk pengembangan ObMap v2.0.
- Memisahkan capaian fondasi Wave 1–3 (`[IMPLEMENTED]`) dari empat paket pengiriman terurut (*Work Packages* `WP-0` s/d `WP-3`) yang dieksekusi lintas **3 Jalur Development Resmi** (*Track 1 Spec-Driven*, *Track 2 Zero-Backend Prototype `src/prototype/` → 1:1 Migration → Snapshot `/prototype`*, *Track 3 Direct Experiment → docs Sync*) mengikuti `docs/02-planning/README.md`.
- Mewajibkan kepatuhan terhadap `AGENTS.md` (Headless Controller `<= 300` baris, Vitest hijau, serta Rule 11 3-Part Changelog Sync) pada setiap penyerahan paket kerja.

---

## 1. Status Baseline & Work Breakdown Structure (WBS)

### Baseline Wave 1–3 (`[IMPLEMENTED]`)
Arsitektur 12 domain DDD, penghapusan *god components* (`OVER_300=0`), 4 solver graf deterministik + Free-Force, editor CodeMirror 6 + YAML terisolasi, Aho-Corasick Web Worker, driver FS Access API + IndexedDB + Cloud, dan skema V4 SQL dasar.

### Paket Kerja v2.0 (*Active & Scheduled Work Packages*)

| Paket Kerja | Stage / Gelombang | Langkah Tercakup | Deliverable Utama & Gate Penerimaan |
| :--- | :--- | :--- | :--- |
| **`WP-0`: Documentation Overhaul (`G1`–`G7` + Upgrade v2.1–v2.2)** | Pre-Code Gate | Docs Waves `G1`–`G7` + Holistic Alignment | Penyelarasan penuh `docs/`, `AGENTS.md`, `llms.txt`, `ADR-0007`–`0013`, 6 Referensi DNA, **`Deep Explorer`**, **Unified `<SettingsHub />`** (*Dual Navigator* + 3 Kategori), **3 Development Tracks**, `.app/config.json`, `@app/sdk`, `docs/07-developers/`, dan `docs/_machine/*.json`. |
| **`WP-1`: Stage 1 Pilot Readiness (`H1`)** | `stage_1_partner` | `STEP-01.1` – `STEP-01.5` | Clean type-safety (`TD-005`), domain `community` + *hard cutover* `/p/*` → `/:username`, `ReleaseStageGate`, approval individual `/admin`, `PolicyEngine` + `CC BY-SA 4.0`, & 6-Layer Config + Theme sync. |
| **`WP-2`: Stage 2 Community Beta (`H2` + `H3`)** | `stage_2_community_beta` | `STEP-02.1` – `STEP-03.3` + `UI-STEP-07` | Domain `dashboard` (`/vaults` + **`Deep Explorer`** & Core Presets `Atlas`/`Studio`/`Academy`/`Freeform`), migrasi Track 2 `<SettingsHub />` (*Dual Navigator* + Snapshot `src/prototype/snapshots/<stage-id>/`), Landing Sandbox `< 65KB` (6 Referensi), Profil `/:username`, `/explore` (+ `Community Presets`), & Unified Drawer *"Share · Access · Versions"* (`AS & WITH` granular Vault/Node). |
| **`WP-3`: Stage 3 Commercial GA (`H4` + `H5`)** | `stage_3_commercial_ga` | `STEP-04.1` – `STEP-05.4` | Skema tarif/kuota dinamis di `/admin`, **Xendit/Midtrans first** + Stripe, Teamspaces + Org-Lock `.app/config.json`, CRDT Yjs, **Academy 3-Layer Competence Tree**, solver `argument-map`/`citation-tree`, Pitch Mode, BYO-AI/Ollama RAG, & **`@app/sdk`**. |

---

## 2. Ruang Lingkup di Luar Cakupan (*Out of Scope* v2.0)
- Aplikasi desktop Electron / Tauri native terpisah *(PWA + File System Access API mencakup kebutuhan lintas-OS v2.0)*.
- Penghapusan atau konversi vault `.md` menjadi format biner tertutup.
- Mekanisme undangan referral *peer-to-peer* pada Stage 2 *(persetujuan akun dilakukan individual oleh Admin di `/admin`)*.
- Papan tugas korporat / *enterprise project management* ala Trello, Asana, Monday.com, ClickUp, maupun fragmentasi file konfigurasi terpisah (`preset.json`, `lms-policy.json`, `setting.json`) di luar `.app/config.json`.

---

## 3. Protokol Serah Terima & Definisi Selesai (DoD)
Setiap penyerahan modul kode (`WP-1` s/d `WP-3`) dinyatakan diterima apabila memenuhi:
1. Seluruh komponen `.tsx` baru/termodifikasi mematuhi batas `<= 300` baris dengan Headless Controller (`ADR-0006`).
2. `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, dan `npm run build` lulus tanpa error.
3. Migrasi SQL baru menyertakan hak akses eksplisit (`authenticated`, `service_role`) serta uji RLS positif & negatif.
4. Agen memperbarui status `STEP-XX.Y` di `docs/02-planning/README.md` serta mengeksekusi **3 pembaruan changelog atomik** (`AGENTS.md` Rule 11).

---

## Terkait
- [Playbook Eksekusi Step-by-Step (`README.md`)](README.md)
- [Roadmap & Horizon (`roadmap.md`)](roadmap.md)
- [Quo Vadis v2.0 (`00-2-quovadis.md`)](../00-meta/00-2-quovadis.md)
- [Repository Rules](../05-engineering/repository-rules.md)
