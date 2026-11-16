---
id: DOC-ARCH-004
title: Arsitektur Data, Storage & Konfigurasi 6-Lapis ObMap v2.0
type: architecture
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-16
audience: engineering
related:
  - DOC-ARCH-001
  - DOC-ARCH-ADR-0004
  - DOC-ARCH-ADR-0009
  - DOC-ARCH-ADR-0011
  - DOC-ARCH-ADR-0013
source_of_truth: src/domains/vault/, src/domains/settings/, supabase/migrations/
---

# Arsitektur Data, Storage & Konfigurasi 6-Lapis (`Data & Storage`)

## Ringkasan 3 Baris
- Mendokumentasikan strategi penyimpanan multi-driver (`IVaultStorageDriver.ts`) yang menjamin data lokal (`FileSystemService.ts`, `IndexedDbVaultDriver.ts`) 100% gratis dan berdaulat selamanya.
- Memetakan skema PostgreSQL V4 aktual (`20261031000000_v4_collaboration_and_publishing.sql`), proteksi bucket privat (`createSignedUrl`), serta skema v2.0 untuk Stage Gate, Citasi, dan paket/kuota dinamis.
- Menjelaskan tata kelola konfigurasi 6-lapis terisolasi (`.vk/` dengan fallback `.obmap/`, `LocalConfigStore.ts`, `CloudConfigStore.ts`), mekanisme *Org-Lock* berbasis peran, serta standar namespace storage *brand-agnostic* (`ADR-0013`).

---

## 1. Isolasi Storage Drivers (`ADR-0004`)

| Driver | Modul Kode | Tujuan & Tahap | Jaminan Kedaulatan Data |
| :--- | :--- | :--- | :--- |
| **File System Access API** | `FileSystemService.ts` | `[IMPLEMENTED]` — Penyimpanan folder `.md` & sidecar `.vk/` (fallback `.obmap/`) asli di OS lokal. | Berkas murni di disk pengguna; gratis tak terbatas selamanya. |
| **IndexedDB Driver** | `IndexedDbVaultDriver.ts` | `[IMPLEMENTED]` — Cache offline PWA & penyimpanan lokal lintas-peramban. | Reaktif lokal tanpa ketergantungan jaringan. |
| **Cloud Vault Driver** | `CloudVaultService.ts` | `[IMPLEMENTED]` — Sinkronisasi terotorisasi ke Supabase Postgres & Storage. | Diatur kuota dinamis DB pada Stage 3; media privat via `createSignedUrl`. |
| **In-Memory Sandbox Driver** | `InMemoryVaultDriver.ts` `[PLANNED]` | `STEP-02.2` — Sandbox instan di Landing `/` (`< 65KB`). | Data sementara di RAM & langsung dimigrasikan saat akun lolos `ReleaseStageGate`. |

---

## 2. Skema Database & Storage Security

