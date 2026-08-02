'use client';

import type { JobRecord, JobStatus, FormState, WorkType } from '../../types';

type DashboardTabProps = {
  theme: any;
  form: FormState;
  handleInputChange: (e: any) => void;
  handleFileChange: (e: any, type: 'resume' | 'cover_letter') => void;
  handleSubmit: (e: any) => void;
  submitting: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFilter: string;
  setSelectedFilter: (f: string) => void;
  filteredJobs: JobRecord[];
  formatAppliedDate: (d: string) => string;
  makeGoogleCalendarUrl: (t: string, d: string, det: string, loc?: string) => string;
  statusStyles: Record<JobStatus, string>;
  handleToggleArchive: (id: number, state: boolean) => void;
  handleDelete: (id: number) => void;
};

const workTypeBadges: Record<WorkType, { label: string; style: string }> = {
  remote: { label: '🏠 Remote', style: 'bg-[#E8F8EC] text-[#3B6D3D]' },
  hybrid: { label: '🪟 Hybrid', style: 'bg-[#FFF3CF] text-[#8C6418]' },
  onsite: { label: '🏢 Onsite', style: 'bg-[#EAF4FF] text-[#3B629B]' },
};

export default function DashboardTab({
  theme,
  form,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  submitting,
  message,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filteredJobs,
  formatAppliedDate,
  makeGoogleCalendarUrl,
  statusStyles,
  handleToggleArchive,
  handleDelete,
}: DashboardTabProps) {
  return (
    <>
      <section className={`rounded-[32px] border p-6 shadow-md sm:p-8 ${theme.card}`}>
        <h2 className="text-3xl font-semibold">Add New Application 🌸</h2>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Left Side: General Info */}
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Salary / Pay Range 💰</label>
                <input
                  name="salary_range"
                  value={form.salary_range}
                  onChange={handleInputChange}
                  placeholder="e.g. $70k - $85k / yr"
                  className={`w-full rounded-2xl border px-3 py-2 text-xs outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Location 📍</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleInputChange}
                  placeholder="e.g. New York, Remote, NY"
                  className={`w-full rounded-2xl border px-3 py-2 text-xs outline-none ${theme.input}`}
                />
              </div>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder="Recruiter details, tech stack, team info..."
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>
          </div>

          {/* Right Side: Status, Dates, Files */}
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
                <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Work Type 💻</label>
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
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Interview Date & Time 🗓️</label>
              <input
                name="interview_date"
                type="datetime-local"
                value={form.interview_date}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${theme.input}`}
              />
            </div>

            {message && (
              <div
                className={`rounded-2xl border px-4 py-2 text-xs ${
                  message.type === 'success'
                    ? 'border-[#DDF3E3] bg-[#F3FFF7] text-[#3F6B4C]'
                    : 'border-[#FFE2E2] bg-[#FFF5F5] text-[#A04A4A]'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#FFB7B2] py-3 text-sm font-semibold text-white transition hover:bg-[#FFA9A0]"
            >
              {submitting ? 'Saving...' : 'Add Application'}
            </button>
          </div>
        </form>
      </section>

      {/* APPLICATIONS TABLE */}
      <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full sm:w-64 rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Details</th>
                <th className="px-3 py-3">Applied</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Calendar</th>
                <th className="px-3 py-3">Actions</th>
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
                  <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{job.company_name}</div>
                      {job.application_link && (
                        <a
                          href={job.application_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#E07A5F] underline"
                        >
                          View posting
                        </a>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1 text-xs">
                        {job.salary_range && <span className="font-semibold text-[#8C6418]">💰 {job.salary_range}</span>}
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${workBadge.style}`}>
                            {workBadge.label}
                          </span>
                          {job.location && <span className="opacity-70">📍 {job.location}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 opacity-80">{formatAppliedDate(job.applied_date)}</td>

                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                        {job.status}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      {job.interview_date && (
                        <a
                          href={calendarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-[#EAF4FF] px-2.5 py-1 text-xs font-semibold text-[#3B629B]"
                        >
                          ＋ Add Event
                        </a>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(job.id, true)}
                          className={`rounded-xl border px-2 py-1 text-xs font-semibold ${theme.input}`}
                        >
                          Archive 📦
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(job.id)}
                          className="rounded-xl border border-[#FFD9D4] bg-[#FFF5F5] px-2 py-1 text-xs font-semibold text-[#A95565]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}