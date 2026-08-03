import { createClient } from '@supabase/supabase-js';

// Fallback configuration values (default constants used when environment variables are missing) allow local execution during early setup.
const defaultSupabaseUrl = 'https://fczedbpuihwapubvfnzv.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_Pl1Fvk7Lzlz3sl4LU_p3Bw_jXH_y1OC';

// URL normalization (input sanitization and protocol validation) prevents malformed endpoints from reaching the Supabase SDK client.
const normalizeUrl = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

// Environment variable resolution (runtime lookup of deployment-specific secrets and endpoints) prioritizes platform-provided values from Vercel, then falls back to defaults.
const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultSupabaseAnonKey;

// Client instantiation (construction of a reusable API client object) creates a singleton that powers authentication operations, database queries, and storage calls.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
