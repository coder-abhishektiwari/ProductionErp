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

// ⬇️ PASTE YOUR SUPABASE CREDENTIALS HERE ⬇️
const SUPABASE_URL = 'https://qynhvfyzrwqfmopjbppb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bmh2Znl6cndxZm1vcGpicHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjIxMDAsImV4cCI6MjA5MDg5ODEwMH0.Xm7txUqsJp5dFICdS1jQv9vslGjvX-dg4hDkDpNxpfo';

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
