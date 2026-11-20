---
id: DOC-META-002
title: Glosarium Kanonik & Kamus Istilah Teknis ObMap v2.0
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.1.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-META-000
  - DOC-META-005
  - DOC-VIS-001
  - DOC-VIS-002
  - DOC-ARCH-004
source_of_truth: src/domains/, docs/
---

# Glosarium Kanonik & Kamus Istilah Teknis (`Canonical Vocabulary`)

## Ringkasan 3 Baris
- Kamus istilah baku tunggal untuk entitas pengetahuan, **Workspace Modes**, **4 Helicopter Views**, **Presentation Lenses**, **Single Central `.app/config.json`**, **Academy 3-Layer Competence Tree**, serta **Essential VCS & Granular Access/Publishing**.
- Seluruh dokumen perencanaan, arsitektur, antarmuka UI, dan kontribusi AI coding agent wajib memakai definisi kanonik di sini agar tidak terjadi pergeseran istilah.
- Rute `/p/*`, direktori `.vk/` / `.obmap/`, serta alias paket `@vk/sdk` hanya dicatat sebagai istilah legacy/fallback kompatibilitas historis.

---

## 1. Kamus Istilah Inti Pengetahuan, Lensa & Konfigurasi

| Istilah Kanonik | Definisi Baku |
| :--- | :--- |
| **Vault** | Wadah arsip pengetahuan utama berisi direktori, berkas Markdown (`.md`), media terlampir, dan konfigurasi tunggal **`.app/config.json`**; dapat disimpan secara lokal (*File System Access API* / *IndexedDB*) maupun cloud (*Supabase*). |
| **Node** | Unit atomik pengetahuan di dalam struktur berkas dan graf—terdiri atas **Folder-Node** (kontainer hierarkis / modul kurikulum / bab) dan **File-Node** (berkas `.md` + YAML Frontmatter terisolasi di `EditorPropertiesPanel.tsx`). |
| **Workspace Mode (Preset)** | Lensa kerja *opinionated* (atau bebas) yang mengatur susunan panel awal, *default visual solver*, template YAML, dan toolbar kontekstual. Disimpan sebagai `primary_mode` di **`.app/config.json`** & tabel `vaults` (*Persistent Intent*), serta dapat di-*override* sementara per tab/sesi (*Active Workspace Lens*). Mencakup: **`Freeform`** (*Unopinionated*), **`Atlas`**, **`Studio`**, dan **`Academy`**, serta jalur inkubator **`Community Presets`**. |
| **Helicopter View (4 Visual Lenses)** | Empat cara pandang *bird's-eye* yang **wajib tersedia di semua Workspace Modes**: **(1) Graph View** (*Network*: `[[backlinks]]`, tags, keywords, klaster properti); **(2) Diagram View** (*Deterministic Solvers*: `Mindmap`, `Org`, `Timeline`, `Fishbone`, `Argument Map`, `Competence/Skill Tree DAG`); **(3) Table View** (*Structured Matrix* properti YAML, status, sitasi, & metadata); dan **(4) Cards View** (*Spatial Gallery* berbasis folder, tag, status epistemik, atau grup properti). |
| **Restructure & Reorganize** | Dua mode penataan ulang di Helicopter View: **`Virtual Grouping` (*Non-Destructive*)** yang mengelompokkan ulang node secara visual menurut properti/tag/backlink/keyword tanpa memindahkan file fisik; dan **`Structural Refactoring` (*Physical Sync*)** lewat *drag-and-drop* Diagram/Tree yang langsung memindahkan Folder-Node/File-Node `.md` atau memperbarui YAML & `[[wikilinks]]`. |
| **Presentation Lens** | Format penyajian publik di `/:username` dan `/explore`: **`atlas`**, **`publication`**, atau **`course`** (memetakan 1-to-1 ke Core Modes `Atlas`, `Studio`, dan `Academy`), ditambah format distribusi **`template`** untuk berbagi preset `.app/config.json`. |
| **Single Central Configuration (`.app/config.json`)** | Aturan arsitektur mutlak bahwa seluruh konfigurasi multi-level vault (`meta`, `mode`, `schema`, `publishing`, `access`, `academy`, `extensions`) disimpan terpusat di **satu berkas `.app/config.json`** (dilarang memecah menjadi `preset.json`, `lms-policy.json`, `setting.json`, dll.; path `.vk/` dan `.obmap/` hanya didukung sebagai fallback migrasi *zero-loss*). |
| **Leaf** | Tab atau panel aktif di dalam `WorkspaceOrchestrator` yang mengisolasi *Active Workspace Lens*, viewport, dan interaksi lokal lewat *Per-Leaf Store* (`LeafGraphConfigStore`, `LeafGraphInteractionStore`). |
| **Explicit Non-Goal** | Penegasan batas bahwa aplikasi **bukan** *office-board-central / enterprise project & task management* (seperti Trello, Asana, Monday.com, ClickUp, atau Notion enterprise board); seluruh *Derived Views* melayani pengetahuan, riset, editorial (`Studio`), dan pembelajaran (`Academy`). |

---

## 2. Kamus Istilah Kolaborasi, Essential VCS, Publishing & Academy (LMS)

