# CLAUDE.md — AI Agent Rules

This file guides AI agents (Claude, Cursor, Windsurf, etc.) working on this codebase.

## Project Overview

Next.js SaaS boilerplate with Kinde auth, Drizzle ORM, Stripe payments, and Shadcn/UI.
Deployed on VPS via Dokploy (Docker containers).

## Tech Stack

- **Framework**: Next.js (App Router, standalone output)
- **Language**: TypeScript (strict mode)
- **UI**: Tailwind CSS + Shadcn/UI (components in `/components/ui/`)
- **Auth**: Kinde (`@kinde-oss/kinde-auth-nextjs`) — NO custom auth, NO passwords stored
- **Database**: PostgreSQL + Drizzle ORM (schema in `/lib/db/schema.ts`)
- **Payments**: Stripe (webhooks at `/app/api/stripe/`)
- **Email**: Resend (`/lib/email/`)
- **Cache**: Redis via ioredis (`/lib/redis/`)
- **Monitoring**: GlitchTip (Sentry-compatible SDK) (`/lib/monitoring/`)
- **Validation**: Zod
- **Deployment**: Docker + Dokploy on VPS

## Project Structure

```
app/
├── (login)/              # Auth pages (sign-in, sign-up) — uses Kinde links
│   └── actions.ts        # Server actions (signOut, team mgmt, account mgmt)
├── (dashboard)/          # Protected routes (requires auth)
│   └── dashboard/        # Dashboard pages (general, security, activity)
├── api/
│   ├── auth/kinde/       # Kinde auth route handler (DO NOT MODIFY)
│   ├── stripe/           # Stripe webhooks and checkout
│   ├── team/             # Team API
│   └── user/             # User API
├── layout.tsx            # Root layout
└── globals.css           # Global styles (Tailwind)

lib/
├── auth/
│   ├── session.ts        # Kinde session helpers (getKindeUser, hasPermission, etc.)
│   └── middleware.ts      # Server action wrappers (validatedAction, validatedActionWithUser, withTeam)
├── db/
│   ├── schema.ts         # Drizzle schema (users, teams, teamMembers, activityLogs, invitations)
│   ├── queries.ts        # Database queries (getUser auto-provisions from Kinde)
│   ├── drizzle.ts        # DB connection
│   ├── migrations/       # Drizzle migrations
│   └── seed.ts           # Seed data
├── email/index.ts        # Resend email helpers
├── monitoring/index.ts   # GlitchTip/Sentry helpers
├── payments/
│   ├── stripe.ts         # Stripe helpers (checkout, portal, subscriptions)
│   └── actions.ts        # Payment server actions
├── redis/index.ts        # Redis client + rate limiting + caching
├── storage/index.ts      # Abstract storage interface (implement per project)
├── utils.ts              # Utility functions (cn, etc.)
├── env.ts                # Zod-validated environment variables (import `env` here)
└── validations/          # Shared Zod schemas (common.ts, team.ts, ...)

i18n/
├── config.ts             # Locales, default locale, type guards
└── request.ts            # next-intl request config (wired via next.config.ts)

messages/
├── en.json               # English translations
└── fr.json               # French translations
```

## Key Patterns

### Authentication
- Auth is 100% handled by Kinde. NEVER implement custom password logic.
- Use `getKindeUser()` from `lib/auth/session.ts` to get the current user.
- Use `getUser()` from `lib/db/queries.ts` to get the DB user (auto-creates on first login).
- Protected routes use Kinde middleware (see `middleware.ts`).
- Sign in/out via Kinde links: `LoginLink`, `RegisterLink`, `LogoutLink`.

### Server Actions
- Always use `validatedAction` or `validatedActionWithUser` wrappers from `lib/auth/middleware.ts`.
- These handle Zod validation and auth checks automatically.
- On auth failure, redirect to `/api/auth/kinde/login`.

### Database
- Schema in `lib/db/schema.ts` — Drizzle with PostgreSQL.
- Users are identified by `kindeId` (string from Kinde), NOT by email.
- Auto-provisioning: `getUser()` creates a DB user + default team on first login.
- Run `pnpm db:generate` after schema changes, then `pnpm db:migrate`.

