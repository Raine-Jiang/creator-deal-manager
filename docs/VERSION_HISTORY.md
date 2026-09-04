# Version History

This file summarizes product versions at a decision level. It is not a full Git changelog.

## V1 - Stable Personal Deal Ledger

Goal: make the first reliable personal tool for recording creator brand deals.

Main work:

- Mobile-first PWA shell.
- Email/password login with persistent sessions.
- Supabase PostgreSQL data persistence.
- Supabase Storage for product images.
- Row Level Security with `user_id` isolation.
- Deal CRUD:
  - list
  - create
  - detail
  - edit
  - delete
- Product image upload and fallback image placeholder.
- Clean iOS-inspired visual foundation.
- Vercel production deployment.
- Basic README, setup docs and deployment notes.

Key V1 decision:

- Use a real database from the start to avoid losing data after refresh, device changes or login changes.

## V2 - Working App For Daily Use

Goal: move from basic ledger to a usable daily operating tool.

Main work:

- Redesigned app-like visual system with softer cards and fixed bottom navigation.
- Home dashboard:
  - needs attention
  - finance reminders
  - collaboration stats
  - recent deals
- Deal list:
  - status filters
  - search
  - publish-date sorting
  - batch delete
  - select all in the current filtered result set
- Deal lifecycle:
  - waiting to publish
  - published
  - completed
  - completed deals are treated as archived
- Trash:
  - soft delete
  - restore
  - permanent delete
  - 30-day retention rule in product logic
- Calendar:
  - based on `publish_deadline`
  - grouped same-day items
  - daily creator revenue shown under date numbers
  - visible-month stats
- Finance:
  - current month, last month, last three months, last year, all time and custom range
  - total commission
  - pending commission
  - total principal
  - pending principal
  - category analysis
- Daily creator revenue:
  - separate from deals
  - one row per date
  - compact single-day editor
  - previous/next day buttons
  - fixed-width clickable date chips for the visible month
  - no long daily record list
- Excel import:
  - maps known spreadsheet columns
  - unmatched columns go into notes
  - embedded images are best-effort extracted and compressed
  - success message prevents repeated duplicate imports
- Excel export:
  - selectable date basis and time range
- Profile:
  - edit display name
  - upload avatar
  - change password
  - access completed deals, trash and export
- Quick record logs:
  - deal detail quick actions update immediately without a confirmation sheet
  - every mark/cancel click is stored in `deal_action_logs`
  - Excel export includes quick action history per deal
- Project context:
  - `docs/PROJECT_CONTEXT.md`
  - `AGENTS.md`
  - version history and handoff docs

Key V2 decisions:

- Use `publish_deadline` as the primary business date for calendar and finance.
- Keep the app lightweight for Vercel and Supabase free tiers.
- Prefer small, focused context files so future AI edits do not waste tokens.

## V3 Candidate Ideas

Do not implement until the user explicitly requests V3.

- Better domestic deployment option.
- Smarter import mapping preview.
- Reminder rules and notification logic.
- Brand profile / CRM.
- More financial reporting.
- Optional multi-user collaboration.
- Data backup automation.
