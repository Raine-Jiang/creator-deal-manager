# Auth Notes

## Current V1 Login

The app uses Supabase email + password login.

For this personal V1 tool, the recommended Supabase setting is:

- Auth > Providers > Email: enabled
- Confirm email: disabled

This avoids repeatedly sending login emails, so it is more suitable for frequent testing and personal daily use.

The project also includes a database trigger in `supabase.sql` that marks email users as confirmed on creation. This is a V1 personal-tool fallback so new accounts are not blocked by missing confirmation emails while the dashboard setting is still enabled.

## Why `email rate limit exceeded` Can Happen

Supabase's default email service is intentionally rate limited to prevent abuse. During setup and testing, repeatedly requesting magic links, OTP emails or confirmation emails for the same address can trigger:

```text
email rate limit exceeded
```

This does not mean the account or app is broken.

## Short-term Fix

- Wait for the Supabase email limit window to reset.
- Avoid repeatedly sending auth emails.
- Once logged in, the browser session is persisted automatically.

## More Robust Email Option

Configure a custom SMTP provider in Supabase Auth. This gives more control over email sending and rate limits, but may require setting up an email provider and domain.
