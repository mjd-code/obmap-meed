---
id: DOC-ENG-001
title: Standar Penulisan Kode & Tata Kelola Arsitektur ObMap v2.0
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0001
  - DOC-ARCH-ADR-0006
  - DOC-ENG-002
  - DOC-ENG-004
  - DOC-CHLOG-000
source_of_truth: AGENTS.md, src/domains/
---

# Standar Penulisan Kode & Tata Kelola Arsitektur ObMap v2.0

## Ringkasan 3 Baris
- Menetapkan standar rekayasa TypeScript 5, React 18, Zustand, Supabase RLS, dan Canvas2D yang wajib dipatuhi seluruh developer manusia dan AI coding agent (`AGENTS.md`).
- Menegakkan pola **Headless Controller (`<= 300` baris UI)**, **Pure Zustand Actions**, **Unidirectional Store Sync**, **Hierarchical Store Bridge**, serta **Canvas Frame Invalidation**.
- Mewajibkan konfigurasi tarif/kuota dinamis berbasis DB tanpa konstanta hardcode, akses media privat eksklusif via `createSignedUrl`, dan **Rule 11 Changelog Sync** di setiap perubahan.

---

## 1. Standar Arsitektur Frontend & Manajemen State (`AGENTS.md` #1–#10)
1. **Isolasi Bounded Domain (`src/domains/`):** Impor antar modul wajib melalui alias `@/` (`@/domains/*`, `@/global/*`). Komponen presentasi suatu domain tidak boleh diimpor langsung oleh domain lain tanpa kontrak API/registry eksplisit.
2. **Pola Headless Controller (`ADR-0006`):**
   - `<Domain>Orchestrator.tsx`: Menghubungkan domain ke rute (`src/App.tsx`) dan konteks leaf/workspace.
   - `<Feature>.tsx` (`<= 300` baris): Murni JSX/styling Tailwind & Radix; bebas `useEffect` kompleks.
   - `shared/hooks/use<Feature>Controller.ts`: Menampung seluruh `useEffect`, `useMemo`, subscription store, dan handler event.
3. **Single Source of Truth & Store Bridge:**
   - Dilarang menduplikasi state store Zustand ke `useState` lokal UI; gunakan selector Zustand atau nilai turunan.
   - Dilarang membuat siklus sinkronisasi dua arah; gunakan *previous-value ref guard* (`prevPropRef`) dan mutasi via *pure action functions* (bukan React Context Provider).
   - Setiap *per-leaf store* (`LeafGraphConfigStore`, `LeafGraphInteractionStore`) menerapkan *Write-Through & Broadcast Bridge* terhadap store globalnya (`useGraphStore`, `globalGraphInteractionStore`).
4. **Canvas2D Frame Invalidation:** Setiap mutasi warna tema, gaya node, atau override sub-pohon pada kanvas deterministik statis (`cooldownTicks === 0`) wajib memicu `graphRef.current?.refresh?.()`.
5. **Deterministic Graph Solvers (`ADR-0003`):** Hanya `Free-Force` yang mengaktifkan simulasi D3 kontinu; seluruh solver terstruktur (`Mindmap`, `Org`, `Timeline`, `Fishbone`, serta terencana `Argument Map` & `Citation Tree`) bersifat deterministik.

---

## 2. Standar Backend, Keamanan, Routing & Komersial (`v2.0`)
- **Database & RLS:** Seluruh perubahan skema wajib berada pada berkas migrasi di `supabase/migrations/` dengan pemberian hak akses eksplisit (`GRANT ... TO authenticated, service_role`) serta polis RLS ketat. Hapus shims tidak bertipe (`untypedSupabase.ts`, `STEP-01.1`).
- **Private Storage Buckets:** Berkas di bucket `vault-media` dan `avatars` wajib disimpan di folder UUID user dan **hanya** diakses memakai `createSignedUrl` (dilarang memakai `getPublicUrl`).
- **Dynamic Plans & Quotas:** Harga paket dan batas kuota numerik harus dibaca dari tabel database (`plans`, `plan_entitlements`, `plan_quotas`) — **dilarang meng-hardcode** nominal harga atau kuota di klien/Edge Function (`STEP-04.1`).
- **Hard Cutover `/:username` & `RESERVED_SLUGS`:** Rute publik mengikuti standar root `/:username` dan `/@:username` (tanpa `/p/*`); setiap validasi handle wajib memeriksa daftar `RESERVED_SLUGS` (`STEP-01.2`).
- **Isolasi Frontmatter:** Blok properti YAML disunting secara terstruktur lewat `EditorPropertiesPanel.tsx` agar kanvas teks Markdown CM6 (`EditorMarkdownView.tsx`) tetap bersih.

---

## 3. Tata Kelola Dokumentasi & Changelog (`AGENTS.md` Rule 11)
Setiap perubahan kode, skema SQL, atau konfigurasi **wajib** menyertakan tiga pembaruan atomik sebelum selesai:
1. Tambah 1 baris JSON valid pada `docs/_machine/changelog.jsonl`.
2. Tambah entri terstruktur pada `docs/changelogs/YYYY-MM.md` memakai format `_template.md`.
3. Perbarui tabel *Rolling Top-10 Recent Changes* di `docs/changelogs/README.md` (dan mutakhirkan status `STEP-XX.Y` di `docs/02-planning/README.md`).

---

## Terkait
- [AGENTS.md](../../AGENTS.md)
- [Aturan Repositori (`repository-rules.md`)](repository-rules.md)
- [Strategi Pengujian (`testing-strategy.md`)](testing-strategy.md)
- [ADR-0006: Reactive State & Headless Controller](../03-architecture/adr/ADR-0006-reactive-state-and-headless-controller-governance.md)
