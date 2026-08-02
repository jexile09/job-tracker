import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                const cookie: any = { name, value };
                if (options) {
                  if (options.path) cookie.path = options.path;
                  if (options.httpOnly !== undefined) cookie.httpOnly = options.httpOnly;
                  if (options.secure !== undefined) cookie.secure = options.secure;
                  if (options.maxAge !== undefined) cookie.maxAge = options.maxAge;
                  if (options.sameSite !== undefined) cookie.sameSite = options.sameSite;
                  if (options.expires) cookie.expires = new Date(options.expires);
                }
                // Next.js cookies().set expects a single cookie object
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Log server-side error and include message in redirect for debugging
    console.error('Supabase exchangeCodeForSession error:', error);
    const msg = encodeURIComponent(error.message ?? 'exchange_failed');
    return NextResponse.redirect(`${origin}/login?error=auth-failed&msg=${msg}`);
  } catch (err: any) {
    console.error('Unexpected error in auth callback:', err);
    const msg = encodeURIComponent(err?.message ?? 'unexpected_error');
    return NextResponse.redirect(`${origin}/login?error=auth-failed&msg=${msg}`);
  }
}
