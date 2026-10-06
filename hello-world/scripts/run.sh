#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
bash scripts/build.sh
exec "${JAVA_HOME:+$JAVA_HOME/bin/}java" --add-modules jdk.httpserver -cp build/classes HelloServer
