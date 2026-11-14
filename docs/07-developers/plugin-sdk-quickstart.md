---
id: DOC-DEV-001
title: Quickstart Membangun Plugin Pertama dengan `@obmap/sdk`
type: developer
status: [PLANNED]
owner: Developer Ecosystem Lead
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-DEV-000
  - DOC-DEV-002
  - DOC-DEV-004
  - DOC-ARCH-ADR-0012
source_of_truth: src/domains/settings/shared/api/pluginRegistry.ts, src/domains/workspace/CommandRegistry.ts
---

# Quickstart Membangun Plugin Pertama dengan `@obmap/sdk`

## Ringkasan 3 Baris
- Panduan langkah demi langkah membuat ekstensi ObMap pertama tanpa menyentuh source code inti `src/`.
- Menjelaskan struktur minimal direktori plugin (`manifest.json`, entrypoint modul, dan panel pengaturan terisolasi di `configRegistry`).
- Menetapkan standar lifecycle `activate(ctx)` / `deactivate()`, deklarasi *Permission Manifest*, dan mekanisme distribusi lokal `.obmap/plugins/` maupun direktori resmi.

---

## 1. Struktur Direktori Plugin Standar

```text
my-obmap-citation-helper/
├── manifest.json          # Identitas plugin, versi minimum SDK, & permission manifest
├── src/
│   ├── index.ts           # Lifecycle activate(ctx) & deactivate()
│   └── styles.css         # Scoped CSS opsional untuk UI iframe plugin
└── package.json           # Dependensi @obmap/sdk (types & mock test harness)
```

### Contoh Spesifikasi `manifest.json`
```json
{
  "id": "org.scholar.citation-helper",
  "name": "Academic Citation Helper",
  "version": "1.0.0",
  "minObMapVersion": "2.0.0",
  "entry": "dist/index.js",
  "permissions": ["ui:only", "vault:read", "metadata:read"],
  "extensionPoints": ["CommandRegistry", "WorkspaceViewRegistry", "ConfigSectionRegistry"]
}
```

---

## 2. Pola Lifecycle `activate(ctx)` & Registrasi Aman

Semua ekstensi pihak ketiga berinteraksi melalui objek `PluginContext` terisolasi (`ctx`) yang hanya membuka endpoint sesuai daftar `permissions` pada `manifest.json`:

1. **Daftarkan Perintah Command Palette (`CommandRegistry`):**
   - Panggil `ctx.commands.register({ id, title, shortcut, run })` untuk muncul pada Command Palette Workspace `/app`.
2. **Daftarkan Section Pengaturan Terisolasi (`ConfigSectionRegistry`):**
   - Panggil `ctx.settings.registerSection({ schema })` dengan definisi skema deklaratif (memanfaatkan fondasi `configRegistry.ts` & `schemaRegistry.ts`) sehingga ObMap secara otomatis merender UI yang tunduk pada **6-Layer Config & Org-Lock**.
3. **Bersihkan Resource di `deactivate()`:**
   - Daftarkan listener ke `ctx.subscriptions` agar saat plugin dinonaktifkan atau di-reload tidak meninggalkan *memory leak* pada Worker maupun tab aktif.

---

## 3. Pengujian Lokal & Siklus Distribusi
1. **Local Vault Testing (`.obmap/plugins/<plugin-id>/`):** Pengembang dapat memuat paket lokal pada Local Vault (`FileSystemService.ts`) dalam mode developer tanpa menunggu publikasi.
2. **Community Directory & Verification:** Plugin publik harus menyertakan repositori sumber terbuka, melewati pemeriksaan izin statis (*Permission Audit*), dan tidak meminta izin lebih luas dari fitur yang dijalankan.
3. **Enterprise Governance (`Team / Academic`):** Administrator organisasi pada `/admin` dapat mengaktifkan mode **Enterprise Allowlist** agar anggota tim hanya dapat mengaktifkan plugin yang telah diaudit secara internal.

---

## Terkait
- [Portal Pengembang (`README.md`)](README.md)
- [Referensi 12 Extension Points (`extension-points-reference.md`)](extension-points-reference.md)
- [Model Keamanan Sandbox (`security-and-sandbox.md`)](security-and-sandbox.md)
