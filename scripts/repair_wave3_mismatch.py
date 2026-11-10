#!/usr/bin/env python3
"""
repair_wave3_mismatch.py

Perbaikan otomatis untuk:
1. Menambahkan re-export useUIStore, useNodeStore, useVaultStore, dsb. ke src/global/stores/index.ts
2. Mengekspor Node & Link dari src/domains/graph/shared/utils/graph.types.ts
3. Memperbaiki URL Web Worker di src/domains/metadata/shared/hooks/useUnlinkedMentions.ts
4. Membersihkan sisa import legacy vault/graph stores
5. Memverifikasi build Vite secara otomatis
"""

import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

def fix_global_stores_index():
    path = SRC / "global" / "stores" / "index.ts"
    print(f"-> Memperbaiki {path.relative_to(ROOT)}...")
    content = """/**
 * Global stores & cross-domain state facade
 */
export * from "./events";
export * from "./useStatusNoticeStore";

// Re-export domain stores untuk modul yang mengimpor dari @/global/stores
export { useUIStore } from "@/domains/workspace/shared/stores/useUIStore";
export { useNodeStore } from "@/domains/graph/shared/stores/useNodeStore";
export { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
export { useGraphStore } from "@/domains/graph/shared/stores/useGraphStore";
export { useOfflineStore } from "@/domains/sync/shared/stores/useOfflineStore";

// Re-export core graph types
export type { Node, Link, GraphData, Backlink, SaveStatus } from "@/global/types/graph.types";
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("  ✓ src/global/stores/index.ts berhasil diperbarui.")

def fix_graph_types():
    path = SRC / "domains" / "graph" / "shared" / "utils" / "graph.types.ts"
    print(f"-> Memperbaiki ekspor Node di {path.relative_to(ROOT)}...")
    if not path.exists():
        print(f"  ❌ File tidak ditemukan: {path}")
        return
    text = path.read_text(encoding="utf-8")
    old_import = "import type { Link, Node } from '@/global/types/graph.types';"
    new_export = "export type { Link, Node, GraphData, Backlink, SaveStatus } from '@/global/types/graph.types';"
    
    if old_import in text:
        text = text.replace(old_import, new_export)
        path.write_text(text, encoding="utf-8")
        print("  ✓ Node & Link berhasil diekspor dari graph.types.ts.")
    elif "export type { Link, Node" in text or "export * from '@/global/types/graph.types'" in text:
        print("  ✓ Node sudah diekspor di graph.types.ts.")
    else:
        text = new_export + "\n" + text
        path.write_text(text, encoding="utf-8")
        print("  ✓ Ekspor Node ditambahkan ke bagian atas graph.types.ts.")

def fix_unlinked_mentions_worker():
    path = SRC / "domains" / "metadata" / "shared" / "hooks" / "useUnlinkedMentions.ts"
    print(f"-> Memperbaiki path Web Worker di {path.relative_to(ROOT)}...")
    if not path.exists():
        print(f"  ❌ File tidak ditemukan: {path}")
        return
    text = path.read_text(encoding="utf-8")
    old_worker_url = '"../mentions.worker.ts"'
    new_worker_url = '"../api/mentions.worker.ts"'
    
    if old_worker_url in text:
        text = text.replace(old_worker_url, new_worker_url)
        path.write_text(text, encoding="utf-8")
        print("  ✓ Path Web Worker useUnlinkedMentions.ts diarahkan ke ../api/mentions.worker.ts.")
    else:
        print("  ✓ Path Web Worker sudah sesuai atau tidak memerlukan perubahan.")

def fix_legacy_store_references():
    print("-> Memperbaiki sisa referensi path legacy di file aktif...")
    replacements = [
        (r'@/domains/vault/stores/useVaultStore', r'@/domains/vault/shared/stores/useVaultStore'),
        (r'@/domains/graph/stores/useGraphStore', r'@/domains/graph/shared/stores/useGraphStore'),
        (r'@/domains/graph/stores/useNodeStore', r'@/domains/graph/shared/stores/useNodeStore'),
        (r'@/domains/vault/services/VaultManager', r'@/domains/vault/shared/api/VaultManager'),
    ]
    import re
    updated = 0
    for ext in ("*.ts", "*.tsx"):
        for p in SRC.rglob(ext):
            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                continue
            orig = content
            for pat, rep in replacements:
                content = re.sub(pat, rep, content)
            if content != orig:
                p.write_text(content, encoding="utf-8")
                updated += 1
    print(f"  ✓ {updated} file diperbarui referensi path store-nya.")

def verify_build():
    print("\n--- Verifikasi Build Vite ---")
    res = subprocess.run(["bunx", "vite", "build", "--mode", "development"], capture_output=True, text=True)
    if res.returncode == 0:
        print("  ✓ VITE BUILD 100% SUKSES! Aplikasi sudah berjalan normal.")
    else:
        print("  ❌ Build masih menemukan error:")
        print(res.stderr[-1000:] if res.stderr else res.stdout[-1000:])

if __name__ == "__main__":
    print("=" * 65)
    print("REPAIR WAVE 3 MISMATCH & EXPORT FIXES")
    print("=" * 65)
    fix_global_stores_index()
    fix_graph_types()
    fix_unlinked_mentions_worker()
    fix_legacy_store_references()
    verify_build()
    print("=" * 65)