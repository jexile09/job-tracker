'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

type JobStatus = 'applied' | 'interview' | 'offered' | 'rejected';

type JobRecord = {
  id: number;
  user_id: string;
  company_name: string;
  application_link: string | null;
  notes: string | null;
  status: JobStatus;
  applied_date: string;
  resume_storage_path: string | null;
  cover_letter_storage_path: string | null;
  resume_url?: string | null;
  cover_letter_url?: string | null;
  created_at?: string;
};

type AuthSession = {
  user: {
    id: string;
    email?: string | null;
  };
} | null;

type FormState = {
  company_name: string;
  application_link: string;
  notes: string;
  status: JobStatus;
  applied_date: string;
};

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatUrl = (url: string) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const statusStyles: Record<JobStatus, string> = {
  applied: 'bg-[#EAF4FF] text-[#5C7AA5]',
  interview: 'bg-[#FFF3CF] text-[#A67E2A]',
  offered: 'bg-[#E8F8EC] text-[#5D7F5E]',
  rejected: 'bg-[#FFE6EA] text-[#A95565]',
};

const formatAppliedDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function JobTracker() {
  const [session, setSession] = useState<AuthSession>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingNote, setViewingNote] = useState<{ company: string; text: string } | null>(null);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const [form, setForm] = useState<FormState>({
    company_name: '',
    application_link: '',
    notes: '',
    status: 'applied',
    applied_date: getTodayString(),
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  const getSignedUrl = async (storagePath: string | null | undefined) => {
    if (!supabase || !storagePath) return null;

    const client = supabase!;
    const { data, error } = await client.storage.from('documents').createSignedUrl(storagePath, 60 * 60);
    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  };

  const fetchJobs = async (userId: string) => {
    if (!supabase) return;

    const client = supabase!;
    setLoading(true);
    const { data, error } = await client
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('applied_date', { ascending: false });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    const jobsWithUrls = await Promise.all(
      (data ?? []).map(async (job) => ({
        ...job,
        resume_url: await getSignedUrl(job.resume_storage_path),
        cover_letter_url: await getSignedUrl(job.cover_letter_storage_path),
      }))
    );

    setJobs(jobsWithUrls as JobRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Supabase is not configured. Add your env vars first.' });
      return;
    }

    const initializeSession = async () => {
      const client = supabase!;
      const {
        data: { session: currentSession },
      } = await client.auth.getSession();
      setSession(currentSession as AuthSession);
      if (currentSession?.user?.id) {
        await fetchJobs(currentSession.user.id);
      } else {
        setLoading(false);
      }
    };

    void initializeSession();

    const client = supabase!;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession as AuthSession);
      if (nextSession?.user?.id) {
        void fetchJobs(nextSession.user.id);
      } else {
        setJobs([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setAuthLoading(true);
    setAuthMessage(null);

    const client = supabase!;
    if (isSignUp) {
      const { error } = await client.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthMessage(error.message);
      } else {
        setAuthMessage('Check your email for the confirmation link! 💌');
      }
    } else {
      const { error } = await client.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthMessage(error.message);
      }
    }
    setAuthLoading(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'resume' | 'cover_letter') => {
    const file = event.target.files?.[0] ?? null;
    if (type === 'resume') {
      setResumeFile(file);
    } else {
      setCoverLetterFile(file);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !session?.user?.id) {
      setMessage({ type: 'error', text: 'Please sign in before adding a job.' });
      return;
    }

    const client = supabase!;

    if (!form.company_name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a company name.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const uploadedPaths: { resume_storage_path: string | null; cover_letter_storage_path: string | null } = {
        resume_storage_path: null,
        cover_letter_storage_path: null,
      };

      if (resumeFile) {
        const resumePath = `${session.user.id}/${Date.now()}_${resumeFile.name}`;
        const { error: resumeError } = await client.storage.from('documents').upload(resumePath, resumeFile, {
          upsert: false,
        });

        if (resumeError) {
          throw new Error(resumeError.message);
        }
        uploadedPaths.resume_storage_path = resumePath;
      }

      if (coverLetterFile) {
        const coverLetterPath = `${session.user.id}/${Date.now()}_${coverLetterFile.name}`;
        const { error: coverLetterError } = await client.storage.from('documents').upload(coverLetterPath, coverLetterFile, {
          upsert: false,
        });

        if (coverLetterError) {
          throw new Error(coverLetterError.message);
        }
        uploadedPaths.cover_letter_storage_path = coverLetterPath;
      }

      const { error: insertError } = await client.from('jobs').insert({
        user_id: session.user.id,
        company_name: form.company_name.trim(),
        application_link: formatUrl(form.application_link),
        notes: form.notes.trim() || null,
        status: form.status,
        applied_date: form.applied_date,
        ...uploadedPaths,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setForm({
        company_name: '',
        application_link: '',
        notes: '',
        status: 'applied',
        applied_date: getTodayString(),
      });
      setResumeFile(null);
      setCoverLetterFile(null);
      setMessage({ type: 'success', text: 'Application added to your tracker.' });
      await fetchJobs(session.user.id);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong while saving your job.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (jobId: number, nextStatus: JobStatus) => {
    if (!supabase || !session?.user?.id) return;

    const client = supabase!;
    const { error } = await client
      .from('jobs')
      .update({ status: nextStatus })
      .eq('id', jobId)
      .eq('user_id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setJobs((previous) => previous.map((job) => (job.id === jobId ? { ...job, status: nextStatus } : job)));
    setMessage({ type: 'success', text: 'Status updated.' });
  };

  const handleDelete = async (jobId: number) => {
    if (!supabase || !session?.user?.id) return;

    const client = supabase!;
    const { error } = await client.from('jobs').delete().eq('id', jobId).eq('user_id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setJobs((previous) => previous.filter((job) => job.id !== jobId));
    setMessage({ type: 'success', text: 'Application removed.' });
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (jobs.length === 0) return;

    const headers = ['Company Name', 'Applied Date', 'Status', 'Link', 'Notes'];
    const rows = jobs.map((job) => [
      `"${job.company_name.replace(/"/g, '""')}"`,
      `"${job.applied_date}"`,
      `"${job.status}"`,
      `"${job.application_link || ''}"`,
      `"${(job.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `job_applications_${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || job.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  if (!session) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center justify-center rounded-[32px] border border-[#FFE5E2] bg-[#FFFDF9] p-8 text-center shadow-[0_20px_45px_rgba(255,183,178,0.16)]">
        <h2 className="text-2xl font-semibold text-[#4E3B3B]">
          {isSignUp ? 'Create Account ✨' : 'Welcome Back 🌸'}
        </h2>
        <p className="mt-2 text-xs text-[#8D6F6F]">
          {isSignUp ? 'Sign up to build your application pipeline' : 'Sign in to access your application journal'}
        </p>

        <form onSubmit={handleAuth} className="mt-6 w-full space-y-3 text-left">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#6C5656]">Email</label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-[#FFE5E2] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#FFB7B2]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#6C5656]">Password</label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#FFE5E2] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#FFB7B2]"
            />
          </div>

          {authMessage && (
            <div className="rounded-xl border border-[#FFE2E2] bg-[#FFF5F5] p-2.5 text-center text-xs text-[#A04A4A]">
              {authMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full rounded-2xl bg-[#FFB7B2] py-3 text-sm font-semibold text-white transition hover:bg-[#FFA9A0] disabled:opacity-70"
          >
            {authLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setAuthMessage(null);
          }}
          className="mt-4 text-xs text-[#D6A28C] underline decoration-[#FFD9D4] underline-offset-2 hover:text-[#4E3B3B]"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="rounded-[32px] border border-[#FFE5E2] bg-[#FFFDF9] p-6 shadow-[0_20px_45px_rgba(255,183,178,0.16)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[#4E3B3B]">Add New Application 🌸</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#8D6F6F]">
              Fill out the form below to add a new job to your tracker.
            </p>
          </div>
          <div className="rounded-2xl border border-[#FFE5E2] bg-white/80 px-4 py-3 text-sm text-[#7E6767]">
            <span className="font-semibold text-[#4E3B3B]">Signed in as</span> {session.user.email ?? 'your account'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-[28px] border border-[#FFE5E2] bg-white p-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="company_name">
                Company name
              </label>
              <input
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={handleInputChange}
                required
                placeholder="Example Co."
                className="w-full rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="application_link">
                Application link
              </label>
              <input
                id="application_link"
                name="application_link"
                type="text"
                value={form.application_link}
                onChange={handleInputChange}
                placeholder="example.com/job or https://..."
                className="w-full rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Anything to remember?"
                className="w-full rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-[#FFE5E2] bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="applied_date">
                  Applied date
                </label>
                <input
                  id="applied_date"
                  name="applied_date"
                  type="date"
                  value={form.applied_date}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#FFB7B2] focus:ring-2 focus:ring-[#FFD9D4]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="resume">
                Resume
              </label>
              <input
                id="resume"
                name="resume"
                type="file"
                onChange={(event) => handleFileChange(event, 'resume')}
                className="w-full rounded-2xl border border-dashed border-[#FFD9D4] bg-[#FFFDF9] px-4 py-3 text-sm text-[#8D6F6F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6C5656]" htmlFor="cover_letter">
                Cover letter
              </label>
              <input
                id="cover_letter"
                name="cover_letter"
                type="file"
                onChange={(event) => handleFileChange(event, 'cover_letter')}
                className="w-full rounded-2xl border border-dashed border-[#FFD9D4] bg-[#FFFDF9] px-4 py-3 text-sm text-[#8D6F6F]"
              />
            </div>

            {message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
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
              disabled={submitting}
              className="w-full rounded-2xl bg-[#FFB7B2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#FFA9A0] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Add application'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-[#FFE5E2] bg-white p-5 shadow-[0_20px_45px_rgba(255,183,178,0.12)] sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#4E3B3B]">Job Applications</h3>
            <p className="text-sm text-[#8D6F6F]">All saved applications and uploaded documents.</p>
          </div>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#6C5656] transition hover:bg-[#FFE5E2]"
            >
              Download Spreadsheet 🍓
            </button>
          )}
        </div>

        {/* Search & Filter Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search company... 🌸"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-2 text-sm text-[#6C5656] outline-none transition focus:border-[#FFB7B2]"
          />

          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {['all', 'applied', 'interview', 'offered', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedFilter(status)}
                className={`rounded-xl px-3 py-1.5 capitalize transition ${
                  selectedFilter === status
                    ? 'bg-[#FFB7B2] text-white'
                    : 'border border-[#FFE5E2] bg-[#FFFDF9] text-[#8D6F6F] hover:bg-[#FFE5E2]/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] p-8 text-center text-sm text-[#8D6F6F]">
            Loading your list…
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] p-8 text-center text-sm text-[#8D6F6F]">
            {jobs.length === 0
              ? 'No applications yet. Add your first job above.'
              : 'No matching applications found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F2E7DE] text-[#8D6F6F]">
                  <th className="px-3 py-3 font-semibold">Company</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Notes</th>
                  <th className="px-3 py-3 font-semibold">Files</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#F7EEE8] align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[#4E3B3B]">{job.company_name}</div>
                      {job.application_link ? (
                        <a
                          href={job.application_link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-[#D6A28C] underline decoration-[#FFD9D4] underline-offset-2"
                        >
                          View posting
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-[#6F5B5B]">{formatAppliedDate(job.applied_date)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {job.notes ? (
                        <button
                          type="button"
                          onClick={() => setViewingNote({ company: job.company_name, text: job.notes! })}
                          className="rounded-full border border-[#FFE5E2] bg-[#FFFDF9] px-3 py-1 text-xs font-semibold text-[#6C5656] transition hover:bg-[#FFE5E2]"
                        >
                          View notes 🧸
                        </button>
                      ) : (
                        <span className="text-xs text-[#B7A0A0]">No notes</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {job.resume_url ? (
                          <a
                            href={job.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#FFE5E2] bg-[#FFFDF9] px-3 py-1 text-xs font-semibold text-[#6C5656]"
                          >
                            Resume
                          </a>
                        ) : (
                          <span className="text-xs text-[#B7A0A0]">No resume</span>
                        )}
                        {job.cover_letter_url ? (
                          <a
                            href={job.cover_letter_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#FFE5E2] bg-[#FFFDF9] px-3 py-1 text-xs font-semibold text-[#6C5656]"
                          >
                            Cover letter
                          </a>
                        ) : (
                          <span className="text-xs text-[#B7A0A0]">No cover letter</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={job.status}
                          onChange={(event) => handleStatusUpdate(job.id, event.target.value as JobStatus)}
                          className="rounded-xl border border-[#FFE5E2] bg-[#FFFDF9] px-2 py-2 text-xs text-[#6C5656]"
                        >
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDelete(job.id)}
                          className="rounded-xl border border-[#FFD9D4] bg-[#FFF5F5] px-2 py-2 text-xs font-semibold text-[#A95565]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pastel Notes Modal */}
      {viewingNote ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-2 border-[#FFE5E2] bg-[#FFFDF9] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#FFE5E2] pb-3">
              <h4 className="font-semibold text-[#4E3B3B]">Notes for {viewingNote.company}</h4>
              <button
                type="button"
                onClick={() => setViewingNote(null)}
                className="text-sm text-[#8D6F6F] hover:text-[#4E3B3B]"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-[#6C5656]">{viewingNote.text}</p>
            <button
              type="button"
              onClick={() => setViewingNote(null)}
              className="mt-6 w-full rounded-2xl bg-[#FFB7B2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#FFA9A0]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}