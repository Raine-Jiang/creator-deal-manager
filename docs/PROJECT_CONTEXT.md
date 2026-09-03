# Project Context

This document is the compact reusable context for future development. Read this file first before reading chat history.

## Prime Directive

- Future agents must minimize token usage.
- Do not reconstruct requirements from old conversation history unless the current request explicitly depends on a missing detail.
- For small fixes, read only this file plus the directly affected source files.
- Before implementing a new version, update this file with the current product state and changed decisions.
- Preserve the existing product direction unless the user explicitly changes it: mobile-first, app-like, simple, lightweight and low-cost.
- Do not push to GitHub or deploy to production unless the user explicitly asks for it.

## Product

Creator Deal Manager is a mobile-first Web App / PWA for a dance creator to manage sponsored product collaborations and daily creator revenue.

The app is currently a personal tool but should remain technically ready for more users later. Keep Supabase RLS and `user_id` isolation on all user-owned tables.

## Current User Priorities

- Fast manual entry, because many deals may be created in a short period.
- Data must persist across refresh, login and devices.
- Visual design should feel like a polished iOS-style app: clean, spacious, bold headings, soft pastel surfaces, minimal dirty shadows.
- Bottom navigation must stay fixed and should not move upward with page scrolling.
- Empty or unknown values should be hidden instead of displaying `--`, `暂无` or `¥0` on deal cards.
- Cost should stay low for Vercel and Supabase free tiers.

## Routes

- `/login`: email/password login, create account, reset password.
- `/`: home dashboard.
- `/deals`: active deal list with search, status filters and publish-date sorting.
- `/deals/new`: create a deal.
- `/deals/[id]`: deal detail.
- `/deals/[id]/edit`: edit a deal and move it to trash.
- `/deals/archived`: completed deals.
- `/deals/trash`: trash, restore, permanent delete.
- `/calendar`: calendar based on publish deadline.
- `/finance`: deal finance summary, category analysis and daily creator revenue entry.

## Data Model

### `deals`

Main Supabase table for collaborations.

Important fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `brand`
- `product_name`
- `product_category`
- `cooperation_date`
- `product_image_url`
- `platform`
- `platforms`
- `advance_required`
- `collaboration_type`
- `product_price`
- `base_fee`
- `commission`
- `advance_amount`
- `received_date`
- `shoot_deadline`
- `shoot_date`
- `publish_deadline`
- `publish_date`
- `expected_payment_date`
- `payment_received`
- `payment_received_date`
- `expected_refund_date`
- `refund_received`
- `refund_received_date`
- `product_url`
- `publish_url`
- `notes`
- `completed`
- `archived_at`
- `deleted_at`

Current business decisions:

- Product categories: `上衣`, `裤子`, `套装`, `裙子`, `鞋子`, `配饰`, `其他`.
- Platforms are multi-select. Existing single `platform` is kept for compatibility; prefer `platforms`.
- Completed deals are archived: `completed = true` or `archived_at` exists means completed/archived.
- Trash is soft delete: `deleted_at` exists means moved to trash.
- Trash items should be excluded from normal list, dashboard, calendar and finance calculations.
- Publish deadline is the primary business date for calendar and finance periods.
- Shoot deadline should not be the primary date unless the user changes the rule again.

### `daily_earnings`

Separate Supabase table for daily platform creator revenue, such as Douyin creator income.

Fields:

- `id`
- `user_id`
- `earning_date`
- `amount`
- `notes`
- `created_at`
- `updated_at`

Rules:

- This is not deal commission.
- It is recorded manually by date.
- The same user can have only one row per date.
- Re-entering the same date updates that day's amount and notes.
- Finance page uses the same range selector to summarize daily earnings.

## Data Logic

- Deal list default order: `created_at DESC`.
- Deal list supports batch soft delete into trash.
- Home order: `需要关注`, `财务提醒`, `合作统计`, `最近合作`.
- Need-attention logic:
  - Upcoming publish-related work should be based on `publish_deadline`.
  - Pending payment: commission exists and `payment_received = false`.
  - Pending refund: `advance_amount` exists and `refund_received = false`.
- Calendar:
  - Uses `publish_deadline`.
  - Month header stats show unique deal count for the visible month and creator revenue for the visible month.
  - Also displays daily creator revenue under each day number when a `daily_earnings` record exists.
  - Selecting a day should show that day's creator revenue detail above deal schedule items.
  - Status colors:
    - waiting to publish / unfinished: red or warm warning
    - published but not completed: green or active
    - completed: gray
  - Group same-day items by type/status so crowded days remain readable.
