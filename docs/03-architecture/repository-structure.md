---
id: ARCH-STRUCT-001
title: Struktur dan Hierarki Repositori ObMap
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - ARCH-DOM-001
  - ENG-RULES-001
source_of_truth: src/
---

# Struktur Repositori Terverifikasi

## Ringkasan 3 Baris
- Repositori dibangun menggunakan arsitektur React 18 + Vite 5 + TypeScript dengan pendekatan Domain-Driven Design (DDD).
- Kode aplikasi berpusat di `src/domains/` (12 domain bisnis) dan `src/global/` (komponen atomik serta utilitas bersama).
- Folder legacy `src/core/` dan `src/shared/` telah dihapus sepenuhnya demi mencegah ambiguitas impor.

---

## 1. Pohon Direktori Repositori (Level 1–3)

```text
obmap-meed/
├── docs/                       # Sistem dokumentasi enterprise
├── supabase/
│   ├── config.toml             # Konfigurasi Supabase CLI
│   └── migrations/             # Sumber kebenaran skema database (SQL)
├── src/
│   ├── App.tsx                 # Root router aplikasi (React Router DOM)
│   ├── main.tsx                # Entry point DOM & hydration
│   ├── index.css               # Styling global & token warna Tailwind
│   ├── app/                    # Entry point spesifik shell aplikasi
│   ├── pages/                  # Halaman top-level untuk route terdaftar
│   │   ├── Admin.tsx           # Dashboard administrasi sistem (/admin)
│   │   ├── Index.tsx           # Workspace utama aplikasi (/app)
│   │   ├── Install.tsx         # Halaman panduan PWA (/install)
│   │   ├── Landing.tsx         # Landing page publik (/)
│   │   ├── NotFound.tsx        # Fallback rute 404
│   │   └── PublicReader.tsx    # Portal pembaca publik (/p/...)
│   ├── domains/                # 12 Domain Modular Bisnis
│   │   ├── admin/              # Monitoring, telemetri bento, audit feed
│   │   ├── auth/               # Otentikasi Supabase, sesi, guard
│   │   ├── collaboration/      # Diff viewer, linters, bulk publish
│   │   ├── editor/             # CodeMirror 6, properties, footnotes
│   │   ├── graph/              # Engine visual 2D/3D, layout, living canvas
│   │   ├── metadata/           # Aho-Corasick mentions, backlinks
│   │   ├── public-reader/      # Portal baca artikel anonim & graf publik
│   │   ├── settings/           # Command palette, profil, API key, hub
│   │   ├── sync/               # Auto-save status, PWA install prompt
│   │   ├── vault/              # Vault lifecycle, storage drivers, manager
│   │   ├── vcs/                # Branching, commits, co-presence avatars
│   │   └── workspace/          # Window docking, tabs, split-pane, tree
│   ├── global/                 # Lapisan Bersama Lintas-Domain
│   │   ├── api/                # Klien Supabase untyped & konfigurasi cloud
│   │   ├── components/         # ErrorBoundary dan shell global
│   │   ├── hooks/              # Utilitas hook global (mobile, toast)
│   │   ├── stores/             # Global event emitter & UI store
│   │   ├── types/              # Deklarasi tipe global & metadata
│   │   ├── ui/                 # 40+ Komponen UI atomik berbasis shadcn/ui
│   │   └── utils/              # Helper manipulasi string, DOM, dan format
│   └── types/                  # Ambient TypeScript definitions
├── package.json
├── tailwind.config.lov.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Tanggung Jawab Direktori Tingkat Atas

| Folder | Status | Deskripsi Tanggung Jawab |
| :--- | :--- | :--- |
| `src/domains/` | `[IMPLEMENTED]` | Logika bisnis terisolasi. Masing-masing memiliki subfolder `components/` dan `shared/`. |
| `src/global/ui/` | `[IMPLEMENTED]` | Pustaka antarmuka atomik murni (shadcn/ui). Bebas dependensi logika bisnis domain apa pun. |
| `src/pages/` | `[IMPLEMENTED]` | Kontainer halaman berbasis lazy-load yang merakit satu atau beberapa Orchestrator domain. |
| `supabase/migrations/`| `[IMPLEMENTED]` | 4 file migrasi SQL aktif yang mengontrol tabel, indeks, RLS, dan triggers. |

---

## Terkait
- [Portal Dokumentasi](../README.md)
- [Peta Domain](domain-map.md)
- [Aturan Repositori](../05-engineering/repository-rules.md)