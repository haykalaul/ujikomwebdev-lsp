# TODO: Integrate Supabase into server.js

- [ ] Import Supabase client at the top of server.js
- [ ] Create Supabase client using SUPABASE_URL and SUPABASE_ANON_KEY from .env
- [ ] Remove MySQL pool creation and ensureTable function
- [ ] Update /calculate POST route: replace MySQL insert with Supabase insert into 'calculations' table
- [ ] Update /dashboard GET route: replace MySQL queries with Supabase queries for stats, totals, and last records
- [ ] Test the changes (run server and check endpoints)
