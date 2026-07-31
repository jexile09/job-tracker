'use client';

import { useState } from 'react';
import type { JobRecord, JobStatus, FormState } from '../../types';

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
  makeGoogleCalendarUrl: (t: string, d: string, det: string) => string;
  statusStyles: Record<JobStatus, string>;
  handleToggleArchive: (id: number, state: boolean) => void;
  handleDelete: (id: number) => void;
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
  const [pendingCalendarLink, setPendingCalendarLink] = useState<string | null>(null);

  const handleCalendarLinkClick = (url: string) => {
    setPendingCalendarLink(url);
  };

  const confirmCalendarOpen = () => {
    if (!pendingCalendarLink) return;
    window.open(pendingCalendarLink, '_blank', 'noopener,noreferrer');
    setPendingCalendarLink(null);
  };

  const handleExportCSV = () => {
    if (filteredJobs.length === 0) return;

    const headers = ['Company Name', 'Applied Date', 'Status', 'Interview Date', 'Notes'];
    const rows = filteredJobs.map((job) => [
      `"${(job.company_name || '').replace(/"/g, '""')}"`,
      `"${job.applied_date}"`,
      `"${job.status}"`,
      `"${job.interview_date || ''}"`,
      `"${(job.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `job-applications-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <section className={`rounded-[32px] border p-6 shadow-md sm:p-8 ${theme.card}`}>
        <h2 className="text-3xl font-semibold">Add New Application 🌸</h2>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={`space-y-4 rounded-[28px] border p-5 ${theme.innerCard}`}>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Company name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleInputChange}
                required
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Application link</label>
              <input
                name="application_link"
                value={form.application_link}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${theme.label}`}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                rows={3}
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
              />
            </div>
          </div>

          <div className={`space-y-4 rounded-[28px] border p-5 ${theme.innerCard}`}>
            <div className="grid gap-3 sm:grid-cols-3">
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
              <div className={`rounded-2xl border px-4 py-2 text-xs ${message.type === 'success' ? 'border-[#DDF3E3] bg-[#F3FFF7] text-[#3F6B4C]' : 'border-[#FFE2E2] bg-[#FFF5F5] text-[#A04A4A]'}`}>
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

      {/* ACTIVE APPLICATIONS LIST */}
      <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full sm:w-64 rounded-2xl border px-4 py-2 text-sm outline-none ${theme.input}`}
          />
          <button
            type="button"
            onClick={handleExportCSV}
            className="rounded-2xl border border-[#FFE5E2] bg-[#FFFDF9] px-4 py-2 text-sm font-semibold text-[#6C5656] transition hover:bg-[#FFE5E2]"
          >
            Export CSV 📄
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={`border-b ${theme.tableHeader}`}>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Applied</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Calendar</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className={`border-b ${theme.tableRow}`}>
                  <td className="px-3 py-3 font-semibold">{job.company_name}</td>
                  <td className="px-3 py-3 opacity-80">{formatAppliedDate(job.applied_date)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {job.interview_date && (
                      <button
                        type="button"
                        onClick={() => handleCalendarLinkClick(makeGoogleCalendarUrl(`Interview: ${job.company_name}`, job.interview_date!.substring(0, 10), ''))}
                        className="rounded-xl bg-[#EAF4FF] px-2.5 py-1 text-xs font-semibold text-[#3B629B]"
                      >
                        + Google Cal
                      </button>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pendingCalendarLink ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-[#FFE5E2] bg-[#FFFDF9] p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-[#4E3B3B]">Open Google Calendar?</h4>
            <p className="mt-2 text-sm text-[#6C5656]">This will open Google Calendar in a new tab. Allow it?</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setPendingCalendarLink(null)} className="flex-1 rounded-2xl border border-[#FFE5E2] bg-white px-3 py-2 text-sm font-semibold text-[#6C5656]">
                Cancel
              </button>
              <button type="button" onClick={confirmCalendarOpen} className="flex-1 rounded-2xl bg-[#FFB7B2] px-3 py-2 text-sm font-semibold text-white">
                Open
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}