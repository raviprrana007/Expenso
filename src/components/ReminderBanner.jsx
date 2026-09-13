import React from 'react';
import { Bell, Plus, X, Clock, Calendar } from 'lucide-react';

export default function ReminderBanner({
  isOpen,
  onDismiss,
  onOpenAddExpense
}) {
  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 text-white shadow-xl relative animate-in slide-in-from-top-4 duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-black/20 border border-white/20">
            <Bell className="w-5 h-5 text-amber-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight">9:00 PM Daily Check-In Reminder</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-amber-200">
                Rule 4
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
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-md inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Log Today's Expenses
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-amber-100 border border-white/10 transition-colors"
            title="Dismiss reminder (Creates no blank record)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
