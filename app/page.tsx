'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import JobTracker from '../components/JobTracker';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;

    // Get active session on load
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF9] text-sm text-[#8D6F6F]">
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF9] p-6 text-[#5A4E4D]">
      <JobTracker />
    </main>
  );
}