### Adding a New Page
1. Create file in `app/(dashboard)/dashboard/your-page/page.tsx`
2. It's automatically protected by middleware.
3. Use `getUser()` or `getTeamForUser()` to access user/team data.

### Adding a New Server Action
1. Add the action in the relevant `actions.ts` file.
2. Wrap with `validatedActionWithUser(zodSchema, async (data, formData, user) => { ... })`.
3. Use Zod for input validation.

### Emails
- Use helpers from `lib/email/index.ts`.
- Add new email templates as functions in that file.

### Styling
- Use Tailwind CSS utility classes.
- Use Shadcn/UI components from `/components/ui/`.
- Add new Shadcn components via: `npx shadcn@latest add <component-name>`

## Commands

```bash
# Development
docker compose -f docker-compose.dev.yml up -d   # Start PostgreSQL + Redis
pnpm dev                                          # Start Next.js dev server

# Database
pnpm db:generate   # Generate migration after schema change
pnpm db:migrate    # Apply migrations
pnpm db:seed       # Seed test data
pnpm db:studio     # Open Drizzle Studio (DB browser)

# Build
pnpm build         # Production build

# Setup (first time)
pnpm db:setup      # Interactive setup wizard

# Tests
pnpm test          # Run Vitest unit tests (headless)
pnpm test:watch    # Vitest watch mode
pnpm test:coverage # Vitest with coverage report
pnpm test:e2e      # Run Playwright e2e tests (auto-starts dev server)
pnpm test:e2e:ui   # Playwright interactive UI
```

## Testing

- **Unit tests (Vitest)**: files in `tests/unit/**/*.{test,spec}.{ts,tsx}`. Mirror the source path (e.g. `tests/unit/lib/utils.test.ts` → `lib/utils.ts`). Use `@testing-library/react` for components and `@testing-library/jest-dom/vitest` matchers (loaded via `tests/unit/setup.ts`).
- **E2E tests (Playwright)**: files in `tests/e2e/**/*.spec.ts`. Playwright auto-starts `pnpm dev` on port 3000 unless `PLAYWRIGHT_BASE_URL` is set.
- **Don't mock the database in integration tests** — use a real Postgres (the dev docker-compose works) so migrations are exercised.
- Config files: `vitest.config.ts`, `playwright.config.ts`.

## Environment Variables

See `.env.example` for all variables. Key ones:
- `POSTGRES_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `KINDE_*` — Kinde auth credentials
- `STRIPE_*` — Stripe API keys
- `RESEND_API_KEY` — Email sending
- `GLITCHTIP_DSN` — Error tracking

**Never read `process.env.*` directly in feature code.** Import the parsed `env` object from `lib/env.ts`, which validates everything with Zod at startup and fails fast on missing/invalid values.

## Rules

1. **TypeScript strict** — No `any` types. Use proper typing.
2. **Zod validation** — All user inputs must be validated with Zod.
3. **No direct DB queries in pages** — Use functions from `lib/db/queries.ts`.
4. **Server Actions for mutations** — All write operations go through Server Actions.
5. **No client-side secrets** — Only `NEXT_PUBLIC_*` vars are exposed to the browser.
6. **Shadcn/UI for components** — Don't create custom components when Shadcn has one.
7. **Package manager** — Always `pnpm`. Never `npm` or `yarn`.
8. **Env access** — Import from `lib/env.ts`, not `process.env` directly.

## i18n

- Locales defined in `i18n/config.ts` (currently `en`, `fr`).
- Translation files in `messages/<locale>.json`.
- Server components: use `getTranslations()` from `next-intl/server`.
- Client components: use `useTranslations()` from `next-intl`.
- To add a locale: add the file in `messages/`, add the code to `locales` in `i18n/config.ts`.

## Deployment

- Local: `docker compose -f docker-compose.dev.yml up -d` (just Postgres + Redis).
- Production: `docker-compose.yml` runs the full stack (app + Postgres + Redis + GlitchTip) under Dokploy.
- Dockerfile is multi-stage with Next.js `output: "standalone"`.
- See `DEPLOY.md` for the Dokploy walkthrough.
