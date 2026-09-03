# Creator Deal Manager Project Handoff

Last updated: 2026-09-03

## What This Project Is

Creator Deal Manager is a mobile-first Web App / PWA for a dance creator to manage sponsored collaborations and daily creator revenue.

It is designed as a personal, low-cost tool first, while keeping the backend ready for more users later through Supabase Auth and Row Level Security.

## Current Production

- Production URL: https://creator-deal-manager.vercel.app
- GitHub: https://github.com/Raine-Jiang/creator-deal-manager
- Backend: Supabase PostgreSQL, Supabase Auth, Supabase Storage
- Hosting: Vercel

## Current Product Shape

- Login with email and password.
- Create, edit, view, complete, soft-delete, restore and permanently delete deals.
- Upload product images; images are compressed to WebP before upload.
- Deal list supports search, status filters, publish-date sorting and batch delete.
- Calendar uses `publish_deadline` as the primary date.
- Finance uses `publish_deadline` for deal commission/principal periods.
- Daily creator revenue is stored separately in `daily_earnings` and is summarized in Finance.
- Excel import/export exists for old spreadsheet migration and backup.
- Profile supports name, avatar, password changes, completed deals, trash and export.

## High-Risk Areas

- Supabase schema changes must update `supabase.sql`, `docs/PROJECT_CONTEXT.md` and any TypeScript types.
- Never expose service role keys in frontend code.
- Do not count trashed deals in dashboard, calendar or finance.
- Keep `publish_deadline` as the main date unless the user explicitly changes the rule.
- Daily creator revenue must not be mixed with deal commission.
- Keep bottom navigation fixed and avoid horizontal overflow on mobile.

## Before Editing

Read only these first:

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. The directly affected source file

Do not read old chat history unless the current task clearly needs missing product context.

## Standard Checks

```bash
npm run lint
npm run build
```

For UI work, also check 375px, 390px and 430px mobile widths.

