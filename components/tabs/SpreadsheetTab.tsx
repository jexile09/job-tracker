'use client';

import type { JobRecord } from '../../types';

type SpreadsheetTabProps = {
  jobs: JobRecord[];
  theme: any;
  darkMode: boolean;
};

const formatCsvValue = (value: string | number | null | undefined) => {
  if (value == null) return '';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
};

export default function SpreadsheetTab({ jobs, theme, darkMode }: SpreadsheetTabProps) {
  const downloadCsv = () => {
    const headers = [
      'Company',
      'Status',
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

    const rows = jobs.map((job) => [
      job.company_name,
      job.status,
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

  return (
    <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Spreadsheet Export</h2>
          <p className={`mt-2 max-w-2xl text-sm ${darkMode ? 'text-[#94A3B8]' : 'text-[#6C5656]'}`}>
            Download a CSV version of your tracked applications or preview rows before exporting.
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

      <div className={`overflow-x-auto rounded-[28px] border p-4 text-sm ${theme.innerCard}`}>
        <table className={`min-w-full text-left ${darkMode ? 'text-[#E2E8F0]' : 'text-[#4E3B3B]'}`}>
          <thead>
            <tr className={`border-b ${theme.tableHeader}`}>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Applied</th>
              <th className="px-3 py-2">Interview</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2">Salary</th>
              <th className="px-3 py-2">Rate Type</th>
              <th className="px-3 py-2">Work Type</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                <td className="px-3 py-3 font-semibold">{job.company_name}</td>
                <td className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-[#8D6F6F]">{job.status}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.applied_date}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.interview_date || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.deadline_date || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.salary_range || ''}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.salary_unit || 'year'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.work_type || 'remote'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.location || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.notes || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656] break-all">{job.application_link || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
