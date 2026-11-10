---
id: DOC-ARCH-001
title: Ikhtisar Arsitektur Sistem (System Overview & C4 Model)
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.1.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ARCH-002
  - DOC-ARCH-003
  - DOC-ARCH-004
  - DOC-ARCH-005
source_of_truth: src/
---

# Ikhtisar Arsitektur Sistem (System Overview)

## Ringkasan 3 Baris
- Mengadopsi arsitektur *local-first hybrid* dengan orkestrasi 12 domain independen berbasis Domain-Driven Design (DDD).
- Mengintegrasikan komputasi kanvas graf 2D dan parsing teks sepenuhnya di sisi klien (*client-side execution*).
- Menghubungkan penyimpanan lokal (FS API/IndexedDB) ke PostgreSQL Supabase melalui lapisan sinkronisasi ber-RLS.

---

## 1. Diagram Konteks Sistem (C4 Context Diagram)

```mermaid
graph TD
    User([Pengguna / Peneliti])
    PublicUser([Pembaca Anonim])
    
    subgraph ObMap System
        WebPWA[ObMap Web / PWA Client<br/>React + Vite + CodeMirror 6 + Canvas]
    end
    
    LocalFS[(Sistem Berkas Lokal<br/>Markdown & Media)]
    IndexedDB[(Browser Storage<br/>IndexedDB Cache)]
    SupabaseCloud[(Supabase Cloud<br/>PostgreSQL 15 + RLS + Auth)]
    
    User -->|Membaca & Menyunting Dokumen| WebPWA
    PublicUser -->|Mengeksplorasi Basis Pengetahuan| WebPWA
    WebPWA -->|File System Access API| LocalFS
    WebPWA -->|Offline Caching & Journaling| IndexedDB
    WebPWA -->|Cloud Sync & Publishing| SupabaseCloud
```

---

## 2. Diagram Kontainer Aplikasi (C4 Container Diagram)

```mermaid
graph TD
    subgraph Client Application Browser Runtime
        Shell[Application Shell & Router<br/>react-router-dom]
        
        subgraph 12 Autonomous Domains
            D_Vault[Vault Domain<br/>Persistence Manager]
            D_Editor[Editor Domain<br/>CodeMirror 6 Engine]
            D_Graph[Graph Domain<br/>2D Canvas & Multi-Solvers]
            D_VCS[VCS Domain<br/>Micro-Revisions & 3-Way Merge]
            D_Collab[Collaboration Domain<br/>Share & Permission Control]
            D_Reader[Public Reader Domain<br/>Fast SSR/CSR Viewer]
            D_Work[Workspace Domain<br/>Leaves & Split Tree Engine]
            D_Meta[Metadata Domain<br/>Aho-Corasick Web Worker]
        end
        
        State[Zustand Stores & Event Bus<br/>Leaf Scoped States]
    end
    
    Shell --> D_Work
    D_Work --> D_Graph
    D_Work --> D_Editor
    D_Graph --> State
    D_Editor --> State
    D_Vault --> LocalFS
    D_Vault --> IndexedDB
    D_Collab --> SupabaseCloud
    D_VCS --> IndexedDB
    D_Meta --> WorkerThreads[Web Worker Background Threads]
```

---

## 3. Aliran Data Utama (Primary Data Flows)

1. **Local Authoring Loop:** Penyuntingan di CodeMirror 6 memicu pembaruan state lokal -> di-debounce ke *auto-save* driver vault (FS API/IndexedDB) -> Web Worker memindai *wikilinks* dan *mentions*.
2. **Graph Visualization Loop:** Struktur file tree diproyeksikan ke `buildGraphProjection` -> solver deterministik menghitung posisi simpul -> kanvas merender simpul, tautan kurva, dan partikel atmosfer.
3. **Publishing Loop:** Modul kolaborasi memvalidasi izin -> mengekspor snapshot dokumen ke Supabase -> rute `/p/:username/:vaultSlug` merender tampilan publik tanpa login.

---

## Terkait
- [Peta Struktur Repositori](repository-structure.md)
- [Peta Domain Arsitektur](domain-map.md)
- [Arsitektur Data dan Penyimpanan](data-and-storage.md)
