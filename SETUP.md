# Creator Deal Manager V1 Setup

## Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase.sql`.
3. In Authentication, enable Email provider.
4. In Auth URL Configuration, add the local URL and production URL.
5. Copy `.env.example` to `.env.local`.
6. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET`

## Local Run

```bash
npm run dev
```

## Vercel

1. Import this project into Vercel.
2. Add the same environment variables in Project Settings.
3. Deploy.
