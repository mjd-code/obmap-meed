---
id: DOC-CHLOG-000
title: Modular Changelog Hub & Mandatory AI Agent Update Protocol
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-META-004
  - DOC-META-005
  - DOC-CHLOG-001
  - DOC-CHLOG-002
source_of_truth: docs/_machine/changelog.jsonl
---

# Modular Changelog Hub & LLM Agent Protocol

## Ringkasan 3 Baris
- Sistem changelog dua lapis yang dirancang efisien token untuk LLM sekaligus terstruktur rapi bagi manusia: stream JSONL ringan (`docs/_machine/changelog.jsonl`) dan log sharded bulanan (`docs/changelogs/YYYY-MM.md`).
- Setiap AI agent atau developer **WAJIB** mencatat setiap perubahan kode, migrasi SQL, konfigurasi, atau arsitektur dokumentasi sebelum menutup sesi kerja (diatur oleh `AGENTS.md` Rule 11).
- Riwayat Wave 1–3 disimpan terpisah pada [Arsip Wave 1–3](archive-wave-1-to-3.md) agar pembacaan konteks terbaru tidak terbebani data historis.

---

## 1. Arsitektur 3 Lapis (Token-Efficient Design)

| Lapis | Lokasi Berkas | Konsumen Utama | Cara Kerja & Efisiensi |
| :---: | :--- | :--- | :--- |
| **L1 (Fast Machine Index)** | `docs/_machine/changelog.jsonl` | AI Agents / CI Scripts | Format JSON Lines *append-only*. LLM cukup membaca `10–20` baris terakhir (`< 500` token) untuk memahami konteks perubahan terkini. |
| **L2 (Sharded Monthly Detail)** | `docs/changelogs/YYYY-MM.md` | Engineers & Deep-Context LLMs | Rincian teknis terstruktur per bulan (`CHG-YYYYMMDD-NNN`). Arsip lama dipisah di `archive-wave-1-to-3.md`. |
| **L3 (Rolling Top-10 Summary)** | Tabel §2 di dokumen ini | Human & Agent Entrypoint | Ringkasan 10 perubahan terbaru agar navigasi awal tidak perlu membuka berkas lain. |

---

## 2. Rolling Top-10 Recent Changes

| ID Perubahan | Tanggal | Scope / Domain | Ringkasan Perubahan | Status Verifikasi | Log Detail |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `CHG-20261114-004` | 2026-11-14 | `auth`, `admin`, `collaboration`, `community`, `settings`, `graph`, `supabase` | Eksekusi `STEP-01.3`–`01.5` (`EPIC-02`, `EPIC-03`): `ReleaseStageGate` & approval per-user `/admin` (`DRFT-016`), `PolicyEngine` & 4-state visibility + `CC BY-SA 4.0` (`DRFT-012`), 6-layer config & `--ob-*` DOM/Canvas2D theme bridge + V4.2 SQL | `tsc` + 119 Vitest + `vite build` | [2026-11.md](2026-11.md) |
| `CHG-20261114-003` | 2026-11-14 | `global`, `community`, `routing`, `supabase` | Eksekusi `STEP-01.1` & `STEP-01.2` (`EPIC-01`): regenerasi 17-tabel `supabaseTypes.ts` (`TD-005`), migrasi V4.1, refaktor `public-reader` → `community`, & *hard cutover* `/p/*` → `/:username` / `/@:username` | `tsc` + 110 Vitest + `vite build` | [2026-11.md](2026-11.md) |
| `CHG-20261114-002` | 2026-11-14 | `docs`, `planning`, `adr`, `sdk`, `_machine` | Perombakan lengkap `G1`–`G7`: kunci 8 keputusan ADR, Playbook `STEP-01.1`–`05.4` di `02-planning/README.md`, `ADR-0007`–`0012`, portal `07-developers/`, & sinkronisasi `docs/_machine/*.json` | JSON/Link/Mermaid Check | [2026-11.md](2026-11.md) |
| `CHG-20261114-001` | 2026-11-14 | `docs`, `meta`, `governance` | Perumusan Master Blueprint v2.0 (`DOC-META-000`), Quo Vadis v2.0 (`DOC-META-005`), 3-Stage Shipping Gate, rute root `/:username`, & subsystem changelog modular LLM | Docs Verified | [2026-11.md](2026-11.md) |
| `vRestruct1.3.6` | 2026-11-10 | `graph`, `metadata`, `workspace` | Perbaikan export `Node`, worker `mentions.worker.ts`, guard `openView`, & integrasi `createGraphInteractionStore` | Wave 3 Baseline | [2026-11.md](2026-11.md) |
| `vRestruct1.3.0-5` | 2026-11-09 | `src/domains/*`, `src/global/` | Migrasi penuh 108 file legacy ke 12 domain DDD, Orchestrator Pattern, & Headless Controllers (`TD-001`–`007`) | Wave 3 Baseline | [archive-wave-1-to-3.md](archive-wave-1-to-3.md) |
| `vRestruct1.2.x` | 2026-11-08 | `graph` | Pemisahan solver deterministik (Mindmap, Org, Timeline, Fishbone) & Color/Atmosphere Engine | Wave 2 Baseline | [archive-wave-1-to-3.md](archive-wave-1-to-3.md) |
| `vRestruct1.0.0-1` | 2026-11-05 | `vault`, `vcs`, `supabase` | Pengenalan `DomainEvents`, migrasi SQL kolaborasi V4, micro-VCS, & legacy `/p/*` reader | Wave 1 Baseline | [archive-wave-1-to-3.md](archive-wave-1-to-3.md) |

---

## 3. Mandatory Agent Update SOP (Wajib Dieksekusi Tiap Perubahan)

Setiap kali AI agent menyelesaikan perubahan kode, skema database, konfigurasi, atau dokumentasi arsitektural, jalankan **3 langkah atomik** berikut:

1. **Append ke Machine Stream (`docs/_machine/changelog.jsonl`):**
   Tambahkan tepat **1 baris JSON valid** di akhir berkas dengan skema:
   `{"id":"CHG-YYYYMMDD-NNN","date":"YYYY-MM-DD","type":"feat|fix|refactor|docs|db|perf|chore","stage":"stage_1_partner|stage_2_community_beta|stage_3_commercial_ga|infra","domains":["..."],"summary":"...","files":["..."],"verified":"npx vitest run | tsc | docs"}`
2. **Tambahkan Entri ke Log Bulanan (`docs/changelogs/YYYY-MM.md`):**
   Salin struktur ringkas dari [`_template.md`](_template.md). Jika berkas bulan berjalan belum ada, buat berkas baru dengan front-matter `DOC-CHLOG-NNN`.
3. **Perbarui Tabel Rolling Top-10 (§2 di dokumen ini):**
   Sisipkan entri baru di baris teratas tabel dan pertahankan maksimal 10 entri terbaru.

---

## Terkait
- [Master Blueprint v2.0](../00-meta/00-0-master-blueprint.md)
- [Quo Vadis v2.0 Execution Plan](../00-meta/00-2-quovadis.md)
- [Log Evolusi Sistem (Legacy Index)](../00-meta/changelog.md)
- [Template Entri Changelog](_template.md)
