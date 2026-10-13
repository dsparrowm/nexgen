# NexGen

A digital-asset investment and mining platform: a user dashboard, an admin console, and an API in one Turborepo monorepo.

**Live demo:** https://nexgen-user.vercel.app

## Features
- **User app:** sign-up with email verification, dashboard, investments, mining, transactions and account settings.
- **Admin console:** customer management (add, view, edit), KYC compliance review, credits and payouts, treasury ledger, mining desk, analytics and reports, notifications and support, and platform security and settings.
- **Role-based access:** protected routes with ADMIN and SUPER_ADMIN roles.
- **Backend:** JWT auth with token refresh, 2FA (TOTP), rate limiting and Helmet, scheduled jobs (cron), real-time updates over Socket.IO, transactional email with React Email, and file uploads to Cloudinary.

## Tech stack
| Layer | Tech |
|---|---|
| Monorepo | Turborepo, pnpm workspaces |
| Frontend (`apps/user`, `apps/admin`) | Next.js, React, TypeScript, Tailwind CSS, Framer Motion, GSAP, Recharts, React Hook Form |
| Backend (`apps/backend`) | Node.js, Express, TypeScript, Prisma, Redis, Socket.IO, Jest |
| Integrations | Stripe, Coinbase Commerce, Resend/Nodemailer, Cloudinary |

## Getting started
```bash
pnpm install
# configure apps/backend/.env (database, Redis, JWT and email keys)
pnpm --filter backend db:migrate
pnpm dev
```
