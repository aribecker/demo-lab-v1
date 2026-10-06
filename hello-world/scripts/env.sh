#!/usr/bin/env bash
# Respeta JAVA_HOME; usa el JDK local cuando el entorno sólo tiene un JRE.
if [[ -z "${JAVA_HOME:-}" ]] && ! command -v javac >/dev/null 2>&1; then
  hello_jdk="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/toolchains/jdk-21.0.8+9"
  if [[ ! -x "$hello_jdk/bin/javac" && -x /workspace/toolchains/jdk-21.0.8+9/bin/javac ]]; then
    hello_jdk=/workspace/toolchains/jdk-21.0.8+9
  fi
  if [[ -x "$hello_jdk/bin/javac" ]]; then
    export JAVA_HOME="$hello_jdk"
  else
    echo 'Falta un JDK 21 o posterior. Ejecuta bash scripts/setup.sh.' >&2
    exit 1
  fi
fi
