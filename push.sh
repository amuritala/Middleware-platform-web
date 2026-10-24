#!/usr/bin/env bash

set -Eeuo pipefail

IMAGE_NAME="baking-web-service"
VERSION="${WEB_TAG:-1.9}"
REGISTRY="docker.io/techstackimagerepo"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Building web application Docker image: ${FULL_IMAGE_NAME}"

read_build_setting() {
  local name="$1"
  local default="$2"
  local value

  value="$(printenv "$name" || true)"
  if [[ -z "$value" && -f deployment/.env ]]; then
    value="$(awk -v name="$name" 'index($0, name "=") == 1 { print substr($0, length(name) + 2); exit }' deployment/.env)"
  fi
  printf '%s' "${value:-$default}"
}

VITE_API_URL_VALUE="$(read_build_setting VITE_API_URL '')"
VITE_AUTH_API_URL_VALUE="$(read_build_setting VITE_AUTH_API_URL '')"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg "VITE_API_URL=${VITE_API_URL_VALUE}" \
  --build-arg "VITE_AUTH_API_URL=${VITE_AUTH_API_URL_VALUE}" \
  --tag "$FULL_IMAGE_NAME" \
  --push \
  .

echo "Done! Multi-platform image pushed: ${FULL_IMAGE_NAME}"
