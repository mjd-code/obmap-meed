---
id: DOC-META-002
title: Glosarium Istilah Domain ObMap
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-META-001
  - ARCH-DOM-001
source_of_truth: src/global/types/
---

# Glosarium Istilah Sistem

## Ringkasan 3 Baris
- Kamus baku istilah teknis dan domain untuk menjaga konsistensi semantik di seluruh kode dan dokumentasi.
- Mencegah ambiguitas istilah kritis seperti pembedaan antara Node, Note, Leaf, dan Group.
- Menjadi rujukan utama penamaan variabel, skema basis data, dan dokumentasi arsitektur.

---

## 1. Istilah Inti Workspace & Data

| Istilah Baku | Definisi Sistem | Konteks Kode |
| :--- | :--- | :--- |
| **Vault** | Ruang penyimpanan terisolasi yang berisi sekumpulan catatan, media, metadata, dan konfigurasi graf. | `src/domains/vault/` |
| **Note** | Dokumen teks individual berformat Markdown (`.md`) yang tersimpan di dalam hierarki folder vault. | `src/domains/editor/` |
| **Node** | Titik representasi visual pada graf (dapat berupa note, folder, media file, atau virtual anchor). | `src/domains/graph/shared/utils/graph.types.ts` |
| **Leaf** | Panel kerja individual dalam sistem antarmuka tile workspace (misal Editor, Graph, Backlinks). | `src/domains/workspace/shared/stores/useWorkspaceStore.ts` |
| **Group** | Kontainer kumpulan tab leaf yang dapat di-split secara vertikal atau horizontal. | `src/domains/workspace/` |
| **Branch (VCS)** | Cabang riwayat revisi dokumen atau vault independen untuk pengeditan paralel dan merge request. | `src/domains/vcs/` |
| **Storage Strategy** | Driver persistensi vault yang dipilih pengguna: Memory/IndexedDB, Supabase Cloud, atau Local File System API. | `src/domains/vault/shared/types/` |
| **Public Reader** | Tampilan web portal baca anonim tanpa otentikasi untuk vault yang telah dipublikasikan. | `src/domains/public-reader/` |
| **Subtree Override** | Kemampuan graf untuk menerapkan algoritma tata letak berbeda pada cabang turunan tertentu. | `src/domains/graph/shared/utils/subtreeCompose.ts` |
| **Co-Presence** | Sinyal kehadiran real-time yang menampilkan avatar pengguna yang aktif pada dokumen yang sama. | `src/domains/vcs/components/VcsCoPresenceAvatars.tsx` |

---

## Terkait
- [Konvensi Dokumentasi](doc-conventions.md)
- [Peta Domain](../03-architecture/domain-map.md)