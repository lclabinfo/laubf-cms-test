#!/usr/bin/env python3
"""
Parse laubf_laubfmaterial.sql and generate TypeScript seed data for BibleStudy entries.
Filters to mtype='Sunday' entries only for the output, but prints summary of all entries.
"""

import re
import sys
from collections import Counter

SQL_FILE = "/Users/davidlim/Desktop/laubf-cms-test/00_old_laubf_db_dump/laubf_laubfmaterial.sql"
OUTPUT_FILE = "/Users/davidlim/Desktop/laubf-cms-test/scripts/parsed-laubfmaterial.ts"

# Mapping from SQL bname values to Prisma BibleBook enum
BNAME_TO_ENUM = {
    "Genesis": "GENESIS",
    "Exodus": "EXODUS",
    "Leviticus": "LEVITICUS",
    "Numbers": "NUMBERS",
    "Deuteronomy": "DEUTERONOMY",
    "Joshua": "JOSHUA",
    "Judges": "JUDGES",
    "Ruth": "RUTH",
    "1Samuel": "FIRST_SAMUEL",
    "2Samuel": "SECOND_SAMUEL",
    "1Kings": "FIRST_KINGS",
    "2Kings": "SECOND_KINGS",
    "1Chronicles": "FIRST_CHRONICLES",
    "2Chronicles": "SECOND_CHRONICLES",
    "Nehemiah": "NEHEMIAH",
    "Neh": "NEHEMIAH",
    "Job": "JOB",
    "Psalm": "PSALMS",
    "Psalms": "PSALMS",
    "Proverbs": "PROVERBS",
    "Ecclesiastes": "ECCLESIASTES",
    "Isaiah": "ISAIAH",
    "Ezekiel": "EZEKIEL",
    "Daniel": "DANIEL",
    "Amos": "AMOS",
    "Micah": "MICAH",
    "Haggai": "HAGGAI",
    "Zechariah": "ZECHARIAH",
    "Malachi": "MALACHI",
    "Matthew": "MATTHEW",
    "Mathew": "MATTHEW",
    "Mattew": "MATTHEW",
    "Mark": "MARK",
    "Luke": "LUKE",
    "Lk": "LUKE",
    "John": "JOHN",
    "Acts": "ACTS",
    "Romans": "ROMANS",
    "1Corinthians": "FIRST_CORINTHIANS",
    "2Corinthians": "SECOND_CORINTHIANS",
    "Galatians": "GALATIANS",
    "Ephesians": "EPHESIANS",
    "Philippians": "PHILIPPIANS",
    "Colossians": "COLOSSIANS",
    "1Thessalonians": "FIRST_THESSALONIANS",
    "2Thessalonians": "SECOND_THESSALONIANS",
    "2Timothy": "SECOND_TIMOTHY",
    "Titus": "TITUS",
    "Hebrew": "HEBREWS",
    "Hebrews": "HEBREWS",
    "James": "JAMES",
    "1Peter": "FIRST_PETER",
    "1Pe": "FIRST_PETER",
    "2Peter": "SECOND_PETER",
    "1John": "FIRST_JOHN",
    "2John": "SECOND_JOHN",
    "3John": "THIRD_JOHN",
    "Jude": "JUDE",
    "Revelation": "REVELATION",
    "1Samuel.": "FIRST_SAMUEL",
    "Esther": "ESTHER",
    "Ezra": "EZRA",
    "Habakkuk": "HABAKKUK",
    "Hosea": "HOSEA",
    "Jeremiah": "JEREMIAH",
    "Joel": "JOEL",
    "Jonah": "JONAH",
    "Lamentations": "LAMENTATIONS",
    "Nahum": "NAHUM",
    "Obadiah": "OBADIAH",
    "Song": "SONG_OF_SOLOMON",
    "Zephaniah": "ZEPHANIAH",
    "Based": None,  # Not a real Bible book
    "Introduction": None,  # Not a real Bible book
    "Special": None,  # Not a real Bible book
}


def make_slug(title: str) -> str:
    """Convert title to URL-friendly slug."""
    slug = title.lower()
    # Replace non-alphanumeric chars with hyphens
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    # Remove leading/trailing hyphens
    slug = slug.strip("-")
    return slug


