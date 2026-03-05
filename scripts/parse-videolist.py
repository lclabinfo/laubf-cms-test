#!/usr/bin/env python3
"""Parse laubf_videolist.sql and generate TypeScript seed data."""

from __future__ import annotations
import re
import sys

SQL_FILE = "/Users/davidlim/Desktop/laubf-cms-test/00_old_laubf_db_dump/laubf_videolist.sql"
OUTPUT_FILE = "/Users/davidlim/Desktop/laubf-cms-test/scripts/parsed-videolist.ts"

# Speaker name consolidation mapping
SPEAKER_MAP = {
    "William": "William",
    "William Larsen": "William Larsen",
    "Dr. Paul Lim": "Paul Lim",
    "Paul Lim": "Paul Lim",
    "Paul": "Paul",
    "Paul Im": "Paul Im",
    "Robert": "Robert Fishman",
    "Robert Fishman": "Robert Fishman",
    "John": "John Kwon",
    "John Kwon": "John Kwon",
    "David Park": "David Park",
    "David Park ": "David Park",
    "David Min": "David Min",
    "John Baik": "John Baik",
    "Jason Koch": "Jason Koch",
    "Troy Segale": "Troy Segale",
    "Moses Yoon": "Moses Yoon",
    "Ron Ward": "Ron Ward",
    "Augustine Kim": "Augustine Kim",
    "Juan Perez": "Juan Perez",
    "Terry Lopez": "Terry Lopez",
    "Frank Holman": "Frank Holman",
    "Daniel Shim": "Daniel Shim",
    "Peace Oh": "Peace Oh",
    "Isiah Pulido": "Isiah Pulido",
    "Andrew Cuevas": "Andrew Cuevas",
    "James Park": "James Park",
    "Timothy Cho": "Timothy Cho",
    "Joshua Lopez": "Joshua Lopez",
}


def normalize_speaker(name: str) -> str:
    """Normalize speaker name using the mapping, with whitespace stripping."""
    # Check exact match first (including trailing spaces)
    if name in SPEAKER_MAP:
        return SPEAKER_MAP[name]
    stripped = name.strip()
    if stripped in SPEAKER_MAP:
        return SPEAKER_MAP[stripped]
    return stripped


def extract_youtube_id(videonum: str) -> str | None:
    """Extract YouTube ID from various formats."""
    v = videonum.strip()

    # https://youtu.be/XXXXX
    m = re.match(r"https://youtu\.be/([A-Za-z0-9_-]+)", v)
    if m:
        return m.group(1)

    # https://youtube.com/live/XXXXX
    m = re.match(r"https://youtube\.com/live/([A-Za-z0-9_-]+)", v)
    if m:
        return m.group(1)

    # Pure numeric = old Vimeo/other platform IDs
    if re.match(r"^\d+$", v):
        return None

    # Plain YouTube ID (11 chars, alphanumeric + dash + underscore)
    if re.match(r"^[A-Za-z0-9_-]{11}$", v):
        return v

    # Fallback: if it looks like a short alphanumeric ID
    if re.match(r"^[A-Za-z0-9_-]+$", v) and len(v) <= 15:
        return v

    return None


def make_slug(title: str) -> str:
    """Create URL slug from title."""
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def parse_sql_values(sql: str) -> list[tuple]:
    """Parse the INSERT INTO ... VALUES (...),(...),... statement."""
    # Find the VALUES portion
    m = re.search(r"VALUES\s*(.+);", sql, re.DOTALL)
    if not m:
        raise ValueError("Could not find VALUES in SQL")

    values_str = m.group(1)

    entries = []
    i = 0
    length = len(values_str)

    while i < length:
        # Find start of tuple
        if values_str[i] == "(":
            # Parse one tuple
            i += 1  # skip (
            fields = []
            while True:
                # Skip whitespace
                while i < length and values_str[i] in " \t\n\r":
                    i += 1

                if i >= length:
                    break

                if values_str[i] == "'":
                    # String field - parse until unescaped closing quote
                    i += 1  # skip opening quote
                    val = []
                    while i < length:
                        if values_str[i] == "\\" and i + 1 < length:
                            # Escaped character
                            val.append(values_str[i + 1])
                            i += 2
                        elif values_str[i] == "'" and i + 1 < length and values_str[i + 1] == "'":
                            # SQL escaped quote
                            val.append("'")
                            i += 2
                        elif values_str[i] == "'":
                            i += 1  # skip closing quote
                            break
                        else:
                            val.append(values_str[i])
                            i += 1
                    fields.append("".join(val))
                elif values_str[i:i+4] == "NULL":
                    fields.append(None)
                    i += 4
                else:
                    # Numeric field
                    val = []
                    while i < length and values_str[i] not in ",)":
                        val.append(values_str[i])
                        i += 1
                    fields.append("".join(val).strip())

                # Skip whitespace
                while i < length and values_str[i] in " \t\n\r":
                    i += 1

                if i < length and values_str[i] == ",":
                    i += 1  # skip comma between fields
                elif i < length and values_str[i] == ")":
                    i += 1  # skip closing paren
                    break

            entries.append(tuple(fields))
        else:
            i += 1

    return entries


