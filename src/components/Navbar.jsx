import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  ArrowLeftRight,
  Contact,
  Archive,
  Settings,
  Plus,
  Sparkles,
  Bell,
  LogOut,
  UserCheck,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  currencySymbol,
  reminderTriggered,
  userName,
  profession,
  profilePic,
  theme = 'dark',
  onToggleTheme,
  onLockVault
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal Expenses', icon: Receipt },
    { id: 'shared', label: 'Shared Expenses', icon: Users },
    { id: 'owes_dues', label: 'Owes & Dues', icon: ArrowLeftRight },
    { id: 'people', label: 'People (4-Digit ID)', icon: Contact },
    { id: 'archive', label: 'Annual Archive', icon: Archive },
  ];

  const userInitial = userName ? userName.trim().charAt(0).toUpperCase() : 'E';

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-280">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* User Profile Banner Button -> Redirects to Settings */}
          <button
            type="button"
            className={`flex items-center gap-3 cursor-pointer group text-left p-1.5 -ml-1.5 rounded-2xl transition-all duration-200 focus:outline-none ${
              activeTab === 'settings'
                ? 'bg-indigo-950/40 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : 'hover:bg-slate-900/70'
            }`}
            onClick={() => setActiveTab('settings')}
            title="Open Vault Profile & Settings"
          >
            {profilePic ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/40 shadow-glow bg-slate-900 flex-shrink-0 group-hover:scale-105 group-hover:border-indigo-400 transition-all duration-200">
                <img src={profilePic} alt={userName || 'User'} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-glow text-white font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-all duration-200">
                {userInitial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent group-hover:text-indigo-200 transition-colors truncate max-w-[150px] sm:max-w-[220px]">
                  {userName ? userName.toUpperCase() : 'EXPENSO'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                  {profession || 'Local-First'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                <span>Vault Profile & Settings</span>
                <span className="text-[10px] text-slate-500">• Manage</span>
              </p>
            </div>
          </button>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 hover:border-indigo-500/40 text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500 transition-transform duration-200" />
                    <span className="hidden md:inline">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200" />
                    <span className="hidden md:inline">Light</span>
                  </>
                )}
              </button>
            )}

            {/* Switch / Lock Vault Button */}
            <button
              onClick={() => {
                if (window.confirm('Lock current vault and return to login screen? (Your data remains securely saved)')) {
                  onLockVault();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-800/80 hover:border-rose-500/40 text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
              title="Lock / Switch Vault"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300" />
              <span className="hidden sm:inline">Switch Vault</span>
            </button>

            {reminderTriggered && (
              <button
                onClick={() => setActiveTab('personal')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse shadow-glow"
                title="Daily 9 PM Reminder Active"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">9 PM Reminder</span>
              </button>
            )}

            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer btn-shimmer btn-press"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">Add Entry</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Centered Segmented Control) */}
        <div className="py-2.5 border-t border-slate-800/60 overflow-x-auto scrollbar-none flex justify-start sm:justify-center">
          <nav className="inline-flex items-center p-1 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-200 cursor-pointer btn-press group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? 'text-white scale-105' : 'text-slate-400 group-hover:scale-110'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
