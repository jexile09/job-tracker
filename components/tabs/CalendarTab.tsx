'use client';

import { useState } from 'react';
import type { JobRecord } from '../../types';

type CalendarTabProps = {
  theme: any;
  jobs: JobRecord[];
  makeGoogleCalendarUrl: (t: string, d: string, det: string, loc?: string) => string;
};

export default function CalendarTab({ theme, jobs, makeGoogleCalendarUrl }: CalendarTabProps) {
  const [pendingCalendarLink, setPendingCalendarLink] = useState<string | null>(null);

  const handleCalendarLinkClick = (url: string) => {
    setPendingCalendarLink(url);
  };

  const confirmCalendarOpen = () => {
    if (!pendingCalendarLink) return;
    window.open(pendingCalendarLink, '_blank', 'noopener,noreferrer');
    setPendingCalendarLink(null);
  };

  return (
    <>
      <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
        <h3 className="text-2xl font-semibold">Upcoming Schedule 🗓️</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${theme.innerCard}`}>
            <h4 className="font-semibold text-[#FFB7B2]">Upcoming Interviews</h4>
            {jobs.filter((j) => j.interview_date).map((j) => {
              const interviewDate = j.interview_date;
              const calendarDetails = [j.notes, j.application_link ? `Application: ${j.application_link}` : '']
                .filter(Boolean)
                .join('\n');
              const calendarUrl = makeGoogleCalendarUrl(
                `Interview: ${j.company_name}`,
                interviewDate || '',
                calendarDetails,
                j.location || ''
              );

              return (
                <div key={j.id} className="mt-2 flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-semibold">{j.company_name}</div>
                    <div className="text-xs opacity-70">{interviewDate ? new Date(interviewDate).toLocaleString() : 'No date set'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCalendarLinkClick(calendarUrl)}
                    className="rounded-xl bg-[#EAF4FF] px-2.5 py-1 text-xs font-semibold text-[#3B629B]"
                  >
                    Add Event
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {pendingCalendarLink ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-[#FFE5E2] bg-[#FFFDF9] p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-[#4E3B3B]">Add this interview to Google Calendar?</h4>
            <p className="mt-2 text-sm text-[#6C5656]">This will open Google Calendar with the event details pre-filled. Allow it?</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setPendingCalendarLink(null)} className="flex-1 rounded-2xl border border-[#FFE5E2] bg-white px-3 py-2 text-sm font-semibold text-[#6C5656]">
                Cancel
              </button>
              <button type="button" onClick={confirmCalendarOpen} className="flex-1 rounded-2xl bg-[#FFB7B2] px-3 py-2 text-sm font-semibold text-white">
                Add Event
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}