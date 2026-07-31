'use client';

import type { JobRecord, JobStatus } from '../../types';

type ArchiveTabProps = {
  theme: any;
  filteredJobs: JobRecord[];
  statusStyles: Record<JobStatus, string>;
  handleToggleArchive: (id: number, state: boolean) => void;
};

export default function ArchiveTab({ theme, filteredJobs, statusStyles, handleToggleArchive }: ArchiveTabProps) {
  return (
    <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
      <h3 className="text-2xl font-semibold">Archived Applications 📦</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className={`border-b ${theme.tableHeader}`}>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                <td className="px-3 py-3 font-semibold">{job.company_name}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(job.id, false)}
                    className={`rounded-xl border px-3 py-1 text-xs font-semibold ${theme.input}`}
                  >
                    Restore 🌸
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}