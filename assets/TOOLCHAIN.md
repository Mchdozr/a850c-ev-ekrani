# Verified Android build environment

The container initially supplied a Java 21 runtime without `javac` and no Android
SDK. A complete local toolchain was installed under `/workspace/.toolchains/`;
no root filesystem installation or committed `local.properties` is needed.

```sh
export JAVA_HOME=/workspace/.toolchains/jdk21
export ANDROID_HOME=/workspace/.toolchains/android-sdk
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME=/workspace/.cache/gradle
export PATH="$JAVA_HOME/bin:/workspace/.toolchains/gradle-8.11.1/bin:$PATH"
```

| Component | Version | Verification |
| --- | --- | --- |
| Eclipse Temurin JDK | 21.0.9+10, Linux x86-64 | Published release SHA-256 |
| Gradle distribution | 8.11.1 | Published distribution SHA-256 |
| Gradle wrapper JAR | 8.11.1 | Published wrapper JAR SHA-256 |
| Android command-line tools | 13114758 | Official Google repository XML checksum |
| Android platform | API 35, revision 2 | Official Google repository XML checksum |
| Android build tools | 35.0.0 | Official Google repository XML checksum |
| Android platform tools | 37.0.1 | Official Google repository XML checksum |

`javac -version` reported `21.0.9`; `aapt2 version` reported
`2.19-11948202`. The Android agents used this environment to compile the project.
The SDK's `adb` binary cannot initialize its default `/home/agent/.android`
directory in this restricted container; APK compilation does not use that path.

The Gradle wrapper JAR was fetched from
`https://raw.githubusercontent.com/gradle/gradle/v8.11.1/gradle/wrapper/gradle-wrapper.jar`
and verified against
`https://services.gradle.org/distributions/gradle-8.11.1-wrapper.jar.sha256`:
`2db75c40782f5e8ba1fc278a5574bab070adccb2d21ca5a6e5ed840888448046`.

The immutable JDK release and all artifact SHA-256 hashes are recorded in
`scripts/setup-android-toolchain.py`. The script installs without root access:

```sh
python scripts/setup-android-toolchain.py \
  --prefix /workspace/.toolchains --accept-android-sdk-license
```

Google's official metadata at
`https://dl.google.com/android/repository/repository2-3.xml` published these
additional archive checksums (SHA-1):

| Archive | Official metadata checksum |
| --- | --- |
| `commandlinetools-linux-13114758_latest.zip` | `5fdcc763663eefb86a5b8879697aa6088b041e70` |
| `platform-35_r02.zip` | `0bb560a90a7a2cbd0dd8348224d518b638fe7949` |
| `build-tools_r35_linux.zip` | `2cfaa0bbb2336e9ec18ed3ecea84fa2e2af607bc` |
| `platform-tools_r37.0.1-linux.zip` | `477254aa5f903c15cf51001717bdf347fb6b53e0` |

TLS certificate verification stayed enabled for every download. The SDK manager
could not retrieve manifests through this container's Java network setup, so the
same official archives were downloaded with Python, verified, and extracted
locally. Download logs, original repository metadata, and temporary archives are
under `/tmp/asset-toolchain-downloads/`; they are not project files. SDK licenses
were accepted locally for the authorized Android build.
