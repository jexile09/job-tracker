'use client';

import { useState } from 'react';
import type { JobRecord, JobStatus } from '../../types';

type CleanupRules = {
  rejected: boolean;
  olderThanOneWeek: boolean;
  olderThanOneMonth: boolean;
  olderThanThreeMonths: boolean;
};

type ArchiveTabProps = {
  theme: any;
  darkMode: boolean;
  filteredJobs: JobRecord[];
  statusStyles: Record<JobStatus, string>;
  handleToggleArchive: (id: number, state: boolean) => void;
  jobs: JobRecord[];
  onRunCleanup: (rules: CleanupRules) => Promise<void>;
  cleanupLoading: boolean;
};

export default function ArchiveTab({
  theme,
  darkMode,
  filteredJobs,
  statusStyles,
  handleToggleArchive,
  jobs,
  onRunCleanup,
  cleanupLoading,
}: ArchiveTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rules, setRules] = useState<CleanupRules>({
    rejected: true,
    olderThanOneWeek: false,
    olderThanOneMonth: false,
    olderThanThreeMonths: false,
  });

  const toggleRule = (key: keyof CleanupRules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRunCleanup = async () => {
    await onRunCleanup(rules);
    setIsModalOpen(false);
  };

  return (
    <>
      <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-semibold">Archived Applications 📦</h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${darkMode ? 'border-[#475569] bg-[#1E293B] text-[#E2E8F0] hover:bg-[#334155]' : 'border-[#FFE5E2] bg-[#FFFDF9] text-[#6C5656] hover:bg-[#FFE5E2]'}`}
          >
            Auto-Archive Rules ⚙️
          </button>
        </div>

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

        <div className={`mt-4 rounded-2xl border p-4 text-sm ${darkMode ? 'border-[#334155] bg-[#111827] text-[#E2E8F0]' : 'border-[#FFE5E2] bg-[#FFFDF9] text-[#6C5656]'}`}>
          <p className={`font-semibold ${darkMode ? 'text-[#F8FAFC]' : 'text-[#4E3B3B]'}`}>Active jobs ready for cleanup</p>
          <p className="mt-1">{jobs.filter((job) => !job.is_archived).length} active applications currently tracked.</p>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-[30px] border p-6 shadow-xl ${theme.card}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme.tableHeader}`}>
              <h4 className={`text-lg font-semibold ${darkMode ? 'text-[#E2E8F0]' : 'text-[#4E3B3B]'}`}>Auto-Archive Rules</h4>
              <button type="button" onClick={() => setIsModalOpen(false)} className={`text-sm ${darkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0]' : 'text-[#8D6F6F] hover:text-[#4E3B3B]'}`}>
                ✕
              </button>
            </div>

            <div className={`mt-4 space-y-3 text-sm ${darkMode ? 'text-[#CBD5E1]' : 'text-[#6C5656]'}`}>
              <label className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.innerCard}`}>
                <input type="checkbox" checked={rules.rejected} onChange={() => toggleRule('rejected')} className="h-4 w-4 rounded border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]" />
                <span>Archive all Rejected applications</span>
              </label>
              <label className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.innerCard}`}>
                <input type="checkbox" checked={rules.olderThanOneWeek} onChange={() => toggleRule('olderThanOneWeek')} className="h-4 w-4 rounded border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]" />
                <span>Archive applications older than 1 week</span>
              </label>
              <label className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.innerCard}`}>
                <input type="checkbox" checked={rules.olderThanOneMonth} onChange={() => toggleRule('olderThanOneMonth')} className="h-4 w-4 rounded border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]" />
                <span>Archive applications older than 1 month</span>
              </label>
              <label className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.innerCard}`}>
                <input type="checkbox" checked={rules.olderThanThreeMonths} onChange={() => toggleRule('olderThanThreeMonths')} className="h-4 w-4 rounded border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]" />
                <span>Archive applications older than 3 months</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleRunCleanup}
              disabled={cleanupLoading}
              className="mt-6 w-full rounded-2xl bg-[#FFB7B2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#FFA9A0] disabled:opacity-70"
            >
              {cleanupLoading ? 'Working…' : 'Run Cleanup'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}