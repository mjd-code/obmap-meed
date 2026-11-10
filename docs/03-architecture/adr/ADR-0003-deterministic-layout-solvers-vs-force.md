---
id: ADR-0003
title: Pemisahan Solver Deterministik dan Penguncian Simpul Pasca-Transisi
type: architecture
status: [IMPLEMENTED]
owner: Senior Visual Performance Engineer
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ADR-000
  - DOC-ARCH-003
source_of_truth: src/domains/graph/shared/utils/layoutCategory.ts
---

# ADR-0003: Solver Deterministik vs Simulasi D3 Berkelanjutan

## Konteks Masalah
Pada implementasi awal, gaya fisika D3 diterapkan di atas semua tata letak diagram pohon (Mindmap, Org Chart). Hal ini menyebabkan simpul bergetar tanpa henti (*jittering*), teks sulit dibaca saat di-hover, dan performa drop drastis pada tab multi-split.

## Keputusan yang Diambil
Hanya mode `free-force` yang diizinkan menjalankan simulasi gaya fisika D3. Semua mode tata letak lainnya (Mindmap, Org Chart, Brace Map, Fishbone, Timeline, Radial, Grid) diperlakukan sebagai solver deterministik: koordinat dihitung satu kali dan simpul langsung dikunci (*pinned* via `fx`, `fy`) setelah transisi selesai.

## Konsekuensi
- **Positif:** Getaran simpul lenyap 100%; penggunaan CPU turun drastis; keterbacaan teks dan klik presisi.
- **Tantangan:** Animasi perubahan reparenting membutuhkan pengontrol transisi interpolasi khusus (`transitionController.ts`).