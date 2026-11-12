# ObMap — Observable Knowledge Mapping Platform

[![Stack](https://img.shields.io/badge/Stack-React_18_+_Vite_5_+_TypeScript_5-61dafb.svg)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/UI-Tailwind_CSS_+_Radix_UI-38bdf8.svg)](https://tailwindcss.com/)
[![Testing](https://img.shields.io/badge/Tests-Vitest_Automated-success.svg)](https://vitest.dev/)
[![Architecture](https://img.shields.io/badge/Architecture-DDD_12_Domains-blueviolet.svg)](docs/03-architecture/domain-map.md)

> **ObMap** adalah workspace visual *local-first* berbasis Markdown yang memadukan graf interaktif multi-model (Mindmap, Org Chart, Timeline, D3 Force) dengan penerbitan web instan dan kolaborasi tim.

---

## 1. Quickstart Pengembang

### Kebutuhan Lingkungan
- **Node.js:** v18.x atau v20.x
- **Package Manager:** `bun` (direkomendasikan) atau `npm`

### Perintah Utama
```bash
Instalasi dependensi
bun install

Menjalankan server dev lokal (Port 8080)
bun run dev

Menjalankan suite pengujian otomatis (Wajib Vitest)
npx vitest run

Pemeriksaan tipe data TypeScript
npx tsc --noEmit

Build produksi
bun run build
```

---

## 2. Arsitektur Domain-Driven Design (`src/domains/`)

Sistem disusun dalam **12 domain terisolasi**, di mana setiap domain mengikuti pola tiga lapis yang ketat:

```text
src/domains/<domain>/
├── <Domain>Orchestrator.tsx    # Domain Façade & Macro Context Conductor
├── components/                 # Pure View Components (Markup JSX murni)
│   ├── <Feature>.tsx
│   └── use<Feature>Controller.ts # Headless Controller Hook (Otak & Wiring)
└── shared/                     # Modul Privat Domain
    ├── api/                    # Remote client & Web Workers
    ├── hooks/                  # Sub-hooks terisolasi
    ├── stores/                 # Scoped Zustand Stores
    └── utils/                  # Algoritma deterministik & mappers
```

---

## 3. Aturan Baku Pengembangan (Ringkasan)

1. **Path Alias Wajib:** Selalu gunakan `@/` untuk impor modul internal (misal `@/domains/graph/...`).
2. **Deterministic Solvers:** Hanya *Free-Force* yang menjalankan simulasi D3 berkelanjutan; layout Mindmap, Org, Timeline, dan Fishbone bersifat deterministik (`layoutCategory.ts`).
3. **Pemisahan Headless Controller:** Komponen kanvas dan UI kompleks dilarang memuat logika kalkulasi langsung; seluruh state, resize observer, dan handlers diletakkan di controller hook pendamping.
4. **Isolasi Frontmatter:** Body markdown wajib bersih dari YAML; properti diedit eksklusif via `EditorPropertiesPanel.tsx`.

---

## 4. Indeks Dokumentasi Sistem

Dokumentasi lengkap enterprise dikelola di bawah folder `docs/`:

- **[Portal Dokumentasi Utama](docs/README.md)**
- **[Visi & Filosofi Produk](docs/01-visions/vision-mission.md)**
- **[Katalog Fitur Lengkap](docs/04-features/feature-catalog.md)**
- **[Peta Domain DDD](docs/03-architecture/domain-map.md)**
- **[Standar Penulisan Kode](docs/05-engineering/coding-standards.md)**
- **[Register Hutang Teknis](docs/05-engineering/tech-debt-register.md)**
- **[Daftar Rujukan Cepat LLM](llms.txt)**