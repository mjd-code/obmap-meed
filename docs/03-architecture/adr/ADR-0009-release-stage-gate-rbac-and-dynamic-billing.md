---
id: DOC-ARCH-ADR-0009
title: ADR-0009 — ReleaseStageGate 3-Tahap, RBAC PolicyEngine & Dynamic Billing (Xendit/Midtrans First)
type: adr
status: [PLANNED]
owner: Principal Software Architect & CPO
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-ARCH-ADR-0004
  - DOC-ARCH-ADR-0010
  - DOC-PLAN-002
  - DOC-PLAN-000
source_of_truth: src/domains/auth/, src/domains/admin/, supabase/migrations/
---

# ADR-0009: ReleaseStageGate, PolicyEngine RBAC & Dynamic Billing (`Xendit/Midtrans First`)

## Ringkasan 3 Baris
- Mengunci mekanisme rilis bertahap 3 tahap (`stage_1_partner`, `stage_2_community_beta`, `stage_3_commercial_ga`) di mana pendaftaran baru Stage 2 disetujui **secara individual oleh Admin di `/admin`**.
- Menyatukan evaluasi hak akses melalui **PolicyEngine** 2-lapis simetris dengan Postgres RLS `can_access_resource(...)`.
- Menetapkan bahwa **seluruh harga & kuota paket dikelola dinamis di DB via `/admin`** (nol hardcode) serta integrasi pembayaran memprioritaskan **Xendit / Midtrans** terlebih dahulu sebelum Stripe.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-14 — Implementasi di `STEP-01.3`, `01.4`, `04.1`, `04.2`).
- **Konteks:** Produk harus segera dikirim (*shipping while developing*) dimulai dari pilot mitra tertutup (`Stage 1`), uji coba komunitas dengan kendali trafik ketat (`Stage 2`), hingga komersial penuh (`Stage 3`). Di samping itu, `useVaultPermission.ts` saat ini belum mendukung peran `commenter`, `guest`, atau penegakan kuota dinamis sisi server.

---

## 2. Keputusan Arsitektur Terkunci

### A. `ReleaseStageGate` & Alur Persetujuan Individual (`STEP-01.3`)
1. Tabel `platform_settings` menyimpan flag aktif `release_stage`.
2. **Stage 1 (`stage_1_partner`):** Pendaftaran umum ditutup; akses diberikan melalui tabel `partner_invitations` atau provisi langsung oleh Admin di `/admin`.
3. **Stage 2 (`stage_2_community_beta`):** Pengguna bebas mendaftar dan mengklaim `username`, tetapi masuk status `account_status = 'pending_approval'`. **Admin menyetujui atau menolak setiap pengguna secara individual di `/admin`** (tidak ada mekanisme referral/kuota undangan antar-pengguna). Sebelum berstatus `approved`, rute `/app`, `/vaults`, dan penayangan profil `/:username` milik pengguna tersebut terkunci.
4. **Stage 3 (`stage_3_commercial_ga`):** Akun baru otomatis berstatus `approved` dengan kuota paket aktif dari database.

### B. Unified `PolicyEngine` & Two-Layer RBAC (`STEP-01.4`)
- Menggabungkan *Layer 1 Account/Stage Roles* (`anonymous`, `pending_approval`, `partner_pilot`, `free`, `pro`, `academic_verified`, `team_member`, `team_admin`, `billing_owner`, `moderator`, `superadmin`) dan *Layer 2 Vault Roles* (`owner`, `admin`, `editor`, `commenter`, `contributor`, `viewer`, `guest`, `public_reader`).
- Fungsi klien `can(actor, action, resource, context)` merefleksikan logika identik dengan fungsi PostgreSQL `public.can_access_resource(...)`. Seluruh perubahan izin tercatat di `audit_logs`.

### C. Dynamic Admin-Managed Plans, Quotas & Payment Gateway (`STEP-04.1`–`04.2`)
1. **Tanpa Konstanta Harga/Kuota Hardcoded:** Seluruh paket disimpan dalam tabel `plans`, `plan_entitlements`, dan `plan_quotas`. UI `src/domains/admin/` memungkinkan Superadmin mengubah nominal harga, batas vault cloud, kapasitas media MB, batas tamu, serta masa retensi VCS kapan saja tanpa men-deploy ulang frontend.
2. **Gateway Priority:** Implementasi Supabase Edge Functions + webhook idempoten menargetkan **Xendit / Midtrans terlebih dahulu** (IDR, QRIS, Virtual Account, e-Wallet), baru diikuti adapter **Stripe** pada fase ekspansi berikutnya.
3. **Non-Destructive Downgrade:** Saat `past_due` melewati *Grace Period* 7 hari → `downgraded_readonly`, data cloud pengguna tetap utuh untuk dibaca dan diekspor ke lokal/ZIP.

---

## 3. Verifikasi & Keamanan
- Wajib menyertakan uji integrasi RLS multi-tenant otomatis untuk setiap kombinasi stage dan peran pada `STEP-05.4` dan PR terkait migrasi SQL.

---

## Terkait
- [Business Requirements Document (`../../02-planning/brd.md`)](../../02-planning/brd.md)
- [Collaboration & Publishing (`../collaboration-and-publishing.md`)](../collaboration-and-publishing.md)
- [Playbook Eksekusi (`../../02-planning/README.md`)](../../02-planning/README.md)
