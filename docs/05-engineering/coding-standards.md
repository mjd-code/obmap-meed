---
id: DOC-ENG-004
title: Standar Penulisan Kode dan Konvensi TypeScript
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.1.0
last_reviewed: 2026-11-12
audience: both
related:
  - DOC-ENG-001
  - DOC-ENG-003
  - ARCH-DOM-001
source_of_truth: src/
---

# Standar Penulisan Kode (Coding Standards)

## Ringkasan 3 Baris
- Menetapkan pedoman penulisan TypeScript strict, styling Tailwind CSS, dan pola isolasi store Zustand.
- Melarang "God Component" (>300 baris) dengan mewajibkan pemisahan pola Headless Component Controller.
- Mengharuskan pemisahan murni antara komponen presentasi UI (View) dan logika bisnis domain (Controller).

---

## 1. Aturan TypeScript & State Management
1. **No Any Policy:** Dilarang menggunakan tipe `any` eksplisit; gunakan `unknown` dengan *type narrowing* bila tipe eksternal belum terdefinisi.
2. **Leaf-Scoped Store Registry:** Store interaksi kanvas wajib diakses melalui registry terisolasi per *leaf* (`getOrCreateLeafInteractionStore`) untuk mencegah siklus render kaskade lintas tab.
3. **Purity of Actions:** Seluruh mutasi catatan wajib melalui fungsi aksi murni di `vaultSessionActions.ts`.
4. **Store Selector Granularity:** Hindari mengekstrak seluruh state store dalam satu objek bila hanya membutuhkan satu nilai. Gunakan atomic selector `useStore((s) => s.property)` untuk meminimalkan re-render.
5. **Single Source of Truth & Unidirectional Sync:** Dilarang menduplikasi state store ke `useState` lokal UI. Dilarang membuat *cyclic bidirectional `useEffect`* antar-store; gunakan *Unidirectional Action Dispatch* dan `prevPropRef` untuk sinkronisasi prop eksternal.
6. **Zero-Regression Headless Extraction & Canvas Invalidation:** Ekstraksi *God Component* wajib mempertahankan paritas fitur 100%, dan mutasi visual pada Canvas2D statis (`cooldownTicks === 0`) wajib memicu `graphRef.current?.refresh?.()`.

---

## 2. Konvensi Penamaan dan Batas Ukuran File
- **Prefix Domain:** Seluruh komponen di dalam domain wajib menggunakan nama representatif berawalan konteks (misal: `Graph*`, `Vault*`, `Vcs*`).
- **Ukuran File Maksimal:** File komponen JSX baru dibatasi maksimal **250–350 baris**. Komponen yang mendekati batas wajib didekomposisi.

---

## 3. Pola Arsitektur Komponen: Orchestrator vs View vs Headless Controller

Untuk mencegah regresi *God Component* pada fitur interaktif tingkat lanjut (seperti graf kanvas atau markdown editor), arsitektur ObMap memberlakukan pemisahan 3 lapis:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Domain Orchestrator (<Domain>Orchestrator.tsx)              │
│    - Gerbang makro domain ke Workspace & Leaf Context           │
│    - Mengatur routing internal domain & inisialisasi session    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Pure View Component (<Feature>.tsx)                          │
│    - Hanya berisi deklarasi JSX, container styling, & props     │
│    - Target ukuran: 50–120 baris                                │
│    - Mengonsumsi data bersih dari Controller Hook               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    (Mendelegasikan seluruh state)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Headless Controller Hook (use<Feature>Controller.ts)         │
│    - Menampung seluruh `useEffect`, `useMemo`, & event handlers │
│    - Menyatukan sub-hooks spesifik (painter, physics, gesture)  │
│    - Return interface bersih: `{ size, data, handlers, uiProps }`│
│    - Sama sekali TIDAK merender tag HTML/JSX                    │
└─────────────────────────────────────────────────────────────────┘

---

## Terkait
- [Aturan Repositori Rekayasa](repository-rules.md)
- [Register Hutang Teknis](tech-debt-register.md)
- [Peta Domain Bisnis](../03-architecture/domain-map.md)
