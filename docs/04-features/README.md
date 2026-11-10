---
id: DOC-FEAT-000
title: Indeks dan Panduan Katalog Fitur ObMap
type: index
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-FEAT-001
  - DOC-PLAN-001
source_of_truth: src/domains/
---

# Indeks dan Panduan Katalog Fitur ObMap

## Ringkasan 3 Baris
- Pintu gerbang inventarisasi seluruh kapabilitas perangkat lunak ObMap lintas 12 domain.
- Menjelaskan konvensi identifikasi fitur (`FEAT-<DOMAIN>-NNN`) dan pemisahan fitur makro versus mikro.
- Mewajibkan pembaruan katalog setiap kali terjadi penambahan fungsionalitas di kode sumber.

---

## Struktur Direktori Fitur
- `feature-catalog.md`: Tabel master seluruh fitur utama sistem.
- `general-modules/`: Uraian fitur tingkat domain (misal: Editor, Graph, VCS).
- `micro-features/`: Uraian interaksi mikro spesifik (misal: Contextual Toolbar, Collapsible Properties, Anti-collision Bounding Box).

---

## Terkait
- [Tabel Master Katalog Fitur](feature-catalog.md)
- [Product Requirements Document (PRD)](../02-planning/prd.md)