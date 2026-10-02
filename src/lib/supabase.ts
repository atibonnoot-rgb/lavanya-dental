import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlylhcrcxdjbfvprbuqb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWxoY3JjeGRqYmZ2cHJidXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTY5NTEsImV4cCI6MjEwNTI5Mjk1MX0.PqbFhdxXU6G_HfYFZjJj2R4r4YIds6EHqCjpUOXlUGA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    // Disable realtime WebSocket to prevent ERR_NAME_NOT_RESOLVED console errors
    // on production (this app does not use realtime subscriptions on the patient-facing site)
    params: {
      eventsPerSecond: 0,
    },
  },
  global: {
    headers: {
      'x-client-info': 'lavanyadental-web',
    },
  },
});
export default supabase;


