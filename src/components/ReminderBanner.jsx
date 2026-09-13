import React from 'react';
import { Bell, Plus, X } from 'lucide-react';

export default function ReminderBanner({
  isOpen,
  onDismiss,
  onOpenAddExpense
}) {
  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-indigo-700/90 backdrop-blur-xl text-white shadow-lg border-b border-amber-400/30 relative animate-in slide-in-from-top-4 duration-300 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-black/25 border border-white/20 shadow-inner flex-shrink-0">
            <Bell className="w-4 h-4 text-amber-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight">9:00 PM Daily Check-In</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-amber-200">
                Daily Log
              </span>
            </div>
            <p className="text-xs text-amber-100/90 mt-0.5">
              Did you spend anything today? Record your transactions now or enter them later anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenAddExpense}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-amber-50 font-bold text-xs shadow-md inline-flex items-center gap-1.5 transition-all duration-150 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Log Today's Expenses
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-amber-100 border border-white/10 transition-all duration-150 active:scale-90"
            title="Dismiss reminder (Creates no blank record)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
