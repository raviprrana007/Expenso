import React, { useState } from 'react';
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
  Moon,
  MoreHorizontal
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

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
    <>
      <header className="w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-280">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            {/* User Profile Banner Button -> Redirects to Settings */}
            <button
              type="button"
              className={`flex items-center gap-2 sm:gap-3 cursor-pointer group text-left p-1 -ml-1 sm:-ml-1.5 rounded-2xl transition-all duration-200 focus:outline-none min-w-0 ${
                activeTab === 'settings'
                  ? 'bg-indigo-950/40 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : 'hover:bg-slate-900/70'
              }`}
              onClick={() => setActiveTab('settings')}
              title="Open Vault Profile & Settings"
            >
              {profilePic ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-indigo-500/40 shadow-glow bg-slate-900 flex-shrink-0 group-hover:scale-105 group-hover:border-indigo-400 transition-all duration-200">
                  <img src={profilePic} alt={userName || 'User'} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-glow text-white font-bold text-sm sm:text-lg flex-shrink-0 group-hover:scale-105 transition-all duration-200">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent group-hover:text-indigo-200 transition-colors truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[200px]">
                    {userName ? userName.toUpperCase() : 'EXPENSO'}
                  </span>
                  <span className="hidden xs:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 sm:py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors truncate max-w-[70px] sm:max-w-none">
                    {profession || 'Vault'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                  <span>Vault Profile & Settings</span>
                  <span className="text-[10px] text-slate-500">• Manage</span>
                </p>
              </div>
            </button>

            {/* Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 hover:border-indigo-500/40 text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                  title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
                  aria-label="Toggle Theme"
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
                className="flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-800/80 hover:border-rose-500/40 text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                title="Lock / Switch Vault"
                aria-label="Switch Vault"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Vault</span>
              </button>

              {reminderTriggered && (
                <button
                  onClick={() => setActiveTab('personal')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse shadow-glow"
                  title="Daily 9 PM Reminder Active"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">9 PM</span>
                </button>
              )}

              <button
                onClick={onOpenQuickAdd}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer btn-shimmer btn-press"
              >
                <Plus className="w-4 h-4" />
                <span className="font-bold">Add<span className="hidden sm:inline"> Entry</span></span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Smooth Scrollable Segmented Control on all screens) */}
          <div className="py-2 border-t border-slate-800/60 overflow-x-auto scrollbar-none scroll-touch flex justify-start sm:justify-center -mx-3 px-3 sm:mx-0 sm:px-0">
            <nav className="inline-flex items-center p-1 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md space-x-1 flex-shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-200 cursor-pointer btn-press group ${
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

      {/* Mobile Bottom App Dock (Visible on Mobile Screens only: md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/92 backdrop-blur-2xl border-t border-slate-800/80 px-2 pt-1 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around max-w-lg mx-auto relative">
          {/* Dashboard */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
              activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">Home</span>
          </button>

          {/* Personal */}
          <button
            onClick={() => {
              setActiveTab('personal');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
              activeTab === 'personal' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className={`w-5 h-5 transition-transform ${activeTab === 'personal' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">Personal</span>
          </button>

          {/* Floating Center Quick Add Button */}
          <div className="relative -mt-6 flex flex-col items-center">
            <button
              onClick={onOpenQuickAdd}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-slate-950 active:scale-95 transition-all duration-150 cursor-pointer"
              title="Quick Add Expense"
              aria-label="Quick Add"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
            <span className="text-[9px] font-bold text-slate-300 mt-0.5">Add</span>
          </div>

          {/* Shared */}
          <button
            onClick={() => {
              setActiveTab('shared');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
              activeTab === 'shared' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className={`w-5 h-5 transition-transform ${activeTab === 'shared' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">Split</span>
          </button>

          {/* Owes & Dues */}
          <button
            onClick={() => {
              setActiveTab('owes_dues');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
              activeTab === 'owes_dues' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className={`w-5 h-5 transition-transform ${activeTab === 'owes_dues' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">Dues</span>
          </button>

          {/* More Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
                activeTab === 'people' || activeTab === 'archive' || activeTab === 'settings' || isMoreMenuOpen
                  ? 'text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="More Features"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5">More</span>
            </button>

            {/* Popup Menu for People, Archive, Settings */}
            {isMoreMenuOpen && (
              <div className="absolute bottom-14 right-0 w-48 rounded-2xl glass-modal p-2 shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
                <button
                  onClick={() => {
                    setActiveTab('people');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                    activeTab === 'people' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Contact className="w-4 h-4" />
                  <span>People Directory</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('archive');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                    activeTab === 'archive' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>Annual Archive</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                    activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings & Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

