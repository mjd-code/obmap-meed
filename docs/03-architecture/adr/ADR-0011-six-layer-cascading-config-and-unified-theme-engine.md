---
id: DOC-ARCH-ADR-0011
title: ADR-0011 — Konfigurasi Bertingkat 6-Lapis & Unified DOM/Canvas2D Theme Engine
type: adr
status: [PLANNED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0006
  - DOC-ARCH-ADR-0012
  - DOC-ARCH-004
  - DOC-ARCH-005
source_of_truth: src/domains/settings/, src/domains/graph/shared/utils/theme.ts
---

# ADR-0011: Konfigurasi 6-Lapis Terisolasi & Unified Theme Engine

## Ringkasan 3 Baris
- Memformalkan arsitektur resolusi konfigurasi **6 lapis** di atas fondasi `configRegistry.ts`, `VaultConfigFile.ts`, `LocalConfigStore.ts`, dan `CloudConfigStore.ts` lengkap dengan kebijakan *Org-Lock*.
- Menyatukan sumber token desain pada `useThemeStore.ts` agar CSS Variables UI DOM (Tailwind/Radix) dan parameter lukis Canvas2D (`theme.ts`, `atmosphereConfig.ts`) selalu sinkron dan memicu `graphRef.current?.refresh?.()`.
- Menyediakan kustomisasi gaya bergaya Obsidian yang tetap aman di ruang tim maupun halaman publik lewat *Scoped CSS Snippets* tersanitasi.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-14 — Implementasi di `STEP-01.5`).
- **Konteks:** Repositori sudah memiliki `configRegistry.ts`, `schemaRegistry.ts`, `VaultConfigFile.ts`, `LocalConfigStore.ts`, `CloudConfigStore.ts`, dan `useThemeStore.ts` di `src/domains/settings/`. Namun, belum ada mekanisme penguncian kebijakan tingkat organisasi/institusi berbasis peran, dan perubahan tema belum sepenuhnya menyinkronkan warna simpul/tepi/atmosfer Canvas2D secara otomatis sebagai satu paket token tema.

---

## 2. Keputusan Arsitektur Terkunci (`STEP-01.5`)
1. **Resolusi Konfigurasi 6-Lapis (Prioritas Menaik kecuali Org-Lock):**
   1. `System Defaults` (`configRegistry.ts` & `schemaRegistry.ts`)
   2. `Org / Institution Policy` (`lockedByOrgAdmin` — bila dikunci Admin tim, lapisan di bawah **tidak boleh** menimpanya dan UI menampilkan lencana *Locked by Admin*)
   3. `Vault Config` (`.obmap/config.json` via `VaultConfigFile.ts` agar portabel lintas perangkat seperti Obsidian)
   4. `User Profile Config` (`LocalConfigStore.ts` untuk preferensi lokal / `CloudConfigStore.ts` tersinkron)
   5. `Workspace / Leaf Store` (`LeafGraphConfigStore` per tab sesuai `ADR-0006`)
   6. `Session / URL Query Override` (sementara di runtime)
2. **Unified Design Token Bridge (DOM ↔ Canvas2D):**
   - `useThemeStore.ts` mengekspor kamus token semantik (`--ob-*`: background, surface, accent, edge-default, node-evergreen, text-primary, font-display, radius).
   - Bridge menulis CSS Variables ke `:root` sekaligus menghitung objek warna kanvas di `src/domains/graph/shared/utils/theme.ts` & `atmosphereConfig.ts`, lalu memanggil `graphRef.current?.refresh?.()` bila kanvas berada pada mode deterministik statis (`cooldownTicks === 0`).
3. **Scoped CSS Snippets:** Pengguna dapat mengunggah snippet CSS kustom untuk `.obmap/` lokal dan tema profil publik `/:username` yang disaring ketat agar hanya memengaruhi selektor bertopik `.obmap-themed-root` tanpa mengeksekusi script atau `url()` eksternal tak tepercaya (`rehype-sanitize` / CSS parser whitelist).

---

## 3. Verifikasi & Dokumentasi Pengembang
- Panduan penulisan tema & daftar token desain lengkap didokumentasikan pada `docs/07-developers/theme-authoring-guide.md`.

---

## Terkait
- [Data & Storage (`../data-and-storage.md`)](../data-and-storage.md)
- [Layout Engine (`../layout-engine.md`)](../layout-engine.md)
- [Theme Authoring Guide (`../../07-developers/theme-authoring-guide.md`)](../../07-developers/theme-authoring-guide.md)
