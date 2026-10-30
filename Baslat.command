#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null; then
  printf 'Node.js bulunamadı. Kurulumsuz önizleme: release/Onizleme.html. Tam sürüm için nodejs.org üzerinden Node.js LTS kurun.\n'
  if command -v open >/dev/null; then open release/Onizleme.html; fi
  exit 1
fi
node scripts/start-local.mjs
