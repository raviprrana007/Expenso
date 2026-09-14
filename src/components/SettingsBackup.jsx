import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Wallet,
  Bell,
  Download,
  Upload,
  Trash2,
  Database,
  CheckCircle2,
  Sparkles,
  User,
  LogOut,
  Camera,
  Image as ImageIcon,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import { CURRENCIES, PROFESSIONS } from '../types/constants';
import { BudgetCalculator } from '../services/budgetCalculator';
import { syncDailyReminder, sendTestNotification, isNative } from '../utils/notificationService';

export default function SettingsBackup({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onLoadSampleData,
  onClearAllData,
  selectedMonth,
  onLockVault
}) {
  const [userName, setUserName] = useState(settings.userName || '');
  const [profession, setProfession] = useState(settings.profession || '');
  const [profilePic, setProfilePic] = useState(settings.profilePic || '');
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [defaultLimit, setDefaultLimit] = useState(settings.defaultMonthlyLimit || 10000);
  const [currentMonthLimit, setCurrentMonthLimit] = useState(
    settings.monthlyLimits?.[selectedMonth] !== undefined
      ? settings.monthlyLimits[selectedMonth]
      : (settings.defaultMonthlyLimit || 10000)
  );
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled !== false);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '21:00');
  const [saveMessage, setSaveMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // Sync state if settings prop updates externally
  useEffect(() => {
    setUserName(settings.userName || '');
    setProfession(settings.profession || '');
    setProfilePic(settings.profilePic || '');
    setTheme(settings.theme || 'dark');
    setDefaultLimit(settings.defaultMonthlyLimit || 10000);
    setCurrency(settings.currency || 'INR');
    setReminderEnabled(settings.reminderEnabled !== false);
    setReminderTime(settings.reminderTime || '21:00');
    setCurrentMonthLimit(
      settings.monthlyLimits?.[selectedMonth] !== undefined
        ? settings.monthlyLimits[selectedMonth]
        : (settings.defaultMonthlyLimit || 10000)
    );
  }, [settings, selectedMonth]);

  const handleSelectTheme = (newTheme) => {
    setTheme(newTheme);
    onUpdateSettings({ ...settings, theme: newTheme });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setProfilePic(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    const currObj = CURRENCIES.find(c => c.code === currency);
    const updatedMonthlyLimits = { ...(settings.monthlyLimits || {}) };

    // Priority rule: If Current Month Limit is set, it always takes priority over Monthly Limit for that month.
    if (currentMonthLimit !== '' && currentMonthLimit !== null && !isNaN(Number(currentMonthLimit))) {
      updatedMonthlyLimits[selectedMonth] = Number(currentMonthLimit);
    } else {
      delete updatedMonthlyLimits[selectedMonth];
    }

    const updated = {
      ...settings,
      userName: userName.trim() || 'Vault User',
      profession: profession.trim(),
      profilePic: profilePic || '',
      theme: theme || 'dark',
      currency,
      currencySymbol: currObj ? currObj.symbol : '₹',
      defaultMonthlyLimit: Number(defaultLimit) || 10000,
      monthlyLimits: updatedMonthlyLimits,
      reminderEnabled,
      reminderTime
    };

    onUpdateSettings(updated);
    syncDailyReminder(reminderTime, reminderEnabled);
    setSaveMessage('Profile & Budget Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (onImportData(json)) {
          alert('Backup restored successfully! All transactions, limits, and contacts have been loaded.');
        }
      } catch (err) {
        alert(`Failed to import backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl glass-panel">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm flex-shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Settings & Backup</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure monthly spending limits, 9 PM reminder, currency, and local data export/import.
          </p>
        </div>
      </div>

      {/* Alert Message */}
      {saveMessage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{saveMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Section 1: User Profile & Vault Identity */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <h3 className="font-bold text-white text-base">Vault Profile & Identity</h3>
            </div>
            {onLockVault && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Lock current vault and switch or log in with another?')) {
                    onLockVault();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Vault</span>
              </button>
            )}
          </div>

          {/* Profile Picture Uploader */}
          <div className="flex items-center gap-3.5 sm:gap-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="relative group flex-shrink-0">
              <div
                onClick={() => profilePicInputRef.current?.click()}
                className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 bg-slate-800/80 flex items-center justify-center cursor-pointer transition-all shadow-md group-hover:scale-105"
                title="Click to change profile picture"
              >
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-300">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-semibold">Add Photo</span>
                  </div>
                )}
              </div>
              {profilePic && (
                <button
                  type="button"
                  onClick={() => setProfilePic('')}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-transform hover:scale-110"
                  title="Remove photo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Profile Photo (DP)</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {profilePic ? 'Set' : 'None'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                Stored offline in your vault and included in JSON backup exports.
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => profilePicInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline cursor-pointer flex items-center gap-1 py-0.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{profilePic ? 'Change Photo' : 'Upload Image'}</span>
                </button>
                {profilePic && (
                  <button
                    type="button"
                    onClick={() => setProfilePic('')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold hover:underline cursor-pointer py-0.5"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={profilePicInputRef}
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Full Name / Nickname
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold text-base sm:text-sm focus:outline-none focus:border-indigo-500 font-medium"
              placeholder="e.g. Ravi Rana"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Profession / Role
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold text-base sm:text-sm focus:outline-none focus:border-indigo-500 mb-2 font-medium"
              placeholder="e.g. Software Engineer, Student"
            />
            <div className="flex flex-wrap gap-1.5">
              {PROFESSIONS.slice(0, 5).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setProfession(p)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    profession === p
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Spending Limits</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Monthly Limit ({settings.currencySymbol || '₹'})
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={defaultLimit}
              onChange={(e) => setDefaultLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-base sm:text-sm focus:outline-none focus:border-indigo-500 tabular-nums"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The default limit used for new months.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Current Month Limit ({BudgetCalculator.formatMonthName(selectedMonth)})
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={currentMonthLimit}
              onChange={(e) => setCurrentMonthLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-base sm:text-sm focus:outline-none focus:border-indigo-500 tabular-nums"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The limit specifically applied to this month. Always takes priority over Monthly Limit.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Theme & Appearance */}
          <div className="pt-2 border-t border-slate-800/60">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span>Theme & Appearance (Dark by Default)</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-slate-950 text-indigo-400 border border-slate-800 flex-shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block text-white truncate">Dark Theme</span>
                  <span className="text-[10px] text-slate-400 block truncate">Default</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  theme === 'light'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex-shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block text-white truncate">Light Theme</span>
                  <span className="text-[10px] text-slate-400 block truncate">Bright</span>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-98 min-h-[42px]"
          >
            Save Profile & Budget Settings
          </button>
        </div>

        {/* Section 2: 9:00 PM Daily Reminder */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <h3 className="font-bold text-white text-base">Daily 9:00 PM Reminder</h3>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-sm font-semibold text-white block">Enable Daily Reminder</span>
              <span className="text-xs text-slate-400">Prompts you to record your day's transactions</span>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Scheduled Reminder Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Reminder Notes:</span>
            <div>• If you ignore or dismiss the reminder, Expenso does not record any blank or zero entry.</div>
            <div>• You can backdate transactions anytime for past dates.</div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs transition-colors cursor-pointer active:scale-98 min-h-[42px]"
            >
              {isNative() ? 'Test Android Notification' : 'Test Browser Notification'}
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Data Backup, Restore & Sample Data */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel space-y-4 sm:space-y-5 border border-slate-800">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-white text-base">Local-First Backup & Data Management</h3>
            <p className="text-xs text-slate-400">Your data remains 100% private and stored locally on your device.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Export JSON */}
          <button
            onClick={async () => {
              if (isExporting) return;
              setIsExporting(true);
              try {
                await onExportData?.();
                setExportSuccess(true);
                setTimeout(() => setExportSuccess(false), 3500);
              } catch (err) {
                console.error('Export error:', err);
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            className={`p-3.5 sm:p-4 rounded-xl text-white font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2.5 sm:gap-2 shadow-md transition-all cursor-pointer active:scale-95 min-h-[44px] ${
              exportSuccess
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-600/25'
            }`}
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-200" />
                <span>Backup Exported!</span>
              </>
            ) : isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                <span>Export JSON Backup</span>
              </>
            )}
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 sm:p-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2.5 sm:gap-2 transition-all cursor-pointer active:scale-95 min-h-[44px]"
          >
            <Upload className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-400 flex-shrink-0" />
            <span>Import JSON Backup</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Load Sample Student Data */}
          <button
            onClick={() => {
              if (window.confirm('Load sample college student expense dataset? This will load realistic expenses, shared bills, and dues for testing.')) {
                onLoadSampleData();
              }
            }}
            className="p-3.5 sm:p-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2.5 sm:gap-2 transition-all cursor-pointer active:scale-95 min-h-[44px]"
          >
            <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400 flex-shrink-0" />
            <span>Load Student Demo Data</span>
          </button>

          {/* Reset Data */}
          <button
            onClick={() => {
              if (window.confirm('WARNING: Reset and clear all personal expenses, shared bills, and directory records? This action cannot be undone unless you exported a backup.')) {
                onClearAllData();
              }
            }}
            className="p-3.5 sm:p-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2.5 sm:gap-2 transition-all cursor-pointer active:scale-95 min-h-[44px]"
          >
            <Trash2 className="w-4 sm:w-5 h-4 sm:h-5 text-rose-400 flex-shrink-0" />
            <span>Clear All App Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
