#!/usr/bin/env bash
# Copies the pinned face-api 1.7.13 browser build + the 3 models the PWA uses into tools/vendor/face-api/
# for self-hosting next to attendance-pwa.html. Requires npm.
set -euo pipefail
cd "$(dirname "$0")"
tmp=$(mktemp -d); (cd "$tmp" && npm pack @vladmandic/face-api@1.7.13 >/dev/null && tar xzf vladmandic-face-api-1.7.13.tgz)
mkdir -p vendor/face-api/model
cp "$tmp/package/dist/face-api.js" vendor/face-api/
for m in tiny_face_detector_model face_landmark_68_model face_recognition_model; do
  cp "$tmp/package/model/$m-weights_manifest.json" "$tmp/package/model/$m.bin" vendor/face-api/model/
done
echo "SRI (must equal the integrity attribute in attendance-pwa.html):"
echo "sha384-$(openssl dgst -sha384 -binary vendor/face-api/face-api.js | openssl base64 -A)"
rm -rf "$tmp"
