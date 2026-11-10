---
id: DOC-META-004
title: Riwayat Perubahan dan Evolusi Arsitektur
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-META-000
  - ENG-DRIFT-001
source_of_truth: git log
---

# Log Evolusi Sistem

## Ringkasan 3 Baris
- Catatan milestone migrasi arsitektur dari prototipe terpusat menuju Domain-Driven Design (DDD).
- Mendokumentasikan restrukturisasi modular Wave 1, Wave 2, dan Wave 3.
- Menjadi rujukan historis pemisahan folder legacy `src/core/` dan `src/shared/` ke `src/domains/` dan `src/global/`.

---

## 1. Garis Waktu Rilis dan Arsitektur

### `vRestruct1.3.6(wave3-dev)` (2026-11-10) - [IMPLEMENTED]
- **Perbaikan Impor & Path Alias:** Memperbaiki ekspor `Node` pada `graph.types.ts` dan resolusi worker `mentions.worker.ts`.
- **Stabilisasi Workspace Store:** Penambahan guard idempotensi pada `openView` dan eliminasi deklarasi duplikat untuk mencegah `Maximum update depth exceeded`.
- **Integrasi Leaf Interaction:** Sinkronisasi parameter `initialLayout` pada pemanggilan `createGraphInteractionStore`.

### `vRestruct1.3.0–1.3.5 (Wave 3)` (2026-11-09) - [IMPLEMENTED]
- **Migrasi Domain Modular Penuh:** Memindahkan 108 file legacy dari `src/core/*` dan `src/shared/*` ke 12 domain terisolasi di `src/domains/*`.
- **Penerapan Orchestrator Pattern:** Setiap domain memiliki Orchestrator utama (`<Domain>Orchestrator.tsx`) sebagai pintu masuk interaksi lintas modul.
- **Konsolidasi Global UI & Stores:** Memusatkan komponen atomik shadcn/ui dan utilitas umum di `src/global/`.

### `vRestruct1.2.x (Wave 2)` (2026-11-08) - [IMPLEMENTED]
- **Engine Visual & Multi-Model Layout:** Pemisahan algoritma Mindmap, Org Chart, Timeline, Fishbone, dan Free-Force.
- **Color Engine Terpadu:** Pengenalan palette generator kedalaman hierarki, mode kategorikal, dan living canvas atmosphere.

### `vRestruct1.0.0–1.1.0 (Wave 1)` (2026-11-05) - [IMPLEMENTED]
- **Sistem Event Domain:** Pengenalan `DomainEvents.ts` untuk reaktivitas state lintas komponen tanpa re-render waterfall.
- **Multi-Tenant Supabase & VCS:** Migrasi skema database kolaborasi v4, sistem branch mikro, dan public publishing `/p/:username/:vaultSlug`.

---

## Terkait
- [Portal Dokumentasi](../README.md)
- [Log Perbedaan Kode](../05-engineering/doc-drift-log.md)