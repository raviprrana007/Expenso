import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar, 
  Tag, 
  ArrowUpDown,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { CATEGORIES } from '../types/constants';
import { BudgetCalculator } from '../services/budgetCalculator';

export default function PersonalExpenses({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  selectedMonth,
  setSelectedMonth,
  settings
}) {
  const currencySymbol = settings.currencySymbol || '₹';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState(selectedMonth);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const openAddModal = () => {
    setEditingTx(null);
    setFormData({
      title: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setFormData({
      title: tx.title || '',
      amount: tx.amount || '',
      category: tx.category || 'food',
      date: tx.date || new Date().toISOString().split('T')[0],
      notes: tx.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTx(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a title or place for the expense.');
      return;
    }

    if (editingTx) {
      onUpdateTransaction({
        ...editingTx,
        title: formData.title.trim(),
        amount: amountNum,
        category: formData.category,
        date: formData.date,
        notes: formData.notes
      });
    } else {
      const newTx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: formData.title.trim(),
        amount: amountNum,
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };
      onAddTransaction(newTx);
    }

    closeModal();
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchTerm || 
      tx.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    
    const matchesMonth = !filterMonth || filterMonth === 'all' || BudgetCalculator.getMonthKey(tx.date) === filterMonth;

    return matchesSearch && matchesCategory && matchesMonth;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Distinct months in transactions for filter dropdown
  const distinctMonths = Array.from(new Set(transactions.map(t => BudgetCalculator.getMonthKey(t.date)).filter(Boolean))).sort().reverse();
  if (!distinctMonths.includes(selectedMonth)) {
    distinctMonths.unshift(selectedMonth);
  }

  const currentTotal = filteredTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Personal Expenses</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track individual expenses, edit any historical entry, and monitor your monthly spending budget.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Personal Expense
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Months</option>
            {distinctMonths.map(m => (
              <option key={m} value={m}>
                {BudgetCalculator.formatMonthName(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Summary */}
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Filtered: </span>
          <span className="text-sm font-bold text-indigo-400">
            {currencySymbol} {currentTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel">
          <Sparkles className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No personal expenses found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try changing your search keywords or filter options.'
              : 'Start logging your daily expenses to keep your monthly budget on track.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Your First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map(tx => {
            const catObj = CATEGORIES.find(c => c.id === tx.category);
            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl glass-panel-interactive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${catObj ? catObj.bg : 'bg-slate-800 text-slate-400'}`}>
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{tx.title}</h4>
                      {tx.isSharedShare && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Shared Share
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {tx.date}
                      </span>
                      <span>•</span>
                      <span>{catObj ? catObj.name : 'Personal'}</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-500">{tx.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right amount & actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-black text-white">
                      {currencySymbol} {(Number(tx.amount) || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Edit Expense"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${tx.title}" (${currencySymbol}${tx.amount})? This will immediately recalculate your monthly budget.`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl glass-modal p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                {editingTx ? 'Edit Personal Expense' : 'Add Personal Expense'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Title / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Expense Description / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canteen Lunch, Books, Uber, Groceries"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Transaction Date * (Backdatable)
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional context or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg transition-all"
                >
                  {editingTx ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
