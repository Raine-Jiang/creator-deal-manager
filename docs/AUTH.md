# Auth Notes

## Why `email rate limit exceeded` Happens

The app uses Supabase email magic links for V1 login. Supabase's default email service is intentionally rate limited to prevent abuse. During setup and testing, repeatedly requesting login links for the same address can trigger:

```text
email rate limit exceeded
```

This does not mean the account or app is broken.

## Short-term Fix

- Wait for the Supabase email limit window to reset.
- Avoid repeatedly clicking "send login link".
- Once logged in, the browser session is persisted automatically.

## Better Free Option for V1

For a personal tool, the simplest free alternative is email + password login with email confirmation disabled in Supabase. This avoids sending a login email every time.

Tradeoff:

- Magic link is simpler and passwordless, but it uses email quota.
- Email + password avoids repeated email sends, but the user needs to remember a password.

## More Robust Option

Configure a custom SMTP provider in Supabase Auth. This gives more control over email sending and rate limits, but may require setting up an email provider and domain.
