---
id: DOC-ARCH-003
title: Struktur Repositori & Tata Letak Berkas ObMap v2.0
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-001
  - DOC-ARCH-002
  - DOC-ENG-002
source_of_truth: src/, supabase/, docs/, AGENTS.md
---

# Struktur Repositori & Tata Letak Berkas (`Repository Structure`)

## Ringkasan 3 Baris
- Mendokumentasikan tata letak direktori kode sumber, migrasi database, modul dokumentasi v2.0, dan indeks mesin pada repositori ObMap.
- Menjaga konvensi seragam pada setiap domain di `src/domains/` (`<Domain>Orchestrator.tsx`, `components/`, `shared/{api,hooks,stores,utils}`) serta impor wajib via alias `@/`.
- Memetakan transisi struktur untuk refaktor `public-reader/` → `community/` (`STEP-01.2`) dan penambahan domain `dashboard/` (`STEP-02.1`).

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
│   ├── 01-visions/                  # Visi, Filosofi, Positioning (5 Referensi), 5 Pilar Use-Case
│   ├── 02-planning/                 # Playbook Antrean Step-by-Step (README.md), PRD, BRD, SRS, SoW, Roadmap
│   ├── 03-architecture/             # Tinjauan Arsitektur, 13 Domain, Storage, Graph, & adr/ADR-0001..0012
│   ├── 04-features/                 # Katalog Fitur Master
│   ├── 05-engineering/              # Standar Koding, Testing Strategy, Repo Rules, Tech Debt, Doc Drift Log
│   ├── 06-lms/                      # Spesifikasi LMS Skill Tree DAG
│   ├── 07-developers/               # Portal SDK (@obmap/sdk), Extension Points, Theme Guide, Sandbox
│   └── _machine/                    # Metadata JSON + changelog.jsonl (append-only machine stream)
├── src/
│   ├── App.tsx                      # Router utama + guard stage/auth
│   ├── global/                      # Shared UI (Radix/shadcn), API (untypedSupabase.ts -> hapus di STEP-01.1), stores, types, utils
│   ├── pages/                       # Halaman root (Landing.tsx, Install, dll.)
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

## Terkait
- [Peta 13 Domain (`domain-map.md`)](domain-map.md)
- [Aturan Repositori (`../05-engineering/repository-rules.md`)](../05-engineering/repository-rules.md)
- [Playbook Eksekusi (`../02-planning/README.md`)](../02-planning/README.md)
