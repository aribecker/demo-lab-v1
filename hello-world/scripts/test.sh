#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
bash scripts/build.sh
node --test tests/*.test.mjs
