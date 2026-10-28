#!/usr/bin/env python3
"""Install the verified, project-local JDK/Gradle/Android SDK without root access.

Example: python scripts/setup-android-toolchain.py --prefix /workspace/.toolchains \
    --accept-android-sdk-license
"""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import shutil
import tarfile
import tempfile
import urllib.request
import zipfile


GOOGLE = "https://dl.google.com/android/repository/"
PACKAGES = [
    ("commandlinetools-linux-13114758_latest.zip", "android-sdk/cmdline-tools/latest",
     "7ec965280a073311c339e571cd5de778b9975026cfcbe79f2b1cdcb1e15317ee"),
    ("platform-35_r02.zip", "android-sdk/platforms/android-35",
     "0988cacad01b38a18a47bac14a0695f246bc76c1b06c0eeb8eb0dc825ab0c8e0"),
    ("build-tools_r35_linux.zip", "android-sdk/build-tools/35.0.0",
     "bd3a4966912eb8b30ed0d00b0cda6b6543b949d5ffe00bea54c04c81e1561d88"),
    ("platform-tools_r37.0.1-linux.zip", "android-sdk/platform-tools",
     "d230f13842f60f782a8645f9c813f8f845bf36089ea7289f28c48f17979313f1"),
]


def download(url: str, expected: str, cache: Path) -> Path:
    destination = cache / url.rsplit("/", 1)[1]
    if not destination.exists():
        print(f"Downloading {destination.name}", flush=True)
        urllib.request.urlretrieve(url, destination)
    with destination.open("rb") as source:
        actual = hashlib.file_digest(source, "sha256").hexdigest()
    if actual != expected:
        raise ValueError(f"SHA-256 mismatch for {destination.name}: {actual}")
    print(f"Verified {destination.name}: {actual}", flush=True)
    return destination


def unzip(archive: Path, target: Path) -> None:
    if target.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target.parent) as scratch:
        temporary = Path(scratch)
        with zipfile.ZipFile(archive) as package:
            package.extractall(temporary)
            for member in package.infolist():
                mode = member.external_attr >> 16
                if mode & 0o111:
                    (temporary / member.filename).chmod(mode & 0o777)
        children = list(temporary.iterdir())
        if len(children) != 1 or not children[0].is_dir():
            raise ValueError(f"Unexpected archive layout: {archive}")
        shutil.move(str(children[0]), target)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prefix", required=True, type=Path,
                        help="Writable local installation directory")
    parser.add_argument("--accept-android-sdk-license", action="store_true",
                        help="Accept https://developer.android.com/studio/terms")
    args = parser.parse_args()
    prefix = args.prefix.resolve()
    if not args.accept_android_sdk_license:
        parser.error("Android SDK installation requires --accept-android-sdk-license")
    prefix.mkdir(parents=True, exist_ok=True)
    cache = prefix / "downloads"
    cache.mkdir(exist_ok=True)

    jdk_url = ("https://github.com/adoptium/temurin21-binaries/releases/download/"
               "jdk-21.0.9%2B10/OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz")
    jdk = download(jdk_url,
                   "810d3773df7e0d6c4394e4e244b264c8b30e0b05a0acf542d065fd78a6b65c2f", cache)
    if not (prefix / "jdk-21.0.9+10").exists():
        with tarfile.open(jdk) as package:
            package.extractall(prefix, filter="data")
    if not (prefix / "jdk21").exists():
        (prefix / "jdk21").symlink_to("jdk-21.0.9+10", target_is_directory=True)

    gradle = download("https://services.gradle.org/distributions/gradle-8.11.1-bin.zip",
                      "f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6", cache)
    unzip(gradle, prefix / "gradle-8.11.1")
    for filename, relative, checksum in PACKAGES:
        unzip(download(GOOGLE + filename, checksum, cache), prefix / relative)
    for executable in (prefix / "android-sdk/cmdline-tools/latest/bin").iterdir():
        executable.chmod(0o755)

    # Android's stable SDK license hash, also recognized by Gradle's SDK loader.
    licenses = prefix / "android-sdk/licenses"
    licenses.mkdir(exist_ok=True)
    (licenses / "android-sdk-license").write_text(
        "\n24333f8a63b6825ea9c5514f83c2829b004d1fee\n"
        "8933bad161af4178b1185d1a37fbf41ea5269c55\n"
        "d56f5187479451eabf01fb78af6dfcb131a6481e\n")
    print(f"JAVA_HOME={prefix / 'jdk21'}")
    print(f"ANDROID_HOME={prefix / 'android-sdk'}")
    print(f"GRADLE_HOME={prefix / 'gradle-8.11.1'}")


if __name__ == "__main__":
    main()