| Istilah Kanonik | Definisi Baku |
| :--- | :--- |
| **Essential VCS** | Kapabilitas pengendali versi esensial bebas friksi Git CLI: **Snapshot** (*Version History & Rollback*), **Visual Diff** (komparasi visual teks Markdown, YAML Frontmatter, dan struktur node), **Fork**, serta **Knowledge Merge Request (`KMR`)**. |
| **Give Access AS & WITH** | Model pemberian akses kolaborasi di **level Vault maupun spesifik Folder-Node / File-Node**. **`AS`** menentukan peran (`Viewer`, `Commenter/Reviewer`, `Contributor`, `Editor/Co-Author`, `Admin/Curator`, atau peran Academy `Student`, `Teacher/Mentor`, `Institution Admin`); **`WITH`** menentukan cakupan (Vault atau Node spesifik), izin CRUD, *time-window*, dan visibilitas undangan. |
| **Publish AS & WITH** | Model penerbitan konten di **level Vault maupun spesifik Folder-Node / File-Node** (memungkinkan Vault berstatus `private` tetap menerbitkan Folder-Node/File-Node pilihan). **`AS`** menentukan *Presentation Lens* (`atlas`, `publication`, `course`, `template`); **`WITH`** menentukan jangkauan (`public_listed`, `public_unlisted`, `shared`, `private`), lisensi (default `CC BY-SA 4.0`), *Allow Citation*, dan *Allow Fork*. |
| **"Share · Access · Versions" Drawer** | Permukaan antarmuka terpadu di `/app` yang menggabungkan tab *Publish*, *Collaborate*, dan *Versions & Diff/MR*, serta otomatis mengenali konteks apakah pengguna memilih seluruh Vault atau sebuah Node spesifik. |
| **Living Pedagogical & Competence Tree** | Struktur visual deterministik mode **`Academy`** yang memetakan hirarki penuh **Falsafah → Kurikulum → Silabus → RPS → Instruksi/Tugas** di atas Folder-Nodes dan File-Nodes dengan tata kelola **3 Lapisan Evolusi** di blok `academy` pada `.app/config.json`. |
| **Living Student Sub-Nodes** | Dokumentasi proses dan hasil belajar murid yang hidup langsung sebagai **sub-nodes (`file-nodes` / `sub-folder-nodes`)** di bawah node kurikulum/instruksi terkait (melacak state `locked` → `available` → `in_progress` → `submitted` → `mastered`). |
| **3-Scope Contextual Settings Escalation** | Penempatan kontrol terstruktur lintas 3 cakupan (**App & Account Scope**, **Vault Scope [`.app/config.json`]**, **Node & Session Scope**) yang tersebar proporsional pada **Dedicated Settings Hub (`/settings` / `Ctrl+,`)**, **Profile Page (`/:username`)**, dan **Editor Page (`/app` In-Place HUD & Quick Settings Drawer)**. |

---

## 3. Kamus Istilah Sosial, AI, Keamanan & Ekstensibilitas

| Istilah Kanonik | Definisi Baku |
| :--- | :--- |
| **Community Domain (`src/domains/community/`)** | Bounded domain yang melayani indeks kurasi `/explore`, profil root kanonik `/:username` dan `/@:username`, serta reader *Dual-Pane* untuk *Presentation Lenses* (`atlas`, `publication`, `course`, `template`). |
| **`RESERVED_SLUGS` & Hard Cutover** | Daftar slug sistem (`app`, `vaults`, `auth`, `admin`, `explore`, `install`, `settings`, dll.) yang dilindungi 3 lapis agar `/:username` tidak bertabrakan dengan rute aplikasi, setelah pematian total rute legacy `/p/*`. |
| **ReleaseStageGate** | Gerbang kontrol rilis 3 tahap berbasis DB (`platform_settings.release_stage`): `stage_1_partner`, `stage_2_community_beta`, dan `stage_3_commercial_ga`. |
| **PolicyEngine** | Evaluator otorisasi terpusat (`can(actor, action, resource, context)`) di frontend yang simetris dengan Postgres RLS `can_access_resource(...)` baik di level Vault maupun Node/Folder. |
| **Cross-Vault Citation & Epistemic YAML** | Tautan terfederasi `[[@username/vaultSlug/noteSlug]]` yang disertai metadata epistemik (`epistemic_status`: `seedling` \| `budding` \| `evergreen` \| `peer_reviewed`, `confidence`, `doi`, `license: CC BY-SA 4.0`, `references`) serta ekspor sitasi instan. |
| **Native BYO-AI & Local AI** | Strategi kecerdasan buatan yang terinspirasi Nodus Research berbasis kedaulatan lokal: *Local AI* (Ollama / WebLLM) serta *Bring Your Own Key (BYOK)* dengan indeks RAG lokal dan manajemen referensi PDF/Zotero tanpa mengirim paksa seluruh vault ke pihak ketiga. |
| **Six-Layer Cascading Config & `@app/sdk`** | Resolusi pengaturan 6 lapis (*System Defaults* → *Org Policy Locked* → *Vault `.app/config.json`* [fallback `.vk/`/`.obmap/`] → *User Profile* → *Node/Leaf* → *Session*) dan antarmuka ekstensi terisolasi Web Worker / Iframe CSP berizin eksplisit (`@app/sdk`, berevolusi dari registry internal dan alias legacy `@vk/sdk`). |

---

## Terkait
- [Master Blueprint v2.0](00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-2-quovadis.md)
- [Konvensi Dokumentasi Sistem](doc-conventions.md)
- [Legenda Status Dokumen](status-legend.md)
