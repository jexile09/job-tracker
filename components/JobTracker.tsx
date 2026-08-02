import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { JobRecord, JobStatus, ActiveTab, AuthSession, FormState } from '../types';
import DashboardTab from './tabs/DashboardTab';
import ArchiveTab from './tabs/ArchiveTab';
import CalendarTab from './tabs/CalendarTab';
import SettingsTab from './tabs/SettingsTab';

const getTodayString = () => new Date().toISOString().split('T')[0];
const formatAppliedDate = (v: string) => new Date(`${v}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
const makeGoogleCalendarUrl = (t: string, d: string, det: string, loc: string = '') => {
  const encodeValue = (value: string) => encodeURIComponent(value || '');

  const buildDateValue = (value: string | Date) => {
    if (value instanceof Date) {
      const yyyy = value.getFullYear().toString();
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const dd = String(value.getDate()).padStart(2, '0');
      const hh = String(value.getHours()).padStart(2, '0');
      const mi = String(value.getMinutes()).padStart(2, '0');
      const ss = String(value.getSeconds()).padStart(2, '0');
      return `${yyyy}${mm}${dd}T${hh}${mi}${ss}`;
    }

    const trimmed = value?.trim() || '';
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed.replace(/-/g, '');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
      const [datePart, timePart = '00:00:00'] = trimmed.split('T');
      const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
      return `${datePart.replace(/-/g, '')}T${hours.padStart(2, '0')}${minutes.padStart(2, '0')}${seconds.padStart(2, '0')}`;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return '';
    return buildDateValue(parsed);
  };

  const startValue = buildDateValue(d);
  if (!startValue) {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeValue(t)}&details=${encodeValue(det)}&location=${encodeValue(loc)}`;
  }

  const isDateOnly = /^\d{8}$/.test(startValue);
  const endValue = isDateOnly
    ? startValue
    : (() => {
        const parsedStart = new Date(d);
        if (Number.isNaN(parsedStart.getTime())) return '';
        return buildDateValue(new Date(parsedStart.getTime() + 60 * 60 * 1000));
      })();

  const dates = isDateOnly ? `${startValue}/${startValue}` : endValue ? `${startValue}/${endValue}` : startValue;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: t,
    details: det,
    location: loc,
  });

  if (dates) params.set('dates', dates);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const statusStyles: Record<JobStatus, string> = {
  applied: 'bg-[#EAF4FF] text-[#3B629B]',
  interview: 'bg-[#FFF3CF] text-[#8C6418]',
  offered: 'bg-[#E8F8EC] text-[#3B6D3D]',
  rejected: 'bg-[#FFE6EA] text-[#8C3A49]',
};

type CleanupRules = {
  rejected: boolean;
  olderThanOneWeek: boolean;
  olderThanOneMonth: boolean;
  olderThanThreeMonths: boolean;
};

