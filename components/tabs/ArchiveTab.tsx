'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { JobRecord, JobStatus, ThemeStyles } from '../../types';

type CleanupRules = {
  rejected: boolean;
  olderThanOneWeek: boolean;
  olderThanOneMonth: boolean;
  olderThanThreeMonths: boolean;
};

type ArchiveTabProps = {
  theme: ThemeStyles;
  darkMode: boolean;
  filteredJobs: JobRecord[];
  statusStyles: Record<JobStatus, string>;
  handleToggleArchive: (id: number, state: boolean) => void;
  jobs: JobRecord[];
  onRunCleanup: (rules: CleanupRules) => Promise<void>;
  cleanupLoading: boolean;
};

/* Vector blossom icon matching the DashboardTab Add Application styling */
function BlossomIcon({ darkMode }: { darkMode: boolean }) {
  const petalFill = darkMode ? '#F4727C' : '#FFB5C5';
  const petalStroke = darkMode ? '#9A2B35' : '#D6657A';
  const stamenColor = darkMode ? '#7F1D24' : '#C4884D';
  const centerColor = darkMode ? '#A3343E' : '#F9D1A2';

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-4 w-4 shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <g id="archivePetalFull">
          <path
            d="M 50 50 C 40 38 32 24 38 12 C 43 2 48 10 50 14 C 52 10 57 2 62 12 C 68 24 60 38 50 50 Z"
            fill={petalFill}
            stroke={petalStroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M 50 34 L 50 20" stroke={petalStroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </g>
      </defs>

      <g>
        <use href="#archivePetalFull" />
        <use href="#archivePetalFull" transform="rotate(72 50 50)" />
        <use href="#archivePetalFull" transform="rotate(144 50 50)" />
        <use href="#archivePetalFull" transform="rotate(216 50 50)" />
        <use href="#archivePetalFull" transform="rotate(288 50 50)" />
      </g>

      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="29" stroke={stamenColor} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="50" cy="28" r="2.2" fill={stamenColor} />
        </g>
      ))}

      <circle cx="50" cy="50" r="6.5" fill={centerColor} stroke={stamenColor} strokeWidth="1.5" />
    </svg>
  );
}

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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 lg:p-8 shadow-md transition-all ${theme.card}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-end gap-3.5">
            <h2 className="text-2xl sm:text-3xl font-semibold leading-none">Archived Applications</h2>
            <div className="relative flex items-end justify-center h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0 translate-y-2 sm:translate-y-2.5">
              <Image
                src={darkMode ? '/Archive_DarkMode.png' : '/Archive.png'}
                alt="Blossom Archive Box"
                width={96}
                height={96}
                priority
                unoptimized
                className="h-full w-full object-contain object-bottom"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition whitespace-nowrap hover:opacity-90 active:scale-[0.99] ${
              darkMode
                ? 'bg-[#FA6E6E] hover:bg-[#f85c5c]'
                : 'bg-[#FFAAA6] hover:bg-[#ff9e9a]'
            }`}
          >
            <span>Auto-Archive Rules</span>
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-transparent [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                  <td className="px-4 py-3.5 font-semibold">{job.company_name}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {/* Restore button matches the Add Application button palette */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(job.id, false)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-150 hover:opacity-95 active:scale-[0.99] ${
                        darkMode
                          ? 'bg-[#352528] text-[#fca5a5] border border-[#f87171]/40 hover:bg-[#402d31]'
                          : 'bg-[#FFE2DE] text-[#7A2C3B] border border-[#FFCCD3] hover:bg-[#FFD9D3]'
                      }`}
                    >
                      <span>Restore</span>
                      <BlossomIcon darkMode={darkMode} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
            No archived applications found.
          </div>
        ) : null}

        <div
          className={`mt-6 rounded-2xl border p-4 text-sm transition ${
            darkMode
              ? 'border-[#2d2e36] bg-[#1c1d22] text-[#f4f4f5]'
              : 'border-[#FFE5E2] bg-[#FFFDF9] text-[#6C5656]'
          }`}
        >
          <p className={`font-semibold ${darkMode ? 'text-[#f4f4f5]' : 'text-[#4E3B3B]'}`}>
            Active applications ready for cleanup
          </p>
          <p className="mt-1 opacity-85">
            {jobs.filter((job) => !job.is_archived).length} active applications currently tracked.
          </p>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-[28px] sm:rounded-[32px] border p-5 sm:p-6 shadow-2xl transition-all ${theme.card}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme.tableHeader}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-[#f4f4f5]' : 'text-[#4E3B3B]'}`}>
                Auto-Archive Rules
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`text-sm p-1 transition ${
                  darkMode ? 'text-[#a1a1aa] hover:text-[#f4f4f5]' : 'text-[#8D6F6F] hover:text-[#4E3B3B]'
                }`}
              >
                ✕
              </button>
            </div>

            <div className={`mt-4 space-y-3 text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.rejected}
                  onChange={() => toggleRule('rejected')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#FA6E6E] focus:ring-[#FA6E6E]'
                      : 'border-[#FFAAA6] text-[#FFAAA6] focus:ring-[#FFAAA6]'
                  }`}
                />
                <span>Archive all Rejected applications</span>
              </label>

              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.olderThanOneWeek}
                  onChange={() => toggleRule('olderThanOneWeek')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#FA6E6E] focus:ring-[#FA6E6E]'
                      : 'border-[#FFAAA6] text-[#FFAAA6] focus:ring-[#FFAAA6]'
                  }`}
                />
                <span>Archive applications older than 1 week</span>
              </label>

              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.olderThanOneMonth}
                  onChange={() => toggleRule('olderThanOneMonth')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#FA6E6E] focus:ring-[#FA6E6E]'
                      : 'border-[#FFAAA6] text-[#FFAAA6] focus:ring-[#FFAAA6]'
                  }`}
                />
                <span>Archive applications older than 1 month</span>
              </label>

              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.olderThanThreeMonths}
                  onChange={() => toggleRule('olderThanThreeMonths')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#FA6E6E] focus:ring-[#FA6E6E]'
                      : 'border-[#FFAAA6] text-[#FFAAA6] focus:ring-[#FFAAA6]'
                  }`}
                />
                <span>Archive applications older than 3 months</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleRunCleanup}
              disabled={cleanupLoading}
              className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-70 ${
                darkMode ? 'bg-[#FA6E6E] hover:bg-[#f85c5c]' : 'bg-[#FFAAA6] hover:bg-[#ff9e9a]'
              }`}
            >
              {cleanupLoading ? 'Working…' : 'Run Cleanup'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}