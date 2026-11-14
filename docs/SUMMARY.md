---
id: DOC-PORTAL-001
title: Ringkasan Navigasi & Indeks Dokumentasi Sistem (SUMMARY)
type: index
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-PORTAL-000
  - DOC-META-000
  - DOC-META-005
  - DOC-CHLOG-000
source_of_truth: docs/
---

# Ringkasan Navigasi Dokumentasi ObMap (`SUMMARY`)

## Ringkasan 3 Baris
- Indeks navigasi cepat seluruh direktori dokumentasi ObMap untuk manusia dan sistem otomasi (`llms.txt`).
- Menempatkan [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md) dan [Quo Vadis v2.0](00-meta/00-2-quovadis.md) sebagai rujukan tertinggi, serta [Modular Changelog Hub](changelogs/README.md) sebagai pusat riwayat perubahan.
- Temuan audit file & *code drift* terdahulu telah diarsipkan secara terstruktur di [Doc Drift Log](05-engineering/doc-drift-log.md).

---

## 1. Dokumen Induk & Tata Kelola (`00-meta/` & `changelogs/`)
- [Master Blueprint v2.0 (`DOC-META-000`)](00-meta/00-0-master-blueprint.md) — Spesifikasi sistem menyeluruh (5 DNA, rute `/:username`, 3-Stage Shipping Gate, RBAC, monetisasi, `dashboard`, 6-layer config, `@obmap/sdk`).
- [Quo Vadis v2.0 (`DOC-META-005`)](00-meta/00-2-quovadis.md) — Retrospektif teknis Wave 1–3, audit kesiapan 20 dimensi, daftar drift, & roadmap `EPIC-01`–`15`.
- [Quo Vadis v1.0 (`00-1-quovadis.md`)](00-meta/00-1-quovadis.md) — Arsip historis cetak biru Wave 3.
- [Modular Changelog Hub (`DOC-CHLOG-000`)](changelogs/README.md) & [Machine JSONL](_machine/changelog.jsonl) — Pusat riwayat perubahan hemat-token & SOP wajib agen.
- [Konvensi Dokumentasi (`DOC-META-001`)](00-meta/doc-conventions.md), [Glosarium (`DOC-META-002`)](00-meta/glossary.md), [Legenda Status (`DOC-META-003`)](00-meta/status-legend.md).

## 2. Visi & Perencanaan (`01-visions/` & `02-planning/`)
- Visi: [Vision & Mission](01-visions/vision-mission.md) · [Product Philosophy](01-visions/product-philosophy.md) · [Positioning](01-visions/positioning.md) · [Use Case Pillars](01-visions/use-case-pillars.md).
- Perencanaan & Eksekusi Bertahap: [**Planning Playbook (`STEP-01.1`–`05.4`)**](02-planning/README.md) · [PRD](02-planning/prd.md) · [BRD](02-planning/brd.md) · [SRS](02-planning/srs.md) · [SoW](02-planning/sow.md) · [Personas](02-planning/personas.md) · [Roadmap](02-planning/roadmap.md) · [Traceability Matrix](02-planning/traceability-matrix.md).

## 3. Arsitektur, Fitur, Engineering, LMS & Developer SDK (`03-architecture/` s/d `07-developers/`)
- Arsitektur: [System Overview](03-architecture/system-overview.md) · [Repository Structure](03-architecture/repository-structure.md) · [Domain Map](03-architecture/domain-map.md) · [Data & Storage](03-architecture/data-and-storage.md) · [Layout Engine](03-architecture/layout-engine.md) · [Collaboration & Publishing](03-architecture/collaboration-and-publishing.md) · [ADR Index](03-architecture/adr/README.md).
- Fitur & LMS: [Feature Catalog](04-features/feature-catalog.md) · [LMS Vision](06-lms/lms-vision.md).
- Engineering: [Coding Standards](05-engineering/coding-standards.md) · [Testing Strategy](05-engineering/testing-strategy.md) · [Repository Rules](05-engineering/repository-rules.md) · [Contribution Guide](05-engineering/contribution-guide.md) · [Tech Debt Register](05-engineering/tech-debt-register.md) · [Doc Drift Log](05-engineering/doc-drift-log.md).
- Developer SDK (`@obmap/sdk`): [Dev Portal](07-developers/README.md) · [SDK Quickstart](07-developers/plugin-sdk-quickstart.md) · [Extension Points](07-developers/extension-points-reference.md) · [Theme Guide](07-developers/theme-authoring-guide.md) · [Security & Sandbox](07-developers/security-and-sandbox.md).

---

## Terkait
- [Portal Dokumentasi Utama](README.md)
- [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-meta/00-2-quovadis.md)
