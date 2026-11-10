---
id: DOC-ARCH-004
title: Arsitektur Kolaborasi, Publikasi, dan Kontrol Versi
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ARCH-001
  - DOC-ARCH-002
source_of_truth: src/domains/collaboration/
---

# Arsitektur Kolaborasi dan Publikasi

## Ringkasan 3 Baris
- Menggunakan arsitektur kontrol versi terpadu (*In-Browser VCS*) untuk mencatat komit mikro, percabangan, dan penyatuan draf kerja tim.
- Portal pembaca publik anonim (`/p/:username/:vaultSlug`) memisahkan aset pembaca dari ruang kerja utama untuk performa maksimal.
- Mengombinasikan RLS Supabase dan deteksi konflik 3-arah (*3-way merge engine*) sebagai fondasi sebelum adopsi penuh CRDT.

---

## 1. Alur Kontrol Versi Internal (`src/domains/vcs/`)

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Pengguna (Cabang Fitur)
    participant LocalVCS as In-Browser VCS Engine
    participant Store as VCS IndexedDB Store
    actor Bob as Pengguna (Cabang Utama)
    
    Alice->>LocalVCS: Tulis catatan & klik "Quick Commit"
    LocalVCS->>Store: Buat Micro-Revision Hash (SHA-256)
    Alice->>LocalVCS: Buka "Interactive Merge Modal"
    LocalVCS->>LocalVCS: Jalankan vcsDiffEngine (3-Way Diff)
    alt Tidak Ada Konflik
        LocalVCS->>Store: Satukan cabang secara otomatis
    else Terdeteksi Konflik
        LocalVCS-->>Alice: Tampilkan UI Resolusi Konflik Bersanding
        Alice->>LocalVCS: Pilih blok penyelesaian
        LocalVCS->>Store: Terapkan komit rekonsiliasi
    end
```

---

## 2. Rute dan Arsitektur Pembaca Publik (`/p/*`)

Portal pembaca publik diisolasi di `src/domains/public-reader/`:
- **Pemuatan Ringan:** Tidak memuat seluruh store editor berat atau pustaka parsing kompleks yang tidak diperlukan pembaca.
- **Rute yang Didukung:**
  - `/p/:username/:vaultSlug/:noteSlug`: Membaca catatan spesifik.
  - `/p/:username/:vaultSlug`: Menampilkan pohon berkas publik dan graf tinjauan.
  - `/p/:vaultSlug`: Tautan publik singkat (*short-link*).

---

## Terkait
- [Ikhtisar Arsitektur Sistem](system-overview.md)
- [Arsitektur Data dan Penyimpanan](data-and-storage.md)