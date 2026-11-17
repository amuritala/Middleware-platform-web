#!/usr/bin/env bash
# Build the nginx-proxy web image from this checkout.
# Usage: ./build-web.sh [--push]
# Override the tag with WEB_PROXY_TAG, for example WEB_PROXY_TAG=1.14-proxy.
set -Eeuo pipefail

if [[ $# -gt 1 || ( $# -eq 1 && "$1" != "--push" ) ]]; then
  echo "Usage: $0 [--push]" >&2
  exit 1
fi

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TAG="${WEB_PROXY_TAG:-1.14-proxy}"
IMAGE="docker.io/techstackimagerepo/baking-web-service:${TAG}"

if [[ "${1:-}" == "--push" ]]; then
  docker buildx build --platform linux/amd64,linux/arm64 -f "$HERE/Dockerfile.web" --tag "$IMAGE" --push "$HERE"
else
  docker build --platform linux/amd64 -f "$HERE/Dockerfile.web" --tag "$IMAGE" "$HERE"
fi
echo "Built ${IMAGE}"
