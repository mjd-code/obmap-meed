---
id: ADR-0006
title: Tata Kelola State Reaktif, Store Bridge, dan Zero-Regression Headless Controller
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - ADR-0001
  - ADR-0003
  - DOC-ENG-004
  - ENG-RULES-001
source_of_truth: src/domains/
---

# ADR-0006: Tata Kelola State Reaktif & Headless Controller

## 1. Konteks Masalah
Selama restrukturisasi pola *Headless Controller* pada Fase 1–4, pemisahan logika ke hook terisolasi dan *per-leaf store* menimbulkan 4 kelas regresi reaktivitas:
1. **Dual-Truth UI State:** Menyimpan salinan state store di `useState` lokal (mis. `activeSettingsSection`) dan guard idempotensi yang tidak memeriksa seluruh field identitas view (`settingsSection`).
2. **Cyclic Bidirectional `useEffect` Sync:** Dua `useEffect` yang saling memantau antara Workspace `view.canvasMode` dan `useGraphInteractionStore.canvasMode` sehingga membatalkan perubahan mode secara instan.
3. **Split-Brain Store Isolation:** `LeafGraphConfigStore` dan `LeafGraphInteractionStore` terputus dari store globalnya (`useGraphStore`, `globalGraphInteractionStore`), sehingga mutasi dari Visual Engine atau Settings tidak terefleksi di kanvas atau tidak tersimpan ke `ConfigService`.
4. **Canvas2D Frame Stagnation & Dropped Effects:** Hilangnya `transition.current.run()` dan tidak adanya `graphRef.current?.refresh?.()` saat `cooldownTicks === 0` membuat kanvas membeku saat berpindah layout atau mengubah properti visual.

## 2. Keputusan Arsitektur
ObMap menetapkan **5 Hukum Reaktivitas Enterprise-Grade**:
1. **Single Authoritative State:** Dilarang menduplikasi state store ke `useState` lokal; gunakan *derived state* atau selector Zustand langsung.
2. **Unidirectional Action Dispatch:** Dilarang menyinkronkan dua store dengan `useEffect` dua arah. Event handler UI memperbarui kedua store secara sinkron, dan prop eksternal hanya disinkronkan melalui *previous-value ref guard* (`prevPropRef`).
3. **Hierarchical Store Bridge (Write-Through & Broadcast):** Mutasi pada *leaf store* diteruskan ke store global (untuk persistensi), dan pembaruan global (reset/import/settings) disiarkan ke seluruh *leaf store* aktif.
4. **Canvas Frame Invalidation Contract:** Setiap perubahan properti visual pada Canvas2D dalam mode statis/deterministik wajib memicu `graphRef.current?.refresh?.()`.
5. **Zero-Regression Headless Extraction:** Ekstraksi *God Component* wajib mempertahankan paritas fitur 100% (seluruh `useEffect`, filter `useMemo`, prop pustaka graf, dan panel UI).

## 3. Konsekuensi
- **Positif:** Perpindahan tab Settings, transisi layout graf (`free-force` $\leftrightarrow$ deterministik), dan kontrol Visual Engine berjalan instan ($\le 16\text{ms}$), teruji otomatis oleh Vitest, dan aman untuk penskalaan fitur enterprise.
- **Negatif:** Penambahan *bridge* antar-store membutuhkan disiplin agar tidak memicu infinite loop (ditangani dengan guard kesamaan referensi/nilai sebelum propagasi).
