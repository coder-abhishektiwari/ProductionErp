// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
// 📌 INSTRUCTIONS:
//   1. Go to https://supabase.com and create a free project
//   2. Go to Project Settings → API
//   3. Copy the "Project URL" and "anon public" key below
//   4. Run the SQL schema from supabase-schema.sql in your
//      Supabase SQL Editor (Dashboard → SQL Editor → New Query)
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ⬇️ READ FROM ENVIRONMENT VARIABLES ⬇️
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ── Supabase Client ────────────────────────────────────────
let supabase = null;

export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabase() {
  if (!supabase && isSupabaseConfigured()) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',             // Ensure we query the public schema
      },
      global: {
        headers: {
          'x-my-custom-header': 'rubber-erp',
        },
      },
    });
  }
  return supabase;
}

export default { getSupabase, isSupabaseConfigured };
