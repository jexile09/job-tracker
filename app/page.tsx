'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Auth from '../components/Auth';
import JobTracker from '../components/JobTracker';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const client = supabase;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setSession(session);
    });

    const initAuth = async () => {
      const { data: sessionData } = await client.auth.getSession();
      if (isMounted) setSession(sessionData.session);
      if (isMounted) setLoading(false);
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF9] text-sm text-[#8D6F6F]">
        Loading dashboard...
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <main className="min-h-screen bg-[#FFFDF9] p-6 text-[#5A4E4D]">
      <JobTracker />
    </main>
  );
}