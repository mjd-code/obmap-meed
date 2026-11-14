---
id: DOC-ARCH-ADR-IDX
title: Indeks Architecture Decision Records (ADR-0001 s/d ADR-0012)
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-META-000
  - DOC-META-005
  - DOC-PLAN-000
source_of_truth: docs/03-architecture/adr/
---

# Indeks Architecture Decision Records (`ADR`)

## Ringkasan 3 Baris
- Mengindeks seluruh catatan keputusan arsitektural (*ADR*) ObMap dari fondasi Wave 1–3 (`ADR-0001` s/d `ADR-0006`) hingga keputusan strategis v2.0 (`ADR-0007` s/d `ADR-0012`).
- Menyelaraskan penamaan file fisik seluruh ADR agar bebas dari ketidakkonsistenan metadata indeks mesin (`DRFT-010`).
- Seluruh ADR v2.0 berstatus **Accepted** (dikunci pada `00-2-quovadis.md` §6) dan menjadi aturan desain wajib sebelum implementasi langkah `STEP-01.1`–`STEP-05.4`.

---

## Daftar ADR Kanonik

| ID | Judul Keputusan Arsitektur | Status ADR | Lingkup Horizon / Step | Berkas Resmi |
| :---: | :--- | :---: | :--- | :--- |
| **`ADR-0001`** | Domain-Driven Design Restructuring (`12 → 13 Domains`) | Accepted (`[IMPLEMENTED]`) | Baseline Wave 1–3 | [ADR-0001-domain-driven-design-restructuring.md](ADR-0001-domain-driven-design-restructuring.md) |
| **`ADR-0002`** | CodeMirror 6 Markdown Editor & Isolated YAML Properties | Accepted (`[IMPLEMENTED]`) | Baseline Wave 1–3 | [ADR-0002-codemirror-6-markdown-editor.md](ADR-0002-codemirror-6-markdown-editor.md) |
| **`ADR-0003`** | Deterministic Layout Solvers vs. Continuous Free-Force | Accepted (`[IMPLEMENTED]`) | Baseline + `STEP-05.2` | [ADR-0003-deterministic-layout-solvers-vs-force.md](ADR-0003-deterministic-layout-solvers-vs-force.md) |
| **`ADR-0004`** | Multi-Strategy Storage Driver Isolation (`FS / IDB / Cloud`) | Accepted (`[IMPLEMENTED]`) | Baseline + `STEP-02.2` | [ADR-0004-multi-strategy-storage-isolation.md](ADR-0004-multi-strategy-storage-isolation.md) |
| **`ADR-0005`** | In-Browser VCS Engine for Markdown Collaboration | Accepted (`[IMPLEMENTED]`) | Baseline + `STEP-03.3` | [ADR-0005-in-browser-vcs-for-markdown-collaboration.md](ADR-0005-in-browser-vcs-for-markdown-collaboration.md) |
| **`ADR-0006`** | Reactive State, Leaf Bridge & Headless Controller Governance | Accepted (`[IMPLEMENTED]`) | Baseline Wave 3 | [ADR-0006-reactive-state-and-headless-controller-governance.md](ADR-0006-reactive-state-and-headless-controller-governance.md) |
| **`ADR-0007`** | Refactor `public-reader` → `community` & Canonical Root `/:username` Hard Cutover | Accepted (`[PLANNED]`) | `STEP-01.2`, `03.1` | [ADR-0007-community-domain-and-canonical-root-routing.md](ADR-0007-community-domain-and-canonical-root-routing.md) |
| **`ADR-0008`** | Dedicated `dashboard` Domain (`/vaults`) & Derived Markdown Views | Accepted (`[PLANNED]`) | `STEP-02.1` | [ADR-0008-dashboard-domain-and-derived-frontmatter-views.md](ADR-0008-dashboard-domain-and-derived-frontmatter-views.md) |
| **`ADR-0009`** | ReleaseStageGate, Two-Layer RBAC PolicyEngine & Dynamic Admin Billing (**Xendit/Midtrans First**) | Accepted (`[PLANNED]`) | `STEP-01.3`–`01.4`, `04.1`–`04.2` | [ADR-0009-release-stage-gate-rbac-and-dynamic-billing.md](ADR-0009-release-stage-gate-rbac-and-dynamic-billing.md) |
| **`ADR-0010`** | Vault Visibility State Machine, `CC BY-SA 4.0` Licensing & Cross-Vault Citations | Accepted (`[PLANNED]`) | `STEP-01.4`, `03.2`–`03.3` | [ADR-0010-visibility-state-machine-licensing-and-citations.md](ADR-0010-visibility-state-machine-licensing-and-citations.md) |
| **`ADR-0011`** | Six-Layer Cascading Configuration & Unified DOM/Canvas2D Theme Engine | Accepted (`[PLANNED]`) | `STEP-01.5` | [ADR-0011-six-layer-cascading-config-and-unified-theme-engine.md](ADR-0011-six-layer-cascading-config-and-unified-theme-engine.md) |
| **`ADR-0012`** | Sandboxed `@obmap/sdk`, Permission Manifest & Standardized Extension Points | Accepted (`[PLANNED]`) | `STEP-05.3` | [ADR-0012-sandboxed-plugin-sdk-and-extension-points.md](ADR-0012-sandboxed-plugin-sdk-and-extension-points.md) |

---

## Terkait
- [Tinjauan Arsitektur Sistem (`../system-overview.md`)](../system-overview.md)
- [Quo Vadis v2.0 §6 Keputusan Terkunci](../../00-meta/00-2-quovadis.md)
- [Playbook Eksekusi Step-by-Step (`../../02-planning/README.md`)](../../02-planning/README.md)
