'use client';

import { useMemo, useState } from 'react';
import type { JobRecord, JobStatus, ThemeStyles } from '../../types';

type SpreadsheetTabProps = {
  jobs: JobRecord[];
  theme: ThemeStyles;
  darkMode: boolean;
  statusStyles: Record<JobStatus, string>;
  formatInterviewDateTime: (value: string | null | undefined) => string;
  getWeekdayChipStyle: (value: string | null | undefined) => string;
};

const formatCsvValue = (value: string | number | null | undefined) => {
  if (value == null) return '';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
};

const getWeekdayLabel = (value: string | null | undefined) => {
  if (!value) return 'No day';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString('en-US', { weekday: 'short' });
};

export default function SpreadsheetTab({
  jobs,
  theme,
  darkMode,
  statusStyles,
  formatInterviewDateTime,
  getWeekdayChipStyle,
}: SpreadsheetTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'active' | 'archived'>('all');

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (archiveFilter === 'active' && job.is_archived) return false;
      if (archiveFilter === 'archived' && !job.is_archived) return false;

      if (!query) return true;
      return [job.company_name, job.location || '', job.notes || ''].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [archiveFilter, jobs, search, statusFilter]);

  const activeRows = filteredJobs.filter((job) => !job.is_archived);
  const archivedRows = filteredJobs.filter((job) => job.is_archived);

  const downloadCsv = () => {
    const headers = [
      'Company',
      'Status',
      'Archived',
      'Applied Date',
      'Interview Date',
      'Deadline Date',
      'Salary Range',
      'Salary Unit',
      'Work Type',
      'Location',
      'Notes',
      'Application Link',
    ];

    const rows = filteredJobs.map((job) => [
      job.company_name,
      job.status,
      job.is_archived ? 'Yes' : 'No',
      job.applied_date,
      job.interview_date || '',
      job.deadline_date || '',
      job.salary_range || '',
      job.salary_unit || '',
      job.work_type || '',
      job.location || '',
      job.notes || '',
      job.application_link || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(formatCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'appli-log-jobs.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setArchiveFilter('all');
  };

  const renderTable = (rows: JobRecord[], title: string) => (
    <div className={`rounded-[28px] border p-4 text-sm ${theme.innerCard}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs opacity-70">{rows.length} item(s)</span>
      </div>

      <div className="overflow-x-auto">
        <table className={`min-w-full text-left ${darkMode ? 'text-[#E2E8F0]' : 'text-[#4E3B3B]'}`}>
          <thead>
            <tr className={`border-b ${theme.tableHeader}`}>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Applied</th>
              <th className="px-3 py-2">Interview</th>
              <th className="px-3 py-2">Salary</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((job) => (
              <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                <td className="px-3 py-3 font-semibold">{job.company_name}</td>
                <td className="px-3 py-3 text-xs uppercase tracking-[0.1em]">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${statusStyles[job.status]}`}>{job.status}</span>
                </td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.applied_date}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">
                  <div>{formatInterviewDateTime(job.interview_date)}</div>
                  {job.interview_date ? (
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${getWeekdayChipStyle(job.interview_date)}`}>
                      {getWeekdayLabel(job.interview_date)}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.salary_range || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.location || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656] max-w-[280px]">
                  {job.interview_date ? (
                    <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${getWeekdayChipStyle(job.interview_date)}`}>
                      {getWeekdayLabel(job.interview_date)}
                    </span>
                  ) : null}
                  <p className="line-clamp-3">{job.notes || '—'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed p-3 text-xs opacity-70">No rows in this section.</div>
      ) : null}
    </div>
  );

  return (
    <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Spreadsheet</h2>
          <p className={`mt-2 max-w-2xl text-sm ${darkMode ? 'text-[#94A3B8]' : 'text-[#6C5656]'}`}>
            Filter rows, scan status colors quickly, and export the current filtered dataset.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-2xl bg-[#FFB7B2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#FFA9A0]"
        >
          Download CSV
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, location, notes"
          className={`rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | JobStatus)}
          className={`rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
        >
          <option value="all">All statuses</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offered">Offered</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={archiveFilter}
          onChange={(e) => setArchiveFilter(e.target.value as 'all' | 'active' | 'archived')}
          className={`rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
        >
          <option value="all">All archive states</option>
          <option value="active">Not archived</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${theme.input}`}
        >
          Clear filters
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className={`rounded-2xl border p-3 ${theme.innerCard}`}>
          <p className="text-xs uppercase tracking-[0.18em] opacity-70">Filtered Total</p>
          <p className="mt-1 text-xl font-semibold">{filteredJobs.length}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${theme.innerCard}`}>
          <p className="text-xs uppercase tracking-[0.18em] opacity-70">Not Archived</p>
          <p className="mt-1 text-xl font-semibold">{activeRows.length}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${theme.innerCard}`}>
          <p className="text-xs uppercase tracking-[0.18em] opacity-70">Archived</p>
          <p className="mt-1 text-xl font-semibold">{archivedRows.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {renderTable(activeRows, 'Not Archived')}
        {renderTable(archivedRows, 'Archived')}
      </div>
    </section>
  );
}