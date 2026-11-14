---
id: DOC-PORTAL-000
title: Portal Dokumentasi Teknis & Produk ObMap
type: index
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-META-005
  - DOC-CHLOG-000
  - DOC-PORTAL-001
source_of_truth: docs/
---

# Portal Dokumentasi ObMap

## Ringkasan 3 Baris
- Pintu masuk utama navigasi arsitektur, perencanaan produk, spesifikasi teknis, dan riwayat perubahan ObMap bagi engineer maupun AI coding agent.
- Seluruh arah produk dan standar teknis mengacu pada [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md) dan [Quo Vadis v2.0](00-meta/00-2-quovadis.md).
- Setiap perubahan kode atau dokumentasi wajib dicatat pada [Modular Changelog Hub](changelogs/README.md) dan `docs/_machine/changelog.jsonl`.

---

## 1. Dokumen Fondasi Utama (Mulai Dari Sini)

| Prioritas | Dokumen | Peran & Kegunaan |
| :---: | :--- | :--- |
| **1** | [**Master Blueprint v2.0**](00-meta/00-0-master-blueprint.md) (`DOC-META-000`) | Spesifikasi arsitektur target, 5 sistem referensi, rute `/:username`, 3-Stage Shipping Gate, RBAC, monetisasi, dashboard, & `@obmap/sdk` |
| **2** | [**Quo Vadis v2.0**](00-meta/00-2-quovadis.md) (`DOC-META-005`) | Audit kesiapan 20 dimensi sistem, register *Doc Drift*, strategi rilis bertahap, roadmap `EPIC-01`–`15`, & rencana perombakan docs |
| **3** | [**Modular Changelog Hub**](changelogs/README.md) (`DOC-CHLOG-000`) | Ringkasan *Rolling Top-10*, log bulanan (`2026-11.md`), dan SOP update wajib 3-langkah bagi setiap AI agent |
| **4** | [**Machine Changelog Stream**](_machine/changelog.jsonl) | Stream JSONL *append-only* untuk konteks cepat AI agent (`tail -n 15` `< 500` token) |

---

## 2. Jalur Baca Berdasarkan Peran (Role-Based Reading Map)

| Peran Pembaca | Urutan Bacaan yang Disarankan |
| :--- | :--- |
| **AI Coding Agents / LLMs** | `AGENTS.md` → `llms.txt` → `docs/_machine/changelog.jsonl` (15 baris akhir) → `02-planning/README.md` (antrean step-by-step) → `00-meta/00-0-master-blueprint.md` |
| **Software Architects & Engineers** | `00-meta/00-0-master-blueprint.md` → `02-planning/README.md` → `03-architecture/system-overview.md` → `03-architecture/domain-map.md` → `03-architecture/adr/README.md` |
| **Product, UX & Growth Leads** | `00-meta/00-0-master-blueprint.md` → `01-visions/positioning.md` → `02-planning/prd.md` → `02-planning/brd.md` → `02-planning/personas.md` |
| **Platform Ops & Release Admin** | `00-meta/00-2-quovadis.md` §3 & §6 → `05-engineering/doc-drift-log.md` → `05-engineering/tech-debt-register.md` → `03-architecture/collaboration-and-publishing.md` |
| **Plugin & Theme Developers** | `07-developers/README.md` → `07-developers/plugin-sdk-quickstart.md` → `07-developers/extension-points-reference.md` → `07-developers/security-and-sandbox.md` |

---

## 3. Peta Direktori `docs/`

| Direktori | Fungsi | Berkas Kunci |
| :--- | :--- | :--- |
| `docs/00-meta/` | Blueprint induk, peta jalan, konvensi & glosarium | [00-0-master-blueprint.md](00-meta/00-0-master-blueprint.md), [00-2-quovadis.md](00-meta/00-2-quovadis.md), [doc-conventions.md](00-meta/doc-conventions.md), [glossary.md](00-meta/glossary.md), [status-legend.md](00-meta/status-legend.md), [00-1-quovadis.md](00-meta/00-1-quovadis.md) *(Arsip Wave 3)* |
| `docs/changelogs/` | Sistem changelog sharded hemat-token | [README.md](changelogs/README.md), [2026-11.md](changelogs/2026-11.md), [archive-wave-1-to-3.md](changelogs/archive-wave-1-to-3.md), [_template.md](changelogs/_template.md) |
| `docs/01-visions/` | Visi, filosofi, positioning & use-case pillars | [vision-mission.md](01-visions/vision-mission.md), [product-philosophy.md](01-visions/product-philosophy.md), [positioning.md](01-visions/positioning.md), [use-case-pillars.md](01-visions/use-case-pillars.md) |
| `docs/02-planning/` | Playbook eksekusi gradual & spesifikasi perencanaan | [**README.md**](02-planning/README.md) *(Step-by-Step Queue)*, [prd.md](02-planning/prd.md), [brd.md](02-planning/brd.md), [srs.md](02-planning/srs.md), [sow.md](02-planning/sow.md), [personas.md](02-planning/personas.md), [roadmap.md](02-planning/roadmap.md), [traceability-matrix.md](02-planning/traceability-matrix.md) |
| `docs/03-architecture/` | Desain sistem, 13 domain DDD, storage, graf & ADR | [system-overview.md](03-architecture/system-overview.md), [domain-map.md](03-architecture/domain-map.md), [data-and-storage.md](03-architecture/data-and-storage.md), [layout-engine.md](03-architecture/layout-engine.md), [collaboration-and-publishing.md](03-architecture/collaboration-and-publishing.md), [adr/README.md](03-architecture/adr/README.md) |
| `docs/04-features/` | Katalog fitur master & status verifikasi | [feature-catalog.md](04-features/feature-catalog.md), [README.md](04-features/README.md) |
| `docs/05-engineering/` | Standar kode, pengujian, aturan repo, hutang teknis & drift | [coding-standards.md](05-engineering/coding-standards.md), [testing-strategy.md](05-engineering/testing-strategy.md), [repository-rules.md](05-engineering/repository-rules.md), [tech-debt-register.md](05-engineering/tech-debt-register.md), [doc-drift-log.md](05-engineering/doc-drift-log.md) |
| `docs/06-lms/` | Spesifikasi kurikulum graf DAG & gamifikasi | [lms-vision.md](06-lms/lms-vision.md) |
| `docs/07-developers/` | Portal SDK Ekstensi (`@obmap/sdk`) & Tema | [README.md](07-developers/README.md), [plugin-sdk-quickstart.md](07-developers/plugin-sdk-quickstart.md), [extension-points-reference.md](07-developers/extension-points-reference.md), [theme-authoring-guide.md](07-developers/theme-authoring-guide.md), [security-and-sandbox.md](07-developers/security-and-sandbox.md) |
| `docs/_machine/` | Indeks JSON & JSONL untuk konsumsi mesin | `changelog.jsonl`, `docs-index.json`, `domains.json`, `features.json`, `requirements.json`, `repo-map.json` |

---

## Terkait
- [Indeks Ringkas Dokumentasi (SUMMARY)](SUMMARY.md)
- [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-meta/00-2-quovadis.md)
