export type JobStatus = 'applied' | 'interview' | 'offered' | 'rejected';
export type ActiveTab = 'dashboard' | 'archive' | 'calendar' | 'settings';

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
  resume_storage_path: string | null;
  cover_letter_storage_path: string | null;
  resume_url?: string | null;
  cover_letter_url?: string | null;
  created_at?: string;
};

export type AuthSession = {
  user: {
    id: string;
    email?: string | null;
  };
} | null;

export type FormState = {
  company_name: string;
  application_link: string;
  notes: string;
  status: JobStatus;
  applied_date: string;
  interview_date: string;
  deadline_date: string;
};