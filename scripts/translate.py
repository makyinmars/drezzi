#!/usr/bin/env python3
"""
Translation Helper Script for Lingui

Streamlines the translation workflow by:
1. Exporting untranslated strings to JSON for Claude to translate
2. Importing completed translations back into .po files

Usage:
    python scripts/translate.py export [--output translations.json]
    python scripts/translate.py import translations.json
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import polib
except ImportError:
    print("Error: polib is required. Install with: pip install polib")
    sys.exit(1)

# Configuration
LOCALES_DIR = Path(__file__).parent.parent / "src" / "locales"
SOURCE_LOCALE = "en"
TARGET_LOCALES = ["fr", "sp"]


def get_po_path(locale: str) -> Path:
    return LOCALES_DIR / locale / "messages.po"


def is_untranslated(msgid: str, msgstr: str) -> bool:
    """Check if a string is untranslated (passthrough or empty)."""
    return msgstr == msgid or msgstr == ""


def export_untranslated(output_path: str | None = None) -> None:
    """Export untranslated strings to JSON."""

    # Parse source (English) .po file
    en_path = get_po_path(SOURCE_LOCALE)
    if not en_path.exists():
        print(f"Error: Source file not found: {en_path}")
        sys.exit(1)

    en_po = polib.pofile(str(en_path))

    # Parse target .po files
    target_pos = {}
    for locale in TARGET_LOCALES:
        path = get_po_path(locale)
        if path.exists():
            target_pos[locale] = polib.pofile(str(path))
        else:
            print(f"Warning: Target file not found: {path}")
            target_pos[locale] = None

    # Find untranslated strings
    untranslated = []

    for entry in en_po:
        if not entry.msgid or entry.obsolete:
            continue

        # Check each target locale
        needs_translation = {}
        for locale in TARGET_LOCALES:
            target_po = target_pos.get(locale)
            if target_po:
                target_entry = target_po.find(entry.msgid)
                if target_entry and not is_untranslated(
                    target_entry.msgid, target_entry.msgstr
                ):
                    needs_translation[locale] = (
                        target_entry.msgstr
                    )  # Already translated
                else:
                    needs_translation[locale] = ""  # Needs translation
            else:
                needs_translation[locale] = ""

        # Only include if at least one locale needs translation
        if any(v == "" for v in needs_translation.values()):
            string_entry = {
                "id": entry.msgid[:50] + "..."
                if len(entry.msgid) > 50
                else entry.msgid,
                "source": entry.msgid,
                "translations": needs_translation,
            }

            # Add context (source location)
            if entry.occurrences:
                string_entry["context"] = ", ".join(
                    f"{f}:{l}" for f, l in entry.occurrences[:3]
                )

            # Add translator notes
            if entry.comment:
                string_entry["note"] = entry.comment

            untranslated.append(string_entry)

    # Build output JSON
    output = {
        "meta": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "source_locale": SOURCE_LOCALE,
            "target_locales": TARGET_LOCALES,
            "total_strings": len(untranslated),
        },
        "strings": untranslated,
    }

    # Output
    if output_path:
        output_file = Path(output_path)
        output_file.write_text(json.dumps(output, indent=2, ensure_ascii=False))
        print(f"Exported {len(untranslated)} untranslated strings to: {output_path}")
    else:
        print(json.dumps(output, indent=2, ensure_ascii=False))

    # Summary
    print(f"\n--- Summary ---", file=sys.stderr)
    print(f"Total untranslated strings: {len(untranslated)}", file=sys.stderr)
    for locale in TARGET_LOCALES:
        count = sum(1 for s in untranslated if s["translations"].get(locale) == "")
        print(f"  {locale}: {count} strings need translation", file=sys.stderr)


def import_translations(json_path: str) -> None:
    """Import translations from JSON back into .po files."""

    # Read JSON file
    json_file = Path(json_path)
    if not json_file.exists():
        print(f"Error: JSON file not found: {json_path}")
        sys.exit(1)

    data = json.loads(json_file.read_text())
    strings = data.get("strings", [])

    if not strings:
        print("No strings found in JSON file")
        return

    # Load target .po files
    target_pos = {}
    for locale in TARGET_LOCALES:
        path = get_po_path(locale)
        if path.exists():
            target_pos[locale] = polib.pofile(str(path))
        else:
            print(f"Warning: Target file not found: {path}")

    # Track updates
    updates = {locale: 0 for locale in TARGET_LOCALES}

    # Apply translations
    for string_entry in strings:
        source = string_entry.get("source")
        translations = string_entry.get("translations", {})

        if not source:
            continue

        for locale, translation in translations.items():
            if locale not in target_pos or not target_pos[locale]:
                continue

            if not translation:  # Skip empty translations
                continue

            po = target_pos[locale]
            entry = po.find(source)

            if entry:
                if entry.msgstr != translation:
                    entry.msgstr = translation
                    updates[locale] += 1
            else:
                print(f"Warning: Entry not found in {locale}: {source[:50]}...")

    # Save updated .po files
    for locale, po in target_pos.items():
        if updates[locale] > 0:
            po.save()
            print(f"Updated {locale}/messages.po: {updates[locale]} translations")

    total = sum(updates.values())
    print(f"\n--- Import Complete ---")
    print(f"Total translations imported: {total}")
    print(f"\nNext step: Run 'bun lingui:compile' to compile the catalogs")


def main():
    parser = argparse.ArgumentParser(
        description="Translation helper for Lingui .po files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Export untranslated strings to stdout (for piping to Claude)
    python scripts/translate.py export

    # Export to a file
    python scripts/translate.py export --output translations.json

    # Import completed translations
    python scripts/translate.py import translations.json
        """,
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Export command
    export_parser = subparsers.add_parser(
        "export", help="Export untranslated strings to JSON"
    )
    export_parser.add_argument(
        "--output", "-o", help="Output file path (default: stdout)"
    )

    # Import command
    import_parser = subparsers.add_parser(
        "import", help="Import translations from JSON"
    )
    import_parser.add_argument("json_file", help="Path to JSON file with translations")

    args = parser.parse_args()

    if args.command == "export":
        export_untranslated(args.output)
    elif args.command == "import":
        import_translations(args.json_file)


if __name__ == "__main__":
    main()
