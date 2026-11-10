---
id: DOC-META-001
title: Konvensi dan Standar Dokumentasi Sistem
type: standard
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-META-000
  - DOC-META-002
source_of_truth: docs/
---

# Konvensi Penulisan Dokumentasi

## Ringkasan 3 Baris
- Seluruh file dokumentasi wajib diawali YAML front-matter terstandarisasi untuk konsumsi manusia dan mesin.
- Setiap entitas teknis dan bisnis memiliki pengenal permanen (ID stabil) yang tidak boleh diubah atau digunakan ulang.
- Panjang dokumen dibatasi maksimal ~400 baris per file dengan format visual mengutamakan tabel ringkas dan diagram Mermaid.

---

## 1. Spesifikasi YAML Front-Matter

Setiap file `.md` di dalam direktori `docs/` wajib menyertakan blok berikut di baris pertama:

```yaml
---
id: <SKEMA-ID-TERDAFTAR>
title: <Judul Representatif dalam Bahasa Indonesia>
type: <index | standard | spec | architecture | feature | engineering | planning>
status: <[IMPLEMENTED] | [PARTIAL] | [PLANNED] | [VISION]>
owner: <Role atau Domain Lead>
version: <Semantic Versioning misal 1.0.0>
last_reviewed: <Format YYYY-MM-DD>
audience: <human | ai | both>
related:
  - <ID-DOKUMEN-TERKAIT-1>
source_of_truth: <Path relatif ke file atau folder kode aktual>
---
```

---

## 2. Taksonomi Identifikasi Stabil (Stable IDs)

| Prefiks ID | Kategori Entitas | Contoh Penggunaan | Deskripsi |
| :--- | :--- | :--- | :--- |
| `DOC-META-NNN` | Meta-dokumen & konvensi | `DOC-META-001` | Dokumentasi tata kelola sistem |
| `FR-<DOMAIN>-NNN` | Kebutuhan fungsional | `FR-GRAPH-001` | Kebutuhan spesifik domain tertentu |
| `NFR-NNN` | Kebutuhan non-fungsional | `NFR-001` | Performa, keamanan, latensi |
| `FEAT-<DOMAIN>-NNN` | Modul atau fitur produk | `FEAT-EDITOR-002` | Fitur konkret dalam katalog |
| `PER-NN` | Profil persona pengguna | `PER-01` | Target pengguna sistem |
| `ADR-NNNN` | Architecture Decision Record | `ADR-0001` | Keputusan arsitektur resmi |
| `EPIC-NN` | Inisiatif kerja tingkat tinggi | `EPIC-03` | Rangkaian deliverable |
| `RISK-NN` | Analisis risiko proyek | `RISK-02` | Risiko teknis/bisnis |
| `TD-NNN` | Register Technical Debt | `TD-001` | Item hutang teknis aktif |

---

## 3. Aturan Struktur Konten

1. **Bagian Pembuka:** Judul level-1 (`#`), diikuti sub-judul level-2 (`## Ringkasan 3 Baris`) yang memuat maksimal 3 poin TL;DR.
2. **Kepadatan Paragraf:** Tidak boleh ada paragraf melebihi 5 baris kalimat. Gunakan poin atau tabel untuk rincian teknis.
3. **Diagram:** Gunakan diagram berbasis teks Mermaid (`mermaid`) untuk menjaga kemudahan audit dan git diff.
4. **Bagian Penutup:** Wajib diakhiri dengan `## Terkait` yang menautkan file dokumen pendukung.

---

## Terkait
- [Portal Dokumentasi](../README.md)
- [Legenda Status](status-legend.md)
- [Glosarium Istilah](glossary.md)
```

---