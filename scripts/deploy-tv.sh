#!/usr/bin/env bash
set -euo pipefail
deploy_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
design_file="${1:-}"
device_serial="${2:-${ANDROID_SERIAL:-}}"
deploy_adb="${ADB:-adb}"
deploy_apk="$deploy_root/android/evekrani-a850c-debug.apk"

if [[ $# -gt 2 || "$design_file" == "--help" ]]; then
  printf 'Kullanım: bash scripts/deploy-tv.sh [tasarım.json] [adb-seri-numarası]\n'
  exit 0
fi
command -v "$deploy_adb" >/dev/null || { printf 'ADB bulunamadı; Android SDK platform-tools yolunu PATH içine ekleyin.\n' >&2; exit 1; }
[[ -f "$deploy_apk" ]] || { printf 'Önce debug APK derleyin: android/evekrani-a850c-debug.apk\n' >&2; exit 1; }

if [[ -n "$design_file" ]]; then
  [[ -f "$design_file" ]] || { printf 'JSON dosyası bulunamadı.\n' >&2; exit 1; }
  [[ -x "$deploy_root/node_modules/.bin/tsx" ]] || { printf 'JSON doğrulaması için önce npm ci çalıştırın.\n' >&2; exit 1; }
  design_file="$(cd -- "$(dirname -- "$design_file")" && pwd)/$(basename -- "$design_file")"
  # User-supplied paths are arguments, never shell code.
  (cd "$deploy_root" && ./node_modules/.bin/tsx -e 'import { readFileSync } from "node:fs"; import { parseDesign } from "./lib/design"; parseDesign(JSON.parse(readFileSync(process.argv[1], "utf8")));' "$design_file")
fi

deploy_args=()
if [[ -n "$device_serial" ]]; then deploy_args=(-s "$device_serial"); fi
"$deploy_adb" "${deploy_args[@]}" get-state >/dev/null
if [[ -n "$design_file" ]]; then
  "$deploy_adb" "${deploy_args[@]}" push "$design_file" /sdcard/Download/a850c-ev-ekrani.json
fi
"$deploy_adb" "${deploy_args[@]}" install -r "$deploy_apk"
"$deploy_adb" "${deploy_args[@]}" shell pm grant dev.evekrani.a850c android.permission.READ_EXTERNAL_STORAGE
printf 'Kurulum tamamlandı. TV kumandasında Ana Sayfa tuşuna basıp Ev ekranını varsayılan seçin.\n'
