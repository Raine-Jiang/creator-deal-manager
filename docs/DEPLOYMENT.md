# Deployment Guide

This project is intended to run on Vercel with Supabase as the backend.

## 1. Supabase

Run `supabase.sql` in the Supabase SQL Editor before the first production deployment.

Required Supabase services:

- Authentication: Email provider enabled
- Database: `public.deals`
- Storage bucket: `deal-product-images`

After deployment, add the production URL to:

- Authentication > URL Configuration > Site URL
- Authentication > URL Configuration > Redirect URLs

## 2. Vercel Environment Variables

Add these variables to Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET=deal-product-images
```

Use the same values for Production and Preview unless you later create separate Supabase projects.

## 3. Free Domain

Vercel provides a free production URL:

```text
https://your-project-name.vercel.app
```

No custom domain is required for V1.

## 4. Deploy Commands

Local validation:

```bash
npm run lint
npm run build
```

Deploy with Vercel CLI:

```bash
npx vercel --prod
```

## 5. Post-deploy Checklist

- Open the Vercel URL on mobile.
- Send yourself a login magic link.
- Create a test deal with brand, product, amount, date, note and image.
- Refresh the page and confirm the deal remains.
- Edit the same deal and add a received date.
- Delete the test deal.

## 6. Data Recovery

Production data is stored in Supabase, not inside Vercel or GitHub. If the web app is redeployed, the data remains in Supabase.

Recommended backup options:

- Export data from Supabase Table Editor when needed.
- Enable Supabase scheduled backups if the project moves to a paid plan.
- Add CSV export in V2 for creator-owned local backups.
