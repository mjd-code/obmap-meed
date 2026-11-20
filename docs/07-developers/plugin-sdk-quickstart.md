---
id: DOC-DEV-001
title: Quickstart Membangun Plugin Pertama dengan `@app/sdk`
type: developer
status: [PLANNED]
owner: Developer Ecosystem Lead
version: 2.2.0
last_reviewed: 2026-11-20
audience: engineering
related:
  - DOC-DEV-000
  - DOC-DEV-002
  - DOC-DEV-004
  - DOC-ARCH-004
  - DOC-ARCH-ADR-0012
source_of_truth: src/domains/settings/shared/api/pluginRegistry.ts, src/domains/workspace/CommandRegistry.ts
---

# Quickstart Membangun Plugin Pertama dengan `@app/sdk`

## Ringkasan 3 Baris
- Panduan langkah demi langkah membuat ekstensi atau konektor riset/AI pertama memakai **`@app/sdk`** tanpa menyentuh kode sumber inti `src/`.
- Menjelaskan struktur paket (`manifest.json`, lifecycle `activate(ctx)`/`deactivate()`) serta penyimpanan terpusat konfigurasi plugin ke dalam blok **`extensions`** pada berkas tunggal **`.app/config.json`**.
- Menetapkan standar pemuatan lokal di **`.app/plugins/`** (dengan kompatibilitas pembacaan legacy dari `.vk/plugins/` dan `.obmap/plugins/`) serta integrasi ke **`Deep Explorer`** (4 lensa visual) dan *Workspace Modes* (`Atlas`, `Studio`, `Academy`, `Freeform`).

---

## 1. Struktur Direktori Plugin Standar

```text
my-app-citation-helper/
├── manifest.json          # Identitas plugin, versi minimum engine, & permission manifest
├── src/
│   ├── index.ts           # Lifecycle activate(ctx) & deactivate()
│   └── styles.css         # Scoped CSS opsional untuk UI iframe plugin
└── package.json           # Dependensi @app/sdk (aliased ke brand.sdkPackageName / legacy @vk/sdk)
```

### Contoh Spesifikasi `manifest.json`
```json
{
  "id": "org.scholar.citation-helper",
  "name": "Academic Citation & PDF Helper",
  "version": "1.0.0",
  "minEngineVersion": "2.0.0",
  "entry": "dist/index.js",
  "permissions": ["ui:only", "vault:read", "metadata:read"],
  "extensionPoints": ["CommandRegistry", "WorkspaceViewRegistry", "ConfigSectionRegistry", "FrontmatterSchemaProvider"]
}
```

---

## 2. Pola Lifecycle `activate(ctx)` & Sentralisasi `.app/config.json`

Semua ekstensi pihak ketiga berinteraksi melalui objek `PluginContext` terisolasi (`ctx`) sesuai daftar `permissions` di `manifest.json`:

1. **Daftarkan Perintah Command Palette (`CommandRegistry`):**
   - Panggil `ctx.commands.register({ id, title, shortcut, run })` untuk muncul pada Command Palette Workspace `/app` dan menu cepat **`Deep Explorer`**.
2. **Daftarkan Section Pengaturan ke Blok `extensions` (`.app/config.json`):**
   - Panggil `ctx.settings.registerSection({ schema })` dengan definisi skema deklaratif (`configRegistry.ts` & `schemaRegistry.ts`). Sistem otomatis menyimpannya pada `extensions.plugin_configs.<plugin-id>` di dalam **`.app/config.json`** (dilarang membuat berkas `setting.json` / `preset.json` terpisah) serta tunduk pada **6-Layer Config & Org-Lock**.
3. **Kaitkan Konteks Workspace Mode & AI:**
   - Plugin riset/sitasi dapat mengekspos aksi kontekstual di mode `Atlas`, `Studio`, `Academy`, maupun `Freeform`, serta berkoordinasi dengan preferensi *BYO-AI / Local AI* (Ollama/WebLLM/BYOK) milik pengguna melalui API host yang disetujui.
4. **Bersihkan Resource di `deactivate()`:**
   - Daftarkan listener ke `ctx.subscriptions` agar penonaktifan atau reload tidak meninggalkan *memory leak* pada Worker maupun tab aktif.

---

## 3. Pengujian Lokal & Siklus Distribusi
1. **Local Vault Testing (`.app/plugins/<plugin-id>/` | fallback `.vk/plugins/` & `.obmap/plugins/`):** Pengembang memuat paket lokal pada *Local Vault* (`FileSystemService.ts`) tanpa menunggu publikasi.
2. **Community Presets & Directory (`template`):** Paket konfigurasi preset yang hanya menyetel `.app/config.json` dapat dibagikan langsung sebagai *Presentation Lens `template`* di `/explore` (**`Community Presets → Core Presets`**).
3. **Enterprise Governance (`Team / Academic`):** Administrator organisasi dapat mengaktifkan mode **Enterprise Allowlist** agar anggota hanya menjalankan plugin terverifikasi.

---

## Terkait
- [Portal Pengembang (`README.md`)](README.md)
- [Referensi 12 Extension Points (`extension-points-reference.md`)](extension-points-reference.md)
- [Skema Sentral `.app/config.json`](../03-architecture/data-and-storage.md)
- [Model Keamanan Sandbox (`security-and-sandbox.md`)](security-and-sandbox.md)
