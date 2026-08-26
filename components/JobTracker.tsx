import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import type {
  JobRecord,
  JobStatus,
  ActiveTab,
  AuthSession,
  FormState,
  DashboardSortOption,
  DashboardPreferences,
  SalaryCurrency,
  ThemeStyles,
} from '../types';
import DashboardTab from './tabs/DashboardTab';
import ArchiveTab from './tabs/ArchiveTab';
import CalendarTab from './tabs/CalendarTab';
import SpreadsheetTab from './tabs/SpreadsheetTab';
import SettingsTab from './tabs/SettingsTab';

const getTodayString = () => new Date().toISOString().split('T')[0];
const DASHBOARD_PREFERENCES_KEY = 'job-tracker-dashboard-preferences-v1';
const AUTH_PERSISTENCE_KEY = 'job-tracker-auth-persistence';
const SESSION_ACTIVE_KEY = 'job-tracker-session-active';

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

const salaryCurrencies: SalaryCurrency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'];

const inferCurrencyFromSalaryRange = (salaryRange: string | null | undefined): SalaryCurrency => {
  if (!salaryRange) return 'USD';
  const upper = salaryRange.toUpperCase();
  const found = salaryCurrencies.find((currency) => upper.includes(currency));
  return found || 'USD';
};

const inferSalaryUnitFromSalaryRange = (salaryRange: string | null | undefined): FormState['salary_unit'] => {
  if (!salaryRange) return 'year';
  const normalized = salaryRange.toLowerCase();
  if (normalized.includes('/ hr')) return 'hour';
  return 'year';
};

const isMissingSalaryUnitColumnError = (message?: string) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('salary_unit') && normalized.includes('schema cache');
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

const statusStylesLight: Record<JobStatus, string> = {
  applied: 'bg-[#EAF4FF] text-[#3B629B]',
  interview: 'bg-[#FFF3CF] text-[#8C6418]',
  offered: 'bg-[#E8F8EC] text-[#3B6D3D]',
  rejected: 'bg-[#FFE6EA] text-[#8C3A49]',
};

const statusStylesDark: Record<JobStatus, string> = {
  applied: 'bg-[#1c2733] text-[#7dabe0]',
  interview: 'bg-[#332b1c] text-[#e0c17d]',
  offered: 'bg-[#1c3321] text-[#7de0a0]',
  rejected: 'bg-[#331c1c] text-[#f87171]',
};

const weekdayChipStylesLight: Record<number, string> = {
  0: 'bg-[#FFE4EC] text-[#A64266]',
  1: 'bg-[#EAF4FF] text-[#365E94]',
  2: 'bg-[#E8F8EC] text-[#2F6A43]',
  3: 'bg-[#FFF3CF] text-[#8A5F16]',
  4: 'bg-[#EFEAFF] text-[#5C4AA3]',
  5: 'bg-[#FFEAD8] text-[#A25A1C]',
  6: 'bg-[#F6E8FF] text-[#7A3C9E]',
};

