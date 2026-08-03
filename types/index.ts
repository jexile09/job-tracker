export type WorkType = 'remote' | 'hybrid' | 'onsite';
export type JobStatus = 'applied' | 'interview' | 'offered' | 'rejected';
export type ActiveTab = 'dashboard' | 'archive' | 'calendar' | 'settings' | 'spreadsheet';
export type SalaryUnit = 'year' | 'hour' | 'salary';
export type SalaryCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'JPY';
export type DashboardSortOption =
  | 'salary_desc'
  | 'salary_asc'
  | 'location_asc'
  | 'location_desc'
  | 'name_asc'
  | 'name_desc'
  | 'applied_desc'
  | 'applied_asc';

export type DashboardPreferences = {
  showOnlyOpen: boolean;
  compactView: boolean;
  hideDetailsByDefault: boolean;
  showSalaryColumn: boolean;
  showLocationColumn: boolean;
  showOpenApplicationsCard: boolean;
  showUpcomingInterviewsCard: boolean;
  showArchivedCard: boolean;
  showStatusBreakdown: boolean;
  dashboardSort: DashboardSortOption;
};

export type ThemeStyles = {
  bg: string;
  card: string;
  innerCard: string;
  input: string;
  label: string;
  tableHeader: string;
  tableRow: string;
};

export type AuthSession = {
  user?: {
    id?: string;
    email?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
} | null;

export type JobRecord = {
  id: number;
  user_id: string;
  company_name: string;
  application_link: string | null;
  notes: string | null;
  status: JobStatus;
  applied_date: string;
  interview_date?: string | null;
  deadline_date?: string | null;
  is_archived?: boolean | null;

  salary_range?: string | null;
  salary_value?: number | null;
  salary_unit?: SalaryUnit | null;
  salary_currency?: SalaryCurrency | null;
  work_type?: WorkType | null;
  location?: string | null;
  tech_stack?: string | null;

  resume_storage_path: string | null;
  cover_letter_storage_path: string | null;
  resume_url?: string | null;
  cover_letter_url?: string | null;
  created_at?: string;
};

export type FormState = {
  company_name: string;
  application_link: string;
  notes: string;
  status: JobStatus;
  applied_date: string;
  interview_date: string;
  deadline_date: string;
  salary_range: string;
  salary_value?: string;
  salary_unit?: SalaryUnit;
  salary_currency?: SalaryCurrency;
  work_type: WorkType;
  location: string;
  resume_storage_path?: string;
  cover_letter_storage_path?: string;
};