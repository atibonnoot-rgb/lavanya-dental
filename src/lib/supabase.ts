import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlylhcrcxdjbfvprbuqb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWxoY3JjeGRqYmZ2cHJidXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTY5NTEsImV4cCI6MjEwNTI5Mjk1MX0.PqbFhdxXU6G_HfYFZjJj2R4r4YIds6EHqCjpUOXlUGA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-client-info': 'lavanyadental-web',
    },
  },
});

// Fully disconnect realtime WebSocket — the patient-facing site does not
// use any realtime subscriptions, so this prevents the ERR_NAME_NOT_RESOLVED
// console errors caused by Supabase trying to connect to its realtime service.
supabase.realtime.disconnect();

export default supabase;



