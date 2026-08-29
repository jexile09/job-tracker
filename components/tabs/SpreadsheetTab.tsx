'use client';

import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { JobRecord, JobStatus, SalaryCurrency, ThemeStyles, WorkType } from '../../types';

type SpreadsheetTabProps = {
  jobs: JobRecord[];
  theme: ThemeStyles;
  darkMode: boolean;
  statusStyles: Record<JobStatus, string>;
  formatInterviewDateTime: (d: string | null | undefined) => string;
  getWeekdayChipStyle: (d: string | null | undefined) => string;
  userId?: string;
  onRefresh?: () => void;
};

/* CSV Template Header Definition */
const CSV_HEADERS = [
  'Company Name',
  'Application Link',
  'Status',
  'Applied Date',
  'Interview Date',
  'Deadline Date',
  'Salary Value',
  'Pay Type',
  'Currency',
  'Work Type',
  'Location',
  'Notes',
];

/* Helper to escape and format strings for CSV output */
const escapeCsvValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/* Robust client-side CSV line parser supporting double-quoted fields with commas */
const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

export default function SpreadsheetTab({
  jobs,
  theme,
  darkMode,
  statusStyles,
  formatInterviewDateTime,
  getWeekdayChipStyle,
  userId,
  onRefresh,
}: SpreadsheetTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* 1. Download Blank Sample CSV Template */
  const handleDownloadTemplate = () => {
    const exampleRow = [
      'Example Tech',
      'https://example.com/careers/swe',
      'applied',
      new Date().toISOString().split('T')[0],
      '',
      '',
      '85000',
      'year',
      'USD',
      'remote',
      'Remote, US',
      'Referred by university alumni',
    ];

    const csvContent = [CSV_HEADERS.join(','), exampleRow.map(escapeCsvValue).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'appli_log_job_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* 2. Export Current Job Applications to CSV */
  const handleExportCsv = () => {
    if (jobs.length === 0) {
      setFeedback({ type: 'error', text: 'No job entries available to export.' });
      return;
    }

    const rows = jobs.map((j) => [
      escapeCsvValue(j.company_name),
      escapeCsvValue(j.application_link || ''),
      escapeCsvValue(j.status),
      escapeCsvValue(j.applied_date),
      escapeCsvValue(j.interview_date || ''),
      escapeCsvValue(j.deadline_date || ''),
      escapeCsvValue(j.salary_value ?? ''),
      escapeCsvValue(j.salary_unit || 'year'),
      escapeCsvValue(j.salary_currency || 'USD'),
      escapeCsvValue(j.work_type || 'remote'),
      escapeCsvValue(j.location || ''),
      escapeCsvValue(j.notes || ''),
    ]);

    const csvContent = [CSV_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appli_log_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* 3. Handle File Upload and Import */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supabase || !userId) {
      setFeedback({ type: 'error', text: 'You must be signed in to import applications.' });
      return;
    }

    setImporting(true);
    setFeedback(null);

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);

      if (rows.length <= 1) {
        throw new Error('CSV file is empty or missing data rows.');
      }

      /* Skip header row */
      const dataRows = rows.slice(1);
      const today = new Date().toISOString().split('T')[0];

      const validStatuses: JobStatus[] = ['applied', 'interview', 'offered', 'rejected'];
      const validWorkTypes: WorkType[] = ['remote', 'hybrid', 'onsite'];

      const parsedJobs = dataRows
        .filter((row) => row.length > 0 && row[0]?.trim())
        .map((row) => {
          const rawStatus = row[2]?.toLowerCase().trim() as JobStatus;
          const status: JobStatus = validStatuses.includes(rawStatus) ? rawStatus : 'applied';

          const rawWorkType = row[9]?.toLowerCase().trim() as WorkType;
          const work_type: WorkType = validWorkTypes.includes(rawWorkType) ? rawWorkType : 'remote';

          const rawSalaryVal = row[6]?.replace(/[^0-9.]/g, '');
          const salary_value = rawSalaryVal && !Number.isNaN(Number(rawSalaryVal)) ? Number(rawSalaryVal) : null;

          const rawUnit = row[7]?.toLowerCase().trim();
          const salary_unit = rawUnit === 'hour' || rawUnit === 'hr' ? 'hour' : 'year';

          return {
            user_id: userId,
            company_name: row[0]?.trim() || 'Untitled Role',
            application_link: row[1]?.trim() || '',
            status,
            applied_date: row[3]?.trim() || today,
            interview_date: row[4]?.trim() || '',
            deadline_date: row[5]?.trim() || '',
            salary_value,
            salary_unit,
            salary_currency: (row[8]?.trim().toUpperCase() || 'USD') as SalaryCurrency,
            work_type,
            location: row[10]?.trim() || '',
            notes: row[11]?.trim() || '',
            is_archived: false,
          };
        });

      if (parsedJobs.length === 0) {
        throw new Error('No valid job rows found in the CSV.');
      }

      const { error } = await supabase.from('jobs').insert(parsedJobs);
      if (error) throw error;

      setFeedback({ type: 'success', text: `Successfully imported ${parsedJobs.length} application(s)!` });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import CSV.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 lg:p-8 shadow-md transition-all ${theme.card}`}>
        {/* Header and CSV Action Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold leading-none">Spreadsheet Overview</h2>
            <p className={`mt-2 text-xs sm:text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
              Manage, import, or export all {jobs.length} tracked applications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hidden CSV File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Download Template Button */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:opacity-90 ${theme.innerCard}`}
            >
              <span aria-hidden="true">📋</span>
              <span>Template</span>
            </button>

            {/* Import CSV Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 ${
                darkMode ? 'bg-[#FA6E6E] hover:bg-[#f85c5c]' : 'bg-[#FFAAA6] hover:bg-[#ff9e9a]'
              }`}
            >
              <span aria-hidden="true">📥</span>
              <span>{importing ? 'Importing…' : 'Import CSV'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:opacity-90 ${theme.innerCard}`}
            >
              <span aria-hidden="true">📤</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Message */}
        {feedback && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-2.5 text-xs ${
              feedback.type === 'success'
                ? darkMode
                  ? 'border-[#1c3321] bg-[#18181b] text-[#7de0a0]'
                  : 'border-[#DDF3E3] bg-[#F3FFF7] text-[#3F6B4C]'
                : darkMode
                ? 'border-[#331c1c] bg-[#18181b] text-[#f87171]'
                : 'border-[#FFE2E2] bg-[#FFF5F5] text-[#A04A4A]'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Full Application Data Grid */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-transparent [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Applied Date</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Work Type</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Interview</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Location</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                  <td className="px-4 py-3 font-semibold">
                    <div>{job.company_name}</div>
                    {job.application_link ? (
                      <a
                        href={job.application_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block text-xs text-[#E07A5F] underline"
                      >
                        Link
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs opacity-80 whitespace-nowrap">{job.applied_date}</td>
                  <td className="px-4 py-3 text-xs opacity-80 capitalize whitespace-nowrap">{job.work_type || 'remote'}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {job.interview_date ? (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getWeekdayChipStyle(job.interview_date)}`}>
                        {formatInterviewDateTime(job.interview_date)}
                      </span>
                    ) : (
                      <span className="opacity-50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs opacity-80 whitespace-nowrap">{job.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {jobs.length === 0 ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
            No applications found. Use "Import CSV" or "Add New Application" on the Dashboard.
          </div>
        ) : null}
      </section>
    </div>
  );
}