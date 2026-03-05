#!/usr/bin/env python3
"""
Extract text content from legacy Bible study DOCX/DOC files.

For each Sunday entry in laubfmaterial:
- Identifies Question, Note, and Message files from doctype1-4 slots
- Converts files to plain text using macOS textutil
- Outputs a JSON file mapping legacyId -> { questions, answers, transcript }
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter

SQL_FILE = "00_old_laubf_db_dump/laubf_laubfmaterial.sql"
LEGACY_DIR = "legacy-files"
OUTPUT_FILE = "scripts/bible-study-content.json"


def parse_sql_value(s, pos):
    if pos >= len(s):
        return None, pos
    ch = s[pos]
    if s[pos : pos + 4] == "NULL":
        return None, pos + 4
    if ch == "'":
        pos += 1
        result = []
        while pos < len(s):
            if s[pos] == "\\" and pos + 1 < len(s):
                result.append(s[pos + 1])
                pos += 2
            elif s[pos] == "'":
                pos += 1
                break
            else:
                result.append(s[pos])
                pos += 1
        return "".join(result), pos
    if ch == "-" or ch.isdigit():
        end = pos
        while end < len(s) and (s[end].isdigit() or s[end] in "-."):
            end += 1
        val = s[pos:end]
        try:
            return int(val), end
        except ValueError:
            return float(val), end
    return None, pos + 1


def parse_row(s, pos):
    if pos >= len(s) or s[pos] != "(":
        return None, pos
    pos += 1
    values = []
    while pos < len(s):
        while pos < len(s) and s[pos] == " ":
            pos += 1
        if pos < len(s) and s[pos] == ")":
            pos += 1
            return values, pos
        val, pos = parse_sql_value(s, pos)
        values.append(val)
        while pos < len(s) and s[pos] == " ":
            pos += 1
        if pos < len(s) and s[pos] == ",":
            pos += 1
    return values, pos


def parse_all_rows(content):
    insert_match = re.search(r"INSERT INTO `laubfmaterial` VALUES\s*", content)
    if not insert_match:
        print("ERROR: Could not find INSERT statement", file=sys.stderr)
        sys.exit(1)
    pos = insert_match.end()
    rows = []
    while pos < len(content):
        while pos < len(content) and content[pos] in " ,\n\r\t":
            pos += 1
        if pos >= len(content) or content[pos] == ";":
            break
        if content[pos] == "(":
            row, pos = parse_row(content, pos)
            if row:
                rows.append(row)
        else:
            break
    return rows


def extract_text_from_file(filepath):
    """Use macOS textutil to convert DOC/DOCX/RTF to plain text."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext not in (".doc", ".docx", ".rtf"):
        return None

    try:
        result = subprocess.run(
            ["textutil", "-convert", "txt", "-stdout", filepath],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            text = result.stdout.strip()
            # Clean up: remove excessive blank lines
            text = re.sub(r"\n{3,}", "\n\n", text)
            return text if text else None
        return None
    except (subprocess.TimeoutExpired, Exception) as e:
        print(f"  Error converting {filepath}: {e}", file=sys.stderr)
        return None


def main():
    with open(SQL_FILE, "r") as f:
        content = f.read()

    rows = parse_all_rows(content)
    print(f"Total entries: {len(rows)}")

    # Filter to Sunday entries
    sunday_rows = [r for r in rows if r[3] == "Sunday"]
    print(f"Sunday entries: {len(sunday_rows)}")

    # Column indices:
    # 0: no, 1: bcode, 2: title, 3: mtype, 4: mdate, 5: passage,
    # 6: bname, 7: from_chapter, 8: to_chapter,
    # 9: doctype1, 10: doctype2, 11: doctype3, 12: doctype4,
    # 13: filename1, 14: filename2, 15: filename3, 16: filename4,
    # 17: fileurl1, 18: fileurl2, 19: fileurl3, 20: fileurl4,
    # 21: msgurl

    content_map = {}
    stats = Counter()
    errors = []

    for idx, row in enumerate(sunday_rows):
        legacy_id = row[0]
        title = row[2] or ""

        if idx % 100 == 0:
            print(f"Processing {idx}/{len(sunday_rows)}... ({title[:50]})")

        questions_text = None
        answers_text = None
        transcript_text = None

        # Check all 4 doctype slots
        for i in range(4):
            doctype = str(row[9 + i] or "").strip()
            filename = str(row[13 + i] or "").strip()

            if not filename:
                continue

            filepath = os.path.join(LEGACY_DIR, filename)
            if not os.path.exists(filepath):
                stats["file_missing"] += 1
                errors.append(f"Missing: {filename} (legacyId={legacy_id})")
                continue

            text = extract_text_from_file(filepath)
            if not text:
                stats["extract_failed"] += 1
                continue

            if doctype == "Question":
                questions_text = text
                stats["questions_extracted"] += 1
            elif doctype == "Note":
                answers_text = text
                stats["answers_extracted"] += 1
            elif doctype == "Message":
                transcript_text = text
                stats["transcript_extracted"] += 1
            elif doctype == "Inductive":
                # Inductive questions are also study questions
                if not questions_text:
                    questions_text = text
                    stats["inductive_as_questions"] += 1
                else:
                    stats["inductive_skipped"] += 1

        # Also check msgurl for transcript
        msgurl = str(row[21] or "").strip()
        if msgurl and not transcript_text:
            # msgurl is typically a URL path, extract filename
            msg_filename = msgurl.split("/")[-1]
            msg_filepath = os.path.join(LEGACY_DIR, msg_filename)
            if os.path.exists(msg_filepath):
                text = extract_text_from_file(msg_filepath)
                if text:
                    transcript_text = text
                    stats["transcript_from_msgurl"] += 1

        if questions_text or answers_text or transcript_text:
            entry = {}
            if questions_text:
                entry["questions"] = questions_text
            if answers_text:
                entry["answers"] = answers_text
            if transcript_text:
                entry["transcript"] = transcript_text
            content_map[str(legacy_id)] = entry
            stats["entries_with_content"] += 1

    print(f"\n=== Extraction Summary ===")
    for key, count in sorted(stats.items()):
        print(f"  {key}: {count}")

    if errors[:10]:
        print(f"\nFirst 10 errors:")
        for e in errors[:10]:
            print(f"  {e}")

    # Write output
    with open(OUTPUT_FILE, "w") as f:
        json.dump(content_map, f, indent=None, ensure_ascii=False)
        # No indent to keep file size manageable

    file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"\nOutput: {OUTPUT_FILE} ({file_size_mb:.1f} MB)")
    print(f"Entries with content: {len(content_map)}")


if __name__ == "__main__":
    main()
