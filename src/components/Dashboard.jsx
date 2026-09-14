import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Wallet,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  ArrowLeftRight,
  Zap,
  Moon,
  Sun,
  Sparkles,
  FileText
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { BudgetCalculator } from '../services/budgetCalculator';
import { getCategoryDisplay, getPaymentModeDisplay, getUniqueCategoryColor, CATEGORY_COLORS, CATEGORIES } from '../types/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/**
 * High-performance, frame-rate-independent count-up component.
 * Uses requestAnimationFrame with cubic ease-out.
 * Automatically adapts to 60Hz, 90Hz, 120Hz displays with zero stutter.
 * Respects prefers-reduced-motion for accessibility.
 */
function AnimatedNumber({ value = 0, prefix = '', suffix = '', decimals = 0, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animFrameRef = useRef(null);

  useEffect(() => {
    // Respect reduced motion accessibility
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = Number(prevValueRef.current) || 0;
    const endVal = Number(value) || 0;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const duration = 400; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
        setDisplayValue(endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value]);

  const formatted = decimals > 0 
    ? Number(displayValue).toFixed(decimals) 
    : Math.round(Number(displayValue)).toLocaleString();

  return <span className={className}>{prefix}{formatted}{suffix}</span>;
}

export default function Dashboard({
  selectedMonth,
  setSelectedMonth,
  transactions,
  owesDues,
  people,
  settings,
  onOpenAddPersonal,
  onOpenAddShared,
  onNavigateTab,
  onLockVault
}) {
  const currencySymbol = (settings && settings.currencySymbol) || '₹';
  const isLightMode = settings && settings.theme === 'light';

  // Defensive values
  const safeMonth = selectedMonth || BudgetCalculator.getMonthKey(new Date());
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeOwesDues = Array.isArray(owesDues) ? owesDues : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeSettings = settings || {};

  // Calculate monthly stats
  const budgetStats = BudgetCalculator.calculateMonthlyBudget(safeMonth, safeTransactions, safeSettings) || {
    effectiveLimit: 0,
    baseLimit: 0,
    totalSpent: 0,
    remainingAmount: 0,
    isOverspent: false,
    overspentAmount: 0,
    percentageUsed: 0
  };
  const owesDuesSummary = BudgetCalculator.calculateOwesDuesSummary(safeOwesDues, safePeople) || {
    totalDues: 0,
    totalOwes: 0,
    netBalance: 0,
    totalSettled: 0,
    personNetList: []
  };

  // Filter current month transactions
  const monthTransactions = safeTransactions.filter(
    tx => tx && tx.date && BudgetCalculator.getMonthKey(tx.date) === safeMonth
  ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Today's transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = safeTransactions.filter(tx => tx && tx.date === todayStr);
  const todayTotal = todayTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

  // Distinct months for selector
  const distinctMonths = Array.from(new Set(
    safeTransactions.map(t => t && t.date ? BudgetCalculator.getMonthKey(t.date) : null).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));
  if (!distinctMonths.includes(safeMonth)) {
    distinctMonths.unshift(safeMonth);
  }

  // Category breakdown for Donut Chart with proper grouping and naming
  const categoryMap = {};
  monthTransactions.forEach(tx => {
    const rawCat = (tx.category || '').trim().toLowerCase();
    const customTitle = (tx.customCategory || '').trim();
    
    // Determine user-friendly display name
    const catDisplay = getCategoryDisplay(rawCat, customTitle);
    const catName = catDisplay.name || 'Others';

    // Normalize category key:
    // If it resolves to "Others", group it under "others".
    // If it's a custom category with a real custom name, use custom_<name>.
    // Otherwise use standard category key.
    let catKey = 'others';
    if (catName.toLowerCase() !== 'others') {
      if (rawCat === 'custom' || (!CATEGORIES.some(c => c.id === rawCat) && customTitle)) {
        catKey = `custom_${customTitle.toLowerCase()}`;
      } else {
        catKey = rawCat;
      }
    }

    if (!categoryMap[catKey]) {
      categoryMap[catKey] = {
        id: catKey,
        name: catName,
        amount: 0
      };
    }
    categoryMap[catKey].amount += (Number(tx.amount) || 0);
  });

  const totalSpent = budgetStats.totalSpent || 0;

  // Sum total of all money spent across all months till date
  const allTimeTotalSpent = safeTransactions.reduce((acc, tx) => acc + (Number(tx?.amount) || 0), 0);
  const allTimeTransactionsCount = safeTransactions.length;

  // Actual month-over-month comparison calculation
  const prevMonthKey = BudgetCalculator.getPrevMonthKey(safeMonth);
  const prevMonthTransactions = safeTransactions.filter(
    tx => tx && tx.date && BudgetCalculator.getMonthKey(tx.date) === prevMonthKey
  );
  const prevTotalSpent = prevMonthTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

  let spendComparison = null;
  if (prevTotalSpent === 0 && totalSpent === 0) {
    spendComparison = { text: '0% vs last month', isIncrease: false, isNeutral: true };
  } else if (prevTotalSpent === 0 && totalSpent > 0) {
    spendComparison = { text: '100% more than last month', isIncrease: true, isNeutral: false };
  } else if (totalSpent === prevTotalSpent) {
    spendComparison = { text: '0% vs last month', isIncrease: false, isNeutral: true };
  } else if (totalSpent > prevTotalSpent) {
    const pct = Math.round(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100);
    spendComparison = { text: `${pct}% more than last month`, isIncrease: true, isNeutral: false };
  } else {
    const pct = Math.round(((prevTotalSpent - totalSpent) / prevTotalSpent) * 100);
    spendComparison = { text: `${pct}% less than last month`, isIncrease: false, isNeutral: false };
  }

  // Dynamic unique color assignment ensuring no duplicate colors across slices
  const usedCategoryColors = new Set();
  const sortedCategories = Object.values(categoryMap)
    .map((catInfo) => {
      const percent = totalSpent > 0 ? Math.round((catInfo.amount / totalSpent) * 100) : 0;
      return { id: catInfo.id, name: catInfo.name, amount: catInfo.amount, percent };
    })
    .sort((a, b) => b.amount - a.amount)
    .map((cat, idx) => ({
      ...cat,
      color: getUniqueCategoryColor(cat.id, idx, usedCategoryColors)
    }));

  // Donut chart data
  const doughnutData = {
    labels: sortedCategories.length > 0 ? sortedCategories.map(c => c.name) : ['No Expenses Yet'],
    datasets: [{
      data: sortedCategories.length > 0 ? sortedCategories.map(c => c.amount) : [1],
      backgroundColor: sortedCategories.length > 0
        ? sortedCategories.map(c => c.color)
        : (isLightMode ? ['#e2e8f0'] : ['#1e293b']),
      borderColor: isLightMode ? '#ffffff' : '#0f1422',
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#181e2e',
        titleColor: isLightMode ? '#0f172a' : '#f8fafc',
        bodyColor: isLightMode ? '#334155' : '#cbd5e1',
        borderColor: isLightMode ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const val = context.raw;
            const percent = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
            return totalSpent > 0 ? ` ${currencySymbol}${val.toLocaleString()} (${percent}%)` : ' No data';
          }
        }
      }
    }
  };

  // Daily spend bar chart
  const [yearStr, monthStr] = (safeMonth && safeMonth.includes('-') ? safeMonth : BudgetCalculator.getMonthKey(new Date())).split('-');
  const parsedDays = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const daysInMonth = isNaN(parsedDays) || parsedDays <= 0 ? 30 : parsedDays;
  const dailySpend = Array(daysInMonth).fill(0);

  monthTransactions.forEach(tx => {
    if (tx && tx.date && tx.date.includes('-')) {
      const parts = tx.date.split('-');
      if (parts[2]) {
        const dayNum = parseInt(parts[2], 10);
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          dailySpend[dayNum - 1] += (Number(tx.amount) || 0);
        }
      }
    }
  });

  const activeSpendDays = dailySpend.filter(a => a > 0);
  const avgDailySpend = activeSpendDays.length > 0
    ? Math.round(totalSpent / activeSpendDays.length)
    : Math.round(totalSpent / Math.max(new Date().getDate(), 1));
  const highestDailySpend = Math.max(0, ...dailySpend);

  const barData = {
    labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
    datasets: [{
      label: `Daily Spend (${currencySymbol})`,
      data: dailySpend,
      backgroundColor: isLightMode ? 'rgba(129, 140, 248, 0.85)' : 'rgba(139, 92, 246, 0.85)',
      hoverBackgroundColor: isLightMode ? 'rgba(99, 102, 241, 1)' : 'rgba(168, 85, 247, 1)',
      borderRadius: 4,
      borderSkipped: false
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#181e2e',
        titleColor: isLightMode ? '#0f172a' : '#f8fafc',
        bodyColor: isLightMode ? '#334155' : '#cbd5e1',
        borderColor: isLightMode ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          title: (items) => `Day ${items[0].label}`,
          label: (context) => ` ${currencySymbol} ${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isLightMode ? '#64748b' : '#94a3b8',
          font: { size: 9, family: 'Inter' },
          maxTicksLimit: 7
        }
      },
      y: {
        grid: { color: isLightMode ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: isLightMode ? '#64748b' : '#94a3b8',
          font: { size: 9, family: 'Inter' },
          maxTicksLimit: 5
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-16">
      {/* 1. Spending by Category Card */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel relative">
        {/* Header with Title and Month Dropdown */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Spending by Category</h2>
          </div>

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-xs font-semibold px-3 py-1.5 pr-7 rounded-xl focus:outline-none cursor-pointer transition-colors"
            >
              {distinctMonths.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {BudgetCalculator.formatMonthName(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Donut Chart & Category Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut on the Left */}
          <div className="sm:col-span-5 relative flex items-center justify-center min-h-[170px]">
            <div className="w-40 h-40 relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              {/* Center Metrics Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-base sm:text-lg font-black text-white tracking-tight tabular-nums leading-none">
                  {currencySymbol} <AnimatedNumber value={totalSpent} />
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">Total Spent</span>
                {spendComparison && (
                  <span
                    className={`text-[9px] font-bold mt-1 flex items-center justify-center gap-0.5 leading-none px-1 ${
                      spendComparison.isNeutral
                        ? 'text-slate-400'
                        : spendComparison.isIncrease
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    <span>{spendComparison.isNeutral ? '•' : spendComparison.isIncrease ? '↑' : '↓'}</span>
                    <span>{spendComparison.text}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Category List on the Right */}
          <div className="sm:col-span-7 space-y-2">
            {sortedCategories.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No expenses logged for this month.
              </div>
            ) : (
              sortedCategories.slice(0, 6).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-slate-300 truncate max-w-[120px] sm:max-w-[150px]">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums flex-shrink-0">
                    <span className="text-slate-400 font-semibold text-[11px] w-8 text-right">{cat.percent}%</span>
                    <span className="font-bold text-white text-xs w-16 text-right">
                      {currencySymbol}<AnimatedNumber value={cat.amount} />
                    </span>
                  </div>
                </div>
              ))
            )}
            {sortedCategories.length > 6 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-0.5 border-t border-slate-800/40">
                <span className="italic">+{sortedCategories.length - 6} other categories</span>
                <span className="font-semibold text-slate-300">
                  {currencySymbol}<AnimatedNumber value={sortedCategories.slice(6).reduce((sum, c) => sum + c.amount, 0)} />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Detailed Breakdown Button */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
          <button
            onClick={() => onNavigateTab('personal')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800/90 text-xs font-semibold transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            <span>View detailed breakdown</span>
            <span className="text-indigo-400">→</span>
          </button>
        </div>
      </div>

      {/* 2. 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* Monthly Limit */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="p-3.5 sm:p-4 rounded-2xl glass-panel-interactive flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">›</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Monthly Limit</span>
            <span className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight block mt-0.5">
              {currencySymbol} <AnimatedNumber value={budgetStats.effectiveLimit} />
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Base limit: {currencySymbol}<AnimatedNumber value={budgetStats.baseLimit} />
            </span>
          </div>
        </div>

        {/* Spent So Far */}
        <div
          onClick={() => onNavigateTab('personal')}
          className="p-3.5 sm:p-4 rounded-2xl glass-panel-interactive flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">›</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Spent So Far</span>
            <span className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight block mt-0.5">
              {currencySymbol} <AnimatedNumber value={allTimeTotalSpent} />
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1 truncate">
              {allTimeTransactionsCount} transactions • All time
            </span>
          </div>
        </div>

        {/* Budget Status */}
        <div
          onClick={() => onNavigateTab('personal')}
          className="p-3.5 sm:p-4 rounded-2xl glass-panel-interactive flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">›</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Budget Status</span>
            <div className="mt-0.5">
              {budgetStats.isOverspent ? (
                <span className="text-base sm:text-lg font-black text-rose-400 tabular-nums tracking-tight block">
                  {currencySymbol} <AnimatedNumber value={budgetStats.overspentAmount || 0} /> over
                </span>
              ) : (
                <span className="text-base sm:text-lg font-black text-emerald-400 tabular-nums tracking-tight block">
                  {currencySymbol} <AnimatedNumber value={budgetStats.remainingAmount || 0} /> left
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              {Number(budgetStats.percentageUsed || 0).toFixed(1)}% of limit
            </span>

            {/* Bottom Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetStats.isOverspent
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(budgetStats.percentageUsed || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Net Obligations */}
        <div
          onClick={() => onNavigateTab('owes_dues')}
          className="p-3.5 sm:p-4 rounded-2xl glass-panel-interactive flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">›</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Net Obligations</span>
            <div className="mt-0.5">
              {owesDuesSummary.netBalance > 0 ? (
                <span className="text-base sm:text-lg font-black text-emerald-400 tabular-nums tracking-tight block">
                  + {currencySymbol} <AnimatedNumber value={Math.abs(owesDuesSummary.netBalance)} /> to receive
                </span>
              ) : owesDuesSummary.netBalance < 0 ? (
                <span className="text-base sm:text-lg font-black text-rose-400 tabular-nums tracking-tight block">
                  - {currencySymbol} <AnimatedNumber value={Math.abs(owesDuesSummary.netBalance)} /> to pay
                </span>
              ) : (
                <span className="text-base sm:text-lg font-black text-slate-300 tracking-tight block">
                  All settled
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Dues: {currencySymbol}<AnimatedNumber value={owesDuesSummary.totalDues} /> | Owes: {currencySymbol}<AnimatedNumber value={owesDuesSummary.totalOwes} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Daily Spending Timeline */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Daily Spending Timeline</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            Last 30 Days ▾
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Bar Chart Left (approx 68%) */}
          <div className="sm:col-span-8 h-36 relative">
            <Bar data={barData} options={barOptions} />
          </div>

          {/* Stat Cards Right (approx 32%) */}
          <div className="sm:col-span-4 flex flex-col gap-2.5">
            {/* Avg. Daily Spend */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight">Avg. Daily Spend</span>
                <span className="text-sm font-bold text-white tabular-nums leading-tight mt-0.5 block">
                  {currencySymbol} <AnimatedNumber value={avgDailySpend} />
                </span>
              </div>
            </div>

            {/* Highest Spend */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight">Highest Spend</span>
                <span className="text-sm font-bold text-white tabular-nums leading-tight mt-0.5 block">
                  {currencySymbol} <AnimatedNumber value={highestDailySpend} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Today's Transactions Card */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Today's Transactions</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 tabular-nums">
              Today: {currencySymbol} <AnimatedNumber value={todayTotal} />
            </span>
            <button
              onClick={() => onNavigateTab('personal')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            {/* Cute 3D glowing box illustration */}
            <div className="w-16 h-16 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 drop-shadow-md">
                <path d="M32 6L54 18V46L32 58L10 46V18L32 6Z" fill="#312e81" opacity="0.4" />
                <path d="M32 6L54 18L32 30L10 18L32 6Z" fill="#6366f1" fillOpacity="0.8" />
                <path d="M10 18L32 30V58L10 46V18Z" fill="#4f46e5" fillOpacity="0.9" />
                <path d="M54 18L32 30V58L54 46V18Z" fill="#4338ca" />
                <path d="M32 20L44 26.5L32 33L20 26.5L32 20Z" fill="#a5b4fc" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">No expenses logged yet today</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto leading-normal">
                You can record multiple transactions at any time or wait for the 9 PM reminder.
              </p>
            </div>
            <button
              onClick={onOpenAddPersonal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense for Today</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTransactions.map((tx) => {
              const catInfo = getCategoryDisplay(tx.category, tx.customCategory);
              const modeInfo = getPaymentModeDisplay(tx.paymentMode, tx.customPaymentMode);
              return (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: CATEGORY_COLORS[tx.category] || catInfo.color || '#6366f1' }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{tx.title}</span>
                      <span className="text-[10px] text-slate-400">{catInfo.name} • {modeInfo.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums flex-shrink-0">
                    {currencySymbol}{Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Quick Actions Card */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Quick Actions</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Add Expense */}
          <button
            onClick={onOpenAddPersonal}
            className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/30 text-left transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-white block">Add Expense</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">Record a new expense</span>
          </button>

          {/* Split Bill */}
          <button
            onClick={onOpenAddShared}
            className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/30 text-left transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Split Bill</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">Share with friends</span>
          </button>

          {/* Settle Owes/Dues */}
          <button
            onClick={() => onNavigateTab('owes_dues')}
            className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/30 text-left transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">Settle Owes/Dues</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">Manage settlements</span>
          </button>

          {/* View Reports */}
          <button
            onClick={() => onNavigateTab('archive')}
            className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/30 text-left transition-all group cursor-pointer active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white block">View Reports</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">Detailed insights</span>
          </button>
        </div>
      </div>

      {/* 6. Motivational / Status Banner */}
      <div className={`p-4 rounded-2xl relative overflow-hidden ${
        isLightMode
          ? 'bg-gradient-to-r from-amber-100/70 via-purple-100/60 to-indigo-100/70 border border-purple-200/60'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/20'
      }`}>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex-shrink-0 ${isLightMode ? 'bg-amber-400/20 text-amber-600' : 'bg-purple-500/20 text-purple-300'}`}>
              {isLightMode ? <Sun className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {isLightMode ? 'Small steps, big financial freedom!' : 'Discipline today, freedom tomorrow.'}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isLightMode ? 'Track today, stress less tomorrow.' : "You're doing great!"}
              </p>
            </div>
          </div>

          {/* Subtle Decorative Moon / Sprout */}
          <div className="text-2xl sm:text-3xl opacity-80 flex-shrink-0 ml-2">
            {isLightMode ? '🌱' : '🌙'}
          </div>
        </div>
      </div>

      {/* 7. Footer Quote */}
      <div className="text-center pt-2 pb-6">
        <p className="text-xs text-slate-500 italic font-medium">
          “A more aware you, a wealthier tomorrow.”
        </p>
      </div>
    </div>
  );
}
