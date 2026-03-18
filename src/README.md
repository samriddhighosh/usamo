## Supabase Local Development

1. Install the Supabase CLI.
2. Run `supabase start` from the repo root.
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your environment. Gatsby will automatically mirror these to `GATSBY_SUPABASE_URL` and `GATSBY_SUPABASE_ANON_KEY`.
4. Deploy Edge Functions as needed: `supabase functions deploy <name>`.

## Development Speedup Tips

To make development even faster, you can take advantage of tailwind incremental
builds (which don't seem to work with the default postcss setup for some
reason).

1. In `gatsby-browser.tsx`, change the css import to `./build.css` instead of
   `./src/styles/main.css`.
2. Run `yarn dev:optimized`.

I get a consistent 1s hot reload with this. This also prevents some unnecessary
development bundle rebuilds.