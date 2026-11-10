#!/usr/bin/env python3
"""
Script: convert_imports_to_alias.py
Deskripsi:
  1. Menghapus 15 file legacy/stale yang tertinggal pasca restrukturisasi Wave 3.
  2. Mengonversi seluruh relative import (./, ../) di src/ menjadi alias @/.
  3. Memvalidasi bahwa setiap import @/ benar-benar ada di disk.
  4. Menjalankan typecheck TypeScript dan build Vite untuk memastikan 100% bersih.
"""

import os
import re
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"

# 1. Daftar file legacy/stale duplikat yang sudah digantikan oleh file ber-prefix domain
STALE_FILES = [
    SRC_DIR / "domains/editor/components/MarkdownView.tsx",
    SRC_DIR / "domains/graph/components/MarkdownRenderer.tsx",
    SRC_DIR / "domains/graph/components/NodePanel.tsx",
    SRC_DIR / "domains/graph/components/FolderOverviewEditor.tsx",
    SRC_DIR / "domains/vault/types.ts",
    SRC_DIR / "domains/vault/components/ExportToFileSystem.tsx",
    SRC_DIR / "domains/workspace/WorkspaceRoot.tsx",
    SRC_DIR / "domains/workspace/components/SidebarPanel.tsx",
    SRC_DIR / "domains/workspace/components/StatusBar.tsx",
    SRC_DIR / "domains/workspace/components/VaultAccessDenied.tsx",
    SRC_DIR / "domains/workspace/components/Ribbon.tsx",
    SRC_DIR / "domains/workspace/components/TabContextMenu.tsx",
    SRC_DIR / "domains/workspace/components/IconRibbon.tsx",
    SRC_DIR / "domains/workspace/components/ImportExportPanel.tsx",
    SRC_DIR / "domains/editor/types.ts",
]

def clean_stale_files():
    print("=" * 60)
    print("STEP 1: Membersihkan file stale/legacy duplikat...")
    print("=" * 60)
    removed = 0
    for path in STALE_FILES:
        if path.exists():
            path.unlink()
            print(f"  [DELETED] {path.relative_to(PROJECT_ROOT)}")
            removed += 1
    print(f"Total file stale dibersihkan: {removed}\n")

def convert_relative_imports():
    print("=" * 60)
    print("STEP 2: Mengonversi relative imports ke alias @/...")
    print("=" * 60)

    # Regex linear untuk mendeteksi import/export relatif (tanpa catastrophic backtracking)
    from_pattern = re.compile(r"""(\bfrom\s+["\x27])(\.[^"\x27]+)(["\x27])""")
    bare_import_pattern = re.compile(r"""(\bimport\s+["\x27])(\.[^"\x27]+)(["\x27])""")
    dynamic_pattern = re.compile(r"""(\bimport\s*\(\s*["\x27])(\.[^"\x27]+)(["\x27]\s*\))""")

    converted_count = 0
    modified_files = 0

    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if not f.endswith((".ts", ".tsx")):
                continue
            file_path = Path(root) / f
            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"  [ERROR READ] {file_path}: {e}")
                continue

            file_converted = 0

            def replace_to_alias(match):
                nonlocal file_converted
                prefix = match.group(1)
                rel_import = match.group(2)
                suffix = match.group(3)

                # Abaikan Vite worker URL instantiation (e.g. new URL("../api/...", import.meta.url))
                target_path = (file_path.parent / rel_import).resolve()

                try:
                    rel_to_src = target_path.relative_to(SRC_DIR)
                    alias_import = "@/" + rel_to_src.as_posix()
                    file_converted += 1
                    return f"{prefix}{alias_import}{suffix}"
                except ValueError:
                    # Di luar src/ (misal root), biarkan
                    return match.group(0)

            new_content = from_pattern.sub(replace_to_alias, content)
            new_content = bare_import_pattern.sub(replace_to_alias, new_content)
            new_content = dynamic_pattern.sub(replace_to_alias, new_content)

            if new_content != content:
                file_path.write_text(new_content, encoding="utf-8")
                modified_files += 1
                converted_count += file_converted
                print(f"  [UPDATED] {file_path.relative_to(PROJECT_ROOT)} ({file_converted} imports)")

    print(f"\nSelesai: {converted_count} import di {modified_files} file berhasil diubah ke @/\n")

def verify_all_imports():
    print("=" * 60)
    print("STEP 3: Memvalidasi seluruh alias @/ di disk...")
    print("=" * 60)

    import_re = re.compile(r"""(?:from|import)\s+["\x27](@/[^"\x27]+)["\x27]""")
    broken = []
    total_checked = 0

    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if not f.endswith((".ts", ".tsx")):
                continue
            p = Path(root) / f
            txt = p.read_text(encoding="utf-8", errors="ignore")
            for m in import_re.finditer(txt):
                total_checked += 1
                alias = m.group(1)
                target_base = str(SRC_DIR / alias[2:])
                candidates = [
                    target_base,
                    target_base + ".ts",
                    target_base + ".tsx",
                    target_base + ".d.ts",
                    os.path.join(target_base, "index.ts"),
                    os.path.join(target_base, "index.tsx"),
                    target_base + ".css",
                    target_base + ".json",
                ]
                if not any(os.path.exists(c) for c in candidates):
                    broken.append((str(p.relative_to(PROJECT_ROOT)), alias))

    print(f"Total import alias dicek: {total_checked}")
    if broken:
        print(f"[PERINGATAN] Ditemukan {len(broken)} import rusak:")
        for file_rel, imp in broken:
            print(f"  - {file_rel} -> {imp}")
    else:
        print("SEMUA IMPORT VALID (0 broken imports)!\n")
    return len(broken) == 0

def run_checks():
    print("=" * 60)
    print("STEP 4: Menjalankan Typecheck dan Build...")
    print("=" * 60)

    print("Running: npx tsc --noEmit...")
    res_tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=PROJECT_ROOT)
    if res_tsc.returncode != 0:
        print("TypeScript check GAGAL. Periksa error di atas.")
        sys.exit(1)
    print("TypeScript check BERHASIL (0 errors)!\n")

    print("Running: npx vite build...")
    res_vite = subprocess.run(["npx", "vite", "build"], cwd=PROJECT_ROOT)
    if res_vite.returncode != 0:
        print("Vite build GAGAL. Periksa log di atas.")
        sys.exit(1)
    print("\nBUILD SUKSES 100%!")

if __name__ == "__main__":
    if not SRC_DIR.exists():
        print("Error: Direktori 'src' tidak ditemukan. Jalankan script ini di root repository.")
        sys.exit(1)

    clean_stale_files()
    convert_relative_imports()
    is_valid = verify_all_imports()
    if is_valid:
        run_checks()
    else:
        print("Ada import rusak yang perlu diperbaiki sebelum menjalankan build.")