const weekdayChipStylesDark: Record<number, string> = {
  0: 'bg-[#331c26] text-[#e07da8]',
  1: 'bg-[#1c2733] text-[#7dabe0]',
  2: 'bg-[#1c3321] text-[#7de0a0]',
  3: 'bg-[#332b1c] text-[#e0c17d]',
  4: 'bg-[#261c33] text-[#b17de0]',
  5: 'bg-[#332619] text-[#e0a17d]',
  6: 'bg-[#2b1c33] text-[#c67de0]',
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

// Local storage hydration (state initialization from browser-side persistence) restores dashboard preference primitives before first render, which prevents user-interface mismatch during initial paint.
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
  // State hydration (initial in-memory state composition) merges immutable defaults with persisted preference values, creating a deterministic source of truth for downstream rendering logic.
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

  // Form factory (deterministic object constructor for controlled form fields) centralizes default payload values used by create, edit cancel, and reset operations.
  const createEmptyForm = (): FormState => ({
    company_name: '',
    application_link: '',
    notes: '',
    status: 'applied',
    applied_date: getTodayString(),
    interview_date: '',
    deadline_date: '',
    salary_value: '',
    salary_unit: 'year',
    salary_currency: 'USD',
    work_type: 'remote',
    location: '',
    resume_storage_path: '',
    cover_letter_storage_path: '',
  });

  const [form, setForm] = useState<FormState>(() => createEmptyForm());

  // Preference applier (defensive state patching routine) validates and applies only recognized boolean and enum fields from persisted payloads, preventing schema drift from mutating unrelated state.
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

  // Database query (remote SELECT operation executed through Supabase PostgREST API) fetches job records constrained by authenticated user identifier.
  // Row Level Security (RLS, database-level authorization policy engine that filters rows per user) must permit SELECT when user_id matches the authentication subject stored in the Supabase session token.
  const fetchJobs = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('jobs').select('*').eq('user_id', userId).order('applied_date', { ascending: false });
    if (data) setJobs(data as JobRecord[]);
    if (error) setMessage({ type: 'error', text: `Couldn't load your applications: ${error.message}` });
  }, []);

  // Preference synchronization read (remote JSON retrieval for per-user customization state) loads server-backed settings so multiple devices converge on the same dashboard configuration.
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

    // Authentication bootstrap (initial session retrieval from Supabase-managed authentication cookies) resolves user identity before protected database operations begin.
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (typeof window !== 'undefined') {
        const authPersistence = window.localStorage.getItem(AUTH_PERSISTENCE_KEY);
        const hasActiveBrowserSession = window.sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1';

        // Session-only auth gate (browser-session continuity check) signs users out after browser restarts when Remember Me is disabled.
        if (authPersistence === 'session' && currentSession && !hasActiveBrowserSession) {
          await supabase.auth.signOut();
          setSession(null);
          setLoadingSession(false);
          setPreferencesHydrated(true);
          return;
        }

        if (currentSession) {
          window.sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
        } else {
          window.sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        }
      }

      setSession(currentSession as AuthSession);
      if (currentSession?.user?.id) {
        // Parallel asynchronous operations (concurrent network requests executed with Promise.all) fetch transactional data and preference metadata in one latency window.
        await Promise.all([fetchJobs(currentSession.user.id), loadRemotePreferences(currentSession.user.id)]);
      }
      setLoadingSession(false);
      setPreferencesHydrated(true);
    });
  }, [fetchJobs, loadRemotePreferences]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Theme persistence write (browser-side key-value storage update) preserves visual-mode state across reload boundaries and browser restarts.
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
      // Local backup persistence (client-side redundant state storage) keeps preference hydration available when remote writes fail due to transient network conditions.
      window.localStorage.setItem(DASHBOARD_PREFERENCES_KEY, JSON.stringify(dashboardPreferences));
    }

    if (!supabase || !session?.user?.id) return;

    // Upsert operation (insert-or-update database mutation transaction) writes exactly one preference row per user identifier, enabling idempotent synchronization semantics.
    // Row Level Security (RLS policy evaluator for INSERT and UPDATE mutations) must authorize writes only when user_id equals the authenticated subject in the JWT claim set.
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
      salary_value: job.salary_value !== null && job.salary_value !== undefined ? String(job.salary_value) : '',
      salary_unit: job.salary_unit || inferSalaryUnitFromSalaryRange(job.salary_range),
      salary_currency: job.salary_currency || inferCurrencyFromSalaryRange(job.salary_range),
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
    setMessage(null);

    // Payload normalization (conversion from string-oriented form controls into backend-safe scalar fields) ensures salary numeric values and pay-type metadata remain internally consistent.
    const salaryValueNumber = form.salary_value ? Number(form.salary_value) : undefined;
    const salaryUnitForDb = form.salary_unit || 'year';
    const persistedForm: Omit<FormState, 'salary_currency'> = {
      company_name: form.company_name,
      application_link: form.application_link,
      notes: form.notes,
      status: form.status,
      applied_date: form.applied_date,
      interview_date: form.interview_date,
      deadline_date: form.deadline_date,
      salary_value: form.salary_value,
      salary_unit: salaryUnitForDb,
      work_type: form.work_type,
      location: form.location,
      resume_storage_path: form.resume_storage_path,
      cover_letter_storage_path: form.cover_letter_storage_path,
    };

    const payload = {
      user_id: session.user.id,
      ...persistedForm,
      salary_currency: form.salary_currency || 'USD',
      salary_value: salaryValueNumber ?? null,
      salary_unit: salaryUnitForDb,
      is_archived: false,
    };

    const { salary_unit: omittedSalaryUnit, ...payloadWithoutSalaryUnit } = payload;
    void omittedSalaryUnit;

    if (editingJobId) {
      // Update query (database UPDATE mutation scoped by primary key) edits an existing job row while preserving unchanged columns in Postgres storage.
      let { error } = await supabase.from('jobs').update(payload).eq('id', editingJobId);
      if (error && isMissingSalaryUnitColumnError(error.message)) {
        ({ error } = await supabase.from('jobs').update(payloadWithoutSalaryUnit).eq('id', editingJobId));
      }
      if (!error) {
        setMessage({ type: 'success', text: 'Updated! 🌸' });
        fetchJobs(session.user.id);
        resetForm();
      } else {
        setMessage({ type: 'error', text: error.message });
      }
    } else {
      // Insert query (database INSERT mutation that appends a new row) creates a job record linked to the authenticated user for future RLS-scoped retrieval.
      let { error } = await supabase.from('jobs').insert(payload);
      if (error && isMissingSalaryUnitColumnError(error.message)) {
        ({ error } = await supabase.from('jobs').insert(payloadWithoutSalaryUnit));
      }
      if (!error) {
        setMessage({ type: 'success', text: 'Saved! 🌸' });
        fetchJobs(session.user.id);
        resetForm();
      } else {
        setMessage({ type: 'error', text: error.message });
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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_PERSISTENCE_KEY);
      window.sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    }
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

    // In-memory filtering pipeline (deterministic rule evaluation over current client cache) computes candidate identifiers before issuing a single batched archive mutation.
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

    // Batched update transaction (single network mutation that updates multiple rows through an IN predicate) marks selected rows as archived with reduced request overhead.
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
    // Time zone extraction (locale formatter metadata lookup using Intl parts) appends an explicit short zone label that clarifies interview scheduling context across regions.
    const timezone =
      new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
        .formatToParts(parsed)
        .find((part) => part.type === 'timeZoneName')?.value || 'Local';

    return `${date} (${weekday}) at ${time} ${timezone}`;
  };

  const getWeekdayChipStyle = (value: string | null | undefined) => {
    const emptyStyle = darkMode ? 'bg-[#1c1d22] text-[#a1a1aa]' : 'bg-[#F3F4F6] text-[#6B7280]';
    if (!value) return emptyStyle;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return emptyStyle;
    return (darkMode ? weekdayChipStylesDark : weekdayChipStylesLight)[parsed.getDay()];
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
    // Comparator strategy (ordered decision tree that computes pairwise ranking values) applies user-selected sorting semantics for salary, location, company name, and application date.
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

  const statusStyles = darkMode ? statusStylesDark : statusStylesLight;

  const theme: ThemeStyles = {
    bg: darkMode ? 'bg-[#121316] text-[#f4f4f5]' : 'bg-[#FAF8F5] text-[#4E3B3B]',
    card: darkMode ? 'bg-[#1c1d22] border-[#2d2e36]' : 'bg-[#FFFDF9] border-[#FFE5E2]',
    innerCard: darkMode ? 'bg-[#1c1d22] border-[#2d2e36] text-[#a1a1aa]' : 'bg-white border-[#FFE5E2] text-[#4E3B3B]',
    input: darkMode ? 'bg-[#18181b] border-[#3f3f46] text-[#f4f4f5]' : 'bg-[#FFFDF9] border-[#FFE5E2] text-[#4E3B3B]',
    label: darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]',
    tableHeader: darkMode ? 'border-[#2d2e36] text-[#a1a1aa]' : 'border-[#F2E7DE] text-[#8D6F6F]',
    tableRow: darkMode ? 'border-[#2d2e36]' : 'border-[#F7EEE8]',
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

  // Component composition (parent orchestration layer that passes typed props into tab modules) enforces one-way data flow where container state becomes view-model input for presentation components.
  return (
    <div className={`min-h-screen overflow-x-hidden p-3 sm:p-8 font-['Karla',sans-serif] transition-colors ${theme.bg}`}>
      <div className="mx-auto max-w-screen-xl space-y-6">
        <section className={`rounded-[32px] border p-6 shadow-md sm:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Image
                src={darkMode ? '/Appli-Log_DarkMode.png' : '/Appli-Log.png'}
                alt="Appli-Log logo"
                width={128}
                height={128}
                className="mb-3 h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
              />
              <p className="text-sm uppercase tracking-[0.24em] text-[#E07A5F]">Welcome back</p>
              <h1 className={`mt-2 text-3xl font-semibold tracking-tight ${darkMode ? 'text-[#f4f4f5]' : 'text-[#4E3B3B]'}`}>
                Appli-Log Dashboard
              </h1>
              <p className={`mt-2 text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
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

        <div className="relative z-0 -mx-1 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-6">
          <div className="flex min-w-max gap-2">
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
                className={`relative -mb-[2px] shrink-0 rounded-t-2xl px-4 py-2.5 text-sm font-bold tracking-wide transition-all sm:px-6 ${
                  isActive
                    ? darkMode
                      ? 'border-t-2 border-x-2 border-[#3f3f46] bg-[#1c1d22] text-[#f87171] shadow-sm'
                      : 'border-t-2 border-x-2 border-[#FFE5E2] bg-[#FFFDF9] text-[#E07A5F] shadow-sm'
                    : darkMode
                    ? 'bg-[#1c1d22]/40 text-[#a1a1aa] hover:bg-[#1c1d22]/80'
                    : 'bg-[#FFE5E2]/40 text-[#8D6F6F] hover:bg-[#FFE5E2]/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          </div>
        </div>

        <div className="relative z-0 grid gap-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              theme={theme}
              darkMode={darkMode}
              form={form}
              handleInputChange={handleInputChange}
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
              darkMode={darkMode}
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