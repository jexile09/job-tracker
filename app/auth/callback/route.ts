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

// API route handler (server-side endpoint executed in a Vercel serverless runtime, which is an isolated on-demand compute process) receives the OAuth callback (identity-provider redirect that transports a temporary authorization code).
export async function GET(request: Request) {
  // URL parsing (structured extraction of request components) reads query parameters, including the authorization code (single-use credential exchanged for long-lived authentication tokens) and the post-login destination path.
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const origin = url.origin;

  // Guard clause (early return that terminates invalid control flow) prevents an unnecessary authentication transaction (network call that would fail without a required credential).
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    // Cookie store (request-scoped HTTP state container) provides read and write access to session cookies (browser-persisted authentication tokens).
    const cookieStore = await cookies();
    // Server client instantiation (construction of a Supabase SDK instance bound to server context) injects environment variables (deployment-time configuration values resolved by Vercel) and cookie adapters (translation functions that map Supabase cookie operations to Next.js cookie APIs).
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
                // Cookie normalization (field-by-field transformation of provider metadata into framework-compatible shape) preserves transport security attributes such as httpOnly (JavaScript access protection) and sameSite (cross-site request behavior policy).
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
                // Framework cookie API contract (required invocation format defined by Next.js) accepts a single cookie object per call, so iteration writes each cookie independently.
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

    // Session exchange (secure credential handoff that converts an authorization code into session tokens) completes the OAuth authentication flow (external identity provider sign-in sequence) and stores tokens in HTTP-only cookies.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Error propagation (controlled forwarding of sanitized failure metadata) appends a URL-encoded message (safe transport format for query strings) so login diagnostics remain visible without exposing stack traces.
    console.error('Supabase exchangeCodeForSession error:', error);
    const msg = encodeURIComponent(error.message ?? 'exchange_failed');
    return NextResponse.redirect(`${origin}/login?error=auth-failed&msg=${msg}`);
  } catch (err: unknown) {
    // Catch-all failure handling (final exception boundary for unanticipated runtime faults) preserves service continuity in the serverless execution environment (ephemeral process that can terminate after response completion).
    console.error('Unexpected error in auth callback:', err);
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'unexpected_error');
    return NextResponse.redirect(`${origin}/login?error=auth-failed&msg=${msg}`);
  }
}
