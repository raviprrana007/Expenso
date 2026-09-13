import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  Sparkles,
  X,
  Wallet,
  PlusCircle
} from 'lucide-react';
import { CATEGORIES, PAYMENT_MODES, getCategoryDisplay, getPaymentModeDisplay } from '../types/constants';
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
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('all');
  const [filterMonth, setFilterMonth] = useState(selectedMonth);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'others',
    customCategory: '',
    paymentMode: 'upi',
    customPaymentMode: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const openAddModal = () => {
    setEditingTx(null);
    setFormData({
      title: '',
      amount: '',
      category: 'others',
      customCategory: '',
      paymentMode: 'upi',
      customPaymentMode: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    const isPredefinedCat = CATEGORIES.some(c => c.id === tx.category);
    const isPredefinedMode = PAYMENT_MODES.some(m => m.id === tx.paymentMode);

    setFormData({
      title: tx.title || '',
      amount: tx.amount || '',
      category: isPredefinedCat ? tx.category : 'custom',
      customCategory: isPredefinedCat ? '' : (tx.customCategory || tx.category || ''),
      paymentMode: isPredefinedMode ? (tx.paymentMode || 'upi') : 'custom',
      customPaymentMode: isPredefinedMode ? '' : (tx.customPaymentMode || tx.paymentMode || ''),
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

    let finalCategory = formData.category || 'others';
    if (formData.category === 'custom') {
      finalCategory = formData.customCategory.trim() || 'others';
    }

    const finalPaymentMode = formData.paymentMode === 'custom'
      ? (formData.customPaymentMode.trim() || 'Custom')
      : formData.paymentMode;

    if (editingTx) {
      onUpdateTransaction({
        ...editingTx,
        title: formData.title.trim(),
        amount: amountNum,
        category: finalCategory,
        customCategory: formData.category === 'custom' ? formData.customCategory.trim() : '',
        paymentMode: finalPaymentMode,
        customPaymentMode: formData.paymentMode === 'custom' ? formData.customPaymentMode.trim() : '',
        date: formData.date,
        notes: formData.notes.trim()
      });
    } else {
      const newTx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: formData.title.trim(),
        amount: amountNum,
        category: finalCategory,
        customCategory: formData.category === 'custom' ? formData.customCategory.trim() : '',
        paymentMode: finalPaymentMode,
        customPaymentMode: formData.paymentMode === 'custom' ? formData.customPaymentMode.trim() : '',
        date: formData.date,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString()
      };
      onAddTransaction(newTx);
    }

    closeModal();
  };

  // Distinct months for filtering
  const distinctMonths = Array.from(new Set(
    transactions.map(t => t.date ? BudgetCalculator.getMonthKey(t.date) : null).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));

  if (!distinctMonths.includes(selectedMonth)) {
    distinctMonths.unshift(selectedMonth);
  }

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchTerm === '' ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.paymentMode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth = filterMonth === 'all' ||
      (t.date && BudgetCalculator.getMonthKey(t.date) === filterMonth);

    const matchesCategory = selectedCategory === 'all' ||
      t.category === selectedCategory ||
      (selectedCategory === 'others' && !t.category);

    const matchesPaymentMode = selectedPaymentMode === 'all' ||
      t.paymentMode === selectedPaymentMode;

    return matchesSearch && matchesMonth && matchesCategory && matchesPaymentMode;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentTotal = filteredTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm flex-shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Personal Expenses</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track individual expenses, edit historical entries, and monitor your monthly spending budget.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer btn-shimmer btn-press"
        >
          <Plus className="w-4 h-4" /> Add Personal Expense
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium"
          />
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium cursor-pointer"
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
          <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Payment Mode Filter */}
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium cursor-pointer"
          >
            <option value="all">All Payment Modes</option>
            {PAYMENT_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>{mode.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between sm:justify-end sm:col-span-2 md:col-span-1 lg:col-span-1 pt-1 sm:pt-0">
          <span className="text-xs text-slate-400 font-medium mr-1.5">Total: </span>
          <span className="text-sm sm:text-base font-black text-indigo-400 tabular-nums">
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
            {searchTerm || selectedCategory !== 'all' || selectedPaymentMode !== 'all'
              ? 'Try changing your search keywords or filter options.'
              : 'Start logging your daily expenses to keep your monthly budget on track.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer btn-press"
          >
            <Plus className="w-4 h-4" /> Add Your First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3 stagger-items">
          {filteredTransactions.map(tx => {
            const catInfo = getCategoryDisplay(tx.category, tx.customCategory);
            const modeInfo = getPaymentModeDisplay(tx.paymentMode, tx.customPaymentMode);

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-2xl glass-panel-interactive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                {/* Left info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border ${catInfo.bg || 'bg-slate-800 text-slate-400'} group-hover:scale-110 transition-transform duration-200 flex-shrink-0 mt-0.5 sm:mt-0`}>
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-tight break-words">{tx.title}</h4>

                      {/* Payment Mode Badge */}
                      <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${modeInfo.color}`}>
                        {modeInfo.name}
                      </span>

                      {/* Category Badge */}
                      <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        {catInfo.name}
                      </span>

                      {tx.isSharedShare && (
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Shared Share
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-slate-300 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {tx.date}
                      </span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-500 truncate max-w-[200px] sm:max-w-xs">{tx.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right amount & actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 sm:border-transparent">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-black text-white tabular-nums">
                      {currencySymbol} {(Number(tx.amount) || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer btn-press hover:scale-105 active:scale-90"
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
                      className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer btn-press hover:scale-105 active:scale-90"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto modal-overlay">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl glass-modal p-5 sm:p-6 shadow-2xl relative modal-sheet sm:my-8 max-h-[92vh] overflow-y-auto border border-slate-800">
            {/* Mobile Drag Indicator Pill */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                {editingTx ? 'Edit Personal Expense' : 'Add Personal Expense'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors font-bold tabular-nums"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors tabular-nums"
                  />
                </div>
              </div>

              {/* Mode of Transaction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mode of Transaction
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {PAYMENT_MODES.map((mode) => {
                    const isSelected = formData.paymentMode === mode.id;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setFormData({ ...formData, paymentMode: mode.id })}
                        className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {mode.name}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Payment Mode Text Box */}
                {formData.paymentMode === 'custom' && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      required
                      placeholder="Enter custom mode (e.g. Crypto, Cheque, Gift Card)"
                      value={formData.customPaymentMode}
                      onChange={(e) => setFormData({ ...formData, customPaymentMode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Category & Custom Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Category <span className="text-slate-500 font-normal lowercase">(optional - defaults to Others)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CATEGORIES.map(cat => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'custom' })}
                    className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center gap-1 cursor-pointer ${
                      formData.category === 'custom'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>Custom...</span>
                  </button>
                </div>

                {/* Custom Category Input */}
                {formData.category === 'custom' && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      required
                      placeholder="Enter custom category name (e.g. Gym, Pet Care, Gadgets)"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notes <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Additional context or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-3.5 sm:pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
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
