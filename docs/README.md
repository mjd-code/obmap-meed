---
id: DOC-PORTAL-000
title: Portal Dokumentasi Teknis & Produk
type: index
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.2.0
last_reviewed: 2026-11-20
audience: both
related:
  - DOC-META-000
  - DOC-META-002
  - DOC-META-005
  - DOC-CHLOG-000
  - DOC-PORTAL-001
source_of_truth: docs/
---

# Portal Dokumentasi Sistem & Produk

## Ringkasan 3 Baris
- Pintu masuk utama navigasi arsitektur, konstitusi produk, perencanaan bertahap, spesifikasi teknis, dan riwayat perubahan bagi engineer maupun AI coding agent.
- Berdiri di atas **6 Sistem Referensi Inti** (**Obsidian**, **Nodus Research**, **XMind**, **Notion**, **Wikipedia**, dan **LinkedIn × ResearchGate × GitHub**), filosofi *"Unopinionated Data, Opinionated Lenses, Visual by Default, Connected by Design"*, sentralisasi tunggal **`.app/config.json`**, dan ekosistem **`@app/sdk`**.
- Setiap perubahan kode atau dokumentasi wajib dicatat pada [Modular Changelog Hub](changelogs/README.md) dan `docs/_machine/changelog.jsonl`.

---

## 1. Dokumen Fondasi Utama (Mulai Dari Sini)

| Prioritas | Dokumen | Peran & Kegunaan |
| :---: | :--- | :--- |
| **1** | [**Master Blueprint v2.0**](00-meta/00-0-master-blueprint.md) (`DOC-META-000`) | Konstitusi **6 Referensi**, Non-Goal, **`Deep Explorer`**, **Workspace Modes** (`Freeform`/`Atlas`/`Studio`/`Academy`), **`.app/config.json`**, **Unified `<SettingsHub />` (*Dual Navigator*)**, **3 Development Tracks** (+ `/prototype`), **Essential VCS + `AS & WITH`**, & **`@app/sdk`** |
| **2** | [**Glosarium Kanonik**](00-meta/glossary.md) (`DOC-META-002`) | Kamus istilah baku tunggal (*Vault, Node, Workspace Mode, `Deep Explorer`, Restructure, Presentation Lens, `<SettingsHub />`, 3 Development Tracks, Zero-Backend Snapshots, Academy 3-Lapis*) |
| **3** | [**Quo Vadis v2.0**](00-meta/00-2-quovadis.md) (`DOC-META-005`) | Audit kesiapan 20 dimensi sistem, register *Doc Drift*, strategi rilis bertahap, & roadmap `EPIC-01`–`15` |
| **4** | [**Modular Changelog Hub**](changelogs/README.md) (`DOC-CHLOG-000`) & [**Machine Stream**](_machine/changelog.jsonl) | Ringkasan *Rolling Top-10*, log bulanan (`2026-11.md`), JSONL `< 500` token, dan SOP update wajib 3-langkah |

---

## 2. Jalur Baca Berdasarkan Peran (Role-Based Reading Map)

| Peran Pembaca | Urutan Bacaan yang Disarankan |
| :--- | :--- |
| **AI Coding Agents / LLMs** | `AGENTS.md` → `llms.txt` → `docs/_machine/changelog.jsonl` (15 baris akhir) → `02-planning/README.md` → `00-meta/00-0-master-blueprint.md` |
| **Software Architects & Engineers** | `00-meta/00-0-master-blueprint.md` → `03-architecture/data-and-storage.md` (`.app/config.json`) → `03-architecture/system-overview.md` → `03-architecture/collaboration-and-publishing.md` → `03-architecture/adr/README.md` |
| **Product, UX & Growth Leads** | `00-meta/00-0-master-blueprint.md` → `01-visions/positioning.md` → `02-planning/prd.md` → `02-planning/ui-ux-and-universal-design-system-plan.md` → `02-planning/personas.md` |
| **Academy & Curriculum Architects** | `06-lms/lms-vision.md` → `03-architecture/data-and-storage.md` (`academy` block) → `03-architecture/collaboration-and-publishing.md` |
| **Plugin & Theme Developers (`@app/sdk`)** | `07-developers/README.md` → `07-developers/plugin-sdk-quickstart.md` → `07-developers/extension-points-reference.md` → `07-developers/security-and-sandbox.md` |

