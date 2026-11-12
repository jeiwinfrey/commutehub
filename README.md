# CommuteHub

A mobile-first PWA for commuters in Ilocos Norte: ride tracking with simulated vehicle positions, ETAs and seat status, a planner for direct and transfer routes, weather alerts, and pickup alerts for approaching vehicles. When the selected service has limited availability, tracking suggests a nearby alternative or links to the planner for the same trip.

Built with Next.js, Convex, Clerk (Google sign-in), shadcn/ui, mapcn (MapLibre), Lisse, motion and OSRM routes.

## Run it

```bash
pnpm install
npx convex dev          # creates your Convex dev deployment and writes .env.local
npx convex run seed:run # routes (via OSRM), places and vehicles
pnpm dev
```

Set these in `.env.local` (and on your host):

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex env var: your Clerk Frontend API URL (turn on Clerk's Convex integration) |

Icons come from Central Icons (`central-icons`), which needs your own license.

## Notes

- Illustrations live in `public/illustrations/`; their prompts are in `prompt.md`.
- Mobile only: on wider screens the app shows as a centered phone-sized column.

## Branches and deploys

| Branch | Vercel project | Backend (Convex) | Deploy |
|---|---|---|---|
| `main` | `commutehub` (live) | production deployment | `pnpm deploy:live` and `npx convex deploy` |
| `revisions` | `commutehub-revisions` | dev deployment | `pnpm deploy:revisions` and `npx convex dev --once` |

Work on `revisions`, check it on its own link, then merge into `main` when it's ready. Both deploy scripts read the Vercel project links from the git-ignored `.vercel/` folder.
