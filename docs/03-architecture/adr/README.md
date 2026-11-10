---
id: DOC-ADR-000
title: Indeks Architecture Decision Records (ADR)
type: index
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ARCH-001
source_of_truth: docs/03-architecture/adr/
---

# Indeks Architecture Decision Records (ADR)

## Ringkasan 3 Baris
- Dokumentasi formal keputusan arsitektur strategis yang telah disepakati dan terbukti di dalam basis kode.
- Mengadopsi format standar: Konteks Masalah, Alternatif Solusi, Keputusan yang Diambil, dan Konsekuensi Teknis.
- Menjadi panduan agar keputusan desain tidak dipertanyakan ulang tanpa bukti regresi performa baru.

---

## Daftar Keputusan Arsitektur Resmi

| ID ADR | Judul Keputusan | Status | Tanggal Berlaku | Area Dampak Utama |
| :--- | :--- | :--- | :--- | :--- |
| `ADR-0001` | [Restrukturisasi Domain-Driven Design (Wave 3)](ADR-0001-domain-driven-design-restructuring.md) | `[IMPLEMENTED]` | 2026-11-10 | Seluruh repositori (`src/domains/*`) |
| `ADR-0002` | [Penggunaan CodeMirror 6 sebagai Editor Markdown](ADR-0002-codemirror-6-markdown-editor.md) | `[IMPLEMENTED]` | 2026-10-25 | Domain Editor (`src/domains/editor/`) |
| `ADR-0003` | [Solver Deterministik vs Simulasi D3 Terus-menerus](ADR-0003-deterministic-layout-solvers-vs-force.md) | `[IMPLEMENTED]` | 2026-10-28 | Domain Graph (`src/domains/graph/`) |
| `ADR-0004` | [Isolasi Strategi Penyimpanan Multi-Tenant](ADR-0004-multi-strategy-storage-isolation.md) | `[IMPLEMENTED]` | 2026-10-15 | Domain Vault & Auth |
| `ADR-0005` | [In-Browser VCS untuk Kolaborasi Berbasis Teks](ADR-0005-in-browser-vcs-for-markdown-collaboration.md) | `[IMPLEMENTED]` | 2026-11-01 | Domain VCS & Collaboration |
