---
id: ADR-0005
title: Adopsi Kontrol Versi Mikro di Peramban untuk Kolaborasi Markdown
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ADR-000
  - DOC-ARCH-004
source_of_truth: src/domains/vcs/
---

# ADR-0005: In-Browser VCS untuk Kolaborasi Teks Markdown

## Konteks Masalah
Kolaborasi real-time berkecepatan tinggi tanpa sistem versi sering menimpa paragraf penting saat jaringan terputus-putus. Pengguna akademis dan teknis menginginkan mekanisme *review*, *branching*, dan *diff* sebelum perubahan digabungkan ke catatan utama.

## Keputusan yang Diambil
Membangun modul kontrol versi internal di peramban (`src/domains/vcs/`) yang mendukung pembuatan cabang (*branches*), penampungan (*stashes*), riwayat komit mikro, dan dialog penggabungan 3-arah (*3-way merge modal*) berbasis perbedaan teks baris demi baris.

## Konsekuensi
- **Positif:** Pencegahan kehilangan data; pengguna memiliki kendali penuh atas persetujuan perubahan rekan tim.
- **Tantangan:** Pengguna non-teknis membutuhkan edukasi antarmuka agar konsep branching terasa intuitif.