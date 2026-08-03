import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type CookieSetOptions = {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  maxAge?: number;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  expires?: string | number | Date;
};

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieSetOptions;
};

// API route handler (server-side endpoint that runs in a serverless function) processes the OAuth callback (provider redirect that contains temporary authorization data).
export async function GET(request: Request) {
  // URL parsing (structured extraction of query parameters) reads the authorization code (single-use token used to create a session).
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const origin = url.origin;

  // Guard clause (early return that prevents invalid execution) stops session exchange when the authorization code is missing.
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    // Cookie store (request-scoped storage for HTTP cookies) allows session tokens to be written by Supabase auth helpers.
    const cookieStore = await cookies();
    // Server client instantiation (creation of an authenticated SDK instance) binds environment variables (runtime configuration values) and cookie adapters (functions that map SDK cookie operations to framework APIs).
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Cookie normalization (conversion of provider cookie metadata into framework-compatible fields) preserves security attributes such as httpOnly and sameSite.
                const cookie: {
                  name: string;
                  value: string;
                  path?: string;
                  httpOnly?: boolean;
                  secure?: boolean;
                  maxAge?: number;
                  sameSite?: boolean | 'lax' | 'strict' | 'none';
                  expires?: Date;
                } = { name, value };
                if (options) {
                  if (options.path) cookie.path = options.path;
                  if (options.httpOnly !== undefined) cookie.httpOnly = options.httpOnly;
                  if (options.secure !== undefined) cookie.secure = options.secure;
                  if (options.maxAge !== undefined) cookie.maxAge = options.maxAge;
                  if (options.sameSite !== undefined) cookie.sameSite = options.sameSite;
                  if (options.expires) cookie.expires = new Date(options.expires);
                }
                // Framework cookie API contract (required function signature expected by Next.js) accepts one cookie object per invocation.
                try {
                  cookieStore.set(cookie);
                } catch (innerErr) {
                  console.error('Failed to set cookie via cookieStore.set:', innerErr);
                }
              });
            } catch (e) {
              console.error('Error in setAll while setting cookies:', e);
            }
          },
        },
      }
    );

    // Session exchange (token handoff that converts authorization code to authenticated session tokens) completes the OAuth authentication flow (external identity provider login sequence).
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Error propagation (controlled forwarding of failure metadata) sends a URL-safe diagnostic string back to the login page for observability (ability to inspect failures quickly).
    console.error('Supabase exchangeCodeForSession error:', error);
    const msg = encodeURIComponent(error.message ?? 'exchange_failed');
    return NextResponse.redirect(`${origin}/login?error=auth-failed&msg=${msg}`);
  } catch (err: unknown) {
    // Catch-all failure handling (final safety block for unexpected exceptions) prevents unhandled crashes in the serverless runtime (isolated function execution environment).
    console.error('Unexpected error in auth callback:', err);
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'unexpected_error');
    return NextResponse.redirect(`${origin}/login?error=auth-failed&msg=${msg}`);
  }
}
