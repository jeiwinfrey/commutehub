#!/bin/sh
# Deploys the current checkout to the live "commutehub" Vercel project (default .vercel link).
set -e
cd "$(dirname "$0")/.."
pnpm dlx vercel@latest deploy --prod --yes
