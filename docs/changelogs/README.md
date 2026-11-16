---
id: DOC-CHLOG-000
title: Modular Changelog Hub & Mandatory AI Agent Update Protocol
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-16
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
| `CHG-20261116-010` | 2026-11-16 | `graph`, `app` | Unifikasi `GraphQuickCanvasBar` + `GraphWorkspaceControls` → `GraphFloatingDock` (*Centered Mega-Menu Card*, 6 cluster, toggle `Smart Inspector` di cluster `Zoom`, guard `Free-Force`), relokasi `GraphCanvasUtilityDock` ke kanan bawah, & hapus 4 file lama | `tsc` + `eslint` (0 err) + 167 Vitest + `vite build` + `<=300` baris | [2026-11.md](2026-11.md) |
| `CHG-20261116-009` | 2026-11-16 | `auth`, `collaboration`, `community`, `settings`, `vault`, `global` | Wave 1 Security Hardening (5 temuan Supabase: `search_path`, RLS `profiles` + RPC kolaborator/publik, RLS `username_redirects` + RPC point-lookup, & `vault-media` folder binding) + perbaikan menyeluruh rute `/@:username` & `/:username` | `tsc` + 167 Vitest + `vite build` + `eslint` | [2026-11.md](2026-11.md) |
| `CHG-20261116-008` | 2026-11-16 | `admin`, `auth`, `collaboration`, `graph`, `metadata`, `settings`, `sync`, `vault`, `vcs`, `workspace`, `global` | Perbaikan typecheck lintas domain: selaraskan kontrak orchestrator, props, model graph, profil/role, dan status autosave | `oj typecheck -b --noEmit` passed | [2026-11.md](2026-11.md) |
| `CHG-20261116-007` | 2026-11-16 | `graph`, `editor`, `global`, `planning` | Eksekusi `XMIND-STEP-05` & `XMIND-STEP-06` (`DOC-PLAN-009`): Konsolidasi UX 3-Lapis (`GraphQuickCanvasBar` + `GraphContextualInspector` + Engine Tuning), ekstraksi YAML `structure_class` & `frontmatterMindmapSync`, sidecar `.vk/mindmap-layout.json` (fallback `.obmap/`), & In-Note Outline AST Bridge *lossless* | `tsc` + 163 Vitest + `vite build` + `eslint` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-006` | 2026-11-16 | `editor`, `graph`, `settings`, `community`, `pages`, `global`, `planning` | Eksekusi `UI-STEP-04`, `UI-STEP-05`, & `UI-STEP-06` (`DOC-PLAN-008`, menjaga `UI-STEP-03` pending): `EditorFormatToolbar` + sinkron `--vk-prose-*` Reading/CM6, tab `Forces` graf, fix `Landing`/`NotFound`/`PublicReaderQuickPreferences`, varian `Badge`/`Button` + `color-mix` Tailwind alpha `--vk-*`, & sapu bersih `text-[9..11px]`/palet mentah (`99` berkas + preloader) + `motion-reduce` | `tsc` + 159 Vitest + `vite build` + `ZERO_MICRO_PX` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-005` | 2026-11-16 | `settings`, `planning` | Eksekusi `UI-STEP-02` (`DOC-PLAN-008`): `SettingsHub` 2-kolom mandiri + search, daftar `appearance` & `graph-engine`, headless `useSettingsAppearanceController.ts`, `SettingsAppearanceSection.tsx` + Sticky `SettingsAppearancePreviewCard.tsx` (WCAG + Org-Lock), & token semantik *Locked by Admin* | `tsc` + 154 Vitest + `vite build` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-004` | 2026-11-16 | `global`, `settings`, `graph`, `app`, `planning` | Eksekusi `UI-STEP-01` (`DOC-PLAN-008`): taksonomi 8 kategori `--vk-*`, `vk-text-*`, 6 preset tema WCAG AA/AAA (`themePresets.ts`), `computeContrastRatio`/`autoAdjustContrastHsl`, font catalog `index.html`, Tailwind semantic colors, seksi `"appearance"`, & `hydrateAppearanceOnBoot()` | `tsc` + 152 Vitest + `vite build` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-003` | 2026-11-16 | `docs`, `settings`, `graph`, `developer-sdk`, `planning` | Standardisasi terminologi teknis universal di `docs/` & token bridge: `--ob-*` → `--vk-*` (mirror `--ob-*`), `ob-text-*` → `vk-text-*`, `.obmap/` → `.vk/`, `.vk-themed-root`, `@vk/sdk`, & `minEngineVersion` | JSON/JSONL + `git grep` + `tsc` + 150 Vitest | [2026-11.md](2026-11.md) |
| `CHG-20261116-002` | 2026-11-16 | `global`, `settings`, `graph`, `vault`, `auth`, `admin`, `community`, `sync` | Eksekusi `BRAND-STEP-01` (`ADR-0013`): implementasi `brand.config.ts` (brand aktif dinamis `"Sidra"` + `VITE_BRAND_*` + runtime override), `storageKeyMigrator.ts` (`VkConfigDB`/`vk-*` fallback `obmap-*`), `viteBrandHtmlPlugin`, rewiring `11` UI ke `useBrandConfig()`, CLI `scripts/rebrand.ts`, & tutup `DRFT-017` | `tsc` + 150 Vitest + `vite build` + `--dry-run` + `OVER_300=0` | [2026-11.md](2026-11.md) |
| `CHG-20261116-001` | 2026-11-16 | `docs`, `architecture`, `global`, `settings`, `planning` | Terbitkan `ADR-0013` (*Brand-Agnostic Technical Infrastructure, Dynamic Brand Registry & Safe Auto-Rebranding Engine*) + jadwalkan `BRAND-STEP-01`; perbarui `data-and-storage.md` (migrasi zero-loss `vk-*`), `coding-standards.md`, `doc-drift-log.md` (`DRFT-017`), `02-planning/*`, `00-0-master-blueprint.md`, & `docs-index.json` | JSON/JSONL + Link Check + `git status` (`0` edit `src/`) | [2026-11.md](2026-11.md) |

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
