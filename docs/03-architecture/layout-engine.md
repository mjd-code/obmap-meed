---
id: DOC-ARCH-003
title: Mesin Tata Letak Graf dan Penata Diagram Visual
type: architecture
status: [IMPLEMENTED]
owner: Senior Visual Performance Engineer
version: 1.1.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ARCH-001
  - DOC-PLAN-001
source_of_truth: src/domains/graph/shared/utils/
---

# Mesin Tata Letak Graf (Visual Layout Engine)

## Ringkasan 3 Baris
- Memisahkan secara ketat antara simulasi dinamis gaya fisika (Free-force) dan solver deterministik (Mindmap, Org Chart, Fishbone, Timeline).
- Hanya mode Free-force yang menjalankan komputasi simulasi D3 secara terus-menerus; solver lain mengunci posisi simpul (*pinned coordinates*) pasca-transisi.
- Mendukung mekanisme *subtree layout overrides* yang memungkinkan cabang anak memiliki algoritma tata letak berbeda dari induknya.

---

## 1. Taksonomi Kategori Tata Letak (`layoutCategory.ts`)

```mermaid
graph TD
    Root[Layout Mode Selector] --> FreeForce[Free-force Simulation<br/>D3 Physics Engine Active]
    Root --> Deterministic[Deterministic Solvers<br/>Coordinates Calculated & Pinned]
    
    Deterministic --> TreeSolvers[Tree Solvers]
    Deterministic --> NetworkSolvers[Static Network Solvers]
    Deterministic --> SpecializedSolvers[Specialized Solvers]
    
    TreeSolvers --> MM[Mind Map: Radial / Lateral]
    TreeSolvers --> OC[Org Chart: Top-Down]
    TreeSolvers --> BM[Brace Map: Lateral Hierarchy]
    
    SpecializedSolvers --> FB[Fishbone: Ishikawa Cause-Effect]
    SpecializedSolvers --> TL[Timeline: Hierarchical Chrono-Flow]
    
    NetworkSolvers --> FR[Fruchterman-Reingold]
    NetworkSolvers --> KK[Kamada-Kawai]
    NetworkSolvers --> RD[Radial Orbit]
    NetworkSolvers --> GD[Grid Layout]
```

---

## 2. Algoritma Khusus: Timeline & Fishbone

### 2.1 Timeline Hierarkis (`timeline.ts`)
Berbeda dengan garis waktu berbasis tanggal kalender, timeline ObMap dihitung berdasarkan urutan berkas dalam hierarki sistem:
- **Root Node:** Topik utama di sebelah kiri atau atas.
- **Direct Children (Milestones):** Diposisikan secara berurutan di sepanjang poros utama (*primary axis*).
- **Sub-descendants:** Dicabangkan tegak lurus secara berselang-seling (*off-axis alternating*) untuk mencegah tabrakan visual.

### 2.2 Fishbone Ishikawa Diagram (`fishbone.ts`)
- **Spine (Tulang Belakang):** Garis horizontal dari kiri ke kanan yang berakhir di simpul kepala masalah (*Problem Statement*).
- **Major Bones (Kategori Akar):** Cabang miring dengan sudut konstan (60 derajat) di sisi atas dan bawah tulang belakang.
- **Minor Bones:** Ranting penyebab spesifik yang disusun paralel dengan tulang belakang.

---

## 3. Pencegahan Tabrakan Kotak Pembatas (Anti-Collision Engine)

```
[FORMULA PERHITUNGAN KOTAK PEMBATAS SIMPUL]
NodeWidth = max(minWidth, textLength × charWidth + paddingX + badgeWidth)
NodeHeight = baseHeight + (numberOfLines × lineHeight) + paddingY
SubtreeSpan = sum(ChildNodeSpans) + (numberOfChildren - 1) × SiblingsGap
```

- Status: `[PARTIAL]` — Penataan pohon dasar dan jarak antar-saudara (*sibling gap*) sudah terisolasi, namun teks yang sangat panjang pada mode Fishbone/Timeline masih dalam tahap penyempurnaan pembatas adaptif.

---

## Terkait
- [Ikhtisar Arsitektur Sistem](system-overview.md)
- [Katalog Fitur Graf](../04-features/feature-catalog.md)