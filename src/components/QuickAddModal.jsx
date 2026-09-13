import React, { useState } from 'react';
import { 
  Receipt, 
  Users, 
  ArrowLeftRight, 
  X, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { CATEGORIES } from '../types/constants';

export default function QuickAddModal({
  isOpen,
  onClose,
  people,
  settings,
  onAddPersonal,
  onAddShared,
  onAddOweDue,
  onOpenSharedModal
}) {
  const currencySymbol = settings.currencySymbol || '₹';
  const [entryType, setEntryType] = useState('personal'); // 'personal' | 'shared' | 'due' | 'owe'

  // Personal / OweDue form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personId, setPersonId] = useState(people[0]?.id || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a description / title.');
      return;
    }

    if (entryType === 'personal') {
      onAddPersonal({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        amount: amountNum,
        category,
        date,
        notes,
        createdAt: new Date().toISOString()
      });
      onClose();
    } else if (entryType === 'due' || entryType === 'owe') {
      if (!personId) {
        alert('Please select an identified person with 4-digit ID.');
        return;
      }
      const personObj = people.find(p => String(p.id) === String(personId));
      onAddOweDue({
        id: `od_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        amount: amountNum,
        originalAmount: amountNum,
        type: entryType,
        personId,
        personName: personObj ? personObj.name : `Person #${personId}`,
        personPhone: personObj ? personObj.phone : '',
        status: 'in_process',
        date,
        settlementDate: null,
        createdAt: new Date().toISOString()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl glass-modal p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Quick Add Transaction
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            type="button"
            onClick={() => setEntryType('personal')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              entryType === 'personal'
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Receipt className="w-4 h-4" /> Personal
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSharedModal();
            }}
            className="p-2.5 rounded-xl border bg-slate-900 border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
          >
            <Users className="w-4 h-4" /> Shared Bill &rarr;
          </button>

          <button
            type="button"
            onClick={() => setEntryType(entryType === 'due' ? 'owe' : 'due')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              entryType === 'due' || entryType === 'owe'
                ? 'bg-purple-600/30 border-purple-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> {entryType === 'due' ? 'Due (They Owe)' : entryType === 'owe' ? 'Owe (You Owe)' : 'Owe / Due'}
          </button>
        </div>

        {/* Sub-type switcher if Owe/Due */}
        {(entryType === 'due' || entryType === 'owe') && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setEntryType('due')}
              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                entryType === 'due' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Due (Someone owes you)
            </button>
            <button
              type="button"
              onClick={() => setEntryType('owe')}
              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                entryType === 'owe' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Owe (You owe someone)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch at Cafeteria, Metro recharge, Books"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Amount ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* If Personal: Category Selector */}
          {entryType === 'personal' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* If Owe/Due: Person Selector */}
          {(entryType === 'due' || entryType === 'owe') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Person (4-Digit ID) *
              </label>
              <select
                required
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Person --</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
