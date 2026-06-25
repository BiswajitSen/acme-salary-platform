#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing dependencies (monorepo root, including dev for TypeScript build)..."
npm ci --include=dev

echo "Building backend..."
npm run build -w backend
