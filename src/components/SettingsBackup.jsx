import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Wallet, 
  DollarSign, 
  Bell, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Calendar
} from 'lucide-react';
import { CURRENCIES } from '../types/constants';
import { BudgetCalculator } from '../services/budgetCalculator';

export default function SettingsBackup({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onLoadSampleData,
  onClearAllData,
  selectedMonth
}) {
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

  const fileInputRef = useRef(null);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    const currObj = CURRENCIES.find(c => c.code === currency);
    const updated = {
      ...settings,
      currency,
      currencySymbol: currObj ? currObj.symbol : '₹',
      defaultMonthlyLimit: Number(defaultLimit),
      monthlyLimits: {
        ...(settings.monthlyLimits || {}),
        [selectedMonth]: Number(currentMonthLimit)
      },
      reminderEnabled,
      reminderTime
    };

    onUpdateSettings(updated);
    setSaveMessage('Settings updated and live recalculations applied successfully!');
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

  const testBrowserNotification = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('Expenso 9:00 PM Reminder', {
        body: 'Time to record your daily personal expenses and shared bills!',
        icon: '/vite.svg'
      });
    } else {
      alert('Notification permission was denied. Please allow notifications in browser settings.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center gap-3 p-5 rounded-2xl glass-panel">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings & Backup</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure monthly spending limits, 9 PM reminder, currency, and local data export/import.
          </p>
        </div>
      </div>

      {/* Alert Message */}
      {saveMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{saveMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Monthly Budget Limits */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Wallet className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Monthly Spending Limits</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Default Monthly Spending Limit ({settings.currencySymbol || '₹'})
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={defaultLimit}
              onChange={(e) => setDefaultLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Rule 6: Applied to new months and carries forward automatically.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Current Month Override ({BudgetCalculator.formatMonthName(selectedMonth)})
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={currentMonthLimit}
              onChange={(e) => setCurrentMonthLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Rule 5: Changing the limit immediately recalculates remaining budget or overspent amounts.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Save Limit & Currency Settings
          </button>
        </div>

        {/* Section 2: 9:00 PM Daily Reminder (Rule 4) */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Daily 9:00 PM Reminder</h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Rule 4 Behavior:</span>
            <span>• If you ignore or dismiss the reminder, Expenso does NOT record a 0 transaction or any blank entry.</span>
            <span>• You can backdate transactions anytime for past dates.</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={testBrowserNotification}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
            >
              Test Browser Notification
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Data Backup, Restore & Sample Data (Rules 16 & 17) */}
      <div className="p-6 rounded-2xl glass-panel space-y-5 border border-slate-800">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-white text-base">Local-First Backup & Data Management</h3>
            <p className="text-xs text-slate-400">Rule 16: Your data remains strictly on your device.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Export JSON */}
          <button
            onClick={onExportData}
            className="p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Export JSON Backup</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-5 h-5 text-indigo-400" />
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
            className="p-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Load Student Demo Data</span>
          </button>

          {/* Reset Data */}
          <button
            onClick={() => {
              if (window.confirm('WARNING: Reset and clear all personal expenses, shared bills, and directory records? This action cannot be undone unless you exported a backup.')) {
                onClearAllData();
              }
            }}
            className="p-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-5 h-5 text-rose-400" />
            <span>Clear All App Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
