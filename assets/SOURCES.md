# Bundled asset provenance

## Wallpapers

All eight wallpaper images are original AI-generated project assets created with
OpenAI image generation on 28 October 2026. They are photographic-style generated
images, **not authentic photographs, downloaded stock images, or official brand
assets**. No third-party stock-photo attribution is claimed or required by this
repository.

The original `istanbul-aksam.jpg` and `sonbahar-bahce.jpg` binary files were absent
from the supplied Git history. The files now at those paths are newly generated
replacements. Their filenames and scene choices are retained; preservation of the
missing original image pixels is not claimed. Wikimedia, Unsplash, and Pexels
could not be accessed in the build environment, so no unverifiable photo mirrors
or unknown-license images were introduced.

| File | Scene |
| --- | --- |
| `istanbul-aksam.jpg` | Bosphorus bridge, Ortaköy mosque, and evening reflections |
| `sonbahar-bahce.jpg` | Copper autumn leaves, a stone garden path, and warm lantern |
| `siyah.jpg` | Sculptural obsidian folds illuminated by a narrow beam of light |
| `bakir-lamba.jpg` | A visible copper table lamp above dark walnut |
| `gece-cam.jpg` | Rain-speckled glass overlooking a night city |
| `somine.jpg` | A stone fireplace with a burning log fire |
| `zeytin-gece.jpg` | A moonlit olive branch above coastal hills |
| `kis-aksami.jpg` | A warm window seat overlooking a snowy winter garden |

Every scene was visually inspected. Each is a progressive 1920 × 1080 RGB JPEG,
with the same bytes in `public/wallpapers/` and Android's `assets/wallpapers/`.
Scenes were composed with subdued space for the launcher interface. Nothing is
fetched from a wallpaper service at runtime.

The checked-in web JPEGs are the canonical distributable originals. Their hashes,
original generation filenames, and descriptions are in `asset-manifest.json`.
Image generation itself is nondeterministic; no claim of exact regeneration from
a text prompt is made. `scripts/prepare-assets.py` reproducibly verifies and copies
the checked-in images to Android. Its optional `--generated-dir` mode re-encodes
the original generated PNGs using Pillow 12.3.0, Lanczos fitting, JPEG quality 92,
progressive encoding, and no chroma subsampling. The original PNGs remain outside
the repository in the environment's `/workspace/generated_images/` directory.

## Fonts

Inter and Nunito Sans are self-hosted from the authoritative
[Google Fonts repository](https://github.com/google/fonts), pinned to commit
`9862abc066c9b83bf84c3e8ed1fc2d8d48f9bbf0` and verified with SHA-256 hashes.
The exact immutable download URLs and checksums are in `asset-manifest.json`.

| Local file | Upstream file | License |
| --- | --- | --- |
| `Inter.ttf` | `ofl/inter/Inter[opsz,wght].ttf` | SIL Open Font License 1.1 |
| `NunitoSans.ttf` | `ofl/nunitosans/NunitoSans[YTLC,opsz,wdth,wght].ttf` | SIL Open Font License 1.1 |

Both TTFs and their complete `Inter-OFL.txt` / `NunitoSans-OFL.txt` license texts
are bundled identically in `public/fonts/` and Android's `assets/fonts/`.
The files retain their upstream font names and contents. No build or runtime
connection to Google Fonts is needed.

Run `python scripts/prepare-assets.py --check` for offline checksum, image-size,
uniqueness, and mirror verification. Run `python scripts/prepare-assets.py` to
restore missing font downloads from their pinned upstream commit and reproduce
the Android mirrors from the canonical web assets. TLS certificate verification
remains enabled for every download.
