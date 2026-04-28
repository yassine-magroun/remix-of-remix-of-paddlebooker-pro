#!/usr/bin/env bash
set -euo pipefail

echo "--- Clean install ---"
rm -rf node_modules package-lock.json

npm install --legacy-peer-deps

echo "--- Build ---"
npm run build

echo "✅ Ready for Vercel — push to main and redeploy"
