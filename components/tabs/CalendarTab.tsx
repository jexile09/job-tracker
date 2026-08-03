'use client';

import { useMemo, useState } from 'react';
import type { JobRecord, ThemeStyles } from '../../types';

type CalendarTabProps = {
  theme: ThemeStyles;
  jobs: JobRecord[];
  makeGoogleCalendarUrl: (t: string, d: string, det: string, loc?: string) => string;
  formatInterviewDateTime: (value: string | null | undefined) => string;
  getWeekdayChipStyle: (value: string | null | undefined) => string;
};

const getWeekdayLabel = (value: string | null | undefined) => {
  if (!value) return 'No day';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString('en-US', { weekday: 'short' });
};

export default function CalendarTab({
  theme,
  jobs,
  makeGoogleCalendarUrl,
  formatInterviewDateTime,
  getWeekdayChipStyle,
}: CalendarTabProps) {
  const [pendingCalendarLink, setPendingCalendarLink] = useState<string | null>(null);

  // Memoized derivation (cached computed dataset that recalculates only when dependency references change) builds a chronologically sorted interview list for stable and predictable rendering order.
  const interviews = useMemo(
    () =>
      jobs
        .filter((job) => !job.is_archived && job.interview_date)
        .sort((a, b) => new Date(a.interview_date || '').getTime() - new Date(b.interview_date || '').getTime()),
    [jobs]
  );

  const handleCalendarLinkClick = (url: string) => {
    setPendingCalendarLink(url);
  };

  const confirmCalendarOpen = () => {
    if (!pendingCalendarLink) return;
    // External navigation call (browser Window API invocation that opens a separate tab) sends a fully encoded template URL to Google Calendar for event prefill.
    const popup = window.open(pendingCalendarLink, '_blank', 'noopener,noreferrer');
    // Popup-blocker fallback (same-tab navigation when a new-tab request is denied by browser policy) guarantees the calendar link still opens.
    if (!popup) {
      window.location.assign(pendingCalendarLink);
    }
    setPendingCalendarLink(null);
  };

  return (
    <>
      <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
        <h3 className="text-2xl font-semibold">Upcoming Schedule</h3>
        <p className="mt-2 text-sm opacity-70">
          Interviews are shown with weekday color tags so your week is easier to scan.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${theme.innerCard}`}>
            <h4 className="font-semibold text-[#FFB7B2]">Upcoming Interviews</h4>

            {interviews.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed p-4 text-sm opacity-70">
                No upcoming interviews yet. Add interview date and time from the dashboard form.
              </div>
            ) : (
              interviews.map((job) => {
                const interviewDate = job.interview_date;
                const calendarDetails = [job.notes, job.application_link ? `Application: ${job.application_link}` : '']
                  .filter(Boolean)
                  .join('\n');
                const calendarUrl = makeGoogleCalendarUrl(
                  `Interview: ${job.company_name}`,
                  interviewDate || '',
                  calendarDetails,
                  job.location || ''
                );

                return (
                  <div key={job.id} className="mt-3 rounded-2xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{job.company_name}</div>
                        <div className="mt-1 text-xs opacity-80">{formatInterviewDateTime(interviewDate)}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${getWeekdayChipStyle(interviewDate)}`}>
                            {getWeekdayLabel(interviewDate)}
                          </span>
                          {job.location ? <span className="opacity-70">{job.location}</span> : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCalendarLinkClick(calendarUrl)}
                        className="rounded-xl bg-[#EAF4FF] px-2.5 py-1 text-xs font-semibold text-[#3B629B]"
                      >
                        Add Event
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {pendingCalendarLink ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-[#FFE5E2] bg-[#FFFDF9] p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-[#4E3B3B]">Add this interview to Google Calendar?</h4>
            <p className="mt-2 text-sm text-[#6C5656]">
              This opens Google Calendar with details pre-filled so you can save quickly.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingCalendarLink(null)}
                className="flex-1 rounded-2xl border border-[#FFE5E2] bg-white px-3 py-2 text-sm font-semibold text-[#6C5656]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCalendarOpen}
                className="flex-1 rounded-2xl bg-[#FFB7B2] px-3 py-2 text-sm font-semibold text-white"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}