---

## 3. Peta Direktori `docs/`

| Direktori | Fungsi | Berkas Kunci |
| :--- | :--- | :--- |
| `docs/00-meta/` | Blueprint induk, glosarium kanonik, Quo Vadis, konvensi | [00-0-master-blueprint.md](00-meta/00-0-master-blueprint.md), [glossary.md](00-meta/glossary.md), [00-2-quovadis.md](00-meta/00-2-quovadis.md), [00-1-quovadis.md](00-meta/00-1-quovadis.md) *(Arsip Wave 3)* |
| `docs/changelogs/` | Sistem changelog sharded hemat-token | [README.md](changelogs/README.md), [2026-11.md](changelogs/2026-11.md), [archive-wave-1-to-3.md](changelogs/archive-wave-1-to-3.md) |
| `docs/01-visions/` | Visi, motto, filosofi, positioning (6 Referensi) & pilar | [vision-mission.md](01-visions/vision-mission.md), [product-philosophy.md](01-visions/product-philosophy.md), [positioning.md](01-visions/positioning.md), [use-case-pillars.md](01-visions/use-case-pillars.md) |
| `docs/02-planning/` | Playbook eksekusi gradual & spesifikasi perencanaan | [**README.md**](02-planning/README.md), [ui-ux-and-universal-design-system-plan.md](02-planning/ui-ux-and-universal-design-system-plan.md), [xmind-obsidian-visual-engine-plan.md](02-planning/xmind-obsidian-visual-engine-plan.md), [prd.md](02-planning/prd.md), [brd.md](02-planning/brd.md), [srs.md](02-planning/srs.md), [personas.md](02-planning/personas.md), [roadmap.md](02-planning/roadmap.md) |
| `docs/03-architecture/` | Desain sistem, 13 domain DDD, **`.app/config.json`**, **`Deep Explorer`**, *Dual Navigator `<SettingsHub />`*, `src/prototype/`, & *Share·Access·Versions* | [system-overview.md](03-architecture/system-overview.md), [domain-map.md](03-architecture/domain-map.md), [data-and-storage.md](03-architecture/data-and-storage.md), [layout-engine.md](03-architecture/layout-engine.md), [collaboration-and-publishing.md](03-architecture/collaboration-and-publishing.md), [adr/README.md](03-architecture/adr/README.md) |
| `docs/04-features/` | Katalog fitur master & status verifikasi | [feature-catalog.md](04-features/feature-catalog.md), [README.md](04-features/README.md) |
| `docs/05-engineering/` | Standar kode, pengujian, aturan repo, hutang teknis & drift | [coding-standards.md](05-engineering/coding-standards.md), [testing-strategy.md](05-engineering/testing-strategy.md), [repository-rules.md](05-engineering/repository-rules.md), [tech-debt-register.md](05-engineering/tech-debt-register.md), [doc-drift-log.md](05-engineering/doc-drift-log.md) |
| `docs/06-lms/` | **Academy** *Living Pedagogical & Competence Tree* (3 Lapisan Evolusi) | [lms-vision.md](06-lms/lms-vision.md) |
| `docs/07-developers/` | Portal SDK Ekstensi (**`@app/sdk`**) & Tema | [README.md](07-developers/README.md), [plugin-sdk-quickstart.md](07-developers/plugin-sdk-quickstart.md), [extension-points-reference.md](07-developers/extension-points-reference.md), [theme-authoring-guide.md](07-developers/theme-authoring-guide.md), [security-and-sandbox.md](07-developers/security-and-sandbox.md) |
| `docs/_machine/` | Indeks JSON & JSONL untuk konsumsi mesin | `changelog.jsonl`, `docs-index.json`, `domains.json`, `features.json`, `requirements.json`, `repo-map.json` |

---

## Terkait
- [Indeks Ringkas Dokumentasi (SUMMARY)](SUMMARY.md)
- [Master Blueprint v2.0](00-meta/00-0-master-blueprint.md)
- [Quo Vadis v2.0](00-meta/00-2-quovadis.md)
