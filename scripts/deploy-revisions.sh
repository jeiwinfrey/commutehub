#!/bin/sh
# Deploys the current checkout to the "commutehub-revisions" Vercel project.
# The live app (the default .vercel link) is not touched.
set -e
cd "$(dirname "$0")/.."
ORG=$(node -p "require('./.vercel/project.json').orgId")
PID=$(node -p "require('./.vercel/revisions.json').projectId")
VERCEL_ORG_ID=$ORG VERCEL_PROJECT_ID=$PID pnpm dlx vercel@latest deploy --prod --yes
