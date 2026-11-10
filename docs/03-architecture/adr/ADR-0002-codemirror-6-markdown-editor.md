---
id: ADR-0002
title: Penggunaan CodeMirror 6 Menggantikan Textarea dan Monaco Editor
type: architecture
status: [IMPLEMENTED]
owner: Senior Frontend Engineer
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ADR-000
  - DOC-PLAN-003
source_of_truth: src/domains/editor/shared/cm/
---

# ADR-0002: Pemilihan CodeMirror 6 untuk Editor Markdown

## Konteks Masalah
Aplikasi membutuhkan editor Markdown berkinerja tinggi yang mendukung Live Preview (dekorasi inline), autocomplete slash commands, wikilinks `[[]]`, tags `#`, dan pelipatan heading tanpa membebani ukuran bundle seperti Monaco Editor.

## Keputusan yang Diambil
Mengadopsi CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@lezer/markdown`). Properti frontmatter YAML dipisahkan ke komponen visual collapsible terpisah (`PropertiesPanel.tsx`), menjaga kanvas dokumen tetap bersih.

## Konsekuensi
- **Positif:** Ukuran bundle ringan; arsitektur fungsional berbasis ekstensi (*state fields* & *decorations*); dukungan mobile ramah sentuhan.
- **Tantangan:** Kurva belajar API CodeMirror 6 (Transaction, StateEffect) lebih curam dibanding textarea standar.