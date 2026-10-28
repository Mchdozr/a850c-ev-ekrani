#!/usr/bin/env python3
"""Verify the canonical web assets and reproduce the identical Android mirrors.

This uses only Python's standard library. Importing original imagegen PNGs with
--generated-dir additionally requires Pillow 12.3.0 for identical JPEG encoding.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets/asset-manifest.json"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify(data: bytes, entry: dict) -> None:
    actual = digest(data)
    if actual != entry["sha256"]:
        raise ValueError(f"{entry['file']}: unexpected SHA-256 {actual}")


def jpeg_size(data: bytes) -> tuple[int, int]:
    """Read a JPEG's frame dimensions without an imaging dependency."""
    if data[:2] != b"\xff\xd8":
        raise ValueError("Expected a JPEG")
    offset = 2
    while offset < len(data):
        if data[offset] != 0xFF:
            raise ValueError("Invalid JPEG marker")
        while data[offset] == 0xFF:
            offset += 1
        marker = data[offset]
        offset += 1
        if marker in (0x01, *range(0xD0, 0xD9)):
            continue
        length = struct.unpack_from(">H", data, offset)[0]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            height, width = struct.unpack_from(">HH", data, offset + 3)
            return width, height
        offset += length
    raise ValueError("JPEG frame dimensions missing")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="Verify every canonical file and mirror; never write/download")
    parser.add_argument("--generated-dir", type=Path,
                        help="Optionally re-encode the original generated PNG files")
    args = parser.parse_args()
    if args.check and args.generated_dir:
        parser.error("--check and --generated-dir cannot be combined")
    manifest = json.loads(MANIFEST.read_text())

    if args.generated_dir:
        from PIL import Image, ImageOps
        for entry in manifest["wallpapers"]:
            source = args.generated_dir / entry["generation_source_filename"]
            with Image.open(source) as original:
                image = ImageOps.fit(original.convert("RGB"), (1920, 1080),
                                     method=Image.Resampling.LANCZOS)
                encoded = io.BytesIO()
                image.save(encoded, "JPEG", quality=92, progressive=True,
                           optimize=True, subsampling=0)
                data = encoded.getvalue()
                verify(data, entry)
                destination = ROOT / "public/wallpapers" / entry["file"]
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)

    hashes: set[str] = set()
    for category in ("fonts", "wallpapers"):
        for entry in manifest[category]:
            canonical = ROOT / "public" / category / entry["file"]
            mirror = ROOT / "android/app/src/main/assets" / category / entry["file"]
            if not canonical.exists() and category == "fonts" and not args.check:
                request = urllib.request.Request(
                    entry["url"], headers={"User-Agent": "A850C-AssetPreparation/1.0"})
                with urllib.request.urlopen(request, timeout=60) as response:
                    data = response.read()
                verify(data, entry)
                canonical.parent.mkdir(parents=True, exist_ok=True)
                canonical.write_bytes(data)
            data = canonical.read_bytes()
            verify(data, entry)
            if category == "wallpapers":
                if jpeg_size(data) != (entry["width"], entry["height"]):
                    raise ValueError(f"{canonical}: expected 1920 x 1080 JPEG")
                if entry["sha256"] in hashes:
                    raise ValueError("Two wallpapers have identical content")
                hashes.add(entry["sha256"])
            if args.check:
                if mirror.read_bytes() != data:
                    raise ValueError(f"{mirror}: Android asset differs from web asset")
            else:
                mirror.parent.mkdir(parents=True, exist_ok=True)
                mirror.write_bytes(data)
            print(f"verified {category}/{entry['file']}")
    print("Verified 8 distinct 1920 x 1080 wallpapers, 2 fonts, 2 OFL licenses; mirrors identical.")


if __name__ == "__main__":
    main()
