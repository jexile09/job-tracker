'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Auth from '../components/Auth';
import JobTracker from '../components/JobTracker';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for sign in / sign out events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFFDF9]">
        <p className="text-lg font-medium text-[#D6A28C]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF9] p-6 text-[#5A4E4D]">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="text-center py-4">
          <p className="text-sm font-semibold tracking-widest text-[#D6A28C] uppercase">
            JOB TRACKER 🌸
          </p>
        </header>

        {/* Content area */}
        {!session ? (
          <Auth />
        ) : (
          <JobTracker session={session} />
        )}
      </div>
    </main>
  );
}