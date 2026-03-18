# Third Party Services

The following is a list of third party services that the USAMO Guide uses.

Note: This may be out of date.

## USAMO Guide

- Hosted on Vercel (sponsored hosting, but the free hobby tier will likely
  suffice)
  - Can also host on Netlify
  - Can also host by yourself
- Supabase backend (Auth + Postgres + Storage)
  - Auth, DB, and Edge Functions replace Firebase services
  - Without Supabase, user login, group features, and syncing will not work
- Algolia for Search
  - Open source plan. With some optimizations you _might_ be able to get by with
    the free tier plan. Otherwise pay as you go.
  - No easy replacement. Without this, module search + problems search won't
    work.

## Domain Names

- https://usamo.guide/ -- Registered under NameCheap, $40/yr (?)
- Google Search Console
- Google Analytics
