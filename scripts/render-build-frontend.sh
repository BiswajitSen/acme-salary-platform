#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${API_URL:-}" ]]; then
  echo "WARNING: API_URL is not set. Next.js rewrites will default to http://localhost:8000."
  echo "Set API_URL to your backend RENDER_EXTERNAL_URL, then redeploy this service."
fi

echo "Installing dependencies (monorepo root, including dev for Next.js build)..."
npm ci --include=dev

echo "Building frontend (API_URL=${API_URL:-http://localhost:8000})..."
npm run build -w frontend