### Skema Terpasang (`supabase/migrations/20261031000000_v4_collaboration_and_publishing.sql`)
- **Tipe Enum:** `app_role`, `vault_member_role`, `note_status`.
- **Tabel Inti V4:** `user_roles`, `vault_members`, `notes`, `note_revisions`, `note_links`, `audit_logs`.
- **Bucket Storage (`vault-media`, `avatars`):** Terisolasi pada folder UUID user dan **wajib diakses memakai `createSignedUrl`** (aturan absolut #5 `AGENTS.md`).
- **Catatan Utang Teknis (`TD-005`):** `src/global/api/untypedSupabase.ts` dijadwalkan untuk dihapus dan diganti tipe hasil generasi migrasi SQL pada **`STEP-01.1`**.

### Migrasi Terencana v2.0 (`STEP-01.2` s/d `STEP-04.2`)
- **Stage Gate & Profiles (`STEP-01.2`–`01.3`):** `platform_settings` (`release_stage`), `partner_invitations`, kolom `account_status` (`pending_approval` | `approved` | `suspended`), constraint `RESERVED_SLUGS`.
- **Policy Engine & Visibility (`STEP-01.4`):** `share_links`, fungsi RLS `can_access_resource()`.
- **Social Graph & Fork/MR (`STEP-03.1`–`03.3`):** `scholar_profiles`, `scholar_follows`, `vault_topics`, `scholar_verifications` (kurasi manual Admin), `cross_vault_citations`, `vault_forks`, `knowledge_merge_requests`, `note_annotations`.
- **Dynamic Plans, Quotas & Billing (`STEP-04.1`–`04.2`):** `plans`, `plan_entitlements`, `plan_quotas`, `subscriptions`, `usage_quotas`, `billing_invoices`, `org_teamspaces`, `org_seats`.

---

## 3. Hierarki Resolusi Konfigurasi 6-Lapis (`ADR-0011`)

```mermaid
flowchart LR
    L1["1. System Defaults (configRegistry.ts)"] --> L2["2. Org/Team Policy Locked (Admin-Locked) [PLANNED]"]
    L2 --> L3["3. Vault (.vk/config.json | fallback .obmap/config.json via VaultConfigFile.ts)"]
    L3 --> L4["4. User Profile (LocalConfigStore / CloudConfigStore)"]
    L4 --> L5["5. Leaf / Tab Store (LeafGraphConfigStore)"]
    L5 --> L6["6. Session / URL Query Override"]
```

- Lapis yang memiliki prioritas lebih tinggi menimpa lapisan sebelumnya, **kecuali** properti yang diberi flag `lockedByOrgAdmin` pada Lapis 2 (*Org/Institution Policy*) yang tetap menjadi penentu mutlak dan tampil *read-only* pada UI `SettingsHub.tsx`.

---

## 4. Standar Namespace Storage *Brand-Agnostic* & Migrasi Zero-Loss (`ADR-0013`)

Untuk memastikan rebranding maupun *white-labeling* tidak menyebabkan kehilangan preferensi atau sesi lokal pengguna, seluruh infrastruktur penyimpanan memakai namespace domain netral ber-prefix **`vk`** (*Visual Knowledge*) dengan fallback pembacaan otomatis dari kunci legacy `obmap`:

| Lapisan Storage | Kunci Kanonik (*Brand-Agnostic*) | Kunci Legacy Fallback | Mekanisme Migrasi (`storageKeyMigrator.ts`) |
| :--- | :--- | :--- | :--- |
| **IndexedDB (`LocalConfigStore.ts`)** | `VkConfigDB` | `ObmapConfigDB` | Salin otomatis entri dari `ObmapConfigDB` saat `VkConfigDB` pertama kali kosong. |
| **Device ID (`ConfigService.ts`)** | `vk-device-id` | `obmap-device-id` | Baca kunci kanonik; fallback baca legacy lalu persist ke kunci kanonik. |
| **Local Config (`LocalConfigStore.ts`)** | `vk-config:` | `obmap-config:` | Migrasi lazy per-key saat pembacaan tanpa menghapus data eksisting. |
| **Vault Schema (`useSchemaStore.ts`)** | `vk-vault-schema` | `obmap-vault-schema` | Fallback read satu kali lalu sinkron ke kunci kanonik. |
| **Active Vault (`VaultManager.ts`)** | `vk.activeVaultId` | `obmap.activeVaultId` | Fallback read satu kali agar tab/vault aktif tidak ter-reset. |
| **Sidecar & Export (`VaultConfigFile.ts`)** | `.vk/config.json`, `.vk/mindmap-layout.json` | `.obmap/config.json`, `.obmap/mindmap-layout.json` | Prioritaskan `.vk/*`; unduhan manual memakai `${brand.slug}-config-${date}.json`. |

---

## Terkait
- [Master Blueprint v2.0 §6.4](../00-meta/00-0-master-blueprint.md)
- [ADR-0004: Multi-Strategy Storage Isolation](adr/ADR-0004-multi-strategy-storage-isolation.md)
- [ADR-0011: Six-Layer Config & Unified Theme Engine](adr/ADR-0011-six-layer-cascading-config-and-unified-theme-engine.md)
- [ADR-0013: Brand-Agnostic Infrastructure & Dynamic Branding](adr/ADR-0013-brand-agnostic-infrastructure-and-dynamic-branding.md)
- [Playbook Eksekusi (`STEP-01.1`, `STEP-01.5`, `BRAND-STEP-01`, `STEP-04.1`)](../02-planning/README.md)
