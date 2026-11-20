---
id: DOC-PLAN-001
title: Product Requirements Document (PRD) v2.0
type: planning
status: [PLANNED]
owner: Chief Product Officer & Lead Product Manager
version: 2.1.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-META-000
  - DOC-META-002
  - DOC-PLAN-000
  - DOC-PLAN-002
  - DOC-PLAN-003
  - DOC-PLAN-005
source_of_truth: docs/00-meta/00-0-master-blueprint.md, docs/00-meta/00-2-quovadis.md
---

# Product Requirements Document (PRD) v2.0

## Ringkasan 3 Baris
- Mendefinisikan kebutuhan produk end-to-end berbasis **6 Sistem Referensi Inti** (**Obsidian**, **Nodus Research**, **XMind**, **Notion**, **Wikipedia**, **LinkedIn × ResearchGate × GitHub**) di atas filosofi *"Unopinionated Data, Opinionated Lenses, Visual by Default, Connected by Design"*.
- Mengunci batas produk tegas (**Non-Goal:** bukan *office-board-central* ala Trello/Asana/Monday/ClickUp), sentralisasi konfigurasi tunggal **`.app/config.json`**, **4 Workspace Modes** (`Freeform`, `Atlas`, `Studio`, `Academy` + `Community Presets`), **4 Helicopter Views**, **Academy 3 Lapis**, serta **Unified Essential VCS & Granular `AS & WITH`** via **"Share · Access · Versions" Drawer**.
- Menghubungkan 3 segmen pengguna (*Beginner*, *Intermediate*, *Advanced*) & persona (`PER-01`–`PER-09`) langsung ke kriteria keberhasilan dan antrean `STEP-01.1`–`STEP-05.4`.

---

## 1. Masalah Inti Pengguna, Non-Goal & Ruang Lingkup Produk
Pengguna pengetahuan selama ini dipaksa memecah arsip, riset PDF, pemetaan visual, editorial, kurasi portofolio, dan pengajaran di alat terpisah—atau terjebak memilih antara kanvas kosong yang intimidatif (*Obsidian* tanpa plugin) dan aplikasi kaku ber-lock-in (*Notion*). Arsitektur v2.0 menyelesaikan keduanya lewat data `.md` + `.app/config.json` yang tetap bebas, dibungkus oleh *Opinionated Core Presets* siap pakai dalam `< 90 detik`.

- **Batas Tegas Produk (*Explicit Non-Goal*):** Aplikasi ini **BUKAN** *office-board-central / enterprise project management* (Trello, Asana, ClickUp, Notion enterprise board). Seluruh *Derived Views* (*Table*, *Cards*, *Kanban/Calendar* ringan) melayani **pengarsipan, pengetahuan, riset, editorial (`Studio`), dan progres belajar (`Academy`)**.

### Ruang Lingkup In-Scope v2.0
- **Core Workbench (`/app`) & Controls 3-Scope:** Editor CM6 + YAML terisolasi, **4 Mandatory Helicopter Views** (*Graph View*, *Diagram View* [6 solver], *Table View*, *Cards View*), *Virtual Grouping* & *Structural Refactoring*, **In-Place HUD & Quick Settings Slide-Over Drawer**, serta **"Share · Access · Versions" Drawer** (3 tab, deteksi Vault vs Node/Folder).
- **Dashboard Hub (`/vaults` — `domains/dashboard/`):** Manajemen multi-vault, *Knowledge Derived Views*, inkubator **`Community Presets` (`template`)**, serta pemilihan **Workspace Mode** (`Freeform`, `Atlas`, `Studio`, `Academy`).
- **Academy 3-Layer Competence Tree:** Hirarki **Falsafah → Kurikulum → Silabus → RPS → Instruksi/Tugas**, *Living Student Sub-Nodes* (`locked → available → in_progress → submitted → mastered`), aturan Lapisan 2 per node di `.app/config.json`, & *Focus Screen* Lapisan 3.
- **Community & Scholarly Network (`/:username`, `/@:username`, `/explore`):** Presentation Lenses (**`atlas`**, **`publication`**, **`course`**, **`template`**), *Granular Node-Level & Vault-Level Publishing*, `[[@user/vault/note]]`, *Essential VCS* (*Snapshot, Visual Diff, Fork, KMR*), Profile light controls + *"Full Account Settings →"*.
- **Settings Hub (`/settings` / `Ctrl+,`), AI & `@app/sdk`:** 5 tab context-aware (*Account & Profile*, *Appearance & App*, *AI & Integrations* [Ollama/WebLLM/BYOK Local RAG + Zotero/PDF], *Active Vault `.app/config.json`*, *Presets & Extensions* `@app/sdk`).

---

## 2. Alur Produk Lintas Tahap (`Stage 1–3`)

```mermaid
flowchart LR
    V["Pengunjung Landing / Sandbox (<65KB)"] --> R["Registrasi + Klaim /:username"]
    R --> G{"ReleaseStageGate"}
    G -->|"Stage 1: Partner Pilot"| P1["partner_invitations -> /vaults (Pilih Core Preset) & /app"]
    G -->|"Stage 2: Community Beta"| P2["pending_approval -> Antrean Individual /admin"]
    P2 -->|"Admin Approve"| P1
    G -->|"Stage 3: Commercial GA"| P3["Auto-Approved + Quota DB Dinamis"]
    P1 --> W["Archive -> Helicopter View -> Restructure -> Drawer Share·Access·Versions"]
    P3 --> W
```

