---
id: DOC-ENG-004
title: Standar Penulisan Kode dan Konvensi TypeScript
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ENG-001
source_of_truth: src/
---

# Standar Penulisan Kode (Coding Standards)

## Ringkasan 3 Baris
- Menetapkan pedoman penulisan TypeScript strict, styling Tailwind CSS, dan pola isolasi store Zustand.
- Melarang mutasi state langsung pada canvas graph data di luar handler terdaftar.
- Mengharuskan pemisahan murni antara komponen presentasi UI dan logika bisnis domain.

---

## 1. Aturan TypeScript & State Management
1. **No Any Policy:** Dilarang menggunakan tipe `any` eksplisit; gunakan `unknown` dengan *type narrowing* bila tipe eksternal belum terdefinisi.
2. **Leaf-Scoped Store Registry:** Store interaksi kanvas wajib diakses melalui registry terisolasi per *leaf* (`getOrCreateLeafInteractionStore`) untuk mencegah siklus render kaskade lintas tab.
3. **Purity of Actions:** Seluruh mutasi catatan wajib melalui fungsi aksi murni di `vaultSessionActions.ts`.

---

## 2. Konvensi Penamaan dan Struktur
- **Prefix Domain:** Seluruh komponen di dalam domain wajib menggunakan nama representatif berawalan konteks (misal: `Graph*`, `Vault*`, `Vcs*`).
- **Ukuran File Maksimal:** File baru dibatasi maksimal 300-400 baris. Komponen yang mendekati batas wajib dipecah menjadi sub-komponen.

---

## Terkait
- [Aturan Repositori Rekayasa](repository-rules.md)
- [Register Hutang Teknis](tech-debt-register.md)