---
id: DOC-ARCH-003
title: Struktur Repositori & Tata Letak Berkas ObMap v2.0
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.2.0
last_reviewed: 2026-11-20
audience: engineering
related:
  - DOC-ARCH-001
  - DOC-ARCH-002
  - DOC-ENG-002
source_of_truth: src/, supabase/, docs/, AGENTS.md
---

# Struktur Repositori & Tata Letak Berkas (`Repository Structure`)

## Ringkasan 3 Baris
- Mendokumentasikan tata letak direktori kode sumber, migrasi database, modul dokumentasi v2.0, direktori **Zero-Backend Prototype & Archived UI/UX Snapshots (`src/prototype/`)**, dan indeks mesin pada repositori ObMap.
- Menjaga konvensi seragam pada setiap domain di `src/domains/` (`<Domain>Orchestrator.tsx`, `components/`, `shared/{api,hooks,stores,utils}`) serta impor wajib via alias `@/`.
- Memetakan transisi struktur untuk refaktor `public-reader/` → `community/` (`STEP-01.2`), penambahan domain `dashboard/` (`STEP-02.1`), serta alur Track 2 (`src/prototype/ → 1:1 main-app → src/prototype/snapshots/<stage-id>/`).

---

## 1. Struktur Tingkat Atas Repositori

```text
obmap-meed/
├── AGENTS.md                        # Aturan wajib & Rule 11 Changelog Protocol bagi AI agents
├── llms.txt                         # Indeks dokumen standar LLM
├── README.md                        # Pengantar repositori & quickstart lokal
├── docs/                            # Basis dokumentasi v2.0 (README.md Portal & SUMMARY.md)
│   ├── 00-meta/                     # Master Blueprint, Quo Vadis v2.0, Konvensi, Glosarium, Arsip v1.0
│   ├── changelogs/                  # Sistem changelog bulanan sharded & hemat-token (Rule 11)
│   ├── 01-visions/                  # Visi, Filosofi, Positioning (6 Referensi), 5 Pilar Use-Case & Lensa
│   ├── 02-planning/                 # Playbook Antrean Step-by-Step (README.md), PRD, BRD, SRS, SoW, Roadmap
│   ├── 03-architecture/             # Tinjauan Arsitektur, 13 Domain, .app/config.json, Deep Explorer, & adr/ADR-0001..0013
│   ├── 04-features/                 # Katalog Fitur Master
│   ├── 05-engineering/              # Standar Koding, 3 Development Tracks, Testing, Repo Rules, Tech Debt, Doc Drift
│   ├── 06-lms/                      # Spesifikasi Academy Living Competence Tree (3 Lapis)
│   ├── 07-developers/               # Portal SDK (@app/sdk), Extension Points, Theme Guide, Sandbox
│   └── _machine/                    # Metadata JSON + changelog.jsonl (append-only machine stream)
├── src/
│   ├── App.tsx                      # Router utama + guard stage/auth + rute /prototype
│   ├── global/                      # Shared UI (Radix/shadcn), API, stores, types, utils
│   ├── pages/                       # Halaman root (Landing.tsx, Install, PublicReader, Admin, Index)
│   ├── prototype/                   # [Track 2] Zona Eksperimen Zero-Backend & Arsip UI/UX Snapshots
│   │   ├── three-pillar/            # Mockup aktif dynamic zero-backend (in-memory deterministic mock state)
│   │   └── snapshots/<stage-id>/    # Arsip UI/UX Snapshot terisolasi & imutabel per stage di /prototype
│   └── domains/                     # Isolated DDD Bounded Domains (lihat §2)
└── supabase/
    └── migrations/                  # Skema SQL byte-for-byte (V4 + migrasi v2.0 terencana)
```

---

## 2. Tata Letak Standar di Dalam `src/domains/<domain>/`

Setiap bounded domain di `src/domains/` mematuhi struktur kanonik berikut (`ADR-0001` & `ADR-0006`):

```text
src/domains/<domain>/
├── <Domain>Orchestrator.tsx         # Penghubung domain ke route/workspace & store context
├── components/                      # Pure presentational React components (<= 300 baris)
└── shared/
    ├── api/                         # Service layer (Supabase queries, SDK registries, drivers)
    ├── hooks/                       # Headless Controller hooks (use<Feature>Controller.ts)
    ├── stores/                      # Pure Zustand stores & actions (tanpa React context provider)
    ├── utils/                       # Pure TypeScript helpers, layout solvers, URL builders
    └── workers/                     # Web Workers / runner terisolasi (mis. metadata/shared/api/mentions.worker.ts)
```

### Catatan Transisi Direktori Terjadwal
- `STEP-01.2`: `src/domains/public-reader/` (berisi `PublicReaderOrchestrator.tsx`, `components/*`, `shared/*`) direfaktor seluruhnya menjadi `src/domains/community/` dengan `CommunityOrchestrator.tsx`.
- `STEP-02.1`: `src/domains/dashboard/` dibuat baru untuk mengelola `/vaults` (`DashboardOrchestrator.tsx`, `DashboardWidgetRegistry.ts`).

---

## 3. Tata Letak `src/prototype/` & Siklus Hidup Snapshot (Track 2)

```text
src/prototype/
├── three-pillar/                    # Dynamic Zero-Backend Mockup aktif (Phase 2A)
│   ├── ThreePillarPrototypePage.tsx # Entrypoint rute /prototype (+ pemilih katalog snapshot)
│   ├── mock*Data.ts                 # Deterministic in-memory mock datasets
│   └── components/                  # Pure presentational prototype components (siap migrasi 1:1)
└── snapshots/
    └── <stage-id>/                  # Phase 2C: Snapshot imutabel setelah migrasi 1:1 ke src/domains/
```

1. **Zero-Backend Isolation:** Berkas di `src/prototype/` dilarang mengimpor klien Supabase, Auth live, IndexedDB/FS storage driver, atau Web Worker backend; seluruh state menggunakan data mock deterministik in-memory.
2. **Migrasi 1:1 & Pembekuan Snapshot:** Saat fitur mockup disetujui (**Phase 2B**), komponen UI/UX disalin **1:1 secara identik** ke domain target di `src/domains/` lalu disambungkan ke backend nyata. Mockup yang selesai dimigrasikan dibekukan menjadi arsip permanen di `src/prototype/snapshots/<stage-id>/` (**Phase 2C**) agar dapat dibuka kapan saja lewat pemilih snapshot di `/prototype`.

---

## Terkait
- [Peta 13 Domain (`domain-map.md`)](domain-map.md)
- [Aturan Repositori (`../05-engineering/repository-rules.md`)](../05-engineering/repository-rules.md)
- [Playbook Eksekusi (`../02-planning/README.md`)](../02-planning/README.md)
