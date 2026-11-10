---
id: ADR-0004
title: Isolasi Strategi Penyimpanan Multi-Tenant per Vault
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 1.0.0
last_reviewed: 2026-11-10
audience: both
related:
  - DOC-ADR-000
  - DOC-ARCH-002
source_of_truth: src/domains/vault/shared/stores/useVaultStore.ts
---

# ADR-0004: Isolasi Strategi Penyimpanan Multi-Tenant

## Konteks Masalah
Pengguna membutuhkan fleksibilitas: catatan pribadi super-rahasia harus tetap berada di drive lokal tanpa pernah menyentuh cloud, sementara proyek kolaborasi tim harus disinkronkan ke Supabase.

## Keputusan yang Diambil
Memberikan properti `storageStrategy` pada setiap vault (`memory`/IndexedDB, `cloud`, `filesystem`). Vault lokal dilarang mengirim mutasi ke Supabase. Saat pengguna keluar (*logout*), seluruh cache lokal yang berasosiasi dengan sesi akun tersebut langsung dibersihkan.

## Konsekuensi
- **Positif:** Kepatuhan privasi dan kedaulatan data absolut; tidak ada risiko kebocoran catatan lokal ke basis data cloud publik.
- **Tantangan:** Penanganan migrasi vault antar-strategi memerlukan konfirmasi konversi data eksplisit dari pengguna.