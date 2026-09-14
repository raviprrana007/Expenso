import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORIES } from '../types/constants';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const PdfArchiveService = {
  // Generate annual PDF report for a given year
  async generateAnnualPdf(year, transactions, currencySymbol = '₹') {
    try {
      // 1. Filter only personal expense transactions for this year
      const yearStr = String(year);
      const yearTransactions = transactions.filter(tx => {
        if (!tx.date) return false;
        return tx.date.startsWith(yearStr);
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      if (yearTransactions.length === 0) {
        throw new Error(`No personal expense transactions found for year ${year}`);
      }

      const totalYearlySpend = yearTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

      // Safe currency string for jsPDF standard Helvetica font (avoids WinAnsiEncoding unicode crashes)
      const pdfCurrency = currencySymbol === '₹' ? 'Rs. ' : `${currencySymbol} `;

      // Month-by-month calculations
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthlyTotals = Array(12).fill(0);
      const monthlyCount = Array(12).fill(0);

      yearTransactions.forEach(tx => {
        const d = new Date(tx.date);
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          monthlyTotals[m] += (Number(tx.amount) || 0);
          monthlyCount[m] += 1;
        }
      });

      // Find highest expenditure month
      let highestMonthIndex = 0;
      let highestMonthSpend = 0;
      monthlyTotals.forEach((total, idx) => {
        if (total > highestMonthSpend) {
          highestMonthSpend = total;
          highestMonthIndex = idx;
        }
      });

      // Category breakdown
      const categoryTotals = {};
      yearTransactions.forEach(tx => {
        const cat = tx.category || 'misc';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(tx.amount) || 0);
      });

      // Create PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [79, 70, 229]; // Indigo #4f46e5
      const slateDark = [15, 23, 42];

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPENSO', 14, 18);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Annual Personal Expense Archive - Calendar Year ${year}`, 14, 26);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 14, 32);

      // Total Spend Callout Card
      doc.setFillColor(245, 247, 255);
      doc.roundedRect(14, 45, 182, 30, 3, 3, 'F');
      doc.setDrawColor(224, 231, 255);
      doc.roundedRect(14, 45, 182, 30, 3, 3, 'D');

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL ANNUAL EXPENDITURE', 20, 54);

      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${pdfCurrency}${totalYearlySpend.toLocaleString()}`, 20, 66);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Total Transactions: ${yearTransactions.length} | Monthly Avg: ${pdfCurrency}${Math.round(totalYearlySpend / 12).toLocaleString()}`, 110, 66);

      // Key Insights Box
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text('Annual Highlights & Insights', 14, 85);

      const highestMonthName = monthNames[highestMonthIndex];
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`* Peak Expenditure Month: ${highestMonthName} (${pdfCurrency}${highestMonthSpend.toLocaleString()})`, 14, 92);
      
      const activeMonths = monthlyTotals.filter(t => t > 0).length;
      doc.text(`* Active Spending Months: ${activeMonths} of 12 months`, 14, 98);

      // Section 1: Month-by-Month Breakdown Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text('Month-by-Month Personal Expenditure', 14, 110);

      const monthTableData = monthNames.map((mName, idx) => {
        const amt = monthlyTotals[idx];
        const pct = totalYearlySpend > 0 ? ((amt / totalYearlySpend) * 100).toFixed(1) + '%' : '0%';
        const isPeak = idx === highestMonthIndex && amt > 0 ? '(Peak Month)' : '';
        return [
          mName,
          monthlyCount[idx].toString(),
          `${pdfCurrency}${amt.toLocaleString()}`,
          pct,
          isPeak
        ];
      });

      autoTable(doc, {
        startY: 115,
        head: [['Month', 'Transactions', 'Expenditure', '% of Annual', 'Note']],
        body: monthTableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
          2: { fontStyle: 'bold', halign: 'right' },
          3: { halign: 'right' },
          4: { textColor: [220, 38, 38], fontStyle: 'italic' }
        }
      });

      // Section 2: Category Breakdown Table
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 210;
      let catStartY = finalY;

      if (catStartY > 240) {
        doc.addPage();
        catStartY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text('Category-wise Distribution', 14, catStartY);

      const categoryTableData = Object.entries(categoryTotals).map(([catId, amount]) => {
        const catObj = CATEGORIES.find(c => c.id === catId);
        const name = catObj ? catObj.name : catId;
        const pct = totalYearlySpend > 0 ? ((amount / totalYearlySpend) * 100).toFixed(1) + '%' : '0%';
        return [
          name,
          `${pdfCurrency}${amount.toLocaleString()}`,
          pct
        ];
      }).sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));

      autoTable(doc, {
        startY: catStartY + 5,
        head: [['Category', 'Amount Spent', '% Contribution']],
        body: categoryTableData,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
          1: { fontStyle: 'bold', halign: 'right' },
          2: { halign: 'right' }
        }
      });

      // Section 3: Itemized Transactions on new page
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(`Complete Itemized Transactions (${year})`, 14, 20);

      const allTxTableData = yearTransactions.map(tx => {
        const catObj = CATEGORIES.find(c => c.id === tx.category);
        return [
          tx.date,
          tx.title || 'Untitled',
          catObj ? catObj.name : (tx.category || 'Misc'),
          `${pdfCurrency}${(Number(tx.amount) || 0).toLocaleString()}`
        ];
      });

      autoTable(doc, {
        startY: 26,
        head: [['Date', 'Description / Title', 'Category', 'Amount']],
        body: allTxTableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          3: { fontStyle: 'bold', halign: 'right' }
        }
      });

      const filename = `Expenso_Annual_Archive_${year}.pdf`;

      // Save file on Native Android or Web
      if (Capacitor.isNativePlatform()) {
        const base64Data = doc.output('datauristring').split(',')[1];
        let savedUri = null;

        try {
          // Attempt to save in Documents directory
          const res = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
          savedUri = res.uri;
        } catch (e) {
          console.warn('Filesystem Documents save fallback to Cache:', e);
          const res = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
          savedUri = res.uri;
        }

        // Open native share / save dialogue so the user can easily view or save the file
        if (savedUri) {
          try {
            await Share.share({
              title: `Expenso Annual Archive ${year}`,
              text: `Annual personal expense summary for ${year}`,
              url: savedUri,
              dialogTitle: 'Save or Open PDF Archive'
            });
          } catch (shareErr) {
            console.warn('Share sheet closed or unavailable:', shareErr);
          }
        }
      } else {
        // Desktop / standard browser download
        doc.save(filename);
      }

      return {
        success: true,
        filename,
        transactionCount: yearTransactions.length,
        totalAmount: totalYearlySpend
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },

  // Fallback TXT archive generator (Rule 14 fallback)
  async generateAnnualTxt(year, transactions, currencySymbol = '₹') {
    try {
      const yearStr = String(year);
      const yearTransactions = transactions.filter(tx => tx.date && tx.date.startsWith(yearStr))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (yearTransactions.length === 0) {
        throw new Error(`No personal expense transactions found for year ${year}`);
      }

      const totalYearlySpend = yearTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthlyTotals = Array(12).fill(0);
      yearTransactions.forEach(tx => {
        const d = new Date(tx.date);
        const m = d.getMonth();
        if (m >= 0 && m < 12) monthlyTotals[m] += (Number(tx.amount) || 0);
      });

      let highestMonthIdx = 0;
      let highestMonthAmt = 0;
      monthlyTotals.forEach((amt, idx) => {
        if (amt > highestMonthAmt) {
          highestMonthAmt = amt;
          highestMonthIdx = idx;
        }
      });

      let text = `==========================================================\n`;
      text += `EXPENSO - ANNUAL PERSONAL EXPENSE ARCHIVE\n`;
      text += `Calendar Year: ${year}\n`;
      text += `Generated At: ${new Date().toISOString()}\n`;
      text += `==========================================================\n\n`;
      text += `SUMMARY STATISTICS\n`;
      text += `----------------------------------------------------------\n`;
      text += `Total Annual Expenditure: ${currencySymbol} ${totalYearlySpend.toLocaleString()}\n`;
      text += `Total Personal Transactions: ${yearTransactions.length}\n`;
      text += `Peak Expenditure Month: ${monthNames[highestMonthIdx]} (${currencySymbol} ${highestMonthAmt.toLocaleString()})\n\n`;

      text += `MONTH-BY-MONTH EXPENDITURE\n`;
      text += `----------------------------------------------------------\n`;
      monthNames.forEach((mName, idx) => {
        const amt = monthlyTotals[idx];
        text += `${mName.padEnd(12)}: ${currencySymbol} ${amt.toLocaleString()}\n`;
      });
      text += `\n`;

      text += `ITEMIZED PERSONAL TRANSACTIONS\n`;
      text += `----------------------------------------------------------\n`;
      text += `Date        | Category        | Amount     | Description\n`;
      text += `----------------------------------------------------------\n`;
      yearTransactions.forEach(tx => {
        const catObj = CATEGORIES.find(c => c.id === tx.category);
        const cat = (catObj ? catObj.name : (tx.category || 'Misc')).padEnd(15);
        const amt = `${currencySymbol} ${(Number(tx.amount) || 0).toLocaleString()}`.padEnd(10);
        text += `${tx.date}  | ${cat} | ${amt} | ${tx.title || 'Untitled'}\n`;
      });
      text += `\n================== END OF ANNUAL ARCHIVE ==================\n`;

      const filename = `Expenso_Annual_Archive_${year}.txt`;

      if (Capacitor.isNativePlatform()) {
        try {
          const base64Txt = btoa(unescape(encodeURIComponent(text)));
          const res = await Filesystem.writeFile({
            path: filename,
            data: base64Txt,
            directory: Directory.Documents,
            recursive: true
          });
          await Share.share({
            title: `Expenso Annual Archive ${year}`,
            text: `Annual personal expense text archive for ${year}`,
            url: res.uri,
            dialogTitle: 'Save or View TXT Archive'
          });
        } catch (fsErr) {
          console.warn('Native TXT save error:', fsErr);
        }
      } else {
        // Download TXT file in browser
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      return {
        success: true,
        filename,
        transactionCount: yearTransactions.length,
        totalAmount: totalYearlySpend
      };
    } catch (error) {
      console.error('Error generating TXT fallback:', error);
      throw error;
    }
  }
};