export default function JobTracker() {
  const [session, setSession] = useState<AuthSession>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [newPassword, setNewPassword] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  const [form, setForm] = useState<FormState>({
    company_name: '',
    application_link: '',
    notes: '',
    status: 'applied',
    applied_date: getTodayString(),
    interview_date: '',
    deadline_date: '',
    salary_range: '',
    work_type: 'remote',
    location: '',
  });

  const fetchJobs = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('jobs').select('*').eq('user_id', userId).order('applied_date', { ascending: false });
    if (data) setJobs(data as JobRecord[]);
  };

  useEffect(() => {
    if (!supabase) {
      setLoadingSession(false);
      return;
    }

    const storedDarkMode = typeof window !== 'undefined' ? window.localStorage.getItem('job-tracker-dark-mode') : null;
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === 'true');
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s as AuthSession);
      if (s?.user?.id) fetchJobs(s.user.id);
      setLoadingSession(false);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('job-tracker-dark-mode', darkMode ? 'true' : 'false');
    }
  }, [darkMode]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user?.id) return;
    setSubmitting(true);
    const { error } = await supabase.from('jobs').insert({ user_id: session.user.id, ...form, is_archived: false });
    if (!error) {
      setMessage({ type: 'success', text: 'Saved! 🌸' });
      fetchJobs(session.user.id);
    }
    setSubmitting(false);
  };

  const handleToggleArchive = async (id: number, state: boolean) => {
    if (!supabase || !session?.user?.id) return;
    await supabase.from('jobs').update({ is_archived: state }).eq('id', id);
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, is_archived: state } : j)));
  };

  const handleDelete = async (id: number) => {
    if (!supabase || !session?.user?.id) return;
    await supabase.from('jobs').delete().eq('id', id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleRunCleanup = async (rules: CleanupRules) => {
    if (!supabase || !session?.user?.id) return;

    setCleanupLoading(true);
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setDate(today.getDate() - 30);
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setDate(today.getDate() - 90);

    const matchingJobs = jobs.filter((job) => {
      if (job.is_archived) return false;
      const appliedDate = new Date(`${job.applied_date}T00:00:00`);
      const matchesRejected = rules.rejected && job.status === 'rejected';
      const matchesOneWeek = rules.olderThanOneWeek && appliedDate < oneWeekAgo;
      const matchesOneMonth = rules.olderThanOneMonth && appliedDate < oneMonthAgo;
      const matchesThreeMonths = rules.olderThanThreeMonths && appliedDate < threeMonthsAgo;
      return matchesRejected || matchesOneWeek || matchesOneMonth || matchesThreeMonths;
    });

    if (matchingJobs.length === 0) {
      setMessage({ type: 'success', text: 'No applications matched the selected cleanup rules.' });
      setCleanupLoading(false);
      return;
    }

    const { error } = await supabase
      .from('jobs')
      .update({ is_archived: true })
      .in('id', matchingJobs.map((job) => job.id))
      .eq('user_id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setCleanupLoading(false);
      return;
    }

    const toArchiveIds = new Set(matchingJobs.map((job) => job.id));
    setJobs((prev) => prev.map((job) => (toArchiveIds.has(job.id) ? { ...job, is_archived: true } : job)));
    setMessage({ type: 'success', text: `Archived ${matchingJobs.length} application(s).` });
    setCleanupLoading(false);
  };

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'dashboard' && j.is_archived) return false;
    if (activeTab === 'archive' && !j.is_archived) return false;
    return j.company_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const theme = {
    bg: darkMode ? 'bg-[#18181B] text-[#F4F4F5]' : 'bg-[#FAF8F5] text-[#4E3B3B]',
    card: darkMode ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-[#FFFDF9] border-[#FFE5E2]',
    innerCard: darkMode ? 'bg-[#18181B] border-[#3F3F46] text-[#F4F4F5]' : 'bg-white border-[#FFE5E2] text-[#4E3B3B]',
    input: darkMode ? 'bg-[#27272A] border-[#3F3F46] text-[#F4F4F5]' : 'bg-[#FFFDF9] border-[#FFE5E2] text-[#4E3B3B]',
    label: darkMode ? 'text-[#D4D4D8]' : 'text-[#6C5656]',
    tableHeader: darkMode ? 'border-[#3F3F46] text-[#A1A1AA]' : 'border-[#F2E7DE] text-[#8D6F6F]',
    tableRow: darkMode ? 'border-[#27272A]' : 'border-[#F7EEE8]',
  };

  const activeJobs = jobs.filter((job) => !job.is_archived);
  const totalApplications = activeJobs.length;
  const upcomingInterviews = activeJobs.filter((job) => {
    if (!job.interview_date) return false;
    const interviewDate = new Date(job.interview_date);
    return interviewDate.getTime() > Date.now();
  }).length;
  const archivedCount = jobs.filter((job) => job.is_archived).length;
  const statusCounts = {
    applied: activeJobs.filter((job) => job.status === 'applied').length,
    interview: activeJobs.filter((job) => job.status === 'interview').length,
    offered: activeJobs.filter((job) => job.status === 'offered').length,
    rejected: activeJobs.filter((job) => job.status === 'rejected').length,
  };

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF9] text-sm text-[#8D6F6F]">
        Loading Appli-Log...
      </div>
    );
  }

  if (!session) return <div className="p-8 text-center">Please sign in to access Appli-Log.</div>;

  return (
    <div className={`min-h-screen p-4 sm:p-8 font-['Karla',sans-serif] transition-colors ${theme.bg}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={`rounded-[32px] border p-6 shadow-md sm:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#E07A5F]">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#4E3B3B]">
                Appli-Log Dashboard
              </h1>
              <p className="mt-2 text-sm text-[#6C5656]">
                Signed in as <span className="font-semibold">{session.user?.email ?? 'your account'}</span>
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8D6F6F]">Open applications</p>
                <p className="mt-3 text-3xl font-semibold">{totalApplications}</p>
              </div>
              <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8D6F6F]">Upcoming interviews</p>
                <p className="mt-3 text-3xl font-semibold">{upcomingInterviews}</p>
              </div>
              <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8D6F6F]">Archived</p>
                <p className="mt-3 text-3xl font-semibold">{archivedCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8D6F6F]">Applied</p>
              <p className="mt-2 text-xl font-semibold">{statusCounts.applied}</p>
            </div>
            <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8D6F6F]">Interview</p>
              <p className="mt-2 text-xl font-semibold">{statusCounts.interview}</p>
            </div>
            <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8D6F6F]">Offered</p>
              <p className="mt-2 text-xl font-semibold">{statusCounts.offered}</p>
            </div>
            <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8D6F6F]">Rejected</p>
              <p className="mt-2 text-xl font-semibold">{statusCounts.rejected}</p>
            </div>
          </div>
        </section>

        <div className="relative z-0 flex flex-wrap gap-2 px-6">
          {[
            { id: 'dashboard', label: '🌸 Dashboard' },
            { id: 'archive', label: '📦 Archive' },
            { id: 'calendar', label: '🗓️ Calendar' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`relative -mb-[2px] rounded-t-2xl px-6 py-2.5 text-sm font-bold tracking-wide transition-all ${
                  isActive
                    ? darkMode
                      ? 'border-t-2 border-x-2 border-[#3F3F46] bg-[#27272A] text-[#FFB7B2] shadow-sm'
                      : 'border-t-2 border-x-2 border-[#FFE5E2] bg-[#FFFDF9] text-[#E07A5F] shadow-sm'
                    : darkMode
                    ? 'bg-[#27272A]/40 text-[#A1A1AA] hover:bg-[#27272A]/80'
                    : 'bg-[#FFE5E2]/40 text-[#8D6F6F] hover:bg-[#FFE5E2]/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative z-0">
          {activeTab === 'dashboard' && (
            <DashboardTab
              theme={theme}
              form={form}
              handleInputChange={handleInputChange}
              handleFileChange={() => {}}
              handleSubmit={handleSubmit}
              submitting={submitting}
              message={message}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              filteredJobs={filteredJobs}
              formatAppliedDate={formatAppliedDate}
              makeGoogleCalendarUrl={makeGoogleCalendarUrl}
              statusStyles={statusStyles}
              handleToggleArchive={handleToggleArchive}
              handleDelete={handleDelete}
            />
          )}
          {activeTab === 'archive' && (
            <ArchiveTab
              theme={theme}
              filteredJobs={filteredJobs}
              statusStyles={statusStyles}
              handleToggleArchive={handleToggleArchive}
              jobs={jobs}
              onRunCleanup={handleRunCleanup}
              cleanupLoading={cleanupLoading}
            />
          )}
          {activeTab === 'calendar' && <CalendarTab theme={theme} jobs={jobs} makeGoogleCalendarUrl={makeGoogleCalendarUrl} />}
          {activeTab === 'settings' && (
            <SettingsTab
              theme={theme}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              handlePasswordChange={() => {}}
              userEmail={session?.user?.email as string | null | undefined}
              handleSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}