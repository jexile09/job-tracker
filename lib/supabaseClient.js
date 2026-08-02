import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://fczedbpuihwapubvfnzv.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_Pl1Fvk7Lzlz3sl4LU_p3Bw_jXH_y1OC';

const normalizeUrl = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
