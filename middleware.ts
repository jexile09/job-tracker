import { NextResponse } from 'next/server';

export function middleware() {
  // Middleware pass-through (edge interception phase that executes before route handlers in Vercel edge infrastructure) forwards the request unchanged while retaining an extension point for authentication enforcement logic (request identity validation rules) and redirect policies (automatic response-based navigation control).
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Route matcher expression (regular-expression-like path selector evaluated by Next.js middleware) scopes edge execution to application routes while excluding static assets and the OAuth callback pipeline.
     * _next/static exclusion (compiled artifact bypass) prevents middleware from processing JavaScript and CSS bundles generated at build time.
     * _next/image exclusion (image optimization service bypass) prevents interception of framework-managed image transformation requests.
     * favicon exclusion (browser icon fetch bypass) avoids non-essential edge invocations.
     * auth/callback exclusion (authentication token exchange bypass) guarantees that Supabase callback processing reaches the serverless API route without middleware loops.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
