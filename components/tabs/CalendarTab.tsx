'use client';

import { useMemo } from 'react';
import type { JobRecord, ThemeStyles } from '../../types';

type CalendarTabProps = {
  theme: ThemeStyles;
  darkMode: boolean;
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
  darkMode,
  jobs,
  makeGoogleCalendarUrl,
  formatInterviewDateTime,
  getWeekdayChipStyle,
}: CalendarTabProps) {
  // Memoized derivation (cached computed dataset that recalculates only when dependency references change) builds a chronologically sorted interview list for stable and predictable rendering order.
  const interviews = useMemo(
    () =>
      jobs
        .filter((job) => !job.is_archived && job.interview_date)
        .sort((a, b) => new Date(a.interview_date || '').getTime() - new Date(b.interview_date || '').getTime()),
    [jobs]
  );

  return (
    <section className={`rounded-[32px] border p-5 shadow-md sm:p-6 ${theme.card}`}>
        <h3 className="text-2xl font-semibold">Upcoming Schedule</h3>
        <p className="mt-2 text-sm opacity-70">
          Interviews are shown with weekday color tags so your week is easier to scan.
        </p>

        <div className="mt-4 grid gap-4">
          <div className={`rounded-2xl border p-5 ${theme.innerCard}`}>
            <h4 className={`font-semibold ${darkMode ? 'text-[#f87171]' : 'text-[#FFB7B2]'}`}>Upcoming Interviews</h4>

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
                  <div key={job.id} className={`mt-3 rounded-2xl border p-3 ${darkMode ? 'border-[#2d2e36]' : ''}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

                      <a
                        href={calendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold sm:self-auto self-start ${darkMode ? 'bg-[#18181b] text-[#f87171]' : 'bg-[#EAF4FF] text-[#3B629B]'}`}
                      >
                        Add Event
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
  );
}