def parse_sql_value(s: str, pos: int):
    """Parse a single SQL value starting at pos. Returns (value, next_pos)."""
    if pos >= len(s):
        return None, pos

    ch = s[pos]

    # NULL
    if s[pos : pos + 4] == "NULL":
        return None, pos + 4

    # Quoted string
    if ch == "'":
        pos += 1  # skip opening quote
        result = []
        while pos < len(s):
            if s[pos] == "\\" and pos + 1 < len(s):
                # Escaped character
                result.append(s[pos + 1])
                pos += 2
            elif s[pos] == "'":
                pos += 1  # skip closing quote
                break
            else:
                result.append(s[pos])
                pos += 1
        return "".join(result), pos

    # Number
    if ch == "-" or ch.isdigit():
        end = pos
        while end < len(s) and (s[end].isdigit() or s[end] == "-" or s[end] == "."):
            end += 1
        val = s[pos:end]
        try:
            return int(val), end
        except ValueError:
            return float(val), end

    return None, pos + 1


def parse_row(s: str, pos: int):
    """Parse one (val,val,...) row. Returns (list_of_values, next_pos)."""
    if pos >= len(s) or s[pos] != "(":
        return None, pos

    pos += 1  # skip (
    values = []

    while pos < len(s):
        # Skip whitespace
        while pos < len(s) and s[pos] == " ":
            pos += 1

        if pos < len(s) and s[pos] == ")":
            pos += 1  # skip )
            return values, pos

        val, pos = parse_sql_value(s, pos)
        values.append(val)

        # Skip comma between values
        while pos < len(s) and s[pos] == " ":
            pos += 1
        if pos < len(s) and s[pos] == ",":
            pos += 1

    return values, pos


def parse_all_rows(content: str):
    """Find the INSERT statement and parse all rows from it."""
    # Find the INSERT INTO line
    insert_match = re.search(r"INSERT INTO `laubfmaterial` VALUES\s*", content)
    if not insert_match:
        print("ERROR: Could not find INSERT statement", file=sys.stderr)
        sys.exit(1)

    pos = insert_match.end()
    rows = []

    while pos < len(content):
        # Skip whitespace and commas between rows
        while pos < len(content) and content[pos] in (" ", ",", "\n", "\r", "\t"):
            pos += 1

        if pos >= len(content) or content[pos] == ";":
            break

        if content[pos] == "(":
            row, pos = parse_row(content, pos)
            if row is not None:
                rows.append(row)
        else:
            break

    return rows


