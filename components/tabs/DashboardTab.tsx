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

/* TypeScript interface defining all incoming component properties, data records, and callback handlers */
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

/* Color palette dictionary for work environment badges when operating in light mode */
const workTypeBadgesLight: Record<WorkType, { label: string; style: string }> = {
  remote: { label: 'Remote', style: 'bg-[#E8F8EC] text-[#3B6D3D]' },
  hybrid: { label: 'Hybrid', style: 'bg-[#FFF3CF] text-[#8C6418]' },
  onsite: { label: 'Onsite', style: 'bg-[#EAF4FF] text-[#3B629B]' },
};

/* Color palette dictionary for work environment badges when operating in dark mode */
const workTypeBadgesDark: Record<WorkType, { label: string; style: string }> = {
  remote: { label: 'Remote', style: 'bg-[#1c3321] text-[#7de0a0]' },
  hybrid: { label: 'Hybrid', style: 'bg-[#332b1c] text-[#e0c17d]' },
  onsite: { label: 'Onsite', style: 'bg-[#1c2733] text-[#7dabe0]' },
};

/* Reusable vector chevron icon rendered inside relative select wrappers with absolute positioning */
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

/* Vector blossom icon generated mathematically via SVG to prevent downscaling blur */
function BlossomIcon({ darkMode }: { darkMode: boolean }) {
  /* Dynamic color variables mapped according to active theme mode */
  const petalFill = darkMode ? '#F4727C' : '#FFB5C5';
  const petalStroke = darkMode ? '#9A2B35' : '#D6657A';
  const stamenColor = darkMode ? '#7F1D24' : '#C4884D';
  const centerColor = darkMode ? '#A3343E' : '#F9D1A2';

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-6 w-6 shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Reusable base petal geometry defined with cubic Bezier curve paths */}
        <g id="petal">
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

      {/* Five-fold radial repetition of the base petal at 72 degree steps */}
      <g>
        <use href="#petal" />
        <use href="#petal" transform="rotate(72 50 50)" />
        <use href="#petal" transform="rotate(144 50 50)" />
        <use href="#petal" transform="rotate(216 50 50)" />
        <use href="#petal" transform="rotate(288 50 50)" />
      </g>

      {/* Ten stamen stems generated mathematically across 36 degree intervals */}
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="29" stroke={stamenColor} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="50" cy="28" r="2.2" fill={stamenColor} />
        </g>
      ))}

      {/* Center pistil node */}
      <circle cx="50" cy="50" r="6.5" fill={centerColor} stroke={stamenColor} strokeWidth="1.5" />
    </svg>
  );
}

