'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { JobRecord, JobStatus, ThemeStyles } from '../../types';

/* Type definition delineating boolean flags for multi-criteria automated job record pruning */
type CleanupRules = {
  rejected: boolean;
  olderThanOneWeek: boolean;
  olderThanOneMonth: boolean;
  olderThanThreeMonths: boolean;
};

/* Component property interface specifying typed data records, theme style maps, and asynchronous callback delegates */
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

/* Primary functional component managing the archived jobs view, modal dialog lifecycle, and batch cleanup triggers */
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
  /* State hook managing modal dialog visibility and document object model attachment */
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* State hook holding the composite configuration object for auto-archive database queries */
  const [rules, setRules] = useState<CleanupRules>({
    rejected: true,
    olderThanOneWeek: false,
    olderThanOneMonth: false,
    olderThanThreeMonths: false,
  });

  /* Pure updater function toggling a targeted boolean property within the rules state object */
  const toggleRule = (key: keyof CleanupRules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* Asynchronous dispatch handler executing parent cleanup mutations prior to closing the modal view */
  const handleRunCleanup = async () => {
    await onRunCleanup(rules);
    setIsModalOpen(false);
  };

  return (
    /* Top-level layout container constrained to max-w-7xl with automatic horizontal margin centering */
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Surface wrapper with dynamic CSS classes for border radius, padding, elevation, and theme tokens */}
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 lg:p-8 shadow-md transition-all ${theme.card}`}>
        {/* Header flexbox utilizing column direction on viewports below 640px and row layout on larger screens */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Flexbox alignment container anchoring the title and graphic directly along the bottom baseline */}
          <div className="flex items-end gap-3.5">
            <h2 className="text-2xl sm:text-3xl font-semibold leading-none">Archived Applications</h2>
            {/* Box graphic wrapper enlarged to 72px square and translated lower on the Y-axis */}
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

          {/* Interactive button element triggering modal visibility state upon click events */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              darkMode
                ? 'border-[#3f3f46] bg-[#1c1d22] text-[#a1a1aa] hover:bg-[#18181b]'
                : 'border-[#FFE5E2] bg-[#FFFDF9] text-[#6C5656] hover:bg-[#FFE5E2]'
            }`}
          >
            <span>Auto-Archive Rules</span>
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>

        {/* Responsive horizontal overflow container enabling momentum scrolling on touch-enabled mobile devices */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-transparent [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left text-sm min-w-[500px]">
            {/* Semantic table header section with dynamic theme token border classes */}
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            {/* Semantic table body mapping the filtered job records collection into table row elements */}
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                  <td className="px-4 py-3.5 font-semibold">{job.company_name}</td>
                  <td className="px-4 py-3.5">
                    {/* Status badge pill with conditional styling matching the application state */}
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {/* Restoration button executing status mutations to remove the application from archive state */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(job.id, false)}
                      className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${theme.input}`}
                    >
                      Restore 🌸
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conditional fallback container rendered when the filtered collection array contains zero items */}
        {filteredJobs.length === 0 ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
            No archived applications found.
          </div>
        ) : null}

        {/* Aggregate overview card computing total unarchived job records via array filter evaluation */}
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

      {/* Modal portal layer utilizing fixed screen positioning, z-index elevation, and CSS backdrop blur filters */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          {/* Modal content dialog surface displaying cleanup criteria selectors */}
          <div className={`w-full max-w-lg rounded-[28px] sm:rounded-[32px] border p-5 sm:p-6 shadow-2xl transition-all ${theme.card}`}>
            {/* Modal header containing title text and close button */}
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

            {/* Checkbox input controls updating individual rule boolean states */}
            <div className={`mt-4 space-y-3 text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-[#6C5656]'}`}>
              {/* Checkbox option for batch archiving rejected entries */}
              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.rejected}
                  onChange={() => toggleRule('rejected')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#f87171] focus:ring-[#f87171]'
                      : 'border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]'
                  }`}
                />
                <span>Archive all Rejected applications</span>
              </label>

              {/* Checkbox option for batch archiving entries older than one week */}
              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.olderThanOneWeek}
                  onChange={() => toggleRule('olderThanOneWeek')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#f87171] focus:ring-[#f87171]'
                      : 'border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]'
                  }`}
                />
                <span>Archive applications older than 1 week</span>
              </label>

              {/* Checkbox option for batch archiving entries older than one month */}
              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.olderThanOneMonth}
                  onChange={() => toggleRule('olderThanOneMonth')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#f87171] focus:ring-[#f87171]'
                      : 'border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]'
                  }`}
                />
                <span>Archive applications older than 1 month</span>
              </label>

              {/* Checkbox option for batch archiving entries older than three months */}
              <label className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${theme.innerCard}`}>
                <input
                  type="checkbox"
                  checked={rules.olderThanThreeMonths}
                  onChange={() => toggleRule('olderThanThreeMonths')}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'border-[#3f3f46] text-[#f87171] focus:ring-[#f87171]'
                      : 'border-[#FFB7B2] text-[#FFB7B2] focus:ring-[#FFB7B2]'
                  }`}
                />
                <span>Archive applications older than 3 months</span>
              </label>
            </div>

            {/* Asynchronous submission button triggering batch database operations with disabled state styling */}
            <button
              type="button"
              onClick={handleRunCleanup}
              disabled={cleanupLoading}
              className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-70 ${
                darkMode ? 'bg-[#f87171] hover:bg-[#ef4444]' : 'bg-[#FFB7B2] hover:bg-[#FFA9A0]'
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