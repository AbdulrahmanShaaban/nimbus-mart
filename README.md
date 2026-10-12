# Nimbus Mart

Arabic (RTL) e-commerce storefront + admin dashboard, built with [Nuxt](https://nuxt.com) 4 and Vue 3.

- SSR storefront: catalog, search, filters, cart, wishlist, guest checkout (idempotent), orders, multi-currency display
- Admin panel: dashboard stats, product/order/user management, content, currencies, audit log
- PostgreSQL (Neon) via Prisma 7, hand-rolled scrypt sessions with HTTP-only cookies
- Design reference: [Goods & U](https://www.goodsandu.com/ar) (study only — content, images and branding are original)

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))

## Setup

Make sure to install dependencies:

```bash
pnpm install
```

Create a `.env` file in the project root (see [Environment variables](#environment-variables)), then apply migrations and seed:

```bash
pnpm exec prisma migrate deploy
pnpm run db:seed
```

## Development

Start development server on `http://localhost:3000`:

```bash
pnpm run dev
```

Quality gates (run before every push):

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm exec tsx scripts/smoke.ts   # API + SSR smoke suite (needs the dev server running)
```

## Production

Build application for production:

```bash
pnpm run build
```

Locally preview production build:

```bash
pnpm run preview
```

Check out [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information on the different deployment providers.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (used by the app and by `prisma generate`/migrations) |
| `NUXT_SESSION_SECRET` | Secret for signing session cookies — **must be rotated** for any real deployment |

## Seed accounts (demo data only)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@nimbus.app` | `admin1234` |
| Customer | `demo@nimbus.app` | `demo1234` |

## Documentation

- [Nuxt documentation](https://nuxt.com/docs)
- [Vue documentation](https://vuejs.org)
- [Prisma documentation](https://www.prisma.io/docs)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
