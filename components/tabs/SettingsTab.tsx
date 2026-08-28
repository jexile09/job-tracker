'use client';

import type { FormEvent } from 'react';
import type { ThemeStyles } from '../../types';

type CustomizationCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
  darkMode: boolean;
};

function CustomizationCheckbox({ label, checked, onChange, description, darkMode }: CustomizationCheckboxProps) {
  return (
    <label
      className={`flex items-start justify-between gap-3 rounded-2xl border p-3 text-sm transition ${
        darkMode ? 'border-[#2d2e36] bg-[#18181b]/50 hover:bg-[#18181b]' : 'border-gray-200 bg-white/60 hover:bg-white'
      }`}
    >
      <div className="min-w-0">
        <p className={`font-semibold ${darkMode ? 'text-[#f4f4f5]' : 'text-[#4E3B3B]'}`}>{label}</p>
        <p className={`text-xs ${darkMode ? 'text-[#a1a1aa]' : 'opacity-70'}`}>{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`mt-1 h-4 w-4 rounded ${darkMode ? 'accent-[#f87171]' : 'accent-[#FFB7B2]'}`}
      />
    </label>
  );
}

type SettingsTabProps = {
  theme: ThemeStyles;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handlePasswordChange: (e: FormEvent<HTMLFormElement>) => void;
  userEmail?: string | null;
  handleSignOut: () => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (val: boolean) => void;
  compactView: boolean;
  setCompactView: (val: boolean) => void;
  hideDetailsByDefault: boolean;
  setHideDetailsByDefault: (val: boolean) => void;
  showSalaryColumn: boolean;
  setShowSalaryColumn: (val: boolean) => void;
  showLocationColumn: boolean;
  setShowLocationColumn: (val: boolean) => void;
  showOpenApplicationsCard: boolean;
  setShowOpenApplicationsCard: (val: boolean) => void;
  showUpcomingInterviewsCard: boolean;
  setShowUpcomingInterviewsCard: (val: boolean) => void;
  showArchivedCard: boolean;
  setShowArchivedCard: (val: boolean) => void;
  showStatusBreakdown: boolean;
  setShowStatusBreakdown: (val: boolean) => void;
  onResetDashboardCustomization: () => void;
};

