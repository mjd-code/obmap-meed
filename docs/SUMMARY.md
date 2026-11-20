---
id: DOC-PORTAL-001
title: Ringkasan Navigasi & Indeks Dokumentasi Sistem (SUMMARY)
type: index
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.1.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-PORTAL-000
  - DOC-META-000
  - DOC-META-002
  - DOC-META-005
  - DOC-CHLOG-000
source_of_truth: docs/
---

# Ringkasan Navigasi Dokumentasi Sistem (`SUMMARY`)

## Ringkasan 3 Baris
- Indeks navigasi cepat seluruh direktori dokumentasi untuk manusia dan sistem otomasi (`llms.txt`).
- Menempatkan [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md) (6 Referensi DNA, filosofi *Unopinionated Data, Opinionated Lenses*, 4 Helicopter Views, Single `.app/config.json`, & `@app/sdk`) dan [Quo Vadis v2.0](00-meta/00-2-quovadis.md) sebagai rujukan tertinggi.
- Seluruh riwayat perubahan terstruktur tersimpan di [Modular Changelog Hub](changelogs/README.md) dan temuan historis berada di [Doc Drift Log](05-engineering/doc-drift-log.md).

---

## 1. Dokumen Induk & Tata Kelola (`00-meta/` & `changelogs/`)
- [Master Blueprint v2.0 (`DOC-META-000`)](00-meta/00-0-master-blueprint.md) — Konstitusi **6 Referensi**, Non-Goal, **4 Helicopter Views**, **Workspace Modes** (`Freeform`/`Atlas`/`Studio`/`Academy`), **`.app/config.json`**, **3-Scope Settings**, **Essential VCS + Granular `AS & WITH`**, & **`@app/sdk`**.
- [Quo Vadis v2.0 (`DOC-META-005`)](00-meta/00-2-quovadis.md) — Audit kesiapan 20 dimensi, daftar drift, & roadmap `EPIC-01`–`15`.
- [Quo Vadis v1.0 (`00-1-quovadis.md`)](00-meta/00-1-quovadis.md) — Arsip historis cetak biru Wave 3.
- [Modular Changelog Hub (`DOC-CHLOG-000`)](changelogs/README.md) & [Machine JSONL](_machine/changelog.jsonl) — Pusat riwayat perubahan hemat-token & SOP wajib agen.
- [Glosarium Kanonik (`DOC-META-002`)](00-meta/glossary.md) · [Konvensi (`DOC-META-001`)](00-meta/doc-conventions.md) · [Legenda Status (`DOC-META-003`)](00-meta/status-legend.md).

## 2. Visi & Perencanaan (`01-visions/` & `02-planning/`)
- Visi: [Vision & Mission](01-visions/vision-mission.md) · [Product Philosophy](01-visions/product-philosophy.md) · [Positioning (6 Referensi)](01-visions/positioning.md) · [Use Case Pillars & Presets](01-visions/use-case-pillars.md).
- Perencanaan & Eksekusi Bertahap: [**Planning Playbook (`STEP-01.1`–`05.4`)**](02-planning/README.md) · [UI/UX & 3-Scope Settings Plan](02-planning/ui-ux-and-universal-design-system-plan.md) · [XMind Visual Engine & Obsidian Synthesis Plan](02-planning/xmind-obsidian-visual-engine-plan.md) · [PRD](02-planning/prd.md) · [BRD](02-planning/brd.md) · [SRS](02-planning/srs.md) · [SoW](02-planning/sow.md) · [Personas](02-planning/personas.md) · [Roadmap](02-planning/roadmap.md) · [Traceability Matrix](02-planning/traceability-matrix.md).

## 3. Arsitektur, Fitur, Engineering, Academy & Developer SDK (`03-architecture/` s/d `07-developers/`)
- Arsitektur: [System Overview & 3-Scope Controls](03-architecture/system-overview.md) · [Repository Structure](03-architecture/repository-structure.md) · [Domain Map](03-architecture/domain-map.md) · [Data & Single `.app/config.json`](03-architecture/data-and-storage.md) · [Helicopter Views & Layout Engine](03-architecture/layout-engine.md) · [Essential VCS & Granular Collaboration/Publishing](03-architecture/collaboration-and-publishing.md) · [ADR Index (`0001`–`0013`)](03-architecture/adr/README.md).
- Fitur & Academy: [Feature Catalog](04-features/feature-catalog.md) · [Academy 3-Layer Competence Tree Vision](06-lms/lms-vision.md).
- Engineering: [Coding Standards](05-engineering/coding-standards.md) · [Testing Strategy](05-engineering/testing-strategy.md) · [Repository Rules](05-engineering/repository-rules.md) · [Contribution Guide](05-engineering/contribution-guide.md) · [Tech Debt Register](05-engineering/tech-debt-register.md) · [Doc Drift Log](05-engineering/doc-drift-log.md).
- Developer SDK (`@app/sdk`): [Dev Portal](07-developers/README.md) · [SDK Quickstart](07-developers/plugin-sdk-quickstart.md) · [Extension Points](07-developers/extension-points-reference.md) · [Theme Guide](07-developers/theme-authoring-guide.md) · [Security & Sandbox](07-developers/security-and-sandbox.md).

---

## Terkait
- [Portal Dokumentasi Utama](README.md)
- [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-meta/00-2-quovadis.md)
