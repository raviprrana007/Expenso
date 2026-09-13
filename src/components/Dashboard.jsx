import React from 'react';
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  Sparkles,
  ArrowLeftRight,
  Receipt
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { BudgetCalculator } from '../services/budgetCalculator';
import { getCategoryDisplay, getPaymentModeDisplay } from '../types/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
  const currencySymbol = settings.currencySymbol || '₹';

  // Calculate monthly stats with rollover
  const budgetStats = BudgetCalculator.calculateMonthlyBudget(selectedMonth, transactions, settings);
  const owesDuesSummary = BudgetCalculator.calculateOwesDuesSummary(owesDues, people);

  // Month navigation helpers
  const handlePrevMonth = () => setSelectedMonth(BudgetCalculator.getPrevMonthKey(selectedMonth));
  const handleNextMonth = () => setSelectedMonth(BudgetCalculator.getNextMonthKey(selectedMonth));
  const handleCurrentMonth = () => {
    const today = new Date();
    setSelectedMonth(BudgetCalculator.getMonthKey(today));
  };

  // Filter current month transactions
  const monthTransactions = transactions.filter(
    tx => BudgetCalculator.getMonthKey(tx.date) === selectedMonth
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Today's transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(tx => tx.date === todayStr);
  const todayTotal = todayTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

  // Category breakdown for charts
  const categoryMap = {};
  monthTransactions.forEach(tx => {
    const cat = tx.category || 'others';
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(tx.amount) || 0);
  });

  const categoryLabels = [];
  const categoryValues = [];
  const categoryColors = [
    '#6366f1', '#10b981', '#f59e0b', '#06b6d4',
    '#d946ef', '#8b5cf6', '#f43f5e', '#14b8a6', '#64748b'
  ];

  Object.entries(categoryMap).forEach(([catId, amount]) => {
    const catInfo = getCategoryDisplay(catId);
    categoryLabels.push(catInfo.name);
    categoryValues.push(amount);
  });

  const isLightMode = settings.theme === 'light';

  const doughnutData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['No Expenses Yet'],
    datasets: [{
      data: categoryValues.length > 0 ? categoryValues : [1],
      backgroundColor: categoryValues.length > 0 ? categoryColors.slice(0, categoryValues.length) : (isLightMode ? ['#e2e8f0'] : ['#1e293b']),
      borderColor: isLightMode ? '#ffffff' : '#121622',
      borderWidth: 2,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isLightMode ? '#475569' : '#94a3b8',
          font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' },
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#181e2e',
        titleColor: isLightMode ? '#0f172a' : '#f8fafc',
        bodyColor: isLightMode ? '#334155' : '#cbd5e1',
        borderColor: isLightMode ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 10,
        callbacks: {
          label: (context) => {
            const val = context.raw;
            return categoryValues.length > 0 ? ` ${currencySymbol} ${val.toLocaleString()}` : ' No data';
          }
        }
      }
    },
    cutout: '72%'
  };

  // Daily spend trend bar chart
  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const dailySpend = Array(daysInMonth).fill(0);

  monthTransactions.forEach(tx => {
    if (tx.date) {
      const dayNum = parseInt(tx.date.split('-')[2], 10);
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        dailySpend[dayNum - 1] += (Number(tx.amount) || 0);
      }
    }
  });

  const barData = {
    labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
    datasets: [{
      label: `Daily Spending (${currencySymbol})`,
      data: dailySpend,
      backgroundColor: isLightMode ? 'rgba(79, 70, 229, 0.82)' : 'rgba(99, 102, 241, 0.85)',
      hoverBackgroundColor: isLightMode ? 'rgba(67, 56, 202, 1)' : 'rgba(129, 140, 248, 1)',
      borderRadius: 5,
      borderSkipped: false,
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#181e2e',
        titleColor: isLightMode ? '#0f172a' : '#f8fafc',
        bodyColor: isLightMode ? '#334155' : '#cbd5e1',
        borderColor: isLightMode ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          title: (items) => `Day ${items[0].label} of ${BudgetCalculator.formatMonthName(selectedMonth)}`,
          label: (context) => ` Spent: ${currencySymbol} ${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: isLightMode ? '#64748b' : '#94a3b8', 
          font: { size: 10, family: 'Inter' },
          maxTicksLimit: 14,
          autoSkip: true
        }
      },
      y: {
        grid: { color: isLightMode ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: isLightMode ? '#64748b' : '#94a3b8', font: { size: 10, family: 'Inter' } },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-12">
      {/* Personalized Vault Welcome Header */}
      {settings.userName && (
        <div className="p-4 sm:p-5 rounded-2xl glass-panel bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            {settings.profilePic ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border border-indigo-500/40 shadow-glow bg-slate-900 flex-shrink-0">
                <img src={settings.profilePic} alt={settings.userName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-glow flex-shrink-0">
                {settings.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight truncate">
                  Welcome back, {settings.userName}! 👋
                </h1>
                {settings.profession && (
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {settings.profession}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Private vault active • Limit: <span className="font-semibold text-slate-300 tabular-nums">{currencySymbol}{Number(settings.defaultMonthlyLimit || 10000).toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenAddPersonal}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={onOpenAddShared}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Split Bill</span>
            </button>
          </div>
        </div>
      )}

      {/* Month Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {BudgetCalculator.formatMonthName(selectedMonth)}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">Monthly Spending & Obligations Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleCurrentMonth}
            className="flex-1 sm:flex-initial text-center px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            Current Month
          </button>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-items">
        {/* Card 1: Monthly Budget Limit */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel-interactive relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Limit</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tabular-nums tracking-tight">
              {currencySymbol} {budgetStats.effectiveLimit.toLocaleString()}
            </div>
            {budgetStats.rolloverDeduction > 0 ? (
              <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Reduced by <strong className="tabular-nums">{currencySymbol}{budgetStats.rolloverDeduction.toLocaleString()}</strong> (prev month overspent)</span>
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-slate-400">
                Base limit: <span className="tabular-nums font-semibold">{currencySymbol}{budgetStats.baseLimit.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Total Spent This Month */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel-interactive relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Spending</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight break-words">
              {currencySymbol} {budgetStats.totalSpent.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              <span className="font-semibold tabular-nums text-slate-300">{budgetStats.transactionCount}</span> transactions recorded
            </div>
          </div>
        </div>

        {/* Card 3: Remaining / Overspent Status */}
        <div className={`p-4 sm:p-5 rounded-2xl glass-panel-interactive relative overflow-hidden border ${
          budgetStats.isOverspent
            ? 'border-rose-500/40 bg-rose-950/20 shadow-glow-danger'
            : 'border-emerald-500/30 bg-emerald-950/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {budgetStats.isOverspent ? 'Budget Overspent' : 'Budget Remaining'}
            </span>
            <div className={`p-2 rounded-xl border ${
              budgetStats.isOverspent
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {budgetStats.isOverspent ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight break-words ${budgetStats.isOverspent ? 'text-rose-400' : 'text-emerald-400'}`}>
              {budgetStats.isOverspent
                ? `${currencySymbol} ${budgetStats.overspentAmount.toLocaleString()} over`
                : `${currencySymbol} ${budgetStats.remainingAmount.toLocaleString()}`}
            </div>
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="tabular-nums font-medium">{budgetStats.percentageUsed}% of limit</span>
                <span className="font-semibold">{budgetStats.isOverspent ? 'Limit exceeded' : 'Under limit'}</span>
              </div>
              <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetStats.isOverspent
                      ? 'bg-rose-500 w-full shadow-sm'
                      : budgetStats.percentageUsed > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetStats.percentageUsed, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Net Financial Obligations (Dues & Owes) */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel-interactive relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Obligations</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight break-words ${
              owesDuesSummary.netBalance > 0
                ? 'text-emerald-400'
                : owesDuesSummary.netBalance < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
            }`}>
              {owesDuesSummary.netBalance > 0
                ? `+${currencySymbol} ${owesDuesSummary.netBalance.toLocaleString()} to receive`
                : owesDuesSummary.netBalance < 0
                  ? `-${currencySymbol} ${Math.abs(owesDuesSummary.netBalance).toLocaleString()} to pay`
                  : 'All Settled'}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400 flex items-center gap-0.5 font-medium tabular-nums">
                <ArrowDownLeft className="w-3 h-3" /> Dues: {currencySymbol}{owesDuesSummary.totalDues.toLocaleString()}
              </span>
              <span className="text-rose-400 flex items-center gap-0.5 font-medium tabular-nums">
                <ArrowUpRight className="w-3 h-3" /> Owes: {currencySymbol}{owesDuesSummary.totalOwes.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Category Doughnut Chart */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Category Breakdown</h3>
            </div>
            <span className="text-xs text-slate-400">{BudgetCalculator.formatMonthName(selectedMonth)}</span>
          </div>

          <div className="relative h-56 sm:h-64 flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={() => onNavigateTab('personal')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              View detailed transactions &rarr;
            </button>
          </div>
        </div>

        {/* Daily Spending Trend Chart */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Daily Spending Timeline</h3>
            </div>
            <span className="text-xs text-slate-400">Day 1 to {daysInMonth}</span>
          </div>

          <div className="relative h-56 sm:h-64">
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-400">
            <span>Daily spending updates dynamically based on transaction dates.</span>
            <span className="font-semibold text-slate-200 tabular-nums">
              Avg Daily: {currencySymbol} {Math.round(budgetStats.totalSpent / daysInMonth).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Transactions & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Activity Card */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-base">Today's Transactions</h3>
            </div>
            <div className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 font-medium tabular-nums border border-slate-700/60">
              Today: <strong className="text-white">{currencySymbol} {todayTotal.toLocaleString()}</strong>
            </div>
          </div>

          {todayTransactions.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800/80">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm font-medium">No expenses logged yet today.</p>
              <p className="text-slate-500 text-xs mt-1">
                You can record multiple transactions at any time or wait for the 9 PM reminder.
              </p>
              <button
                onClick={onOpenAddPersonal}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" /> Log Expense for Today
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {todayTransactions.map(tx => {
                const catInfo = getCategoryDisplay(tx.category, tx.customCategory);
                const modeInfo = getPaymentModeDisplay(tx.paymentMode, tx.customPaymentMode);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${catInfo.bg || 'bg-slate-800 text-slate-400'}`}>
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">
                          {tx.title || 'Personal Expense'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${modeInfo.color}`}>
                            {modeInfo.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            • {catInfo.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white tabular-nums">
                        {currencySymbol} {(Number(tx.amount) || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions & Top Obligations */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={onOpenAddPersonal}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-indigo-300 font-semibold text-xs transition-all duration-200 cursor-pointer btn-press group hover:translate-x-1"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add Personal Expense
                </span>
                <span className="text-xs group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>

              <button
                onClick={onOpenAddShared}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-600/10 border border-purple-500/25 hover:bg-purple-600/20 hover:border-purple-500/40 text-purple-300 font-semibold text-xs transition-all duration-200 cursor-pointer btn-press group hover:translate-x-1"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform" /> Split Shared Bill
                </span>
                <span className="text-xs group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>

              <button
                onClick={() => onNavigateTab('owes_dues')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-600/20 hover:border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all duration-200 cursor-pointer btn-press group hover:translate-x-1"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 group-hover:scale-110 transition-transform" /> Settle Owes / Dues
                </span>
                <span className="text-xs group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Person-Wise Balance</h4>
            {owesDuesSummary.personNetList.filter(p => p.hasActivity).slice(0, 2).length === 0 ? (
              <p className="text-xs text-slate-500">No active dues or owes pending.</p>
            ) : (
              <div className="space-y-2">
                {owesDuesSummary.personNetList.filter(p => p.hasActivity).slice(0, 2).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300 font-medium">{p.name} <span className="text-slate-500 text-[10px] font-mono">#{p.id}</span></span>
                    <span className={`tabular-nums font-bold ${p.net > 0 ? 'text-emerald-400' : p.net < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {p.net > 0 ? `+${currencySymbol}${p.net.toLocaleString()}` : p.net < 0 ? `-${currencySymbol}${Math.abs(p.net).toLocaleString()}` : 'Settled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