export default function SettingsTab({
  theme,
  darkMode,
  setDarkMode,
  newPassword,
  setNewPassword,
  handlePasswordChange,
  userEmail,
  handleSignOut,
  showOnlyOpen,
  setShowOnlyOpen,
  compactView,
  setCompactView,
  hideDetailsByDefault,
  setHideDetailsByDefault,
  showSalaryColumn,
  setShowSalaryColumn,
  showLocationColumn,
  setShowLocationColumn,
  showOpenApplicationsCard,
  setShowOpenApplicationsCard,
  showUpcomingInterviewsCard,
  setShowUpcomingInterviewsCard,
  showArchivedCard,
  setShowArchivedCard,
  showStatusBreakdown,
  setShowStatusBreakdown,
  onResetDashboardCustomization,
}: SettingsTabProps) {
  const settingButton = (active: boolean) =>
    `shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white ${active ? 'bg-[#f87171]' : 'bg-[#71717A]'}`;
  const secondaryButton = darkMode
    ? 'border-[#3f3f46] bg-[#1c1d22] text-[#a1a1aa] hover:bg-[#18181b]'
    : 'border-[#FFD9D4] bg-[#FFF5F5] text-[#A95565]';

  return (
    <section className={`flex h-full flex-col justify-between rounded-[32px] border p-6 shadow-md ${theme.card}`}>
      <div>
        <h3 className="text-2xl font-semibold">Settings</h3>
        <div className="mt-6 space-y-4">
          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Signed in as</div>
              <div className="text-xs opacity-70">{userEmail || 'No account loaded'}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${secondaryButton}`}
            >
              Sign out
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Dark Mode</div>
              <div className="text-xs opacity-70">Use a softer dark tone across the app.</div>
            </div>
            <button type="button" onClick={() => setDarkMode(!darkMode)} className={settingButton(darkMode)}>
              {darkMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <details className={`rounded-2xl border p-5 ${theme.innerCard}`} open>
            <summary className="cursor-pointer text-sm font-semibold">Dashboard Customization</summary>
            <p className="mt-1 text-xs opacity-70">
              Configure which sections, metrics, and table columns display on the main dashboard.
            </p>

            <div className="mt-5 space-y-5">
              {/* Category 1: Summary Metric Cards */}
              <div>
                <p className="text-xs font-bold tracking-wider uppercase opacity-80 mb-2.5">
                  Header Summary Cards
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CustomizationCheckbox
                    label="Show open applications card"
                    description="Display the top card tracking active applications."
                    checked={showOpenApplicationsCard}
                    onChange={setShowOpenApplicationsCard}
                    darkMode={darkMode}
                  />
                  <CustomizationCheckbox
                    label="Show upcoming interviews card"
                    description="Display the top card tracking scheduled interviews."
                    checked={showUpcomingInterviewsCard}
                    onChange={setShowUpcomingInterviewsCard}
                    darkMode={darkMode}
                  />
                  <CustomizationCheckbox
                    label="Show archived card"
                    description="Display the top card tracking archived applications."
                    checked={showArchivedCard}
                    onChange={setShowArchivedCard}
                    darkMode={darkMode}
                  />
                  <CustomizationCheckbox
                    label="Show status breakdown"
                    description="Display counts for Applied, Interview, Offered, and Rejected."
                    checked={showStatusBreakdown}
                    onChange={setShowStatusBreakdown}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* Category 2: Table Columns */}
              <div className="border-t pt-4 border-gray-200/50 dark:border-gray-800">
                <p className="text-xs font-bold tracking-wider uppercase opacity-80 mb-2.5">
                  Dashboard Table Columns
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CustomizationCheckbox
                    label="Show salary column"
                    description="Display salary compensation in the table."
                    checked={showSalaryColumn}
                    onChange={setShowSalaryColumn}
                    darkMode={darkMode}
                  />
                  <CustomizationCheckbox
                    label="Show location column"
                    description="Display job work location in the table."
                    checked={showLocationColumn}
                    onChange={setShowLocationColumn}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* Category 3: Row Spacing & Filtering */}
              <div className="border-t pt-4 border-gray-200/50 dark:border-gray-800">
                <p className="text-xs font-bold tracking-wider uppercase opacity-80 mb-2.5">
                  Table Layout & Filtering
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <CustomizationCheckbox
                    label="Compact rows"
                    description="Use tighter vertical row padding."
                    checked={compactView}
                    onChange={setCompactView}
                    darkMode={darkMode}
                  />
                  <CustomizationCheckbox
                    label="Hide details by default"
                    description="Keep interview notes collapsed on load."
                    checked={hideDetailsByDefault}
                    onChange={setHideDetailsByDefault}
                    darkMode={darkMode}
                  />
                  <CustomizationCheckbox
                    label="Show only open jobs"
                    description="Hide rejected applications from the list."
                    checked={showOnlyOpen}
                    onChange={setShowOnlyOpen}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onResetDashboardCustomization}
              className={`mt-5 w-full rounded-xl border px-3 py-2 text-xs font-semibold ${secondaryButton}`}
            >
              Reset dashboard customization to defaults
            </button>
          </details>

          <form onSubmit={handlePasswordChange} className={`space-y-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <h4 className="font-semibold text-sm">Change Password</h4>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${theme.input}`}
            />
            <button
              type="submit"
              className={`w-full rounded-xl py-2 text-xs font-semibold text-white ${
                darkMode ? 'bg-[#f87171] hover:bg-[#ef4444]' : 'bg-[#FFB7B2]'
              }`}
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}