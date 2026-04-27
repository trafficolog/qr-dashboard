#!/usr/bin/env bash
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  exit 0
fi

if [ "$(id -u)" != "0" ]; then
  exit 0
fi

marker="${HOME}/.cache/playwright-system-deps-ok"
mkdir -p "$(dirname "$marker")"

if [ -f "$marker" ]; then
  exit 0
fi

select_pkg() {
  local preferred="$1"
  local fallback="$2"

  if apt-cache show "$preferred" >/dev/null 2>&1; then
    printf '%s\n' "$preferred"
    return 0
  fi

  printf '%s\n' "$fallback"
}

packages=(
  "$(select_pkg libatk1.0-0t64 libatk1.0-0)"
  "$(select_pkg libatk-bridge2.0-0t64 libatk-bridge2.0-0)"
  libxcomposite1
  libxdamage1
  libxfixes3
  libxrandr2
  libgbm1
  "$(select_pkg libasound2t64 libasound2)"
  libxkbcommon0
)

apt-get update
apt-get install -y --no-install-recommends "${packages[@]}"
touch "$marker"
