---
id: DOC-PLAN-005
title: Profil Persona Pengguna (User Personas)
type: planning
status: [IMPLEMENTED]
owner: Lead UX Researcher
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-VIS-004
  - DOC-PLAN-001
  - DOC-PLAN-002
source_of_truth: src/domains/
---

# Profil Persona Pengguna (User Personas)

## Ringkasan 3 Baris
- Menghadirkan 6 profil persona mendalam yang mewakili spektrum pengguna utama ObMap.
- Memetakan titik frustrasi (*pain points*), motivasi utama, serta pola alur penggunaan aplikasi harian mereka.
- Menjadi panduan empati bagi perancang antarmuka dan perekayasa fitur dalam memprioritaskan kapabilitas produk.

---

## 1. Matriks Ringkasan Persona

| ID Persona | Nama Persona | Peran Utama | Kebutuhan Kunci di ObMap | Fitur Utama yang Digunakan |
| :--- | :--- | :--- | :--- | :--- |
| `PER-01` | Dr. Aris Pratama | Peneliti / Akademisi | Kedaulatan data lokal, wikilinks, graf sitasi bebas | Markdown Editor, Mention Worker, Force Graph |
| `PER-02` | Siti Nurhaliza | Dosen / Pengajar LMS | Penyusunan kurikulum interaktif & pemantauan progres | Mindmap Layout, Timeline, Public Reader |
| `PER-03` | Kevin Sanjaya | Konsultan / Analis Bisnis | Dekomposisi masalah akar, visualisasi hierarki cepat | Fishbone (Ishikawa), Org Chart, Export ZIP |
| `PER-04` | Maya Indrawati | Product Lead / PM | Kolaborasi tim, pencegahan konflik catatan proyek | In-Browser VCS, Branching, Stashing, 3-Way Merge |
| `PER-05` | Budi Santoso | Pembaca Publik / Pelajar | Membaca catatan interaktif anonim tanpa registrasi | Public Reader Portal (`/p/*`), Filter Topik |
| `PER-06` | Reza Rahardian | System Admin / DevOps | Keamanan data multi-tenant, kontrol RLS ketat | Supabase RLS, Storage Bucket Isolation, Auth |

---

## 2. Rincian Persona Mendalam

### PER-01: Dr. Aris Pratama (Peneliti Akademik & Mahasiswa Doktoral)
- **Karakteristik:** Menulis ribuan catatan literatur ilmiah, sensitif terhadap privasi data penelitian, menolak *vendor lock-in*.
- **Titik Frustrasi:** Khawatir catatan disandera format *proprietary* aplikasi SaaS; graf bawaan alat lain lambat saat memproses 3.000+ catatan.
- **Skenario ObMap:**
  ```mermaid
  graph LR
      P1[Buka Direktori Lokal via FS API] --> P2[Tulis Catatan Paper di CodeMirror]
      P2 --> P3[Koneksikan [[Teori]] & #Sitasi]
      P3 --> P4[Eksplorasi Kluster Ide via 2D Living Canvas]
  ```

### PER-02: Siti Nurhaliza, M.Pd (Dosen & Instruktur Pembelajaran Visual)
- **Karakteristik:** Mengajar kelas berkapasitas besar; ingin menyajikan silabus dan materi kuliah yang tidak membosankan.
- **Titik Frustrasi:** Mahasiswa kesulitan memahami urutan materi (*prerequisites*) jika hanya diberi daftar tautan PDF panjang.
- **Skenario ObMap:** Menyusun modul kuliah sebagai pohon topik hierarkis, mengaktifkan mode Timeline untuk peta jalan tugas, dan membagikan tautan `/p/siti/matakuliah-ai` ke mahasiswa.

### PER-03: Kevin Sanjaya (Konsultan Manajemen & Solusi Strategis)
- **Karakteristik:** Sering memfasilitasi sesi *brainstorming* ruang rapat; membutuhkan visualisasi analisis sebab-akibat instan.
- **Titik Frustrasi:** Pembuatan diagram di alat presentasi biasa memakan waktu penataan kotak berjam-jam secara manual.
- **Skenario ObMap:** Mengetik poin permasalahan dalam daftar bertingkat Markdown, lalu mengubah visualisasi menjadi diagram Fishbone dalam satu klik via *Floating Gear Toolbar*.

### PER-04: Maya Indrawati (Tech Product Lead & Koordinator Proyek)
- **Karakteristik:** Mengelola dokumentasi arsitektur perangkat lunak bersama tim perekayasa lintas disiplin.
- **Titik Frustrasi:** Edit dokumen bersamaan sering menghasilkan teks tertimpa (*race conditions*) atau riwayat perubahan yang kabur.
- **Skenario ObMap:** Membuat *branch* catatan baru untuk draf rilis fitur, melakukan pengujian draf, lalu menggabungkannya ke *main branch* melalui mesin *3-way merge* bawaan ObMap.

---

## Terkait
- [Pilar Kasus Penggunaan](../01-visions/use-case-pillars.md)
- [Product Requirements Document (PRD)](prd.md)
- [Software Requirements Specification (SRS)](srs.md)