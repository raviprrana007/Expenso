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

  // Calculate monthly metrics with exact Rollover Rules (Rule 5 & 6)
  calculateMonthlyBudget(monthKey, transactions, settings) {
    const defaultLimit = settings.defaultMonthlyLimit || 10000;
    
    // Find all distinct months from transactions and configured settings
    const allMonths = new Set();
    transactions.forEach(tx => {
      const k = this.getMonthKey(tx.date);
      if (k) allMonths.add(k);
    });
    if (settings.monthlyLimits) {
      Object.keys(settings.monthlyLimits).forEach(k => allMonths.add(k));
    }
    allMonths.add(monthKey);

    // Also ensure previous month is included to calculate rollover correctly
    const prevKey = this.getPrevMonthKey(monthKey);
    allMonths.add(prevKey);

    const sortedMonths = Array.from(allMonths).sort();

    // Compute chain of budgets up to the target monthKey
    const monthStats = {};
    let runningDefaultLimit = defaultLimit;

    for (const m of sortedMonths) {
      // 1. Personal expense total for this month
      const monthTransactions = transactions.filter(tx => this.getMonthKey(tx.date) === m);
      const totalSpent = monthTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

      // 2. Base user-set limit
      let baseLimit = runningDefaultLimit;
      if (settings.monthlyLimits && settings.monthlyLimits[m] !== undefined && settings.monthlyLimits[m] !== null) {
        baseLimit = Number(settings.monthlyLimits[m]);
        runningDefaultLimit = baseLimit; // Carry forward updated limit
      }

      // 3. Rollover from previous month
      const prevM = this.getPrevMonthKey(m);
      let rolloverDeduction = 0;
      if (monthStats[prevM]) {
        const prevStat = monthStats[prevM];
        if (prevStat.isOverspent) {
          // Overspent in previous month is deducted from current month's starting limit
          rolloverDeduction = prevStat.overspentAmount;
        }
        // Unused budget is NEVER added to next month (Rule 6)
      }

      // 4. Effective limit for this month
      const effectiveLimit = Math.max(0, baseLimit - rolloverDeduction);
      const remainingAmount = effectiveLimit - totalSpent;
      const isOverspent = totalSpent > effectiveLimit;
      const overspentAmount = isOverspent ? totalSpent - effectiveLimit : 0;
      const percentageUsed = effectiveLimit > 0 ? Math.min(Math.round((totalSpent / effectiveLimit) * 100), 999) : (totalSpent > 0 ? 100 : 0);

      monthStats[m] = {
        monthKey: m,
        baseLimit,
        rolloverDeduction,
        effectiveLimit,
        totalSpent,
        remainingAmount: isOverspent ? 0 : remainingAmount,
        isOverspent,
        overspentAmount,
        percentageUsed,
        transactionCount: monthTransactions.length
      };

      if (m === monthKey) {
        break; // We have computed up to the requested month
      }
    }

    return monthStats[monthKey] || {
      monthKey,
      baseLimit: defaultLimit,
      rolloverDeduction: 0,
      effectiveLimit: defaultLimit,
      totalSpent: 0,
      remainingAmount: defaultLimit,
      isOverspent: false,
      overspentAmount: 0,
      percentageUsed: 0,
      transactionCount: 0
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
