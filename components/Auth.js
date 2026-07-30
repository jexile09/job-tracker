'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter both your email and password.' });
      setLoading(false);
      return;
    }

    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase is not configured yet. Add your environment variables.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: isSignUp
            ? 'Account created! Please check your inbox to confirm your email.'
            : 'You are signed in successfully.',
        });
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF9] px-4 py-10 text-[#4E3B3B]">
      <div className="w-full max-w-md rounded-2xl border-2 border-[#FFE5E2] bg-[#FFFDF9] p-8 shadow-[0_20px_45px_rgba(255,183,178,0.18)]">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#E79A90]">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold text-[#4E3B3B]">
            {isSignUp ? 'Create your account' : 'Log in to your account'}
          </h1>
          <p className="mt-2 text-sm text-[#8D6F6F]">
            A soft little gateway to your job tracker.
          </p>
        </div>

        <div className="mb-5 flex rounded-full border border-[#FFE5E2] bg-[#FFF7F3] p-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setMessage(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              !isSignUp
                ? 'bg-[#FFB7B2] text-white shadow-sm'
                : 'text-[#8D6F6F] hover:bg-[#FFEDEB]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setMessage(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              isSignUp
                ? 'bg-[#FFB7B2] text-white shadow-sm'
                : 'text-[#8D6F6F] hover:bg-[#FFEDEB]'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#6C5656]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#6C5656]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
            />
          </div>

          {message ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border-[#DDF3E3] bg-[#F3FFF7] text-[#3F6B4C]'
                  : 'border-[#FFE2E2] bg-[#FFF5F5] text-[#A04A4A]'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#FFB7B2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#FFA9A0] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
