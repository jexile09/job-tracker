'use client';

import type { FormEvent } from 'react';
import type { ThemeStyles } from '../../types';

type CustomizationCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
};

function CustomizationCheckbox({ label, checked, onChange, description }: CustomizationCheckboxProps) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-2xl border p-3 text-sm">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="text-xs opacity-70">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
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
    `shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white ${active ? 'bg-[#FFB7B2]' : 'bg-[#71717A]'}`;

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
              className="shrink-0 rounded-xl border border-[#FFD9D4] bg-[#FFF5F5] px-3 py-2 text-xs font-semibold text-[#A95565]"
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

          <details className={`rounded-2xl border p-4 ${theme.innerCard}`} open>
            <summary className="cursor-pointer text-sm font-semibold">Dashboard Customization</summary>
            <p className="mt-2 text-xs opacity-70">
              Choose exactly what appears on your dashboard. These preferences sync with your account.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CustomizationCheckbox
                label="Show only open jobs"
                description="Hide rejected items in the dashboard list."
                checked={showOnlyOpen}
                onChange={setShowOnlyOpen}
              />
              <CustomizationCheckbox
                label="Compact rows"
                description="Use tighter spacing in dashboard table rows."
                checked={compactView}
                onChange={setCompactView}
              />
              <CustomizationCheckbox
                label="Hide details by default"
                description="Start each row collapsed until opened."
                checked={hideDetailsByDefault}
                onChange={setHideDetailsByDefault}
              />
              <CustomizationCheckbox
                label="Show salary column"
                description="Display salary in the dashboard table."
                checked={showSalaryColumn}
                onChange={setShowSalaryColumn}
              />
              <CustomizationCheckbox
                label="Show location column"
                description="Display location in the dashboard table."
                checked={showLocationColumn}
                onChange={setShowLocationColumn}
              />
              <CustomizationCheckbox
                label="Show open applications card"
                description="Display top summary card for open applications."
                checked={showOpenApplicationsCard}
                onChange={setShowOpenApplicationsCard}
              />
              <CustomizationCheckbox
                label="Show upcoming interviews card"
                description="Display top summary card for upcoming interviews."
                checked={showUpcomingInterviewsCard}
                onChange={setShowUpcomingInterviewsCard}
              />
              <CustomizationCheckbox
                label="Show archived card"
                description="Display top summary card for archived jobs."
                checked={showArchivedCard}
                onChange={setShowArchivedCard}
              />
              <CustomizationCheckbox
                label="Show status breakdown"
                description="Show applied, interview, offered, and rejected counts."
                checked={showStatusBreakdown}
                onChange={setShowStatusBreakdown}
              />
            </div>

            <button
              type="button"
              onClick={onResetDashboardCustomization}
              className="mt-4 w-full rounded-xl border border-[#FFD9D4] bg-[#FFF5F5] px-3 py-2 text-xs font-semibold text-[#A95565]"
            >
              Reset dashboard customization
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
            <button type="submit" className="w-full rounded-xl bg-[#FFB7B2] py-2 text-xs font-semibold text-white">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}