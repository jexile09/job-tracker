import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type {
  JobRecord,
  JobStatus,
  ActiveTab,
  AuthSession,
  FormState,
  DashboardSortOption,
  DashboardPreferences,
  ThemeStyles,
} from '../types';
import { formatSalary } from '../lib/salary';
import DashboardTab from './tabs/DashboardTab';
import ArchiveTab from './tabs/ArchiveTab';
import CalendarTab from './tabs/CalendarTab';
import SpreadsheetTab from './tabs/SpreadsheetTab';
import SettingsTab from './tabs/SettingsTab';

const getTodayString = () => new Date().toISOString().split('T')[0];
const DASHBOARD_PREFERENCES_KEY = 'job-tracker-dashboard-preferences-v1';

const isDashboardSortOption = (value: unknown): value is DashboardSortOption => {
  return (
    value === 'salary_desc' ||
    value === 'salary_asc' ||
    value === 'location_asc' ||
    value === 'location_desc' ||
    value === 'name_asc' ||
    value === 'name_desc' ||
    value === 'applied_desc' ||
    value === 'applied_asc'
  );
};

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

const weekdayChipStyles: Record<number, string> = {
  0: 'bg-[#FFE4EC] text-[#A64266]',
  1: 'bg-[#EAF4FF] text-[#365E94]',
  2: 'bg-[#E8F8EC] text-[#2F6A43]',
  3: 'bg-[#FFF3CF] text-[#8A5F16]',
  4: 'bg-[#EFEAFF] text-[#5C4AA3]',
  5: 'bg-[#FFEAD8] text-[#A25A1C]',
  6: 'bg-[#F6E8FF] text-[#7A3C9E]',
};

type CleanupRules = {
  rejected: boolean;
  olderThanOneWeek: boolean;
  olderThanOneMonth: boolean;
  olderThanThreeMonths: boolean;
};

const defaultDashboardPreferences: DashboardPreferences = {
  showOnlyOpen: false,
  compactView: false,
  hideDetailsByDefault: true,
  showSalaryColumn: true,
  showLocationColumn: true,
  showOpenApplicationsCard: true,
  showUpcomingInterviewsCard: true,
  showArchivedCard: true,
  showStatusBreakdown: true,
  dashboardSort: 'applied_desc',
};

// Local storage hydration (state initialization from browser persistence) restores dashboard settings before the first paint to avoid interface flicker.
const readStoredDashboardPreferences = (): Partial<DashboardPreferences> => {
  if (typeof window === 'undefined') return {};
  const storedDashboardPreferences = window.localStorage.getItem(DASHBOARD_PREFERENCES_KEY);
  if (!storedDashboardPreferences) return {};

  try {
    return JSON.parse(storedDashboardPreferences) as Partial<DashboardPreferences>;
  } catch {
    window.localStorage.removeItem(DASHBOARD_PREFERENCES_KEY);
    return {};
  }
};

