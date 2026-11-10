---
id: ADR-0001
title: Restrukturisasi Repositori Menjadi 12 Domain Modular (DDD)
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ADR-000
  - DOC-ARCH-001
source_of_truth: src/domains/
---

# ADR-0001: Restrukturisasi 12 Domain Modular (Wave 3)

## Konteks Masalah
Sebelum Wave 3, kode terpusat pada folder generik `src/core/` dan `src/shared/`. Seiring pertumbuhan aplikasi menuju platform hybrid (Obsidian + XMind + Notion), terjadi kopling tinggi (*high coupling*) antar-modul, dependensi sirkular pada hooks graf, dan kesulitan pengujian terisolasi.

## Keputusan yang Diambil
Merekstrukturisasi seluruh fungsionalitas menjadi 12 domain independen di `src/domains/` (`admin`, `auth`, `collaboration`, `editor`, `graph`, `metadata`, `public-reader`, `settings`, `sync`, `vault`, `vcs`, `workspace`). Setiap domain memiliki komponen gerbang `<Domain>Orchestrator.tsx`, folder `components/`, dan `shared/{api,hooks,stores,utils}`. Kode lintas domain murni dipusatkan di `src/global/`.

## Konsekuensi
- **Positif:** Batas modul jelas; eliminasi kebocoran state antartab graf; refaktorisasi lokal aman.
- **Tantangan:** Jalur impor lebih panjang (diselesaikan dengan alias `@/domains/...`).