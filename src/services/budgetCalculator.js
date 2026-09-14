/**
 * Expenso Budget and Calculation Engine
 * Implements all 19 Business Rules strictly.
 */

export const BudgetCalculator = {
  // Get month key 'YYYY-MM' from Date object or ISO string
  getMonthKey(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  // Get previous month key 'YYYY-MM'
  getPrevMonthKey(monthKey) {
    const [yearStr, monthStr] = monthKey.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    if (month === 1) {
      month = 12;
      year -= 1;
    } else {
      month -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  },

  // Get next month key 'YYYY-MM'
  getNextMonthKey(monthKey) {
    const [yearStr, monthStr] = monthKey.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    if (month === 12) {
      month = 1;
      year += 1;
    } else {
      month += 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  },

  // Format month key to readable string e.g. "September 2026"
  formatMonthName(monthKey) {
    if (!monthKey) return '';
    const [yearStr, monthStr] = monthKey.split('-');
    const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  },

  // Calculate monthly metrics with exact independent Monthly Limit rules:
  // 1. Current Month Limit takes priority over Monthly Limit for that month if set.
  // 2. A new month starts with the Monthly Limit value by default.
  // 3. Previous month's unused amount is NOT carried forward.
  // 4. Previous month's overspending is NOT deducted from the next month.
  // 5. Changing Current Month Limit recalculates that month immediately.
  // 6. Changing Monthly Limit affects future/un-overridden months without overriding explicit month limits.
  calculateMonthlyBudget(monthKey, transactions, settings = {}) {
    const defaultLimit = (settings.defaultMonthlyLimit !== undefined && settings.defaultMonthlyLimit !== null && !isNaN(Number(settings.defaultMonthlyLimit)))
      ? Number(settings.defaultMonthlyLimit)
      : 10000;

    // Check if Current Month Limit is explicitly configured for this month
    const hasCurrentMonthLimit = Boolean(
      settings.monthlyLimits &&
      settings.monthlyLimits[monthKey] !== undefined &&
      settings.monthlyLimits[monthKey] !== null &&
      settings.monthlyLimits[monthKey] !== '' &&
      !isNaN(Number(settings.monthlyLimits[monthKey]))
    );

    // Priority rule: If Current Month Limit is set, it always takes priority over Monthly Limit for that month.
    const effectiveLimit = hasCurrentMonthLimit
      ? Number(settings.monthlyLimits[monthKey])
      : defaultLimit;

    // Personal expense total for this month only
    const safeTxList = Array.isArray(transactions) ? transactions : [];
    const monthTransactions = safeTxList.filter(
      tx => tx && tx.date && this.getMonthKey(tx.date) === monthKey
    );
    const totalSpent = monthTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

    // Completely independent month calculation (no carryover, no rollover deduction)
    const isOverspent = totalSpent > effectiveLimit;
    const overspentAmount = isOverspent ? totalSpent - effectiveLimit : 0;
    const remainingAmount = isOverspent ? 0 : effectiveLimit - totalSpent;
    const percentageUsed = effectiveLimit > 0
      ? Math.min(Math.round((totalSpent / effectiveLimit) * 100), 999)
      : (totalSpent > 0 ? 100 : 0);

    return {
      monthKey,
      baseLimit: defaultLimit,
      effectiveLimit,
      isCustomMonthLimit: hasCurrentMonthLimit,
      rolloverDeduction: 0,
      totalSpent,
      remainingAmount,
      isOverspent,
      overspentAmount,
      percentageUsed,
      transactionCount: monthTransactions.length
    };
  },

  // Calculate Owes, Dues & Net Totals (Rule 8, 12, 13)
  calculateOwesDuesSummary(owesDues, people = []) {
    let totalDuesInProcess = 0; // Money others owe user (active)
    let totalOwesInProcess = 0; // Money user owes others (active)
    let totalSettled = 0;

    // Person net maps
    const personMap = {};
    
    // Initialize with existing people
    people.forEach(p => {
      personMap[p.id] = {
        id: p.id,
        name: p.name,
        phone: p.phone || '',
        dues: 0,
        owes: 0,
        net: 0,
        transactions: []
      };
    });

    owesDues.forEach(item => {
      const amount = Number(item.amount) || 0;
      const isSettled = item.status === 'settled';

      if (isSettled) {
        totalSettled += amount;
      } else {
        if (item.type === 'due') {
          totalDuesInProcess += amount;
        } else if (item.type === 'owe') {
          totalOwesInProcess += amount;
        }
      }

      // Group by person
      const pId = String(item.personId);
      if (!personMap[pId]) {
        personMap[pId] = {
          id: pId,
          name: item.personName || `Person #${pId}`,
          phone: item.personPhone || '',
          dues: 0,
          owes: 0,
          net: 0,
          transactions: []
        };
      }

      personMap[pId].transactions.push(item);
      if (!isSettled) {
        if (item.type === 'due') {
          personMap[pId].dues += amount;
        } else if (item.type === 'owe') {
          personMap[pId].owes += amount;
        }
      }
    });

    // Calculate net per person (Rule 12)
    // Positive net: they owe user. Negative net: user owes them.
    const personNetList = Object.values(personMap).map(p => {
      const net = p.dues - p.owes;
      return {
        ...p,
        net,
        hasActivity: p.dues > 0 || p.owes > 0 || p.transactions.length > 0
      };
    }).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    return {
      totalDues: totalDuesInProcess,
      totalOwes: totalOwesInProcess,
      netBalance: totalDuesInProcess - totalOwesInProcess,
      totalSettled,
      personNetList
    };
  },

  // Calculate 30-day Settled Deletion Window status (Rule 10)
  getSettledDeletionInfo(item, windowDays = 30) {
    if (item.status !== 'settled' || !item.settlementDate) {
      return { isExpired: false, daysRemaining: windowDays, progressPercent: 0 };
    }
    const settleTime = new Date(item.settlementDate).getTime();
    const now = Date.now();
    const elapsedMs = now - settleTime;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, Math.ceil(windowDays - elapsedDays));
    const isExpired = elapsedDays >= windowDays;
    const progressPercent = Math.min(100, Math.round((elapsedDays / windowDays) * 100));

    return {
      isExpired,
      daysRemaining,
      progressPercent,
      settlementDate: item.settlementDate
    };
  }
};