export default function JobTracker() {
  // State hydration (initial in-memory state construction) merges immutable defaults with user-specific browser persistence.
  const [initialDashboardPreferences] = useState<DashboardPreferences>(() => {
    const storedPreferences = readStoredDashboardPreferences();
    return {
      ...defaultDashboardPreferences,
      ...storedPreferences,
      dashboardSort: isDashboardSortOption(storedPreferences.dashboardSort)
        ? storedPreferences.dashboardSort
        : defaultDashboardPreferences.dashboardSort,
    };
  });
  const [session, setSession] = useState<AuthSession>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('job-tracker-dark-mode') === 'true';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showOnlyOpen, setShowOnlyOpen] = useState(initialDashboardPreferences.showOnlyOpen);
  const [compactView, setCompactView] = useState(initialDashboardPreferences.compactView);
  const [hideDetailsByDefault, setHideDetailsByDefault] = useState(initialDashboardPreferences.hideDetailsByDefault);
  const [showSalaryColumn, setShowSalaryColumn] = useState(initialDashboardPreferences.showSalaryColumn);
  const [showLocationColumn, setShowLocationColumn] = useState(initialDashboardPreferences.showLocationColumn);
  const [showOpenApplicationsCard, setShowOpenApplicationsCard] = useState(initialDashboardPreferences.showOpenApplicationsCard);
  const [showUpcomingInterviewsCard, setShowUpcomingInterviewsCard] = useState(initialDashboardPreferences.showUpcomingInterviewsCard);
  const [showArchivedCard, setShowArchivedCard] = useState(initialDashboardPreferences.showArchivedCard);
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(initialDashboardPreferences.showStatusBreakdown);
  const [dashboardSort, setDashboardSort] = useState<DashboardSortOption>(initialDashboardPreferences.dashboardSort);
  const [newPassword, setNewPassword] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(Boolean(supabase));
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [preferencesHydrated, setPreferencesHydrated] = useState(!supabase);
  const [todayTimestamp] = useState(() => Date.now());

  // Form factory (deterministic object creator for controlled inputs) centralizes default values used by create and reset flows.
  const createEmptyForm = (): FormState => ({
    company_name: '',
    application_link: '',
    notes: '',
    status: 'applied',
    applied_date: getTodayString(),
    interview_date: '',
    deadline_date: '',
    salary_range: '',
    salary_value: '',
    salary_unit: 'year',
    work_type: 'remote',
    location: '',
    resume_storage_path: '',
    cover_letter_storage_path: '',
  });

  const [form, setForm] = useState<FormState>(() => createEmptyForm());

  // Preference applier (defensive state patching routine) updates only known boolean and enum fields from persisted payloads.
  const applyDashboardPreferences = (prefs?: Partial<DashboardPreferences> | null) => {
    if (!prefs) return;
    if (typeof prefs.showOnlyOpen === 'boolean') setShowOnlyOpen(prefs.showOnlyOpen);
    if (typeof prefs.compactView === 'boolean') setCompactView(prefs.compactView);
    if (typeof prefs.hideDetailsByDefault === 'boolean') setHideDetailsByDefault(prefs.hideDetailsByDefault);
    if (typeof prefs.showSalaryColumn === 'boolean') setShowSalaryColumn(prefs.showSalaryColumn);
    if (typeof prefs.showLocationColumn === 'boolean') setShowLocationColumn(prefs.showLocationColumn);
    if (typeof prefs.showOpenApplicationsCard === 'boolean') setShowOpenApplicationsCard(prefs.showOpenApplicationsCard);
    if (typeof prefs.showUpcomingInterviewsCard === 'boolean') setShowUpcomingInterviewsCard(prefs.showUpcomingInterviewsCard);
    if (typeof prefs.showArchivedCard === 'boolean') setShowArchivedCard(prefs.showArchivedCard);
    if (typeof prefs.showStatusBreakdown === 'boolean') setShowStatusBreakdown(prefs.showStatusBreakdown);
    if (isDashboardSortOption(prefs.dashboardSort)) setDashboardSort(prefs.dashboardSort);
  };

  // Database query (remote read operation against Supabase Postgres) fetches job records scoped by user identifier.
  // Row Level Security (database authorization rules that restrict row visibility by authenticated user) must permit SELECT on jobs where user_id matches the session user.
  const fetchJobs = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('jobs').select('*').eq('user_id', userId).order('applied_date', { ascending: false });
    if (data) setJobs(data as JobRecord[]);
  }, []);

  // Preference synchronization read (remote retrieval of per-user JSON settings) loads server-backed customization for cross-device consistency.
  const loadRemotePreferences = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('dashboard_preferences')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.dashboard_preferences) return;
    applyDashboardPreferences(data.dashboard_preferences as Partial<DashboardPreferences>);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Authentication bootstrap (initial session retrieval from Supabase auth cookies) obtains the current user context before protected data reads.
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession as AuthSession);
      if (currentSession?.user?.id) {
        // Parallel asynchronous operations (concurrent network requests that reduce total load time) fetch jobs and remote preferences together.
        await Promise.all([fetchJobs(currentSession.user.id), loadRemotePreferences(currentSession.user.id)]);
      }
      setLoadingSession(false);
      setPreferencesHydrated(true);
    });
  }, [fetchJobs, loadRemotePreferences]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Theme persistence write (browser-side storage update) preserves dark mode between page reloads.
      window.localStorage.setItem('job-tracker-dark-mode', darkMode ? 'true' : 'false');
    }
  }, [darkMode]);

  const dashboardPreferences = useMemo<DashboardPreferences>(
    () => ({
      showOnlyOpen,
      compactView,
      hideDetailsByDefault,
      showSalaryColumn,
      showLocationColumn,
      showOpenApplicationsCard,
      showUpcomingInterviewsCard,
      showArchivedCard,
      showStatusBreakdown,
      dashboardSort,
    }),
    [
      showOnlyOpen,
      compactView,
      hideDetailsByDefault,
      showSalaryColumn,
      showLocationColumn,
      showOpenApplicationsCard,
      showUpcomingInterviewsCard,
      showArchivedCard,
      showStatusBreakdown,
      dashboardSort,
    ]
  );

  useEffect(() => {
    if (!preferencesHydrated) return;

    if (typeof window !== 'undefined') {
      // Local backup persistence (client-side redundant storage) keeps preferences available when remote writes are temporarily unavailable.
      window.localStorage.setItem(DASHBOARD_PREFERENCES_KEY, JSON.stringify(dashboardPreferences));
    }

    if (!supabase || !session?.user?.id) return;

    // Upsert operation (insert-or-update database transaction) writes one preference row per user for cross-device hydration.
    // Row Level Security (database policy gatekeeper for INSERT and UPDATE operations) must allow writes only for the authenticated user_id.
    void supabase.from('user_preferences').upsert(
      {
        user_id: session.user.id,
        dashboard_preferences: dashboardPreferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  }, [dashboardPreferences, preferencesHydrated, session]);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingJobId(null);
  };

  const loadJobIntoForm = (job: JobRecord) => {
    setForm({
      company_name: job.company_name,
      application_link: job.application_link || '',
      notes: job.notes || '',
      status: job.status,
      applied_date: job.applied_date,
      interview_date: job.interview_date || '',
      deadline_date: job.deadline_date || '',
      salary_range: job.salary_range || '',
      salary_value: job.salary_value !== null && job.salary_value !== undefined ? String(job.salary_value) : '',
      salary_unit: job.salary_unit || 'year',
      work_type: job.work_type || 'remote',
      location: job.location || '',
      resume_storage_path: job.resume_storage_path || '',
      cover_letter_storage_path: job.cover_letter_storage_path || '',
    });
    setEditingJobId(job.id);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase || !session) return;
    if (!newPassword) {
      setMessage({ type: 'error', text: 'Enter a new password first.' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user?.id) return;
    setSubmitting(true);

    // Payload normalization (conversion from string-based form inputs into backend-safe scalar values) ensures numeric salary fields and derived labels are consistent.
    const salaryValueNumber = form.salary_value ? Number(form.salary_value) : undefined;
    const salaryUnit = form.salary_unit || 'year';
    const salaryRange = salaryValueNumber ? formatSalary(salaryValueNumber, salaryUnit) : form.salary_range || '';

    const payload = {
      user_id: session.user.id,
      ...form,
      salary_range: salaryRange,
      salary_value: salaryValueNumber ?? null,
      salary_unit: salaryUnit,
      is_archived: false,
    };

    if (editingJobId) {
      // Update query (database mutation that edits an existing row) targets the selected identifier.
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingJobId);
      if (!error) {
        setMessage({ type: 'success', text: 'Updated! 🌸' });
        fetchJobs(session.user.id);
        resetForm();
      }
    } else {
      // Insert query (database mutation that creates a new row) appends a new job record under the authenticated user.
      const { error } = await supabase.from('jobs').insert(payload);
      if (!error) {
        setMessage({ type: 'success', text: 'Saved! 🌸' });
        fetchJobs(session.user.id);
        resetForm();
      }
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

    // In-memory filtering pipeline (deterministic rule evaluation over client state) computes candidate rows before issuing a batched backend mutation.
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

    // Batched update transaction (single request that mutates multiple rows) marks selected rows as archived for efficient network usage.
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

  const resetDashboardCustomization = () => {
    applyDashboardPreferences(defaultDashboardPreferences);
  };

  const formatAppliedDate = (value: string) => {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatInterviewDateTime = (value: string | null | undefined) => {
    if (!value) return 'No interview date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    const date = parsed.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    const weekday = parsed.toLocaleDateString('en-US', { weekday: 'long' });
    const time = parsed
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(' AM', 'am')
      .replace(' PM', 'pm');
    // Time zone extraction (locale formatter metadata lookup) appends a short zone marker that clarifies interview scheduling context.
    const timezone =
      new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
        .formatToParts(parsed)
        .find((part) => part.type === 'timeZoneName')?.value || 'Local';

    return `${date} (${weekday}) at ${time} ${timezone}`;
  };

  const getWeekdayChipStyle = (value: string | null | undefined) => {
    if (!value) return 'bg-[#F3F4F6] text-[#6B7280]';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'bg-[#F3F4F6] text-[#6B7280]';
    return weekdayChipStyles[parsed.getDay()];
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchesSearch = (job: JobRecord) =>
    !normalizedSearch || job.company_name.toLowerCase().includes(normalizedSearch);

  const dashboardBaseJobs = jobs.filter((job) => {
    if (job.is_archived) return false;
    if (showOnlyOpen && job.status === 'rejected') return false;
    if (selectedFilter !== 'all' && job.status !== selectedFilter) return false;
    return matchesSearch(job);
  });

  const sortableSalary = (job: JobRecord) => {
    if (typeof job.salary_value === 'number' && Number.isFinite(job.salary_value)) return job.salary_value;
    return null;
  };

  const sortedDashboardJobs = [...dashboardBaseJobs].sort((a, b) => {
    // Comparator strategy (ordered decision tree that computes pairwise ranking) applies user-selected sorting semantics.
    if (dashboardSort === 'salary_desc' || dashboardSort === 'salary_asc') {
      const aSalary = sortableSalary(a);
      const bSalary = sortableSalary(b);
      if (aSalary === null && bSalary === null) return 0;
      if (aSalary === null) return 1;
      if (bSalary === null) return -1;
      return dashboardSort === 'salary_desc' ? bSalary - aSalary : aSalary - bSalary;
    }

    if (dashboardSort === 'location_asc' || dashboardSort === 'location_desc') {
      const result = (a.location || '').localeCompare(b.location || '', 'en', { sensitivity: 'base' });
      return dashboardSort === 'location_asc' ? result : -result;
    }

    if (dashboardSort === 'name_asc' || dashboardSort === 'name_desc') {
      const result = a.company_name.localeCompare(b.company_name, 'en', { sensitivity: 'base' });
      return dashboardSort === 'name_asc' ? result : -result;
    }

    const aApplied = new Date(`${a.applied_date}T00:00:00`).getTime();
    const bApplied = new Date(`${b.applied_date}T00:00:00`).getTime();
    return dashboardSort === 'applied_asc' ? aApplied - bApplied : bApplied - aApplied;
  });

  const archiveJobs = jobs.filter((job) => job.is_archived && matchesSearch(job));

  const theme: ThemeStyles = {
    bg: darkMode ? 'bg-[#020617] text-[#E2E8F0]' : 'bg-[#FAF8F5] text-[#4E3B3B]',
    card: darkMode ? 'bg-[#111827] border-[#1F2937]' : 'bg-[#FFFDF9] border-[#FFE5E2]',
    innerCard: darkMode ? 'bg-[#0B1220] border-[#1F2937] text-[#CBD5E1]' : 'bg-white border-[#FFE5E2] text-[#4E3B3B]',
    input: darkMode ? 'bg-[#0D1328] border-[#1F2937] text-[#E2E8F0]' : 'bg-[#FFFDF9] border-[#FFE5E2] text-[#4E3B3B]',
    label: darkMode ? 'text-[#94A3B8]' : 'text-[#6C5656]',
    tableHeader: darkMode ? 'border-[#1F2937] text-[#94A3B8]' : 'border-[#F2E7DE] text-[#8D6F6F]',
    tableRow: darkMode ? 'border-[#131A28]' : 'border-[#F7EEE8]',
  };

  const activeJobs = jobs.filter((job) => !job.is_archived);
  const totalApplications = activeJobs.length;
  const upcomingInterviews = activeJobs.filter((job) => {
    if (!job.interview_date) return false;
    const interviewDate = new Date(job.interview_date);
    return interviewDate.getTime() > todayTimestamp;
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

  // Component composition (parent orchestrator that passes typed props into tab modules) drives one-way data flow from container state to presentation layers.
  return (
    <div className={`min-h-screen p-4 sm:p-8 font-['Karla',sans-serif] transition-colors ${theme.bg}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={`rounded-[32px] border p-6 shadow-md sm:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#E07A5F]">Welcome back</p>
              <h1 className={`mt-2 text-3xl font-semibold tracking-tight ${darkMode ? 'text-[#E2E8F0]' : 'text-[#4E3B3B]'}`}>
                Appli-Log Dashboard
              </h1>
              <p className={`mt-2 text-sm ${darkMode ? 'text-[#94A3B8]' : 'text-[#6C5656]'}`}>
                Signed in as <span className="font-semibold">{session.user?.email ?? 'your account'}</span>
              </p>
            </div>

            <div className="grid w-full gap-3 sm:max-w-[540px] sm:grid-cols-3">
              {showOpenApplicationsCard && (
                <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8D6F6F]">Open applications</p>
                  <p className="mt-3 text-3xl font-semibold">{totalApplications}</p>
                </div>
              )}
              {showUpcomingInterviewsCard && (
                <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8D6F6F]">Upcoming interviews</p>
                  <p className="mt-3 text-3xl font-semibold">{upcomingInterviews}</p>
                </div>
              )}
              {showArchivedCard && (
                <div className={`rounded-[28px] border p-4 ${theme.innerCard}`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8D6F6F]">Archived</p>
                  <p className="mt-3 text-3xl font-semibold">{archivedCount}</p>
                </div>
              )}
            </div>
          </div>

          {showStatusBreakdown && (
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
          )}
        </section>

        <div className="relative z-0 flex flex-wrap gap-2 px-6">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'archive', label: 'Archive' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'spreadsheet', label: 'Spreadsheet' },
            { id: 'settings', label: 'Settings' },
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

        <div className="relative z-0 grid gap-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              theme={theme}
              form={form}
              handleInputChange={handleInputChange}
              setSalaryUnit={(salaryUnit) => setForm((prev) => ({ ...prev, salary_unit: salaryUnit }))}
              handleSubmit={handleSubmit}
              submitting={submitting}
              message={message}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              dashboardSort={dashboardSort}
              setDashboardSort={setDashboardSort}
              filteredJobs={sortedDashboardJobs}
              formatAppliedDate={formatAppliedDate}
              formatInterviewDateTime={formatInterviewDateTime}
              makeGoogleCalendarUrl={makeGoogleCalendarUrl}
              statusStyles={statusStyles}
              handleToggleArchive={handleToggleArchive}
              handleDelete={handleDelete}
              compactMode={compactView}
              hideDetailsByDefault={hideDetailsByDefault}
              showSalaryColumn={showSalaryColumn}
              showLocationColumn={showLocationColumn}
              editingJobId={editingJobId}
              onEdit={loadJobIntoForm}
              onCancelEdit={resetForm}
            />
          )}
          {activeTab === 'spreadsheet' && (
            <SpreadsheetTab
              jobs={jobs}
              theme={theme}
              darkMode={darkMode}
              statusStyles={statusStyles}
              formatInterviewDateTime={formatInterviewDateTime}
              getWeekdayChipStyle={getWeekdayChipStyle}
            />
          )}
          {activeTab === 'archive' && (
            <ArchiveTab
              theme={theme}
              darkMode={darkMode}
              filteredJobs={archiveJobs}
              statusStyles={statusStyles}
              handleToggleArchive={handleToggleArchive}
              jobs={jobs}
              onRunCleanup={handleRunCleanup}
              cleanupLoading={cleanupLoading}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab
              theme={theme}
              jobs={jobs}
              makeGoogleCalendarUrl={makeGoogleCalendarUrl}
              formatInterviewDateTime={formatInterviewDateTime}
              getWeekdayChipStyle={getWeekdayChipStyle}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              theme={theme}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              handlePasswordChange={handlePasswordChange}
              userEmail={session?.user?.email as string | null | undefined}
              handleSignOut={handleSignOut}
              showOnlyOpen={showOnlyOpen}
              setShowOnlyOpen={setShowOnlyOpen}
              compactView={compactView}
              setCompactView={setCompactView}
              hideDetailsByDefault={hideDetailsByDefault}
              setHideDetailsByDefault={setHideDetailsByDefault}
              showSalaryColumn={showSalaryColumn}
              setShowSalaryColumn={setShowSalaryColumn}
              showLocationColumn={showLocationColumn}
              setShowLocationColumn={setShowLocationColumn}
              showOpenApplicationsCard={showOpenApplicationsCard}
              setShowOpenApplicationsCard={setShowOpenApplicationsCard}
              showUpcomingInterviewsCard={showUpcomingInterviewsCard}
              setShowUpcomingInterviewsCard={setShowUpcomingInterviewsCard}
              showArchivedCard={showArchivedCard}
              setShowArchivedCard={setShowArchivedCard}
              showStatusBreakdown={showStatusBreakdown}
              setShowStatusBreakdown={setShowStatusBreakdown}
              onResetDashboardCustomization={resetDashboardCustomization}
            />
          )}
        </div>
      </div>
    </div>
  );
}