- Finance:
  - Period filters: current month, last month, last three months, last year, all time, custom start/end.
  - Deal commission period is based on `publish_deadline`.
  - Principal totals are also periodized by `publish_deadline`; changing finance month/range should change total principal and pending principal.
  - Category analysis uses `product_category`; missing values are `未分类`.
- Daily creator revenue:
  - Period is based on `earning_date`.
  - Keep separate from deal commission totals.
  - Finance page owns range statistics and range daily detail.
  - Finance page should not render a long daily earning record list.
  - Primary input should be a recent 14-day quick entry grid so the user can batch backfill creator revenue without opening a date picker for every day.
  - Selecting a date in the daily earning form should load that day's existing record for edit; saving updates it, and the same compact form includes delete for that selected day.
  - Calendar page owns per-day visibility.
- Profile:
  - User name and avatar are stored in Supabase Auth `user_metadata`.
  - Avatar uploads are compressed to WebP and stored in the existing user-scoped product image bucket under `user_id/profile/avatar.webp`.
- Date display:
  - Date-only values display as Chinese year/month/day.
  - Timestamp values display as Chinese year/month/day plus hour/minute/second.
- Excel import:
  - Preserve useful unmatched columns by appending them to notes as `Header：Value`.
  - Embedded images are best-effort matched to row number, compressed to WebP and uploaded to Supabase Storage.
  - After a successful import, clear the preview and show a clear success message to prevent duplicate repeated imports.
- Excel export:
  - Let the user choose date basis and time range before downloading.

## Key Files

- `src/lib/types.ts`: shared domain types and option constants.
- `src/lib/supabase.ts`: Supabase typed client.
- `src/lib/use-deals.ts`: deal loading and persistence hook.
- `src/lib/use-daily-earnings.ts`: daily creator revenue hook.
- `src/lib/deal-status.ts`: derived status logic.
- `src/lib/finance.ts`: finance period and summary calculations.
- `src/lib/import-deals.ts`: Excel import parsing.
- `src/lib/excel-images.ts`: best-effort `.xlsx` embedded image extraction.
- `src/lib/images.ts`: client-side WebP image compression.
- `src/components/DealForm.tsx`: create/edit form.
- `src/components/DealsList.tsx`: active deal list and filters.
- `src/components/DealDetail.tsx`: detail and quick status actions.
- `src/components/Dashboard.tsx`: home and profile panel.
- `src/components/CalendarPage.tsx`: calendar.
- `src/components/FinancePage.tsx`: finance and daily earnings.
- `src/components/DealImporter.tsx`: Excel import modal.
- `src/components/BottomNav.tsx`: fixed app navigation.
- `src/app/globals.css`: global visual system.
- `supabase.sql`: database, RLS and storage setup.
- `README.md`: user-facing project overview.

## Backend And Security

- Supabase Auth uses email/password.
- Sessions persist automatically in browser storage.
- All user-owned tables must include `user_id`.
- RLS must be enabled on user-owned tables.
- Policies must restrict read/write/delete to `(select auth.uid()) = user_id`.
- Do not expose Supabase service role keys in frontend code.
- Product images use Supabase Storage bucket `deal-product-images`.
- Product image paths should stay user-scoped.
- Images are compressed client-side to WebP before upload to save storage.

## Deployment

- Production: `https://creator-deal-manager.vercel.app`
- GitHub: `https://github.com/Raine-Jiang/creator-deal-manager`
- Vercel project is already linked through `.vercel/project.json`.
- Do not edit or commit `.env.local`.
- When deploying, run lint/build first.

## Verification

For most code changes:

```bash
npm run lint
npm run build
```

For UI changes:

- Check 375px, 390px and 430px mobile widths.
- Confirm no horizontal page overflow.
- Confirm bottom navigation remains fixed.
- Confirm text does not overlap or get clipped.

For Supabase schema changes:

- Update `supabase.sql`.
- Apply SQL to Supabase before deploying code that depends on new fields/tables.
- Verify table columns or a simple authenticated query when possible.

## Low-Token Workflow For Future Agents

1. Read `docs/PROJECT_CONTEXT.md`.
2. Read only the files listed under Key Files that relate to the user's request.
3. Use `rg` to locate exact symbols instead of opening broad histories.
4. Make small scoped edits.
5. Run only the relevant verification commands.
6. Update this context if product logic, schema or deployment assumptions change.
7. Summarize the change briefly; do not restate the whole project.
