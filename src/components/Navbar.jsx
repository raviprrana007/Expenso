import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  ArrowLeftRight,
  Contact,
  Archive,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
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
    { id: 'personal', label: 'Personal', icon: Receipt },
    { id: 'shared', label: 'Shared', icon: Users },
    { id: 'owes_dues', label: 'Owes/Dues', icon: ArrowLeftRight },
    { id: 'people', label: 'People', icon: Contact },
    { id: 'archive', label: 'Archive', icon: Archive },
  ];

  const userInitial = userName ? userName.trim().charAt(0).toUpperCase() : 'R';

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-280 shadow-sm shadow-black/20">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
              <img src="/app-icon.png" alt="Expenso" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-black text-sm sm:text-base tracking-wider text-white uppercase leading-tight">
                EXPENSO
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight truncate">
                Track Today. Stress Less.
              </span>
            </div>
          </div>

          {/* Right Controls: Theme Toggle, Notifications, User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 shadow-sm group ${
                  theme === 'light'
                    ? 'bg-slate-100 border border-slate-200 text-amber-500 hover:bg-amber-50 hover:rotate-12'
                    : 'bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:bg-purple-900/50 hover:-rotate-12'
                }`}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 fill-amber-400/30 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <Moon className="w-4 h-4 fill-purple-400/20 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
                )}
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('settings')}
              className="relative w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800/80 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 shadow-sm"
              title="Daily Reminder & Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Red notification dot indicator */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-600/30 border border-indigo-400/30 hover:scale-105 active:scale-90 transition-all duration-200 cursor-pointer flex-shrink-0"
              title="Profile & Settings"
              aria-label="Settings"
            >
              {profilePic ? (
                <img src={profilePic} alt={userName || 'User'} className="w-full h-full rounded-full object-cover" />
              ) : (
                userInitial
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Strip: 6 equal columns fitted exactly across the screen */}
        <div className="py-1.5 border-t border-slate-800/60 w-full">
          <nav className="w-full grid grid-cols-6 p-1 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md gap-0.5 sm:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 sm:px-1 rounded-xl transition-all duration-200 cursor-pointer min-w-0 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-slate-400'}`} />
                  <span className="text-[9px] xs:text-[10px] sm:text-[11px] leading-tight tracking-tight truncate max-w-full text-center">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