def escape_ts_string(s: str) -> str:
    """Escape a string for use in TypeScript single-quoted string."""
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main():
    with open(SQL_FILE, "r") as f:
        sql = f.read()

    entries = parse_sql_values(sql)
    print(f"Parsed {len(entries)} total entries from SQL")

    sunday_messages = []
    events_messages = []
    skipped_wednesday = 0

    for entry in entries:
        # Fields: no, videonum, title, videotype, mtype, mdate, messenger, passage, bname, from_chapter, to_chapter
        no = int(entry[0])
        videonum = entry[1] if entry[1] else ""
        title = entry[2] if entry[2] else ""
        videotype = entry[3] if entry[3] else ""
        # mtype = entry[4]  # not used in output
        mdate = entry[5] if entry[5] else ""
        messenger = entry[6] if entry[6] else ""
        passage = entry[7] if entry[7] else ""
        # bname = entry[8]
        # from_chapter = entry[9]
        # to_chapter = entry[10]

        # Filter by videotype
        if videotype == "Wednesday":
            skipped_wednesday += 1
            continue
        elif videotype == "Sunday":
            series = "Sunday Service"
        elif videotype == "Events":
            series = "Events"
        else:
            # Skip unknown types
            continue

        # Normalize YouTube ID
        youtube_id = extract_youtube_id(videonum) if videonum else None

        # Normalize speaker
        speaker = normalize_speaker(messenger)

        # Create slug
        slug = make_slug(title)

        # Convert date format
        date_for = mdate.replace("/", "-") if mdate else ""

        # Thumbnail URL
        thumbnail_url = f"https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg" if youtube_id else None

        # Normalize passage: replace ~ with -
        passage = passage.replace("~", "-") if passage else ""

        # Clean up title (strip whitespace)
        title = title.strip()

        msg = {
            "legacyId": no,
            "slug": slug,
            "title": title,
            "youtubeId": youtube_id,
            "thumbnailUrl": thumbnail_url,
            "speaker": speaker,
            "series": series,
            "passage": passage,
            "dateFor": date_for,
        }

        if videotype == "Sunday":
            sunday_messages.append(msg)
        else:
            events_messages.append(msg)

    print(f"Sunday messages: {len(sunday_messages)}")
    print(f"Events messages: {len(events_messages)}")
    print(f"Skipped Wednesday: {skipped_wednesday}")

    # Generate TypeScript output
    all_messages = sunday_messages + events_messages

    lines = []
    lines.append("type MessageSeed = {")
    lines.append("  legacyId: number;")
    lines.append("  slug: string;")
    lines.append("  title: string;")
    lines.append("  youtubeId: string | null;")
    lines.append("  thumbnailUrl: string | null;")
    lines.append("  speaker: string;")
    lines.append("  series: string;")
    lines.append("  passage: string;")
    lines.append("  dateFor: string;")
    lines.append("};")
    lines.append("")
    lines.append("const MESSAGES: MessageSeed[] = [")

    for msg in all_messages:
        yt = f"'{msg['youtubeId']}'" if msg["youtubeId"] else "null"
        thumb = f"'{msg['thumbnailUrl']}'" if msg["thumbnailUrl"] else "null"
        title_escaped = escape_ts_string(msg["title"])
        lines.append(
            f"  {{ legacyId: {msg['legacyId']}, slug: '{msg['slug']}', "
            f"title: '{title_escaped}', youtubeId: {yt}, thumbnailUrl: {thumb}, "
            f"speaker: '{escape_ts_string(msg['speaker'])}', series: '{msg['series']}', "
            f"passage: '{escape_ts_string(msg['passage'])}', dateFor: '{msg['dateFor']}' }},"
        )

    lines.append("];")
    lines.append("")
    lines.append("export default MESSAGES;")
    lines.append("")

    output = "\n".join(lines)

    with open(OUTPUT_FILE, "w") as f:
        f.write(output)

    print(f"\nOutput written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
