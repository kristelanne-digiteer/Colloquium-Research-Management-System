const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Create backend/.env (see .env.example).'
  );
}

// Admin client (service_role). It bypasses RLS, so it must only ever live on the server.
module.exports = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});