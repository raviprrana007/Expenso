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
  Bell
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenQuickAdd, currencySymbol, reminderTriggered }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal Expenses', icon: Receipt },
    { id: 'shared', label: 'Shared Expenses', icon: Users },
    { id: 'owes_dues', label: 'Owes & Dues', icon: ArrowLeftRight },
    { id: 'people', label: 'People (4-Digit ID)', icon: Contact },
    { id: 'archive', label: 'Annual Archive', icon: Archive },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-glow text-white font-bold text-xl">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  EXPENSO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Local-First
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Smart Budgeting & Group Expense Split</p>
            </div>
          </div>

          {/* Quick Actions & Reminder Pill */}
          <div className="flex items-center gap-3">
            {reminderTriggered && (
              <button 
                onClick={() => setActiveTab('personal')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse"
                title="Daily 9 PM Reminder Active"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">9 PM Reminder</span>
              </button>
            )}

            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Entry</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
