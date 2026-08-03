import { NextResponse } from 'next/server';

export function middleware() {
  // Middleware pass-through (edge interception step that currently forwards requests unchanged) keeps routing behavior explicit while preserving an extension point for authentication checks (request validation rules) and redirects (automatic navigation responses).
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Route matcher expression (pattern that selects middleware execution targets) excludes asset paths (files served without application logic) and excludes the OAuth callback route (authentication completion endpoint required for token exchange).
     * _next/static exclusion (build artifact bypass) avoids unnecessary edge execution for precompiled files.
     * _next/image exclusion (image optimizer bypass) avoids intercepting framework-managed media transformations.
     * favicon exclusion (browser icon request bypass) reduces non-essential middleware invocations.
     * auth/callback exclusion (authentication handshake bypass) guarantees that Supabase session exchange can execute without interception loops.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
