'use client';

type SettingsTabProps = {
  theme: any;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handlePasswordChange: (e: any) => void;
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
  defaultSalaryUnit: 'year' | 'hour';
  setDefaultSalaryUnit: (val: 'year' | 'hour') => void;
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
  defaultSalaryUnit,
  setDefaultSalaryUnit,
}: SettingsTabProps) {
  const settingButton = (active: boolean) =>
    `shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white ${active ? 'bg-[#FFB7B2]' : 'bg-[#71717A]'}`;

  return (
    <section className={`flex h-full flex-col justify-between rounded-[32px] border p-6 shadow-md ${theme.card}`}>
      <div>
        <h3 className="text-2xl font-semibold">Settings ⚙️</h3>
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
              <div className="font-semibold text-sm">Dark Mode 🌙</div>
              <div className="text-xs opacity-70">Use a softer dark tone across the app.</div>
            </div>
            <button type="button" onClick={() => setDarkMode(!darkMode)} className={settingButton(darkMode)}>
              {darkMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Show only open applications</div>
              <div className="text-xs opacity-70">Hide archived or rejected items in dashboard view.</div>
            </div>
            <button type="button" onClick={() => setShowOnlyOpen(!showOnlyOpen)} className={settingButton(showOnlyOpen)}>
              {showOnlyOpen ? 'On' : 'Off'}
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Compact dashboard rows</div>
              <div className="text-xs opacity-70">Reduce spacing for a denser job table.</div>
            </div>
            <button type="button" onClick={() => setCompactView(!compactView)} className={settingButton(compactView)}>
              {compactView ? 'On' : 'Off'}
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Collapse details by default</div>
              <div className="text-xs opacity-70">Keep notes and extra fields hidden until expanded.</div>
            </div>
            <button type="button" onClick={() => setHideDetailsByDefault(!hideDetailsByDefault)} className={settingButton(hideDetailsByDefault)}>
              {hideDetailsByDefault ? 'On' : 'Off'}
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Show salary column</div>
              <div className="text-xs opacity-70">Toggle salary visibility in the dashboard table.</div>
            </div>
            <button type="button" onClick={() => setShowSalaryColumn(!showSalaryColumn)} className={settingButton(showSalaryColumn)}>
              {showSalaryColumn ? 'On' : 'Off'}
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Show location column</div>
              <div className="text-xs opacity-70">Display job location in the dashboard table.</div>
            </div>
            <button type="button" onClick={() => setShowLocationColumn(!showLocationColumn)} className={settingButton(showLocationColumn)}>
              {showLocationColumn ? 'On' : 'Off'}
            </button>
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Default rate type</div>
              <div className="text-xs opacity-70">Choose the default salary unit for new applications.</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDefaultSalaryUnit('year')}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${defaultSalaryUnit === 'year' ? 'bg-[#FFB7B2] text-white' : 'bg-[#71717A] text-white'}`}
              >
                Yearly
              </button>
              <button
                type="button"
                onClick={() => setDefaultSalaryUnit('hour')}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${defaultSalaryUnit === 'hour' ? 'bg-[#FFB7B2] text-white' : 'bg-[#71717A] text-white'}`}
              >
                Hourly
              </button>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className={`space-y-3 rounded-2xl border p-4 ${theme.innerCard}`}>
            <h4 className="font-semibold text-sm">Change Password 🔑</h4>
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