def escape_ts_string(s: str) -> str:
    """Escape a string for use in TypeScript template literal or double-quoted string."""
    if s is None:
        return ""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main():
    with open(SQL_FILE, "r") as f:
        content = f.read()

    rows = parse_all_rows(content)
    print(f"Total entries parsed: {len(rows)}")

    # Column indices based on CREATE TABLE:
    # 0: no, 1: bcode, 2: title, 3: mtype, 4: mdate, 5: passage,
    # 6: bname, 7: from_chapter, 8: to_chapter,
    # 9: doctype1, 10: doctype2, 11: doctype3, 12: doctype4,
    # 13: filename1, 14: filename2, 15: filename3, 16: filename4,
    # 17: fileurl1, 18: fileurl2, 19: fileurl3, 20: fileurl4,
    # 21: msgurl

    # Summary: entries by mtype
    mtype_counts = Counter()
    bnames = set()
    dates = []

    for row in rows:
        mtype = row[3] if row[3] else ""
        mtype_counts[mtype] += 1
        bname = row[6] if row[6] else ""
        if bname:
            bnames.add(bname)
        mdate = row[4] if row[4] else ""
        if mdate:
            dates.append(mdate)

    print(f"\nEntries by mtype:")
    for mtype, count in sorted(mtype_counts.items(), key=lambda x: -x[1]):
        label = mtype if mtype else "(empty)"
        print(f"  {label}: {count}")

    dates_sorted = sorted(dates)
    print(f"\nDate range: {dates_sorted[0]} to {dates_sorted[-1]}")
    print(f"\nUnique bname values ({len(bnames)}):")
    for b in sorted(bnames):
        mapped = BNAME_TO_ENUM.get(b, "UNMAPPED")
        print(f"  {b} -> {mapped}")

    # Filter to Sunday entries only
    sunday_rows = [r for r in rows if r[3] == "Sunday"]
    print(f"\nSunday entries: {len(sunday_rows)}")

    # Build TypeScript output
    ts_entries = []

    # Track slugs for deduplication
    slug_counts = Counter()

    for row in sunday_rows:
        no = row[0]
        title = row[2] if row[2] else ""
        mdate = row[4] if row[4] else ""
        passage = row[5] if row[5] else ""
        bname = row[6] if row[6] else ""

        # Map bname to enum
        book_enum = BNAME_TO_ENUM.get(bname)
        if book_enum is None and bname:
            print(f"  WARNING: Unmapped bname '{bname}' for no={no}, title='{title}'", file=sys.stderr)
            continue

        # Create slug
        slug = make_slug(title)
        slug_counts[slug] += 1
        if slug_counts[slug] > 1:
            slug = f"{slug}-{slug_counts[slug]}"

        # Convert date
        date_for = mdate.replace("/", "-") if mdate else ""

        # Fix passage: replace ~ with -
        passage_fixed = passage.replace("~", "-") if passage else ""

        # Collect attachments
        attachments = []
        for i in range(4):
            doctype = row[9 + i]
            filename = row[13 + i]
            fileurl = row[17 + i]

            if filename and fileurl and filename.strip() and fileurl.strip():
                # Map doctype to attachment type
                att_type = "DOCX"  # All are doc/docx files
                attachments.append({
                    "name": filename.strip(),
                    "url": fileurl.strip(),
                    "type": att_type,
                })

        # Build entry
        att_str = ""
        if attachments:
            att_parts = []
            for att in attachments:
                att_parts.append(
                    f'{{ name: "{escape_ts_string(att["name"])}", '
                    f'url: "{escape_ts_string(att["url"])}", '
                    f'type: "{att["type"]}" }}'
                )
            att_str = f"[{', '.join(att_parts)}]"
        else:
            att_str = "[]"

        book_str = f'"{book_enum}"' if book_enum else "null"

        entry = (
            f"  {{ "
            f'legacyId: {no}, '
            f'slug: "{escape_ts_string(slug)}", '
            f'title: "{escape_ts_string(title)}", '
            f"book: {book_str}, "
            f'passage: "{escape_ts_string(passage_fixed)}", '
            f'dateFor: "{date_for}", '
            f'series: "Sunday Service", '
            f"attachments: {att_str}"
            f" }}"
        )
        ts_entries.append(entry)

    # Write TypeScript file
    joined_entries = ",\n".join(ts_entries)
    ts_content = (
        f"// Auto-generated from laubf_laubfmaterial.sql\n"
        f"// Total entries in SQL: {len(rows)}\n"
        f"// Sunday entries (included below): {len(ts_entries)}\n"
        f"// Date range: {dates_sorted[0]} to {dates_sorted[-1]}\n"
        f"// Generated by scripts/parse-laubfmaterial.py\n"
        f"\n"
        f"type BibleStudySeed = {{\n"
        f"  legacyId: number;\n"
        f"  slug: string;\n"
        f"  title: string;\n"
        f"  book: string | null;\n"
        f"  passage: string;\n"
        f"  dateFor: string;\n"
        f"  series: string;\n"
        f"  attachments: {{ name: string; url: string; type: string }}[];\n"
        f"}};\n"
        f"\n"
        f"const BIBLE_STUDIES_FROM_MATERIAL: BibleStudySeed[] = [\n"
        f"{joined_entries},\n"
        f"];\n"
        f"\n"
        f"export default BIBLE_STUDIES_FROM_MATERIAL;\n"
    )

    with open(OUTPUT_FILE, "w") as f:
        f.write(ts_content)

    print(f"\nOutput written to {OUTPUT_FILE}")
    print(f"Total TypeScript entries: {len(ts_entries)}")


if __name__ == "__main__":
    main()