---

## 3. Matriks Kebutuhan Produk per Domain Utama

| Kelompok Fitur | Spesifikasi Ringkas | Status | Target Step |
| :--- | :--- | :---: | :--- |
| **4 Helicopter Views & Solver Deterministik** | *Graph, Diagram* (Mindmap, Org+Matrix, Timeline, Fishbone, `argument-map`, `competence-dag`), *Table*, *Cards*; *Virtual Grouping* & *Structural Refactoring* | `[IMPLEMENTED]` / `[PLANNED]` | Baseline + `STEP-02.1`, `05.2` |
| **Workspace Modes & Dashboard (`/vaults`)** | `Freeform`, `Atlas`, `Studio` (+ 4 Helicopter Views wajib), `Academy`, + `Community Presets` (`template`) | `[VISION]` | `STEP-02.1` |
| **Community (`/:username` & `/explore`)** | *Hard cutover* `/p/*`, Presentation Lenses (`atlas`/`publication`/`course`/`template`), Profile light UI, & kurasi *Verified Scholar* Admin | `[PARTIAL]` / `[VISION]` | `STEP-01.2`, `03.1` |
| **Essential VCS & Granular `AS & WITH`** | Drawer **"Share · Access · Versions"** (*Publish*, *Collaborate*, *Versions & Diff/MR*) sadar konteks **Vault & Node Level** + `CC BY-SA 4.0` + *Block Comments* | `[PARTIAL]` / `[VISION]` | `STEP-01.4`, `03.3` |
| **Academy 3-Layer Competence Tree** | *Falsafah → Kurikulum → Silabus → RPS → Tugas*, *Living Student Sub-Nodes*, rules per node di blok `academy` `.app/config.json`, & Focus Screen | `[VISION]` | `STEP-05.1` |
| **Single `.app/config.json` & 3-Scope Controls** | 7 blok config sentral (anti-fragmentasi), *3-Scope Escalation* (`/settings`, `/:username`, `/app`), `@app/sdk`, & Native BYO-AI / Ollama RAG + PDF | `[IMPLEMENTED]` / `[VISION]` | `STEP-01.5`, `UI-STEP-01..02`, `STEP-05.3` |
| **Dynamic Billing & Teamspaces** | Konfigurasi tarif/kuota dinamis di `/admin`, **Xendit/Midtrans first → Stripe**, *Non-Destructive Downgrade*, & CRDT Yjs | `[VISION]` | `STEP-04.1`–`04.3` |

---

## 4. Mitigasi Risiko Produk & Teknis (`RISK-01` s/d `RISK-06`)

| ID Risiko | Deskripsi Risiko | Tingkat | Strategi Mitigasi Terstruktur |
| :--- | :--- | :---: | :--- |
| **`RISK-01`** | Kebocoran node privat pada granular node-level publishing / collab | Kritis | Evaluasi simetris `PolicyEngine` ↔ Postgres RLS atas `visibility: private` & `publishing/access.node_overrides`; bucket `vault-media` hanya lewat `createSignedUrl`. |
| **`RISK-02`** | Lonjakan trafik atau beban support di tahap awal | Tinggi | `ReleaseStageGate` Stage 1 & Stage 2 `pending_approval` individual + *Core Presets* `< 90 detik` mengurangi *drop-off*. |
| **`RISK-03`** | Ruang lingkup produk melebar menjadi klon papan tugas korporat | Tinggi | Ditegakkan melalui *Explicit Non-Goal* pada Master Blueprint & PRD: Views hanya untuk pengetahuan, riset, editorial, & pembelajaran. |
| **`RISK-04`** | Tabrakan root `/:username` atau fragmentasi berkas konfigurasi | Kritis | Guard 3-lapis `RESERVED_SLUGS` + larangan memecah `.app/config.json` menjadi `preset.json`/`lms-policy.json`/`setting.json`. |
| **`RISK-05`** | Ketidakpuasan pengguna saat downgrade atau berpindah alat | Tinggi | *Local-First Forever Free*, berkas `.md` murni, & *Non-Destructive Downgrade* (`downgraded_readonly`). |
| **`RISK-06`** | Risiko XSS atau kebocoran key AI/token oleh plugin | Kritis | Isolasi **`@app/sdk`** di Web Worker / Iframe CSP, *Permission Manifest*, `rehype-sanitize`, & pemrosesan Local AI (Ollama/BYOK). |

---

## Terkait
- [Master Blueprint v2.0](../00-meta/00-0-master-blueprint.md)
- [Playbook Eksekusi Step-by-Step (`README.md`)](README.md)
- [System Requirements Specification (`srs.md`)](srs.md)
- [Visi & Arsitektur Academy 3-Lapis](../06-lms/lms-vision.md)
- [Kolaborasi Granular & Essential VCS](../03-architecture/collaboration-and-publishing.md)
