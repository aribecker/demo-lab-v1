#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
mkdir -p build/classes
"${JAVA_HOME:+$JAVA_HOME/bin/}javac" --release 21 --add-modules jdk.httpserver -d build/classes backend/src/HelloServer.java
