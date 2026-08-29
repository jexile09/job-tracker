'use client';

import { useMemo } from 'react';
import type { JobRecord, ThemeStyles } from '../../types';

/* TypeScript interface defining properties passed into the Calendar tab view */
type CalendarTabProps = {
  theme: ThemeStyles;
  darkMode: boolean;
  jobs: JobRecord[];
  makeGoogleCalendarUrl: (t: string, d: string, det: string, loc?: string) => string;
  formatInterviewDateTime: (d: string | null | undefined) => string;
  getWeekdayChipStyle: (d: string | null | undefined) => string;
};

/* Primary functional component displaying scheduled interviews within a calendar view */
export default function CalendarTab({
  theme,
  darkMode,
  jobs,
  makeGoogleCalendarUrl,
  formatInterviewDateTime,
  getWeekdayChipStyle,
}: CalendarTabProps) {
  /* Filter collection selecting active applications with valid interview dates */
  const interviewJobs = useMemo(() => {
    return jobs
      .filter((job) => !job.is_archived && Boolean(job.interview_date))
      .sort((a, b) => new Date(a.interview_date!).getTime() - new Date(b.interview_date!).getTime());
  }, [jobs]);

  return (
    /* Top-level grid container constrained to a maximum width of 1280px with centered automatic margins */
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Calendar Surface Container */}
      <section className={`rounded-[28px] sm:rounded-[32px] border p-4 sm:p-6 lg:p-8 shadow-md transition-all ${theme.card}`}>
        <h2 className="text-2xl sm:text-3xl font-semibold leading-none">Upcoming Interviews</h2>

        {/* Interviews Collection List with theme-matched soft borders in light and dark mode */}
        <div className="mt-6 space-y-3">
          {interviewJobs.map((job) => {
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
              /* Interview card container styled with soft theme.innerCard borders preventing harsh dark outlines in light mode */
              <div
                key={job.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-all ${theme.innerCard}`}
              >
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-[#f4f4f5]' : 'text-[#4E3B3B]'}`}>{job.company_name}</h3>
                  <p className="mt-0.5 text-xs opacity-80">{formatInterviewDateTime(job.interview_date)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getWeekdayChipStyle(job.interview_date)}`}>
                      {new Date(job.interview_date!).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    {job.location ? <span className="text-xs opacity-75">{job.location}</span> : null}
                  </div>
                </div>

                {/* Calendar export button */}
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center justify-center rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    darkMode ? 'bg-[#18181b] text-[#f87171] hover:bg-[#27272a]' : 'bg-[#EAF4FF] text-[#3B629B] hover:bg-[#dbeafe]'
                  }`}
                >
                  Add Event
                </a>
              </div>
            );
          })}

          {interviewJobs.length === 0 ? (
            <div className={`rounded-2xl border p-4 text-sm ${theme.innerCard}`}>
              No upcoming interviews scheduled.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}