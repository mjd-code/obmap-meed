---
id: ARCH-DOM-001
title: Peta dan Arsitektur 12 Domain ObMap
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - ARCH-STRUCT-001
  - ENG-RULES-001
  - DOC-META-002
source_of_truth: src/domains/
---

# Peta Domain Bisnis

## Ringkasan 3 Baris
- Aplikasi dibagi secara tegas menjadi 12 modul domain independen menggunakan prinsip Domain-Driven Design (DDD).
- Setiap domain memiliki satu `Orchestrator` yang mengekspos kapabilitas domain ke domain lain atau ke halaman (`src/pages/`).
- Komponen internal domain dilarang mengimpor internal komponen domain lain secara langsung (harus melalui Orchestrator atau Event Bus).

---

## 1. Matriks 12 Domain Sistem

```mermaid
graph TD
    WS[workspace] --> ED[editor]
    WS --> GR[graph]
    WS --> VL[vault]
    WS --> VCS[vcs]
    WS --> MD[metadata]
    VL --> SY[sync]
    VL --> AU[auth]
    VCS --> CO[collaboration]
    PR[public-reader] --> GR
    PR --> ED
    AD[admin] --> ST[settings]
```

### Rincian Modul Domain

| Domain | Orchestrator Utama | Subfolder Aktif | Tanggung Jawab & Fitur Kunci |
| :--- | :--- | :--- | :--- |
| **admin** | `AdminOrchestrator.tsx` | `components`, `shared/api,hooks` | Audit log, telemetri visual Bento, health check, sistem diagnostik. |
| **auth** | `AuthOrchestrator.tsx` | `components`, `shared/api,hooks` | Login, registrasi, sesi Supabase Cloud, route protection, dev banner. |
| **collaboration** | `CollaborationOrchestrator.tsx` | `components`, `shared/api,utils` | Review workflow, visual diff viewer, bulk publish modal, linter dua tahap. |
| **editor** | `EditorOrchestrator.tsx` | `components`, `shared/api,stores,utils` | Editor CodeMirror 6, collapsible YAML properties, footnote popover, tabel dinamis. |
| **graph** | `GraphOrchestrator.tsx` | `components`, `shared/api,hooks,stores,utils` | Engine tata letak multi-model (XMind/Mindmap/Force), Living Canvas, Color Engine. |
| **metadata** | `MetadataOrchestrator.tsx` | `components`, `shared/api,hooks,utils` | Web Worker Aho-Corasick untuk unlinked mentions, backlinks traversal. |
| **public-reader** | `PublicReaderOrchestrator.tsx`| `components`, `shared/api` | Render rute `/p/:username/:vaultSlug`, file tree publik, graf interaktif anonim. |
| **settings** | `SettingsOrchestrator.tsx` | `components`, `shared/api,hooks,stores,utils`| Settings Hub, command palette (Ctrl+P), manajemen API key, claim username. |
| **sync** | `SyncOrchestrator.tsx` | `components`, `shared/api,hooks,stores` | Status auto-save, sinkronisasi queue, antarmuka instalasi PWA. |
| **vault** | `VaultOrchestrator.tsx` | `components`, `shared/api,hooks,stores,utils`| CRUD vault, isolasi data, driver Local/Cloud/FS, backup & ZIP import/export. |
| **vcs** | `VcsOrchestrator.tsx` | `components`, `shared/api,stores,utils` | Version control internal: branch, commit mikro, merge request, co-presence. |
| **workspace** | `WorkspaceOrchestrator.tsx` | `components`, `shared/api,hooks,stores,utils`| Sistem dock antarmuka VS Code/Obsidian, group split, tabs, file explorer. |

---

## 2. Pola Akses dan State Store

1. **Leaf-Scoped Store:** Store graf (`useGraphInteractionStore`) dibuat independen per leaf workspace agar konfigurasi tab tidak saling menimpa.
2. **Domain Action Layer:** Mutasi vault dilakukan secara deterministik melalui `vaultSessionActions.ts`.
3. **Decoupled Events:** Peristiwa global ditransmisikan melalui `src/global/stores/` menggunakan arsitektur publish/subscribe `DomainEvents`.

---

## Terkait
- [Struktur Repositori](repository-structure.md)
- [Aturan Repositori](../05-engineering/repository-rules.md)