/* Primary functional component rendering the application tracker creation form and dynamic data table */
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
  /* State dictionary tracking which table row identifiers possess open detail drawers */
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  /* Adaptive styling variables calculated from interface themes and user display settings */
  const workTypeBadges = darkMode ? workTypeBadgesDark : workTypeBadgesLight;
  const buttonStyle = compactMode ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5';
  const rowSpacing = compactMode ? 'py-2' : 'py-3.5';
  const formTitle = editingJobId ? 'Edit Application' : 'Add New Application';
  const selectedCurrency: SalaryCurrency = form.salary_currency || 'USD';

  /* Toggle handler altering row expansion state for specific job numeric identifiers */
  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* Helper evaluation checking whether row drawer details should render open or closed */
  const detailsOpen = (job: JobRecord) => {
    return expandedRows[job.id] ?? !hideDetailsByDefault;
  };

  /* Total table column span calculation including optional dynamic salary and location cells */
  const detailsColSpan = 5 + Number(showSalaryColumn) + Number(showLocationColumn);

  return (
    /* Top-level grid container constrained to a maximum width of 1280px with centered automatic margins */
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Form Submission Surface Container */}
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 lg:p-8 shadow-md transition-all ${theme.card}`}>
        <h2 className="text-2xl sm:text-3xl font-semibold">{formTitle}</h2>

        {/* Input form grid with responsive two-column arrangement at the 1280px breakpoint */}
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 xl:grid-cols-2">
          {/* Form Left Column for entity details and compensation */}
          <div className={`space-y-4 rounded-[24px] sm:rounded-[28px] border p-4 sm:p-5 ${theme.innerCard}`}>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Company name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Google, Target, Local Studio"
                className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none transition ${theme.input}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Application link</label>
              <input
                name="application_link"
                value={form.application_link}
                onChange={handleInputChange}
                placeholder="https://..."
                className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none transition ${theme.input}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder="e.g. New York, NY"
                className={`w-full rounded-2xl border px-3 py-2 text-xs outline-none transition ${theme.input}`}
              />
            </div>

            {/* Compensation Inputs: Single column on small devices expanding to three columns above 640px */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
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
                    className={`w-full rounded-2xl border pl-9 pr-3 py-2 text-xs outline-none transition ${theme.input}`}
                  />
                </div>
              </div>
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Pay type</label>
                {/* Relative container hosting select input stripped of default browser styling alongside custom inset chevron */}
                <div className="relative">
                  <select
                    name="salary_unit"
                    value={form.salary_unit || 'year'}
                    onChange={handleInputChange}
                    className={`w-full appearance-none rounded-2xl border pl-3 pr-10 py-2 text-xs outline-none transition ${theme.input}`}
                  >
                    <option value="hour">Hourly</option>
                    <option value="year">Yearly</option>
                  </select>
                  <DropdownChevron />
                </div>
              </div>
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Currency</label>
                {/* Relative container hosting currency select input with appearance-none and inset chevron indicator */}
                <div className="relative">
                  <select
                    name="salary_currency"
                    value={selectedCurrency}
                    onChange={handleInputChange}
                    className={`w-full appearance-none rounded-2xl border pl-3 pr-10 py-2 text-xs outline-none transition ${theme.input}`}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="INR">INR (Rs)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                  <DropdownChevron />
                </div>
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
                className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none transition ${theme.input}`}
              />
            </div>
          </div>

          {/* Form Right Column for schedule timestamps, status dropdowns, and form submission buttons */}
          <div className={`space-y-4 rounded-[24px] sm:rounded-[28px] border p-4 sm:p-5 flex flex-col justify-between ${theme.innerCard}`}>
            <div className="space-y-4">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Status</label>
                  {/* Relative container stripping default select appearance and rendering custom positioned chevron */}
                  <div className="relative">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                      className={`w-full appearance-none rounded-xl border pl-2.5 pr-10 py-2 text-xs outline-none transition ${theme.input}`}
                    >
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <DropdownChevron />
                  </div>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Work Type</label>
                  {/* Relative container stripping default select appearance and rendering custom positioned chevron */}
                  <div className="relative">
                    <select
                      name="work_type"
                      value={form.work_type}
                      onChange={handleInputChange}
                      className={`w-full appearance-none rounded-xl border pl-2.5 pr-10 py-2 text-xs outline-none transition ${theme.input}`}
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                    <DropdownChevron />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Applied Date</label>
                  <input
                    name="applied_date"
                    type="date"
                    value={form.applied_date}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition ${theme.input}`}
                  />
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Deadline</label>
                  <input
                    name="deadline_date"
                    type="date"
                    value={form.deadline_date}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition ${theme.input}`}
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
                  className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${theme.input}`}
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
            </div>

            {/* Submit and Cancel Action Controls */}
            <div className="space-y-3 pt-3">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex w-full items-center justify-center gap-2.5 rounded-2xl h-[42px] px-5 text-sm font-semibold shadow-sm transition-all duration-150 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 ${
                  darkMode
                    ? 'bg-[#352528] text-[#fca5a5] border border-[#f87171]/40 hover:bg-[#402d31]'
                    : 'bg-[#FFE2DE] text-[#7A2C3B] border border-[#FFCCD3] hover:bg-[#FFD9D3]'
                }`}
              >
                <span>{submitting ? 'Saving...' : editingJobId ? 'Save Changes' : 'Add Application'}</span>
                <BlossomIcon darkMode={darkMode} />
              </button>
              {editingJobId ? (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className={`w-full rounded-2xl border py-2 text-xs font-semibold transition ${
                    darkMode
                      ? 'border-[#3f3f46] bg-transparent text-[#a1a1aa] hover:bg-[#18181b]'
                      : 'border-[#94A3B8] bg-transparent text-[#94A3B8] hover:bg-[#1F2937]/10'
                  }`}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      {/* Applications Table Card */}
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 shadow-md transition-all ${theme.card}`}>
        {/* Search and Sort Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap flex-1">
            <input
              type="text"
              placeholder="Search company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-52 lg:w-64 rounded-2xl border px-3.5 py-2 text-sm outline-none transition ${theme.input}`}
            />
            {/* Filter select input hosted inside relative container with appearance-none and inset chevron */}
            <div className="relative w-full sm:w-36">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className={`w-full appearance-none rounded-2xl border pl-3 pr-10 py-2 text-sm outline-none transition ${theme.input}`}
              >
                <option value="all">All statuses</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>
              <DropdownChevron />
            </div>
            {/* Sort select input hosted inside relative container with appearance-none and inset chevron */}
            <div className="relative w-full sm:w-48 lg:w-56">
              <select
                value={dashboardSort}
                onChange={(e) => setDashboardSort(e.target.value as DashboardSortOption)}
                className={`w-full appearance-none rounded-2xl border pl-3 pr-10 py-2 text-sm outline-none transition ${theme.input}`}
              >
                <option value="salary_desc">Salary: High to Low</option>
                <option value="salary_asc">Salary: Low to High</option>
                <option value="location_asc">Location: A to Z</option>
                <option value="location_desc">Location: Z to A</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="applied_desc">Applied: Newest</option>
                <option value="applied_asc">Applied: Oldest</option>
              </select>
              <DropdownChevron />
            </div>
          </div>
          <div className="hidden text-xs text-[#8D6F6F] xl:block shrink-0">Row actions stay horizontal for easy scanning.</div>
        </div>

        {/* Scrollable table container with touch momentum enabled */}
        <div className="overflow-x-auto rounded-2xl border border-transparent [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-4 py-3 font-semibold">Company</th>
                {showSalaryColumn && <th className="hidden px-4 py-3 font-semibold md:table-cell whitespace-nowrap">Salary</th>}
                {showLocationColumn && <th className="hidden px-4 py-3 font-semibold lg:table-cell whitespace-nowrap">Location</th>}
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Applied</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell whitespace-nowrap">Calendar</th>
                {/* Actions column header centered horizontally above row button controls */}
                <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
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
                      <td className={`px-4 ${rowSpacing}`}>
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
                        <td
                          className={`hidden px-4 ${rowSpacing} text-xs md:table-cell whitespace-nowrap ${
                            darkMode ? 'text-[#a1a1aa]' : 'text-[#8C6418]'
                          }`}
                        >
                          {formatSalary(job.salary_value, job.salary_unit, job.salary_currency) || '—'}
                        </td>
                      )}
                      {showLocationColumn && (
                        <td className={`hidden px-4 ${rowSpacing} text-xs opacity-80 lg:table-cell whitespace-nowrap`}>
                          {job.location || '—'}
                        </td>
                      )}
                      <td className={`px-4 ${rowSpacing} whitespace-nowrap opacity-80`}>{formatAppliedDate(job.applied_date)}</td>

                      <td className={`px-4 ${rowSpacing}`}>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                          {job.status}
                        </span>
                      </td>

                      <td className={`hidden px-4 ${rowSpacing} whitespace-nowrap sm:table-cell`}>
                        {job.interview_date && (
                          <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-block whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-semibold ${
                              darkMode ? 'bg-[#18181b] text-[#f87171]' : 'bg-[#EAF4FF] text-[#3B629B]'
                            }`}
                          >
                            Add Event
                          </a>
                        )}
                      </td>

                      {/* Row Actions Section centered horizontally underneath the Actions column header */}
                      <td className={`px-4 ${rowSpacing} text-center whitespace-nowrap`}>
                        <div className="inline-flex flex-row items-center justify-center gap-1.5 flex-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleRow(job.id)}
                            className={`rounded-xl border ${buttonStyle} font-semibold transition ${theme.input}`}
                          >
                            {detailsOpen(job) ? 'Hide' : 'Details'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(job)}
                            className={`rounded-xl border ${buttonStyle} font-semibold transition ${theme.input}`}
                          >
                            Edit
                          </button>
                          {/* Archive button styled with theme-adaptive coral in dark mode and blossom pink in light mode */}
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(job.id, true)}
                            className={`rounded-xl border ${buttonStyle} font-semibold transition ${
                              darkMode
                                ? 'border-[#f87171]/40 bg-[#352528] text-[#fca5a5] hover:bg-[#402d31]'
                                : 'border-[#FFCCD3] bg-[#FFE2DE] text-[#7A2C3B] hover:bg-[#FFD9D3]'
                            }`}
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            className={`rounded-xl border ${buttonStyle} font-semibold transition ${
                              darkMode
                                ? 'border-[#3f3f46] bg-[#1c1d22] text-[#a1a1aa] hover:bg-[#18181b]'
                                : 'border-[#FFD9D4] bg-[#FFF5F5] text-[#A95565]'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Drawer */}
                    {detailsOpen(job) && (
                      <tr className={`${theme.tableRow}`}>
                        <td colSpan={detailsColSpan} className={`px-4 ${rowSpacing} ${theme.input}`}>
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                            <div className="space-y-1 rounded-2xl border p-3">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8D6F6F]">Interview</p>
                              <p className="text-xs">{formatInterviewDateTime(job.interview_date)}</p>
                              <p className="text-xs">
                                {job.deadline_date
                                  ? `Deadline: ${formatAppliedDate(job.deadline_date)}`
                                  : 'No deadline set'}
                              </p>
                            </div>
                            <div className="space-y-1 rounded-2xl border p-3">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8D6F6F]">Additional info</p>
                              {job.notes ? (
                                <p className="text-xs">Notes: {job.notes}</p>
                              ) : (
                                <p className="text-xs">No notes yet.</p>
                              )}
                              {job.application_link && (
                                <a
                                  className="text-xs text-[#E07A5F] underline"
                                  href={job.application_link}
                                  target="_blank"
                                  rel="noreferrer"
                                >
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

        {/* Empty State Display */}
        {filteredJobs.length === 0 ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
            No applications match your current search, filter, and sort choices.
          </div>
        ) : null}
      </section>
    </div>
  );
}