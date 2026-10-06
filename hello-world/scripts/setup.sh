#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -z "${JAVA_HOME:-}" ]] && ! command -v javac >/dev/null 2>&1; then
  hello_tools="$(cd .. && pwd)/toolchains"
  hello_archive=OpenJDK21U-jdk_x64_linux_hotspot_21.0.8_9.tar.gz
  hello_url='https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.8%2B9'
  mkdir -p "$hello_tools"
  if [[ ! -x "$hello_tools/jdk-21.0.8+9/bin/javac" ]]; then
    (
      cd "$hello_tools"
      curl --fail --location --retry 2 "$hello_url/$hello_archive" -o "$hello_archive"
      printf '%s  %s\n' 'f2dc5418092c43003db8f9005c4a286e1c0104fea96ccdd49e8ebd037cac9219' "$hello_archive" | sha256sum --check -
      tar -xzf "$hello_archive"
    )
  fi
fi
bash scripts/build.sh
