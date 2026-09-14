import React, { useState } from 'react';
import { 
  Archive, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  FileCheck, 
  Clock, 
  FileCode,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { PdfArchiveService } from '../services/pdfArchive';
import { sendDownloadCompleteNotification } from '../utils/notificationService';

export default function AnnualArchive({
  transactions,
  archives,
  settings,
  onSaveArchiveRecord,
  onCleanupArchivedYear
}) {
  const currencySymbol = settings.currencySymbol || '₹';
  const currentYear = new Date().getFullYear();

  // Find all distinct years in transactions
  const availableYears = Array.from(new Set(
    transactions.map(tx => tx.date ? new Date(tx.date).getFullYear() : null).filter(Boolean)
  )).sort((a, b) => b - a);

  if (!availableYears.includes(currentYear - 1)) {
    availableYears.push(currentYear - 1);
  }
  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
  }

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingTxt, setIsGeneratingTxt] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Transactions for selected year
  const yearTransactions = transactions.filter(
    tx => tx.date && tx.date.startsWith(String(selectedYear))
  );

  const totalYearSpend = yearTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

  // Month-by-month stats
  const monthlyTotals = Array(12).fill(0);
  yearTransactions.forEach(tx => {
    const m = new Date(tx.date).getMonth();
    if (m >= 0 && m < 12) monthlyTotals[m] += (Number(tx.amount) || 0);
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let maxMonthIndex = 0;
  let maxMonthAmount = 0;
  monthlyTotals.forEach((amt, idx) => {
    if (amt > maxMonthAmount) {
      maxMonthAmount = amt;
      maxMonthIndex = idx;
    }
  });

  // Check if this year was already archived
  const existingArchive = archives.find(a => String(a.year) === String(selectedYear));

  // Handle PDF Generation
  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setSuccessMessage('');
      const result = await PdfArchiveService.generateAnnualPdf(selectedYear, transactions, currencySymbol);
      
      const archiveRecord = {
        id: `arch_${selectedYear}_${Date.now()}`,
        year: selectedYear,
        generatedAt: new Date().toISOString(),
        format: 'pdf',
        filename: result.filename,
        totalAmount: result.totalAmount,
        transactionCount: result.transactionCount
      };

      onSaveArchiveRecord(archiveRecord);
      setSuccessMessage(`Annual PDF archive for ${selectedYear} successfully generated and downloaded!`);
      await sendDownloadCompleteNotification(result.filename, selectedYear);
    } catch (err) {
      alert(`PDF Generation failed: ${err.message}. You can use the TXT Fallback instead.`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle TXT Fallback
  const handleGenerateTxt = async () => {
    try {
      setIsGeneratingTxt(true);
      setSuccessMessage('');
      const result = await PdfArchiveService.generateAnnualTxt(selectedYear, transactions, currencySymbol);

      const archiveRecord = {
        id: `arch_${selectedYear}_${Date.now()}`,
        year: selectedYear,
        generatedAt: new Date().toISOString(),
        format: 'txt',
        filename: result.filename,
        totalAmount: result.totalAmount,
        transactionCount: result.transactionCount
      };

      onSaveArchiveRecord(archiveRecord);
      setSuccessMessage(`Annual TXT archive for ${selectedYear} successfully generated and downloaded!`);
      await sendDownloadCompleteNotification(result.filename, selectedYear);
    } catch (err) {
      alert(`TXT Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingTxt(false);
    }
  };

  // Handle Safe Deletion of Archived Personal Expenses
  const handleCleanup = () => {
    if (!existingArchive) {
      alert('Archive Required: You must generate and download either the PDF or TXT archive first before deleting historical personal expenses.');
      return;
    }

    if (window.confirm(
      `Are you sure you want to clean up ${yearTransactions.length} personal expenses for ${selectedYear}?\n\n` +
      `✓ Your generated ${existingArchive.format.toUpperCase()} archive is saved.\n` +
      `✓ All Owes & Dues will remain safely untouched.`
    )) {
      onCleanupArchivedYear(selectedYear);
      setSuccessMessage(`Archived personal expense records for ${selectedYear} cleaned up successfully.`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm flex-shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Annual Personal-Expense Archive</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate annual PDF summaries and safely clean up past years' personal records while keeping Owes & Dues untouched.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold">Calendar Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value, 10));
              setSuccessMessage('');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors tabular-nums cursor-pointer"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200 cursor-pointer p-1">Dismiss</button>
        </div>
      )}

      {/* Annual Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 stagger-items">
        <div className="p-4 sm:p-5 rounded-2xl glass-panel-interactive">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Year Spending</span>
          <div className="text-xl sm:text-2xl font-black text-white mt-2 tabular-nums">
            {currencySymbol} {totalYearSpend.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="font-semibold tabular-nums text-slate-300">{yearTransactions.length}</span> personal transactions in {selectedYear}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-panel-interactive">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peak Spending Month</span>
          <div className="text-base sm:text-xl font-bold text-amber-400 mt-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{maxMonthAmount > 0 ? `${monthNames[maxMonthIndex]} (${currencySymbol}${maxMonthAmount.toLocaleString()})` : 'None'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Highest expenditure month of {selectedYear}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-panel-interactive sm:col-span-2 md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Archive Status</span>
          <div className="text-sm sm:text-base font-bold text-slate-200 mt-2 flex items-center gap-2">
            {existingArchive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> {existingArchive.format.toUpperCase()} Generated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">
                Not Yet Archived
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {existingArchive 
              ? `Generated on ${new Date(existingArchive.generatedAt).toLocaleDateString()}` 
              : 'Download PDF or TXT before performing annual cleanup'}
          </div>
        </div>
      </div>

      {/* Month-by-month mini bar breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Month-by-Month Overview ({selectedYear})</h3>
          <span className="text-[10px] text-slate-500 sm:hidden">Swipe to explore →</span>
        </div>
        
        {/* Horizontally scrollable container on mobile (isolated from page swipe) */}
        <div
          data-no-swipe="true"
          className="overflow-x-auto scroll-touch scrollbar-none pb-2 pt-1 -mx-1 px-1 overscroll-x-contain"
          style={{ touchAction: 'pan-x pan-y' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="min-w-[560px] sm:min-w-0 grid grid-cols-12 gap-2 stagger-items">
            {monthNames.map((mName, idx) => {
              const val = monthlyTotals[idx];
              const pct = maxMonthAmount > 0 ? (val / maxMonthAmount) * 100 : 0;
              return (
                <div key={mName} className="flex flex-col items-center gap-1.5 group">
                  <div className="w-full h-20 bg-slate-900/80 rounded-xl flex items-end p-1 overflow-hidden border border-slate-800/80 group-hover:border-indigo-500/40 transition-colors">
                    <div 
                      className={`w-full rounded-lg transition-all duration-700 ease-out ${
                        idx === maxMonthIndex && val > 0 ? 'bg-amber-500 shadow-sm' : 'bg-indigo-500'
                      }`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${mName}: ${currencySymbol}${val.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">{mName}</span>
                  <span className="text-[9px] text-slate-500 tabular-nums">{val > 0 ? `${currencySymbol}${val.toLocaleString()}` : '0'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Card: Generate Archive & Cleanup */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel space-y-4 sm:space-y-5 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400 flex-shrink-0" />
            Archive Actions for Calendar Year {selectedYear}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Annual reports contain yearly totals, monthly breakdowns, and peak expense months. Monthly spending limits and Owes/Dues are excluded from personal expense reports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Action 1: Download PDF */}
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || yearTransactions.length === 0}
            className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer btn-press btn-shimmer min-h-[44px]"
          >
            <Download className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : `Generate Annual PDF (${selectedYear})`}</span>
          </button>

          {/* Action 2: Download TXT Fallback */}
          <button
            onClick={handleGenerateTxt}
            disabled={isGeneratingTxt || yearTransactions.length === 0}
            className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-2 shadow-sm hover:shadow transition-all cursor-pointer btn-press min-h-[44px]"
          >
            <FileCode className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>{isGeneratingTxt ? 'Generating TXT...' : `Generate TXT Fallback (${selectedYear})`}</span>
          </button>

          {/* Action 3: Safe Cleanup */}
          <button
            onClick={handleCleanup}
            disabled={!existingArchive || yearTransactions.length === 0}
            className={`p-3.5 sm:p-4 rounded-xl font-bold text-xs flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-2 border transition-all min-h-[44px] ${
              existingArchive && yearTransactions.length > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer active:scale-95 shadow-sm'
                : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 sm:w-5 h-4 sm:h-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            <span>Clean Up {selectedYear} Personal Data</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            Data Safeguards:
          </div>
          <div>• Previous-year personal expense data can only be cleaned up after successfully generating an archive file.</div>
          <div>• The annual cleanup strictly removes only that year's personal expenses. Unsettled Owes and Dues remain active.</div>
        </div>
      </div>
    </div>
  );
}
