---
id: DOC-META-002
title: Glosarium Teknis & Produk ObMap v2.0
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-META-005
  - DOC-META-001
  - DOC-META-003
source_of_truth: src/domains/, docs/
---

# Glosarium Teknis & Produk ObMap v2.0

## Ringkasan 3 Baris
- Daftar istilah baku untuk entitas pengetahuan, graf Canvas2D, arsitektur 13 domain DDD, jejaring sosial cendekiawan, dan kontrol rilis di seluruh repositori ObMap.
- Seluruh dokumen perencanaan, arsitektur, dan UI wajib memakai definisi konsisten guna menghindari ambiguitas lintas tim dan AI coding agent.
- Istilah legacy `/p/*` dan `public-reader` berstatus transisi *hard cutover* menuju `/:username` dan domain `community`.

---

## 1. Entitas Pengetahuan, Editor & Graf Canvas2D

| Istilah | Definisi Kanonik |
| :--- | :--- |
| **Vault** | Ruang kerja pengetahuan terisolasi berupa direktori berkas Markdown (`.md`) beserta metadata `.obmap/` dan indeks relasi antar-catatan; dapat disimpan lokal (`FS Access API` / `IndexedDB`) atau cloud (`Supabase`). |
| **Note** | Unit atomik berkas Markdown (`.md`) yang memisahkan **YAML Frontmatter terisolasi** (`EditorPropertiesPanel.tsx`) dari isi teks murni (`EditorMarkdownView.tsx`). |
| **Node** | Representasi visual sebuah *Note* atau topik konseptual di kanvas graf 2D (`GraphCanvas.tsx`), lengkap dengan koordinat, derajat tautan, warna cabang, dan status progres. |
| **Leaf** | Tab atau panel aktif di dalam `WorkspaceOrchestrator` yang masing-masing memiliki instance store terisolasi (*Per-Leaf Store*: `LeafGraphConfigStore`, `LeafGraphInteractionStore`). |
| **Group** | Klaster simpul atau folder logis yang dikelompokkan dalam tampilan Workspace / Dashboard maupun visualisasi batas wilayah (*cluster boundary*) pada kanvas. |
| **Branch** | Cabang hierarki terarah pada solver deterministik (`Mindmap`, `Org`, `Fishbone`) atau cabang riwayat versi terisolasi pada engine VCS in-browser (`src/domains/vcs/`). |
| **Storage Strategy** | Abstraksi driver penyimpanan vault melalui antarmuka `IVaultStorageDriver.ts` yang mencakup `FileSystemService.ts`, `IndexedDbVaultDriver.ts`, `CloudVaultService.ts`, serta driver *in-memory sandbox* `[PLANNED]`. |
| **Subtree Override** | Kustomisasi warna, bentuk, atau gaya visual pada satu sub-pohon tertentu di solver graf tanpa menimpa pengaturan tema global vault. |
| **Co-Presence** | Indikator kehadiran kolaborator secara real-time (`VcsCoPresenceAvatars.tsx`) ketika beberapa pengguna membuka atau meninjau vault yang sama. |
| **Derived View** | Tampilan manajemen data (*Grid, Tree, Kanban, Calendar/Timeline, Analytics*) pada domain `dashboard` yang diturunkan 100% dari berkas Markdown + YAML Frontmatter tanpa skema blok *proprietary*. |

---

## 2. Jejaring Sosial Pengetahuan, Kontrol Akses & Rilis (v2.0)

| Istilah | Definisi Kanonik |
| :--- | :--- |
| **Community Domain (`src/domains/community/`)** | Bounded domain hasil refaktor dari `src/domains/public-reader/` (`[PLANNED]` pada `STEP-01.2`) yang melayani rute root publik `/:username`, `/@:username`, `/explore`, dan pembaca dual-pane Graph + Markdown. |
| **Scholar Profile (`/:username`)** | Halaman identitas intelektual kanonik di root domain (didukung alias `/@:username`) yang menampilkan bio, afiliasi, ORCID, Konstelasi Vault Publik, dan indeks dampak sitasi. |
| **Hard Cutover & `RESERVED_SLUGS`** | Penghentian langsung rute legacy `/p/*` tanpa redirect, disertai daftar kata tercadang (`app`, `vaults`, `auth`, `admin`, `explore`, `install`, dll.) pada lapisan router & database agar slug sistem tidak bertabrakan dengan `username`. |
| **ReleaseStageGate** | Gerbang kontrol rilis 3 tahap berbasis database (`platform_settings.release_stage`): `stage_1_partner` (Closed Pilot), `stage_2_community_beta` (Approval individual di `/admin`), dan `stage_3_commercial_ga` (Komersial terbuka). |
| **PolicyEngine** | Evaluator otorisasi terpusat (`can(actor, action, resource, context)`) di frontend yang selaras simetris dengan fungsi Postgres RLS `can_access_resource(...)` serta empat status visibilitas (`Private`, `Shared`, `Public Unlisted`, `Public Listed`). |
| **Dynamic Entitlements & Quotas** | Pengaturan paket langganan (`plans`), hak fitur (`plan_entitlements`), dan batas kuota (`plan_quotas`) yang disimpan di database dan dikonfigurasi dinamis oleh Admin di `/admin` tanpa hardcode harga atau kuota. |
| **Verified Scholar** | Lencana verifikasi resmi bagi akademisi, pendidik, atau institusi yang diberikan melalui proses kurasi manual Admin pada `/admin`. |
| **Cross-Vault Citation & Fork/MR** | Tautan federated `[[@username/vaultSlug/noteSlug]]` yang tercatat di indeks sitasi global, serta alur *Fork to My Vault* → *Knowledge Merge Request* dengan lisensi publik default **`CC BY-SA 4.0`**. |
| **Epistemic Metadata** | Properti YAML standar (`epistemic_status`: `seedling` \| `budding` \| `evergreen` \| `peer_reviewed`, `confidence`, `doi`, `license`, `references`) untuk keandalan rujukan ilmiah. |
| **Six-Layer Cascading Config & `@obmap/sdk`** | Resolusi pengaturan 6 lapis (*System Defaults* → *Org Policy Locked* → *Vault `.obmap/`* → *User Profile* → *Leaf* → *Session*) dan antarmuka ekstensi terisolasi (Web Worker / Iframe CSP) dengan manifest izin eksplisit. |

---

## Terkait
- [Master Blueprint v2.0](00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-2-quovadis.md)
- [Konvensi Dokumentasi Sistem](doc-conventions.md)
- [Legenda Status Dokumen](status-legend.md)
