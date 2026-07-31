import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { JobRecord, JobStatus, ActiveTab, AuthSession, FormState } from '../types';
import DashboardTab from './tabs/DashboardTab';
import ArchiveTab from './tabs/ArchiveTab';
import CalendarTab from './tabs/CalendarTab';
import SettingsTab from './tabs/SettingsTab';

const getTodayString = () => new Date().toISOString().split('T')[0];
const formatAppliedDate = (v: string) => new Date(`${v}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
const makeGoogleCalendarUrl = (t: string, d: string, det: string) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t)}&dates=${d.replace(/-/g, '')}/${d.replace(/-/g, '')}&details=${encodeURIComponent(det)}`;

const statusStyles: Record<JobStatus, string> = {
  applied: 'bg-[#EAF4FF] text-[#3B629B]',
  interview: 'bg-[#FFF3CF] text-[#8C6418]',
  offered: 'bg-[#E8F8EC] text-[#3B6D3D]',
  rejected: 'bg-[#FFE6EA] text-[#8C3A49]',
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

  const [form, setForm] = useState<FormState>({
    company_name: '',
    application_link: '',
    notes: '',
    status: 'applied',
    applied_date: getTodayString(),
    interview_date: '',
    deadline_date: '',
  });

  const fetchJobs = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('jobs').select('*').eq('user_id', userId).order('applied_date', { ascending: false });
    if (data) setJobs(data as JobRecord[]);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s as AuthSession);
      if (s?.user?.id) fetchJobs(s.user.id);
    });
  }, []);

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

  if (!session) return <div className="p-8 text-center">Please sign in to access your tracker.</div>;

  return (
    <div className={`min-h-screen p-4 sm:p-8 font-['Karla',sans-serif] transition-colors ${theme.bg}`}>
      <div className="mx-auto max-w-6xl space-y-0">
        <div className="relative z-10 flex flex-wrap gap-2 px-6">
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
            />
          )}
        </div>
      </div>
    </div>
  );
}