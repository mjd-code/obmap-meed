---
id: DOC-ENG-002
title: Strategi dan Prosedur Pengujian Otomatis
type: engineering
status: [IMPLEMENTED]
owner: Senior Test Automation Engineer
version: 1.1.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ENG-001
  - DOC-ENG-003
source_of_truth: package.json
---

# Strategi Pengujian Perangkat Lunak (Testing Strategy)

## Ringkasan 3 Baris
- Menegaskan Vitest (`npm run test` / `npx vitest run`) sebagai runner resmi pengujian repositori.
- Melarang penggunaan test runner bawaan Bun (`bun test`) karena ketidakcocokan stub global `vi.stubGlobal`.
- Memetakan hasil eksekusi pengujian saat ini: 12 test files (11 passed, 1 failed / 93 passed, 1 failed).

---

## 1. Lingkungan dan Eksekutor Pengujian Resmi

```bash
Perintah eksekusi pengujian tunggal (Official Command)
npm run test
atau
npx vitest run

Mode pengamatan interaktif saat pengembangan
npm run test:watch
```

> **PERINGATAN ARSITEKTUR:** Jangan menjalankan `bun test`. Bun native test runner gagal mengeksekusi suite `VaultManager.test.ts` karena implementasi internal stubbing Vitest (`vi.stubGlobal`, `vi.mock`) tidak sepenuhnya kompatibel dengan runtime Bun v1.4.

---

## 2. Status Eksekusi Pengujian Terverifikasi

Hasil eksekusi `npx vitest run` per 2026-11-10:
- **Total Test Files:** 12 files
- **Lulus:** 11 files (93 tests)
- **Gagal:** 1 file (1 test di `VaultManager.test.ts`: `renames an existing vault` mengharapkan tipe boolean murni alih-alih objek respons `{ success: true }`).

---

## 3. Strategi Mocking Dependensi

| Dependensi Eksternal | Strategi Mocking | Lokasi Mock |
| :--- | :--- | :--- |
| **IndexedDB API** | `fake-indexeddb` in-memory mock | `src/domains/vault/__tests__/` |
| **File System Access API** | Virtual directory handle mock object | `src/domains/vault/__tests__/fixtures.ts` |
| **Supabase Client** | Untyped client stubbing / mock query builder | `src/shared/lib/untypedSupabase.ts` |
| **Canvas 2D Context** | Headless canvas context stub | `src/domains/graph/__tests__/fixtures.ts` |

---

## Terkait
- [Aturan Repositori Rekayasa](repository-rules.md)
- [Register Hutang Teknis](tech-debt-register.md)