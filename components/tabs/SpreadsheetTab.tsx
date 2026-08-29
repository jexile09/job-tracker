'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';
import type { JobRecord, JobStatus, SalaryCurrency, ThemeStyles, WorkType } from '../../types';
import { formatSalary } from '../../lib/salary';

/* TypeScript interface defining all data and callback props accepted by the spreadsheet tab view */
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

/* Standard column names used when exporting records or generating blank import files */
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

/* Helper function that wraps CSV cell values in quotation marks if they contain commas, newlines, or quotes */
const escapeCsvValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/* Custom text parser that breaks raw CSV files into individual rows and columns while respecting quoted blocks */
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

/* Reusable SVG dropdown arrow icon for select input fields */
function DropdownChevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
  /* References and states for file input handling, loading status, and search filters */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'active' | 'archived'>('all');

  /* Dictionary holding boolean expansion states for row notes drawers */
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  const toggleNoteDetails = (id: number) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setArchiveFilter('all');
  };

  /* Generates and triggers download for a clean template CSV file */
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
      'First round screening completed',
    ];

    const csvContent = [CSV_HEADERS.join(','), exampleRow.map(escapeCsvValue).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'appli_log_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* Exports the currently filtered rows into a downloadable CSV file */
  const handleExportFilteredCsv = () => {
    if (filteredJobs.length === 0) {
      setFeedback({ type: 'error', text: 'No matching jobs to export with current filters.' });
      return;
    }

    const rows = filteredJobs.map((j) => [
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
    link.setAttribute('download', `appli_log_spreadsheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* Reads an uploaded CSV file, validates rows, and bulk inserts records into Supabase */
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
        throw new Error('The uploaded CSV is empty or missing data rows.');
      }

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
            company_name: row[0]?.trim() || 'Untitled Position',
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

      setFeedback({ type: 'success', text: `Successfully imported ${parsedJobs.length} job application(s)!` });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import CSV.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Filters the jobs collection based on search query, status, and archive state */
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      if (archiveFilter === 'active' && job.is_archived) return false;
      if (archiveFilter === 'archived' && !job.is_archived) return false;
      if (selectedStatus !== 'all' && job.status !== selectedStatus) return false;

      if (q) {
        const matchCompany = job.company_name.toLowerCase().includes(q);
        const matchLocation = (job.location || '').toLowerCase().includes(q);
        const matchNotes = (job.notes || '').toLowerCase().includes(q);
        if (!matchCompany && !matchLocation && !matchNotes) return false;
      }

      return true;
    });
  }, [jobs, searchQuery, selectedStatus, archiveFilter]);

  const notArchivedJobs = useMemo(() => filteredJobs.filter((j) => !j.is_archived), [filteredJobs]);
  const archivedJobs = useMemo(() => filteredJobs.filter((j) => j.is_archived), [filteredJobs]);

  const buttonStyle = 'text-xs px-3 py-1.5';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 lg:p-8 shadow-md transition-all ${theme.card}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold leading-none">Spreadsheet</h2>
            <p className={`mt-2 text-xs sm:text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
              Filter rows, scan status colors quickly, and export the current filtered dataset.
            </p>
          </div>

          {/* Action Toolbar with lighter pastel pink button tones matching the Dashboard "Add Application" button */}
          <div className="flex flex-wrap items-center gap-2.5">
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
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition hover:opacity-90 active:scale-[0.99] ${
                darkMode
                  ? 'bg-[#352528] text-[#fca5a5] border border-[#f87171]/40 hover:bg-[#402d31]'
                  : 'bg-[#FFE2DE] text-[#7A2C3B] border border-[#FFCCD3] hover:bg-[#FFD9D3]'
              }`}
            >
              <span>Download Template</span>
              <Image
                src={darkMode ? '/Template_DarkMode.png' : '/Template.png'}
                alt="Template Icon"
                width={18}
                height={18}
                unoptimized
                className="h-4 w-4 object-contain"
              />
            </button>

            {/* Import CSV Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 ${
                darkMode
                  ? 'bg-[#352528] text-[#fca5a5] border border-[#f87171]/40 hover:bg-[#402d31]'
                  : 'bg-[#FFE2DE] text-[#7A2C3B] border border-[#FFCCD3] hover:bg-[#FFD9D3]'
              }`}
            >
              <span>{importing ? 'Importing…' : 'Import CSV'}</span>
              <Image
                src={darkMode ? '/Import_DarkMode.png' : '/Import.png'}
                alt="Import Icon"
                width={18}
                height={18}
                unoptimized
                className="h-4 w-4 object-contain"
              />
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportFilteredCsv}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition hover:opacity-90 active:scale-[0.99] ${
                darkMode
                  ? 'bg-[#352528] text-[#fca5a5] border border-[#f87171]/40 hover:bg-[#402d31]'
                  : 'bg-[#FFE2DE] text-[#7A2C3B] border border-[#FFCCD3] hover:bg-[#FFD9D3]'
              }`}
            >
              <span>Export CSV</span>
              <Image
                src={darkMode ? '/Export_DarkMode.png' : '/Export.png'}
                alt="Export Icon"
                width={18}
                height={18}
                unoptimized
                className="h-4 w-4 object-contain"
              />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="text"
            placeholder="Search company, location, notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full lg:w-72 rounded-2xl border px-3.5 py-2.5 text-sm outline-none transition ${theme.input}`}
          />

          <div className="relative w-full sm:w-44">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full appearance-none rounded-2xl border pl-3.5 pr-10 py-2.5 text-sm outline-none transition ${theme.input}`}
            >
              <option value="all">All statuses</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
            <DropdownChevron />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value as 'all' | 'active' | 'archived')}
              className={`w-full appearance-none rounded-2xl border pl-3.5 pr-10 py-2.5 text-sm outline-none transition ${theme.input}`}
            >
              <option value="all">All archive states</option>
              <option value="active">Not Archived only</option>
              <option value="archived">Archived only</option>
            </select>
            <DropdownChevron />
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${theme.innerCard} hover:opacity-90`}
          >
            Clear filters
          </button>
        </div>

        {/* Status Counters */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl border p-4 ${theme.innerCard}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Filtered Total</p>
            <p className="mt-1 text-2xl font-bold">{filteredJobs.length}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${theme.innerCard}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Not Archived</p>
            <p className="mt-1 text-2xl font-bold">{notArchivedJobs.length}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${theme.innerCard}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Archived</p>
            <p className="mt-1 text-2xl font-bold">{archivedJobs.length}</p>
          </div>
        </div>

        {/* Upload Alert Feedback */}
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
      </section>

      {/* Table Section: Not Archived */}
      {(archiveFilter === 'all' || archiveFilter === 'active') && (
        <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 shadow-md transition-all ${theme.card}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Not Archived</h3>
            <span className="text-xs opacity-70">{notArchivedJobs.length} item(s)</span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-transparent [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead>
                <tr className={`border-b ${theme.tableHeader}`}>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Applied</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Interview</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Salary</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Location</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody>
                {notArchivedJobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr className={`border-b ${theme.tableRow}`}>
                      <td className="px-4 py-3.5 font-semibold">
                        {job.company_name}
                        {job.application_link && (
                          <a
                            href={job.application_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block text-xs text-[#E07A5F] underline font-normal"
                          >
                            Link
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusStyles[job.status]}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs opacity-80 whitespace-nowrap">{job.applied_date}</td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {job.interview_date ? (
                          <div>
                            <div>{formatInterviewDateTime(job.interview_date)}</div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getWeekdayChipStyle(job.interview_date)}`}>
                              {new Date(job.interview_date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span className="opacity-50">No interview date</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap opacity-80">
                        {formatSalary(job.salary_value, job.salary_unit, job.salary_currency) || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap opacity-80">{job.location || '—'}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleNoteDetails(job.id)}
                          className={`rounded-xl border ${buttonStyle} font-semibold transition ${theme.innerCard}`}
                        >
                          {expandedNotes[job.id] ? 'Hide Details' : 'Show Details'}
                        </button>
                      </td>
                    </tr>

                    {expandedNotes[job.id] && (
                      <tr className={theme.tableRow}>
                        <td colSpan={7} className={`px-4 py-3 text-xs ${theme.input}`}>
                          <div className="space-y-1">
                            <span className="font-bold opacity-75">Notes: </span>
                            <span>{job.notes || 'No extra notes recorded.'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {notArchivedJobs.length === 0 && (
            <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
              No active applications match your filter selections.
            </div>
          )}
        </section>
      )}

      {/* Table Section: Archived */}
      {(archiveFilter === 'all' || archiveFilter === 'archived') && (
        <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 shadow-md transition-all ${theme.card}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Archived</h3>
            <span className="text-xs opacity-70">{archivedJobs.length} item(s)</span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-transparent [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead>
                <tr className={`border-b ${theme.tableHeader}`}>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Applied</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Interview</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Salary</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Location</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody>
                {archivedJobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr className={`border-b ${theme.tableRow}`}>
                      <td className="px-4 py-3.5 font-semibold">{job.company_name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusStyles[job.status]}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs opacity-80 whitespace-nowrap">{job.applied_date}</td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {job.interview_date ? (
                          <div>
                            <div>{formatInterviewDateTime(job.interview_date)}</div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getWeekdayChipStyle(job.interview_date)}`}>
                              {new Date(job.interview_date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span className="opacity-50">No interview date</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap opacity-80">
                        {formatSalary(job.salary_value, job.salary_unit, job.salary_currency) || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap opacity-80">{job.location || '—'}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleNoteDetails(job.id)}
                          className={`rounded-xl border ${buttonStyle} font-semibold transition ${theme.innerCard}`}
                        >
                          {expandedNotes[job.id] ? 'Hide Details' : 'Show Details'}
                        </button>
                      </td>
                    </tr>

                    {expandedNotes[job.id] && (
                      <tr className={theme.tableRow}>
                        <td colSpan={7} className={`px-4 py-3 text-xs ${theme.input}`}>
                          <div className="space-y-1">
                            <span className="font-bold opacity-75">Notes: </span>
                            <span>{job.notes || 'No extra notes recorded.'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {archivedJobs.length === 0 && (
            <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
              No archived applications match your filter selections.
            </div>
          )}
        </section>
      )}
    </div>
  );
}