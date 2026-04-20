#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENAPI_FILE="${ROOT_DIR}/public/openapi.json"
TS_OUTPUT_DIR="${ROOT_DIR}/examples/typescript-sdk/generated"

if [[ ! -f "${OPENAPI_FILE}" ]]; then
  echo "OpenAPI file not found: ${OPENAPI_FILE}" >&2
  exit 1
fi

mkdir -p "${TS_OUTPUT_DIR}"

npx --yes @hey-api/openapi-ts@latest \
  --input "${OPENAPI_FILE}" \
  --output "${TS_OUTPUT_DIR}" \
  --client fetch

echo "TypeScript SDK generated at ${TS_OUTPUT_DIR}"
