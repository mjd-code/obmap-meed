---
id: DOC-FEAT-000
title: Indeks & Tata Kelola Katalog Fitur ObMap v2.0
type: feature
status: [IMPLEMENTED]
owner: Lead Product Manager & Principal Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-FEAT-001
  - DOC-META-000
  - DOC-PLAN-000
  - DOC-ARCH-002
source_of_truth: docs/04-features/feature-catalog.md, src/domains/
---

# Indeks & Tata Kelola Katalog Fitur (`docs/04-features/`)

## Ringkasan 3 Baris
- Menjelaskan konvensi identifikasi fitur (`FEAT-<DOMAIN>-NNN`) dan aturan verifikasi status implementasi terhadap kode sumber nyata di `src/domains/`.
- Setiap fitur pada [Master Feature Catalog](feature-catalog.md) terhubung ke domain target v2.0 (13 domain termasuk `community` dan `dashboard`), paket monetisasi dinamis `/admin`, dan langkah eksekusi `STEP-01.1`–`05.4`.
- Status `[IMPLEMENTED]` hanya boleh disematkan apabila simbol, berkas, dan verifikasi uji pada kode sumber telah terbukti hadir.

---

## Aturan Sinkronisasi Katalog
1. Penambahan fitur baru atau perubahan status `[PLANNED]` → `[IMPLEMENTED]` wajib dilakukan bersamaan dengan pembaruan `docs/_machine/features.json` dan **Mandatory 3-Part Changelog Sync** (`AGENTS.md` Rule 11).
2. Lokasi berkas pada kolom `Source of Truth` mengacu kepada struktur Wave 3 + transisi v2.0 (mis. `src/domains/workspace/`, `layoutCategory.ts`, dan target refaktor `src/domains/community/`).

---

## Terkait
- [Master Feature Catalog (`feature-catalog.md`)](feature-catalog.md)
- [Playbook Eksekusi Step-by-Step (`../02-planning/README.md`)](../02-planning/README.md)
- [Peta 13 Domain (`../03-architecture/domain-map.md`)](../03-architecture/domain-map.md)
