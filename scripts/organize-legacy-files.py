#!/usr/bin/env python3
"""
Organize legacy bible study files from a flat directory into per-entry slug-based folders.

Reads scripts/parsed-laubfmaterial.ts, extracts slug -> attachments mapping,
copies files from legacy-files/ to public/legacy-files/{slug}/, and generates
a JSON mapping file at scripts/legacy-file-map.json.
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = PROJECT_ROOT / "legacy-files"
DEST_DIR = PROJECT_ROOT / "public" / "legacy-files"
TS_FILE = PROJECT_ROOT / "scripts" / "parsed-laubfmaterial.ts"
MAP_FILE = PROJECT_ROOT / "scripts" / "legacy-file-map.json"


def parse_ts_entries(ts_path: Path) -> list[dict]:
    """Parse the TypeScript file and extract bible study entries."""
    content = ts_path.read_text(encoding="utf-8")

    # Match each entry object: { legacyId: ..., slug: "...", ... attachments: [...] }
    # We'll use a regex to extract each entry line
    entry_pattern = re.compile(
        r'\{\s*legacyId:\s*(\d+),\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]*)".*?attachments:\s*\[(.*?)\]\s*\}',
        re.DOTALL,
    )

    attachment_pattern = re.compile(
        r'\{\s*name:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*type:\s*"([^"]+)"\s*\}'
    )

    entries = []
    for m in entry_pattern.finditer(content):
        legacy_id = int(m.group(1))
        slug = m.group(2)
        title = m.group(3)
        attachments_str = m.group(4)

        attachments = []
        for am in attachment_pattern.finditer(attachments_str):
            attachments.append({
                "name": am.group(1),
                "url": am.group(2),
                "type": am.group(3),
            })

        entries.append({
            "legacyId": legacy_id,
            "slug": slug,
            "title": title,
            "attachments": attachments,
        })

    return entries


def main():
    if not SOURCE_DIR.exists():
        print(f"ERROR: Source directory not found: {SOURCE_DIR}")
        sys.exit(1)

    if not TS_FILE.exists():
        print(f"ERROR: TypeScript file not found: {TS_FILE}")
        sys.exit(1)

    print(f"Parsing {TS_FILE}...")
    entries = parse_ts_entries(TS_FILE)
    print(f"Found {len(entries)} bible study entries")

    # Build a set of available source files (case-sensitive)
    source_files = set(os.listdir(SOURCE_DIR))
    print(f"Found {len(source_files)} files in {SOURCE_DIR}")

    # Stats
    dirs_created = 0
    files_copied = 0
    files_missing = []
    files_skipped_no_attachments = 0
    mapping = {}

    for entry in entries:
        slug = entry["slug"]
        legacy_id = str(entry["legacyId"])
        attachments = entry["attachments"]

        if not attachments:
            files_skipped_no_attachments += 1
            mapping[legacy_id] = {"slug": slug, "files": []}
            continue

        dest_slug_dir = DEST_DIR / slug
        dir_was_created = False

        file_entries = []
        for att in attachments:
            filename = att["name"]

            if filename not in source_files:
                files_missing.append({"slug": slug, "legacyId": legacy_id, "filename": filename})
                continue

            # Create directory only if we have at least one file to copy
            if not dir_was_created:
                dest_slug_dir.mkdir(parents=True, exist_ok=True)
                dirs_created += 1
                dir_was_created = True

            src_path = SOURCE_DIR / filename
            dst_path = dest_slug_dir / filename

            shutil.copy2(str(src_path), str(dst_path))
            files_copied += 1

            file_entries.append({
                "name": filename,
                "localPath": f"/legacy-files/{slug}/{filename}",
            })

        mapping[legacy_id] = {"slug": slug, "files": file_entries}

    # Write mapping file
    MAP_FILE.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nMapping file written to {MAP_FILE}")

    # Report
    print("\n=== SUMMARY ===")
    print(f"Total entries processed: {len(entries)}")
    print(f"Directories created:     {dirs_created}")
    print(f"Files copied:            {files_copied}")
    print(f"Entries with no attachments: {files_skipped_no_attachments}")
    print(f"Missing files:           {len(files_missing)}")

    if files_missing:
        print("\n=== MISSING FILES ===")
        for mf in files_missing:
            print(f"  [{mf['legacyId']}] {mf['slug']} -> {mf['filename']}")


if __name__ == "__main__":
    main()
