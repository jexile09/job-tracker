'use client';

type SettingsTabProps = {
  theme: any;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handlePasswordChange: (e: any) => void;
};

export default function SettingsTab({
  theme,
  darkMode,
  setDarkMode,
  newPassword,
  setNewPassword,
  handlePasswordChange,
}: SettingsTabProps) {
  return (
    <section className={`rounded-[32px] border p-6 shadow-md ${theme.card}`}>
      <h3 className="text-2xl font-semibold">Settings ⚙️</h3>
      <div className="mt-6 max-w-md space-y-4">
        <div className={`flex items-center justify-between rounded-2xl border p-4 ${theme.innerCard}`}>
          <div>
            <div className="font-semibold text-sm">Dark Mode 🌙</div>
            <div className="text-xs opacity-70">Deep dark charcoal theme</div>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white ${darkMode ? 'bg-[#FFB7B2]' : 'bg-[#71717A]'}`}
          >
            {darkMode ? 'Enabled' : 'Disabled'}
          </button>
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
    </section>
  );
}