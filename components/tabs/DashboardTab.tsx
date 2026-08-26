'use client';

import { Fragment, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type {
  DashboardSortOption,
  FormState,
  JobRecord,
  JobStatus,
  SalaryCurrency,
  ThemeStyles,
  WorkType,
} from '../../types';
import { currencySymbols, formatSalary } from '../../lib/salary';

type DashboardTabProps = {
  theme: ThemeStyles;
  darkMode: boolean;
  form: FormState;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFilter: string;
  setSelectedFilter: (f: string) => void;
  dashboardSort: DashboardSortOption;
  setDashboardSort: (value: DashboardSortOption) => void;
  filteredJobs: JobRecord[];
  compactMode: boolean;
  hideDetailsByDefault: boolean;
  showSalaryColumn: boolean;
  showLocationColumn: boolean;
  formatAppliedDate: (d: string) => string;
  formatInterviewDateTime: (d: string | null | undefined) => string;
  makeGoogleCalendarUrl: (t: string, d: string, det: string, loc?: string) => string;
  statusStyles: Record<JobStatus, string>;
  handleToggleArchive: (id: number, state: boolean) => void;
  handleDelete: (id: number) => void;
  editingJobId: number | null;
  onEdit: (job: JobRecord) => void;
  onCancelEdit: () => void;
};

const workTypeBadgesLight: Record<WorkType, { label: string; style: string }> = {
  remote: { label: 'Remote', style: 'bg-[#E8F8EC] text-[#3B6D3D]' },
  hybrid: { label: 'Hybrid', style: 'bg-[#FFF3CF] text-[#8C6418]' },
  onsite: { label: 'Onsite', style: 'bg-[#EAF4FF] text-[#3B629B]' },
};

const workTypeBadgesDark: Record<WorkType, { label: string; style: string }> = {
  remote: { label: 'Remote', style: 'bg-[#1c3321] text-[#7de0a0]' },
  hybrid: { label: 'Hybrid', style: 'bg-[#332b1c] text-[#e0c17d]' },
  onsite: { label: 'Onsite', style: 'bg-[#1c2733] text-[#7dabe0]' },
};

export default function DashboardTab({
  theme,
  darkMode,
  form,
  handleInputChange,
  handleSubmit,
  submitting,
  message,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  dashboardSort,
  setDashboardSort,
  filteredJobs,
  compactMode,
  hideDetailsByDefault,
  formatAppliedDate,
  formatInterviewDateTime,
  makeGoogleCalendarUrl,
  statusStyles,
  handleToggleArchive,
  handleDelete,
  editingJobId,
  onEdit,
  onCancelEdit,
  showSalaryColumn,
  showLocationColumn,
}: DashboardTabProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const workTypeBadges = darkMode ? workTypeBadgesDark : workTypeBadgesLight;

  const buttonStyle = compactMode ? 'text-[10px] px-2.5 py-1' : 'text-xs px-3 py-1.5';
  const rowSpacing = compactMode ? 'py-2' : 'py-3';
  const formTitle = editingJobId ? 'Edit Application' : 'Add New Application';
  const selectedCurrency: SalaryCurrency = form.salary_currency || 'USD';

  // Row expansion state machine (record-indexed visibility map for collapsible detail panels) enables independent open and close behavior for each table row without cross-row coupling.
  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const detailsOpen = (job: JobRecord) => {
    return expandedRows[job.id] ?? !hideDetailsByDefault;
  };
  const detailsColSpan = 5 + Number(showSalaryColumn) + Number(showLocationColumn);

  return (
    <>
      <section className={`rounded-[32px] border p-5 shadow-md sm:p-8 ${theme.card}`}>
        <h2 className="text-3xl font-semibold">{formTitle}</h2>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={`space-y-4 rounded-[28px] border p-5 ${theme.innerCard}`}>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Company name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Google, Target, Local Studio"
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Application link</label>
              <input
                name="application_link"
                value={form.application_link}
                onChange={handleInputChange}
                placeholder="https://..."
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder="e.g. New York, NY"
                className={`w-full rounded-2xl border px-3 py-2 text-xs outline-none ${theme.input}`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Salary</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8D6F6F]">
                    {currencySymbols[selectedCurrency]}
                  </span>
                  <input
                    name="salary_value"
                    type="number"
                    step="0.01"
                    value={form.salary_value ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 25.50 or 85000"
                    className={`w-full rounded-2xl border pl-9 pr-3 py-2 text-xs outline-none ${theme.input}`}
                  />
                </div>
              </div>
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Pay type</label>
                <select
                  name="salary_unit"
                  value={form.salary_unit || 'year'}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border px-3 py-2 text-xs outline-none ${theme.input}`}
                >
                  <option value="hour">Hourly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Currency</label>
                <select
                  name="salary_currency"
                  value={selectedCurrency}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border px-3 py-2 text-xs outline-none ${theme.input}`}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (Rs)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Recruiter details, team info, next steps..."
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>
          </div>

          <div className={`space-y-4 rounded-[28px] border p-5 ${theme.innerCard}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl border px-2 py-2 text-xs outline-none ${theme.input}`}
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Work Type</label>
                <select
                  name="work_type"
                  value={form.work_type}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl border px-2 py-2 text-xs outline-none ${theme.input}`}
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Applied Date</label>
                <input
                  name="applied_date"
                  type="date"
                  value={form.applied_date}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl border px-2 py-2 text-xs outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Deadline</label>
                <input
                  name="deadline_date"
                  type="date"
                  value={form.deadline_date}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl border px-2 py-2 text-xs outline-none ${theme.input}`}
                />
              </div>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Interview Date & Time</label>
              <input
                name="interview_date"
                type="datetime-local"
                value={form.interview_date}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${theme.input}`}
              />
              {form.interview_date ? (
                <p className="mt-2 text-xs text-[#8D6F6F]">{formatInterviewDateTime(form.interview_date)}</p>
              ) : null}
            </div>

            {message && (
              <div
                className={`rounded-2xl border px-4 py-2 text-xs ${
                  message.type === 'success'
                    ? darkMode
                      ? 'border-[#1c3321] bg-[#18181b] text-[#7de0a0]'
                      : 'border-[#DDF3E3] bg-[#F3FFF7] text-[#3F6B4C]'
                    : darkMode
                    ? 'border-[#331c1c] bg-[#18181b] text-[#f87171]'
                    : 'border-[#FFE2E2] bg-[#FFF5F5] text-[#A04A4A]'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition ${darkMode ? 'bg-[#f87171] hover:bg-[#ef4444]' : 'bg-[#FFB7B2] hover:bg-[#FFA9A0]'}`}
              >
                {submitting ? 'Saving...' : editingJobId ? 'Save changes' : 'Add Application'}
              </button>
              {editingJobId ? (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className={`w-full rounded-2xl border py-3 text-sm font-semibold transition ${darkMode ? 'border-[#3f3f46] bg-transparent text-[#a1a1aa] hover:bg-[#18181b]' : 'border-[#94A3B8] bg-transparent text-[#94A3B8] hover:bg-[#1F2937]/10'}`}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      <section className={`rounded-[32px] border p-5 shadow-md sm:p-6 ${theme.card}`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <input
              type="text"
              placeholder="Search company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-56 rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
            />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={`w-full sm:w-40 rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
            >
              <option value="all">All statuses</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={dashboardSort}
              onChange={(e) => setDashboardSort(e.target.value as DashboardSortOption)}
              className={`w-full sm:w-56 rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
            >
              {/* Sort selector mapping (user-interface control that maps textual options to typed comparator modes) drives deterministic ordering in the container-level sorting pipeline. */}
              <option value="salary_desc">Salary: High to Low</option>
              <option value="salary_asc">Salary: Low to High</option>
              <option value="location_asc">Location: A to Z</option>
              <option value="location_desc">Location: Z to A</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="applied_desc">Applied: Newest</option>
              <option value="applied_asc">Applied: Oldest</option>
            </select>
          </div>
          <div className="hidden text-xs text-[#8D6F6F] lg:block">Tap or click a row to expand interview notes and details.</div>
        </div>

        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[640px] lg:min-w-full text-left text-sm">
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-3 py-3">Company</th>
                {showSalaryColumn && <th className="hidden px-3 py-3 sm:table-cell">Salary</th>}
                {showLocationColumn && <th className="hidden px-3 py-3 md:table-cell">Location</th>}
                <th className="px-3 py-3">Applied</th>
                <th className="px-3 py-3">Status</th>
                <th className="hidden px-3 py-3 sm:table-cell">Calendar</th>
                <th className="w-px px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                // Event payload composition (structured calendar metadata assembly) combines notes, posting URL, and location fields into a normalized description string for external Google Calendar template URLs.
                const workBadge = workTypeBadges[job.work_type || 'remote'];
                const calendarDetails = [job.notes, job.application_link ? `Application: ${job.application_link}` : '']
                  .filter(Boolean)
                  .join('\n');
                const calendarUrl = makeGoogleCalendarUrl(
                  `Interview: ${job.company_name}`,
                  job.interview_date || '',
                  calendarDetails,
                  job.location || ''
                );

                return (
                  <Fragment key={job.id}>
                    <tr className={`border-b ${theme.tableRow}`}>
                      <td className="px-3 py-3">
                        <div className="font-semibold">{job.company_name}</div>
                        <div
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${workBadge.style}`}
                        >
                          {workBadge.label}
                        </div>
                        {job.application_link && (
                          <a
                            href={job.application_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block text-xs text-[#E07A5F] underline"
                          >
                            View posting
                          </a>
                        )}
                      </td>
                      {showSalaryColumn && (
                        <td className={`hidden px-3 py-3 text-xs sm:table-cell ${darkMode ? 'text-[#a1a1aa]' : 'text-[#8C6418]'}`}>
                          {formatSalary(job.salary_value, job.salary_unit, job.salary_currency) || '—'}
                        </td>
                      )}
                      {showLocationColumn && <td className="hidden px-3 py-3 text-xs opacity-80 md:table-cell">{job.location || '—'}</td>}
                      <td className="px-3 py-3 opacity-80">{formatAppliedDate(job.applied_date)}</td>

                      <td className="px-3 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>{job.status}</span>
                      </td>

                      <td className="hidden px-3 py-3 sm:table-cell">
                        {job.interview_date && (
                          <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${darkMode ? 'bg-[#18181b] text-[#f87171]' : 'bg-[#EAF4FF] text-[#3B629B]'}`}
                          >
                            Add Event
                          </a>
                        )}
                      </td>

                      <td className="w-px px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleRow(job.id)}
                            className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border ${buttonStyle} font-semibold ${theme.input}`}
                          >
                            {detailsOpen(job) ? 'Hide Details' : 'Show Details'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(job)}
                            className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border ${buttonStyle} font-semibold ${theme.input}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(job.id, true)}
                            className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border ${buttonStyle} font-semibold ${theme.input}`}
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border ${buttonStyle} font-semibold ${darkMode ? 'border-[#3f3f46] bg-[#1c1d22] text-[#a1a1aa] hover:bg-[#18181b]' : 'border-[#FFD9D4] bg-[#FFF5F5] text-[#A95565]'}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {detailsOpen(job) && (
                      <tr className={`${theme.tableRow}`}>
                        <td colSpan={detailsColSpan} className={`px-3 ${rowSpacing} ${theme.input}`}>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1 rounded-2xl border p-3">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8D6F6F]">Interview</p>
                              <p className="text-xs">{formatInterviewDateTime(job.interview_date)}</p>
                              <p className="text-xs">
                                {job.deadline_date ? `Deadline: ${formatAppliedDate(job.deadline_date)}` : 'No deadline set'}
                              </p>
                            </div>
                            <div className="space-y-1 rounded-2xl border p-3">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8D6F6F]">Additional info</p>
                              {job.notes ? <p className="text-xs">Notes: {job.notes}</p> : <p className="text-xs">No notes yet.</p>}
                              {job.application_link && (
                                <a className="text-xs text-[#E07A5F] underline" href={job.application_link} target="_blank" rel="noreferrer">
                                  Open application link
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
            No applications match your current search, filter, and sort choices.
          </div>
        ) : null}
      </section>
    </>
  );
}