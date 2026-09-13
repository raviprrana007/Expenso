import React, { useState } from 'react';
import { 
  Archive, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  FileCheck, 
  Clock, 
  Calendar,
  Sparkles,
  TrendingUp,
  FileCode
} from 'lucide-react';
import { PdfArchiveService } from '../services/pdfArchive';
import { CATEGORIES } from '../types/constants';

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

  // If no years found, include previous year & current year
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
      const result = PdfArchiveService.generateAnnualPdf(selectedYear, transactions, currencySymbol);
      
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
    } catch (err) {
      alert(`PDF Generation failed: ${err.message}. You can use the TXT Fallback instead.`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle TXT Fallback (Rule 14 fallback)
  const handleGenerateTxt = () => {
    try {
      setIsGeneratingTxt(true);
      setSuccessMessage('');
      const result = PdfArchiveService.generateAnnualTxt(selectedYear, transactions, currencySymbol);

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
    } catch (err) {
      alert(`TXT Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingTxt(false);
    }
  };

  // Handle Safe Deletion of Archived Personal Expenses (Rule 14)
  const handleCleanup = () => {
    if (!existingArchive) {
      alert('Rule 14 Violation: You must generate and download either the PDF or TXT archive first before deleting historical personal expenses.');
      return;
    }

    if (window.confirm(
      `Are you sure you want to clean up ${yearTransactions.length} personal expenses for ${selectedYear}?\n\n` +
      `✓ Your generated ${existingArchive.format.toUpperCase()} archive is saved.\n` +
      `✓ Rule 14: All Owes & Dues will remain safely untouched.`
    )) {
      onCleanupArchivedYear(selectedYear);
      setSuccessMessage(`Archived personal expense records for ${selectedYear} cleaned up successfully.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Annual Personal-Expense Archive</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rules 14 & 15: Generate annual PDF summaries and safely clean up past years' personal records while keeping Owes & Dues untouched.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Calendar Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value, 10));
              setSuccessMessage('');
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">Dismiss</button>
        </div>
      )}

      {/* Annual Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Year Spending</span>
          <div className="text-2xl font-black text-white mt-2">
            {currencySymbol} {totalYearSpend.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {yearTransactions.length} personal transactions in {selectedYear}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peak Expenditure Month</span>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {monthNames[maxMonthIndex]} ({currencySymbol}{maxMonthAmount.toLocaleString()})
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Highest spending month of {selectedYear}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Archive Status</span>
          <div className="mt-2">
            {existingArchive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <FileCheck className="w-3.5 h-3.5" /> Archived ({existingArchive.format.toUpperCase()})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" /> Ready to Archive
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {existingArchive 
              ? `Generated on ${new Date(existingArchive.generatedAt).toLocaleDateString()}` 
              : 'Download PDF or TXT before performing annual cleanup'}
          </div>
        </div>
      </div>

      {/* Month-by-month mini bar breakdown */}
      <div className="p-5 rounded-2xl glass-panel space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Month-by-Month Overview ({selectedYear})</h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
          {monthNames.map((mName, idx) => {
            const val = monthlyTotals[idx];
            const pct = maxMonthAmount > 0 ? (val / maxMonthAmount) * 100 : 0;
            return (
              <div key={mName} className="flex flex-col items-center gap-1.5">
                <div className="w-full h-20 bg-slate-900 rounded-lg flex items-end p-1 overflow-hidden">
                  <div 
                    className={`w-full rounded transition-all duration-500 ${
                      idx === maxMonthIndex && val > 0 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                    title={`${mName}: ${currencySymbol}${val.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{mName}</span>
                <span className="text-[9px] text-slate-500">{val > 0 ? `${currencySymbol}${val}` : '0'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Card: Generate Archive & Cleanup */}
      <div className="p-6 rounded-2xl glass-panel space-y-5 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400" />
            Archive Actions for Calendar Year {selectedYear}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            According to Rule 14, reports contain yearly totals, monthly breakdowns, and peak expense months. Monthly spending limits and Owes/Dues are excluded from annual personal expense reports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Download PDF */}
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || yearTransactions.length === 0}
            className="p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : `Generate Annual PDF (${selectedYear})`}</span>
          </button>

          {/* Action 2: Download TXT Fallback */}
          <button
            onClick={handleGenerateTxt}
            disabled={isGeneratingTxt || yearTransactions.length === 0}
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all"
          >
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span>{isGeneratingTxt ? 'Generating TXT...' : `Generate TXT Fallback (${selectedYear})`}</span>
          </button>

          {/* Action 3: Safe Cleanup */}
          <button
            onClick={handleCleanup}
            disabled={!existingArchive || yearTransactions.length === 0}
            className={`p-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-2 border transition-all ${
              existingArchive && yearTransactions.length > 0
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-5 h-5 text-rose-400" />
            <span>Clean Up {selectedYear} Personal Data</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Rule 14 & 15 Safeguards:
          </div>
          <div>• Previous-year personal expense data can only be cleaned up after successfully generating an archive file.</div>
          <div>• The annual cleanup strictly removes only that year's personal expenses. Unsettled Owes and Dues remain active.</div>
        </div>
      </div>
    </div>
  );
}
