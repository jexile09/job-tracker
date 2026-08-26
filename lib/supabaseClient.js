import { createClient } from '@supabase/supabase-js';

// Fallback configuration values (default constants used when deployment environment variables are unavailable) support local bootstrap scenarios and prevent immediate client instantiation failures.
const defaultSupabaseUrl = 'https://fczedbpuihwapubvfnzv.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_Pl1Fvk7Lzlz3sl4LU_p3Bw_jXH_y1OC';

// URL normalization (input sanitization plus protocol validation) prevents malformed endpoint strings from reaching the Supabase SDK transport layer (network request subsystem used for database and authentication calls).
const normalizeUrl = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

// Environment variable resolution (runtime lookup of deployment-scoped configuration values injected by Vercel) prioritizes platform-managed endpoint and key values, then falls back to defaults for non-production execution.
const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultSupabaseAnonKey;

// Client instantiation (construction of a reusable Supabase client singleton) creates one shared API gateway object that performs authentication flows, Row Level Security-aware database queries, and storage API operations.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
