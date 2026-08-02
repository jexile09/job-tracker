'use client';

import type { JobRecord } from '../../types';

type SpreadsheetTabProps = {
  jobs: JobRecord[];
};

const formatCsvValue = (value: string | number | null | undefined) => {
  if (value == null) return '';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
};

export default function SpreadsheetTab({ jobs }: SpreadsheetTabProps) {
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
      'Tech Stack',
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
      job.tech_stack || '',
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
    <section className="rounded-[32px] border p-6 shadow-md bg-white text-[#4E3B3B]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Spreadsheet Export</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6C5656]">
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

      <div className="overflow-x-auto rounded-[28px] border border-[#F7EEE8] bg-[#FCF7F5] p-4 text-sm">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[#EEDDD1] text-xs uppercase tracking-[0.2em] text-[#8D6F6F]">
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Applied</th>
              <th className="px-3 py-2">Salary</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Tech Stack</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-[#F7EEE8]">
                <td className="px-3 py-3 font-semibold">{job.company_name}</td>
                <td className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-[#8D6F6F]">{job.status}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.applied_date}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.salary_range || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.location || '—'}</td>
                <td className="px-3 py-3 text-xs text-[#6C5656]">{job.tech_stack || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
