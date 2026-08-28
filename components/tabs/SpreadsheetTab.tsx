'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { JobRecord, JobStatus, ThemeStyles } from '../../types';
import { formatSalary } from '../../lib/salary';

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
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobRecord | null>(null);

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
      'Salary',
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
      formatSalary(job.salary_value, job.salary_unit, job.salary_currency),
      job.work_type || '',
      job.location || '',
      job.notes || '',
      job.application_link || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(formatCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    <div className={`w-full rounded-[28px] border p-4 text-sm ${theme.innerCard}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs opacity-70">{rows.length} item(s)</span>
      </div>

      <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className={`w-full table-auto text-left ${darkMode ? 'text-[#f4f4f5]' : 'text-[#4E3B3B]'}`}>
          <thead>
            <tr className={`border-b ${theme.tableHeader}`}>
              <th className="w-2/12 px-3 py-3 font-semibold">Company</th>
              <th className="w-1/12 px-3 py-3 font-semibold">Status</th>
              <th className="w-2/12 px-3 py-3 font-semibold">Applied</th>
              <th className="w-3/12 px-3 py-3 font-semibold">Interview</th>
              <th className="w-2/12 px-3 py-3 font-semibold">Salary</th>
              <th className="w-2/12 px-3 py-3 font-semibold">Location</th>
              <th className="w-1/12 px-3 py-3 text-right font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((job) => (
              <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                <td className="px-3 py-3.5 font-semibold">{job.company_name}</td>
                <td className="px-3 py-3.5 text-xs uppercase tracking-[0.1em]">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${statusStyles[job.status]}`}>{job.status}</span>
                </td>
                <td className={`px-3 py-3.5 text-xs ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>{job.applied_date}</td>
                <td className={`px-3 py-3.5 text-xs ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{formatInterviewDateTime(job.interview_date)}</span>
                    {job.interview_date ? (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getWeekdayChipStyle(job.interview_date)}`}>
                        {getWeekdayLabel(job.interview_date)}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={`px-3 py-3.5 text-xs ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
                  {formatSalary(job.salary_value, job.salary_unit, job.salary_currency) || '—'}
                </td>
                <td className={`px-3 py-3.5 text-xs ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>{job.location || '—'}</td>
                <td className="px-3 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForDetails(job)}
                    className={`rounded-xl border px-3 py-1 text-xs font-semibold whitespace-nowrap ${theme.input}`}
                  >
                    Show Details
                  </button>
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
    <>
      <section className={`rounded-[32px] border p-5 shadow-md sm:p-6 ${theme.card}`}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Spreadsheet</h2>
            <p className={`mt-2 max-w-2xl text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
              Filter rows, scan status colors quickly, and export the current filtered dataset.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${darkMode ? 'bg-[#f87171] hover:bg-[#ef4444]' : 'bg-[#FFB7B2] hover:bg-[#FFA9A0]'}`}
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

      {selectedJobForDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-[28px] border p-6 shadow-xl ${theme.card}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{selectedJobForDetails.company_name}</h3>
                <p className="mt-1 text-xs opacity-75">
                  {formatInterviewDateTime(selectedJobForDetails.interview_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForDetails(null)}
                className="rounded-lg p-1 transition hover:opacity-75"
                aria-label="Close dialog"
              >
                <Image
                  src="/icons/Close.png"
                  alt="Close icon"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              </button>
            </div>

            <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
              <p className="text-xs uppercase tracking-[0.16em] opacity-70">Notes</p>
              <p className="mt-2 whitespace-pre-wrap break-words">{selectedJobForDetails.notes || 'No notes yet.'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}