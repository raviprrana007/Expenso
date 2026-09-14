import React, { useState, useEffect, useMemo } from 'react';
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
  PlusCircle,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  Filter,
  ChevronDown
} from 'lucide-react';
import { CATEGORIES, PAYMENT_MODES, getCategoryDisplay, getPaymentModeDisplay } from '../types/constants';
import { BudgetCalculator } from '../services/budgetCalculator';
import Modal from './Modal';

export default function PersonalExpenses({
  transactions = [],
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  selectedMonth,
  setSelectedMonth,
  settings
}) {
  const currencySymbol = settings?.currencySymbol || '₹';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('all');
  const [filterMonth, setFilterMonth] = useState(selectedMonth || 'all');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc'

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

  // Keep filterMonth in sync with selectedMonth prop when provided
  useEffect(() => {
    if (selectedMonth && filterMonth !== 'all') {
      setFilterMonth(selectedMonth);
    }
  }, [selectedMonth]);

  const handleMonthChange = (val) => {
    setFilterMonth(val);
    if (val !== 'all' && setSelectedMonth) {
      setSelectedMonth(val);
    }
  };

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

  // Distinct months present in transactions
  const distinctMonths = useMemo(() => {
    const months = Array.from(new Set(
      (transactions || []).map(t => {
        if (!t.date) return null;
        if (typeof t.date === 'string' && /^\d{4}-\d{2}/.test(t.date)) {
          return t.date.slice(0, 7);
        }
        return BudgetCalculator.getMonthKey(t.date);
      }).filter(Boolean)
    )).sort((a, b) => b.localeCompare(a));

    if (selectedMonth && !months.includes(selectedMonth)) {
      months.unshift(selectedMonth);
    }
    return months;
  }, [transactions, selectedMonth]);

  // Dynamically extract all available categories (predefined + custom)
  const availableCategories = useMemo(() => {
    const map = new Map();
    CATEGORIES.forEach(c => map.set(c.id, c.name));
    (transactions || []).forEach(t => {
      const catId = (t.category || '').toLowerCase().trim();
      const customName = (t.customCategory || '').trim();
      // Skip if empty or maps to standard/alias
      if (!catId || ['others', 'misc', 'custom'].includes(catId)) {
        if (!customName) return;
      }
      if (CATEGORIES.some(c => c.id === catId || c.name.toLowerCase() === catId)) {
        return;
      }
      const key = customName || t.category;
      if (key && !map.has(key)) {
        const display = getCategoryDisplay(t.category, t.customCategory);
        map.set(key, display.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  // Dynamically extract all available payment modes (predefined + custom)
  const availablePaymentModes = useMemo(() => {
    const map = new Map();
    PAYMENT_MODES.forEach(m => map.set(m.id, m.name));
    (transactions || []).forEach(t => {
      const rawMode = (t.paymentMode || t.customPaymentMode || '').trim();
      if (!rawMode) return;
      const normalized = rawMode.toLowerCase();
      // Skip standard payment mode identifiers
      if (['upi', 'cash', 'card', 'netbanking', 'net banking', 'mix', 'custom'].includes(normalized)) return;
      const customName = t.customPaymentMode || t.paymentMode;
      if (customName && !map.has(customName.toLowerCase())) {
        map.set(customName.toLowerCase(), customName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  // Comprehensive multi-field search and active filtering logic
  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return (transactions || []).filter(t => {
      // 1. Month Filter (timezone-safe YYYY-MM extraction)
      if (filterMonth !== 'all') {
        const txMonth = t.date
          ? (typeof t.date === 'string' && /^\d{4}-\d{2}/.test(t.date) ? t.date.slice(0, 7) : BudgetCalculator.getMonthKey(t.date))
          : null;
        if (txMonth !== filterMonth) return false;
      }

      // 2. Category Filter (supports predefined, aliases, and custom categories)
      if (selectedCategory !== 'all') {
        const sel = selectedCategory.toLowerCase().trim();
        const txCat = (t.category || '').toLowerCase().trim();
        const txCustom = (t.customCategory || '').toLowerCase().trim();

        let matchesCat = false;
        if (sel === 'others') {
          matchesCat = !txCat || txCat === 'others' || txCat === 'misc' || (!txCustom && !CATEGORIES.some(c => c.id === txCat || c.name.toLowerCase() === txCat));
        } else {
          const predefined = CATEGORIES.find(c => c.id === sel);
          if (predefined) {
            matchesCat = txCat === predefined.id || txCat === predefined.name.toLowerCase() ||
              txCustom === predefined.id || txCustom === predefined.name.toLowerCase();
          } else {
            matchesCat = txCat === sel || txCustom === sel;
          }
        }
        if (!matchesCat) return false;
      }

      // 3. Payment Mode Filter (Mode of Transaction: handles default UPI, case-insensitivity, Net Banking, and Custom)
      if (selectedPaymentMode !== 'all') {
        const sel = selectedPaymentMode.toLowerCase().trim();
        const rawMode = (t.paymentMode || t.customPaymentMode || 'upi').trim().toLowerCase();
        let normalizedMode = rawMode;
        if (rawMode === 'net banking') normalizedMode = 'netbanking';
        const customMode = (t.customPaymentMode || '').trim().toLowerCase();

        let matchesMode = false;
        if (sel === 'custom') {
          matchesMode = !['upi', 'cash', 'card', 'netbanking', 'mix'].includes(normalizedMode) ||
            Boolean(customMode) ||
            t.paymentMode === 'custom';
        } else {
          matchesMode = normalizedMode === sel || customMode === sel;
        }
        if (!matchesMode) return false;
      }

      // 4. Search Filter (searches across Title, Notes, Amount, Category Names, Payment Mode Names, and Dates)
      if (query !== '') {
        const title = (t.title || '').toLowerCase();
        const notes = (t.notes || '').toLowerCase();
        const rawAmount = String(t.amount || '');
        const formattedAmount = (Number(t.amount) || 0).toLocaleString();
        const catInfo = getCategoryDisplay(t.category, t.customCategory);
        const modeInfo = getPaymentModeDisplay(t.paymentMode, t.customPaymentMode);
        const catName = catInfo.name.toLowerCase();
        const catId = (t.category || '').toLowerCase();
        const customCat = (t.customCategory || '').toLowerCase();
        const modeName = modeInfo.name.toLowerCase();
        const modeId = (t.paymentMode || '').toLowerCase();
        const customMode = (t.customPaymentMode || '').toLowerCase();
        const dateStr = t.date || '';
        const txMonth = t.date ? (typeof t.date === 'string' && /^\d{4}-\d{2}/.test(t.date) ? t.date.slice(0, 7) : BudgetCalculator.getMonthKey(t.date)) : '';
        const monthFormatted = txMonth ? BudgetCalculator.formatMonthName(txMonth).toLowerCase() : '';

        const matched =
          title.includes(query) ||
          notes.includes(query) ||
          rawAmount.includes(query) ||
          formattedAmount.includes(query) ||
          catName.includes(query) ||
          catId.includes(query) ||
          customCat.includes(query) ||
          modeName.includes(query) ||
          modeId.includes(query) ||
          customMode.includes(query) ||
          dateStr.includes(query) ||
          monthFormatted.includes(query);

        if (!matched) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      if (dateA !== dateB) {
        if (sortBy === 'date-asc') return dateA - dateB;
        if (sortBy === 'date-desc') return dateB - dateA;
      }
      if (sortBy === 'amount-desc') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'amount-asc') {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      // default secondary sort: most recently created first
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();
      return createdB - createdA;
    });
  }, [transactions, searchTerm, filterMonth, selectedCategory, selectedPaymentMode, sortBy]);

  const currentTotal = filteredTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Active filter checks
  const isSearchActive = searchTerm.trim() !== '';
  const isCatActive = selectedCategory !== 'all';
  const isModeActive = selectedPaymentMode !== 'all';
  const isMonthActive = filterMonth !== 'all';
  const isSortActive = sortBy !== 'date-desc';
  const hasActiveFilters = isSearchActive || isCatActive || isModeActive || isMonthActive || isSortActive;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPaymentMode('all');
    setFilterMonth('all');
    setSortBy('date-desc');
  };

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

      {/* Filter & Search Toolbar */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel space-y-3">
        {/* Search & Sort Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
          {/* Real-time Search Input with Clear Button */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, amount (₹), category, payment mode, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-4 relative flex items-center bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl px-3 py-2.5 transition-colors">
            <ArrowUpDown className="w-4 h-4 text-indigo-400 flex-shrink-0 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="clean-filter-select w-full bg-transparent border-0 outline-none shadow-none text-slate-200 text-xs font-semibold pl-2.5 pr-6 py-0 appearance-none cursor-pointer focus:outline-none focus:ring-0"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', border: 'none', outline: 'none', boxShadow: 'none' }}
            >
              <option value="date-desc" className="bg-slate-900 text-white">Date: Newest First</option>
              <option value="date-asc" className="bg-slate-900 text-white">Date: Oldest First</option>
              <option value="amount-desc" className="bg-slate-900 text-white">Amount: Highest First</option>
              <option value="amount-asc" className="bg-slate-900 text-white">Amount: Lowest First</option>
              <option value="title-asc" className="bg-slate-900 text-white">Title: A to Z</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none flex-shrink-0" />
          </div>
        </div>

        {/* Filter Dropdowns Row: Month, Category, Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-center pt-1 border-t border-slate-800/60">
          {/* Month Filter */}
          <div className="relative flex items-center bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl px-3 py-2.5 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
            <select
              value={filterMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="clean-filter-select w-full bg-transparent border-0 outline-none shadow-none text-slate-200 text-xs font-medium pl-2.5 pr-6 py-0 appearance-none cursor-pointer focus:outline-none focus:ring-0"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', border: 'none', outline: 'none', boxShadow: 'none' }}
            >
              <option value="all" className="bg-slate-900 text-white">All Months (All Time)</option>
              {distinctMonths.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {BudgetCalculator.formatMonthName(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none flex-shrink-0" />
          </div>

          {/* Dynamic Category Filter */}
          <div className="relative flex items-center bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl px-3 py-2.5 transition-colors">
            <Tag className="w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="clean-filter-select w-full bg-transparent border-0 outline-none shadow-none text-slate-200 text-xs font-medium pl-2.5 pr-6 py-0 appearance-none cursor-pointer focus:outline-none focus:ring-0"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', border: 'none', outline: 'none', boxShadow: 'none' }}
            >
              <option value="all" className="bg-slate-900 text-white">All Categories ({availableCategories.length})</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none flex-shrink-0" />
          </div>

          {/* Dynamic Payment Mode Filter */}
          <div className="relative flex items-center bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl px-3 py-2.5 transition-colors">
            <Wallet className="w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className="clean-filter-select w-full bg-transparent border-0 outline-none shadow-none text-slate-200 text-xs font-medium pl-2.5 pr-6 py-0 appearance-none cursor-pointer focus:outline-none focus:ring-0"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', border: 'none', outline: 'none', boxShadow: 'none' }}
            >
              <option value="all" className="bg-slate-900 text-white">All Payment Modes ({availablePaymentModes.length})</option>
              {availablePaymentModes.map(mode => (
                <option key={mode.id} value={mode.id} className="bg-slate-900 text-white">{mode.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none flex-shrink-0" />
          </div>
        </div>

        {/* Results Info & Active Filter Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{filteredTransactions.length}</span> of {transactions.length} expenses
            </span>

            {/* Active filter pills */}
            {isSearchActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">
                "{searchTerm}"
                <button type="button" onClick={() => setSearchTerm('')} className="hover:text-white">×</button>
              </span>
            )}
            {isMonthActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-semibold">
                {BudgetCalculator.formatMonthName(filterMonth)}
                <button type="button" onClick={() => setFilterMonth('all')} className="hover:text-white">×</button>
              </span>
            )}
            {isCatActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                {availableCategories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                <button type="button" onClick={() => setSelectedCategory('all')} className="hover:text-white">×</button>
              </span>
            )}
            {isModeActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[11px] font-semibold">
                {availablePaymentModes.find(m => m.id === selectedPaymentMode)?.name || selectedPaymentMode}
                <button type="button" onClick={() => setSelectedPaymentMode('all')} className="hover:text-white">×</button>
              </span>
            )}

            {/* 1-Click Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 font-medium">Filtered Total:</span>
            <span className="text-sm sm:text-base font-black text-indigo-400 tabular-nums">
              {currencySymbol} {currentTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="py-14 text-center rounded-2xl glass-panel">
          <Sparkles className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            {hasActiveFilters ? 'No personal expenses match your filters' : 'No personal expenses logged yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search query, selecting another category/payment mode, or resetting all filters.'
              : 'Start logging your daily expenses to keep your monthly budget on track.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer btn-press"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer btn-press"
            >
              <Plus className="w-4 h-4" /> Add Personal Expense
            </button>
          </div>
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
        <Modal isOpen={isModalOpen} onClose={closeModal} maxWidth="max-w-lg">
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
      </Modal>
      )}
    </div>
  );
}
