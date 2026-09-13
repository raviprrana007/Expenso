import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PersonalExpenses from './components/PersonalExpenses';
import SharedExpenses from './components/SharedExpenses';
import OwesDues from './components/OwesDues';
import PersonDirectory from './components/PersonDirectory';
import AnnualArchive from './components/AnnualArchive';
import SettingsBackup from './components/SettingsBackup';
import ReminderBanner from './components/ReminderBanner';
import QuickAddModal from './components/QuickAddModal';
import VaultLogin from './components/VaultLogin';
import { StorageService } from './services/storage';
import { BudgetCalculator } from './services/budgetCalculator';

export default function App() {
  // Vault Authentication State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(() => StorageService.hasActiveVault());

  // Navigation & Month Selection
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return BudgetCalculator.getMonthKey(today);
  });

  // Core App State
  const [transactions, setTransactions] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [owesDues, setOwesDues] = useState([]);
  const [people, setPeople] = useState([]);
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const [archives, setArchives] = useState([]);

  // Quick Add & Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isReminderBannerOpen, setIsReminderBannerOpen] = useState(false);

  // Sync state from storage whenever vault is unlocked
  const syncStateFromStorage = () => {
    setPeople(StorageService.getPeople());
    setTransactions(StorageService.getTransactions());
    setSharedExpenses(StorageService.getSharedExpenses());
    setOwesDues(StorageService.getOwesDues());
    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);
    setArchives(StorageService.getArchives());
    return loadedSettings;
  };

  // Synchronize theme with document element (visual transition only)
  useEffect(() => {
    const applyTheme = () => {
      const activeTheme = settings.theme || 'dark';
      const root = document.documentElement;
      if (activeTheme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      }
    };

    const root = document.documentElement;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('theme-switching');
    const clearSwitching = () => {
      window.setTimeout(() => root.classList.remove('theme-switching'), 300);
    };

    if (!prefersReduced && typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(applyTheme);
      transition.finished.finally(clearSwitching);
    } else {
      applyTheme();
      clearSwitching();
    }
  }, [settings.theme]);

  const mainRef = useRef(null);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [activeTab]);

  // Initialize data on mount
  useEffect(() => {
    if (isVaultUnlocked) {
      const loadedSettings = syncStateFromStorage();

      // Check 9 PM daily reminder condition
      const checkReminder = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const todayStr = now.toISOString().split('T')[0];
        
        if (loadedSettings.reminderEnabled !== false && currentHours >= 21) {
          if (loadedSettings.lastReminderDismissedDate !== todayStr) {
            setIsReminderBannerOpen(true);
          }
        }
      };
      checkReminder();
    }
  }, [isVaultUnlocked]);

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updated = { ...settings, theme: nextTheme };
    updateSettings(updated);
  };

  // Save changes to storage
  const updateTransactions = (newTx) => {
    setTransactions(newTx);
    StorageService.saveTransactions(newTx);
  };

  const updateSharedExpenses = (newSE) => {
    setSharedExpenses(newSE);
    StorageService.saveSharedExpenses(newSE);
  };

  const updateOwesDues = (newOD) => {
    setOwesDues(newOD);
    StorageService.saveOwesDues(newOD);
  };

  const updatePeople = (newPeople) => {
    setPeople(newPeople);
    StorageService.savePeople(newPeople);
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const updateArchives = (newArchives) => {
    setArchives(newArchives);
    StorageService.saveArchives(newArchives);
  };

  // --- Handlers: Personal Expenses ---
  const handleAddTransaction = (tx) => {
    const updated = [tx, ...transactions];
    updateTransactions(updated);
  };

  const handleUpdateTransaction = (updatedTx) => {
    const updated = transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    updateTransactions(updated);
  };

  const handleDeleteTransaction = (txId) => {
    const updated = transactions.filter(t => t.id !== txId);
    updateTransactions(updated);
  };

  // --- Handlers: Shared Expenses (Rule 7: updates personal share & derives dues/owes) ---
  const handleSaveSharedExpense = (expense) => {
    // 1. Remove old derived records if editing
    let currentTransactions = transactions.filter(t => t.sharedExpenseId !== expense.id);
    let currentOwesDues = owesDues.filter(od => od.sharedExpenseId !== expense.id);

    // 2. Add derived Personal Expense for User's Share
    if (expense.userShare > 0) {
      const personalShareTx = {
        id: `tx_shared_${expense.id}`,
        title: `${expense.title} (Your Share)`,
        amount: expense.userShare,
        category: 'food',
        date: expense.date,
        isSharedShare: true,
        sharedExpenseId: expense.id,
        createdAt: new Date().toISOString()
      };
      currentTransactions = [personalShareTx, ...currentTransactions];
    }

    // 3. Add derived Owes / Dues
    const isUserPayer = expense.payerId === 'user';
    if (isUserPayer) {
      // User paid: other participants owe user (Dues)
      expense.participants.forEach(p => {
        if (p.id !== 'user' && p.share > 0) {
          const dueRecord = {
            id: `od_shared_${expense.id}_${p.id}`,
            title: `${expense.title} (Share)`,
            amount: p.share,
            originalAmount: p.share,
            type: 'due',
            personId: p.id,
            personName: p.name,
            personPhone: p.phone || '',
            status: 'in_process',
            date: expense.date,
            settlementDate: null,
            sharedExpenseId: expense.id,
            createdAt: new Date().toISOString()
          };
          currentOwesDues = [dueRecord, ...currentOwesDues];
        }
      });
    } else {
      // Someone else paid: User owes the payer (Owe)
      if (expense.userShare > 0) {
        const payerObj = people.find(p => p.id === expense.payerId);
        const oweRecord = {
          id: `od_shared_${expense.id}_user_owe`,
          title: `${expense.title} (Your Share to ${expense.payerName})`,
          amount: expense.userShare,
          originalAmount: expense.userShare,
          type: 'owe',
          personId: expense.payerId,
          personName: expense.payerName,
          personPhone: payerObj ? payerObj.phone : '',
          status: 'in_process',
          date: expense.date,
          settlementDate: null,
          sharedExpenseId: expense.id,
          createdAt: new Date().toISOString()
        };
        currentOwesDues = [oweRecord, ...currentOwesDues];
      }
    }

    // 4. Update Shared Expenses list
    const existingIndex = sharedExpenses.findIndex(se => se.id === expense.id);
    let updatedSharedList = [];
    if (existingIndex >= 0) {
      updatedSharedList = sharedExpenses.map(se => se.id === expense.id ? expense : se);
    } else {
      updatedSharedList = [expense, ...sharedExpenses];
    }

    updateTransactions(currentTransactions);
    updateOwesDues(currentOwesDues);
    updateSharedExpenses(updatedSharedList);
  };

  const handleDeleteSharedExpense = (expenseId) => {
    const updatedSE = sharedExpenses.filter(se => se.id !== expenseId);
    const updatedTx = transactions.filter(t => t.sharedExpenseId !== expenseId);
    const updatedOD = owesDues.filter(od => od.sharedExpenseId !== expenseId);

    updateSharedExpenses(updatedSE);
    updateTransactions(updatedTx);
    updateOwesDues(updatedOD);
  };

  // --- Handlers: Owes & Dues ---
  const handleAddOweDue = (item) => {
    updateOwesDues([item, ...owesDues]);
  };

  const handleUpdateOweDue = (updatedItem) => {
    const updated = owesDues.map(od => od.id === updatedItem.id ? updatedItem : od);
    updateOwesDues(updated);
  };

  const handleDeleteOweDue = (itemId) => {
    const updated = owesDues.filter(od => od.id !== itemId);
    updateOwesDues(updated);
  };

  // Toggle Settled State (Rule 8)
  const handleToggleSettled = (itemId) => {
    const updated = owesDues.map(item => {
      if (item.id === itemId) {
        const isNowSettled = item.status !== 'settled';
        return {
          ...item,
          status: isNowSettled ? 'settled' : 'in_process',
          settlementDate: isNowSettled ? new Date().toISOString() : null
        };
      }
      return item;
    });
    updateOwesDues(updated);
  };

  // Partial Settlement (Rule 9)
  const handlePartialSettle = (itemId, settledAmount) => {
    const target = owesDues.find(i => i.id === itemId);
    if (!target) return;

    const remainingAmount = target.amount - settledAmount;

    // 1. Create a settled record for the paid portion
    const settledPortion = {
      id: `od_part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${target.title} (Partial Settle)`,
      amount: settledAmount,
      originalAmount: target.originalAmount || target.amount,
      type: target.type,
      personId: target.personId,
      personName: target.personName,
      personPhone: target.personPhone,
      status: 'settled',
      date: target.date,
      settlementDate: new Date().toISOString(),
      sharedExpenseId: target.sharedExpenseId || null,
      createdAt: new Date().toISOString()
    };

    // 2. Update remaining item
    const updatedRemainder = {
      ...target,
      amount: remainingAmount
    };

    const updatedList = owesDues.map(item => item.id === itemId ? updatedRemainder : item);
    updateOwesDues([settledPortion, ...updatedList]);
  };

  // Clean up expired settled items > 30 days (Rule 10)
  const handleCleanupExpiredSettled = () => {
    const countBefore = owesDues.length;
    const filtered = owesDues.filter(item => {
      if (item.status !== 'settled') return true;
      const info = BudgetCalculator.getSettledDeletionInfo(item);
      return !info.isExpired;
    });
    const removedCount = countBefore - filtered.length;
    updateOwesDues(filtered);
    alert(`Cleaned up ${removedCount} expired settled record(s) older than 30 days.`);
  };

  // --- Handlers: People Directory ---
  const handleAddPerson = (person) => {
    updatePeople([...people, person]);
  };

  const handleUpdatePerson = (updatedPerson) => {
    const updated = people.map(p => p.id === updatedPerson.id ? updatedPerson : p);
    updatePeople(updated);

    // Also update names in owes/dues
    const updatedOD = owesDues.map(od => {
      if (String(od.personId) === String(updatedPerson.id)) {
        return { ...od, personName: updatedPerson.name, personPhone: updatedPerson.phone || '' };
      }
      return od;
    });
    updateOwesDues(updatedOD);
  };

  const handleDeletePerson = (personId) => {
    const updatedPeople = people.filter(p => p.id !== personId);
    updatePeople(updatedPeople);
  };

  // --- Handlers: Annual Archive (Rules 14 & 15) ---
  const handleSaveArchiveRecord = (archiveRecord) => {
    const updated = [archiveRecord, ...archives.filter(a => a.year !== archiveRecord.year)];
    updateArchives(updated);
  };

  const handleCleanupArchivedYear = (year) => {
    const yearStr = String(year);
    // Deletes only that calendar year's personal expenses; Owes & Dues remain intact (Rule 14)
    const filteredTx = transactions.filter(tx => !tx.date || !tx.date.startsWith(yearStr));
    updateTransactions(filteredTx);
  };

  // --- Handlers: Vault Lifecycle ---
  const handleCreateNewVault = (vaultData) => {
    StorageService.createNewVault(vaultData);
    syncStateFromStorage();
    setIsVaultUnlocked(true);
    setActiveTab('dashboard');
  };

  const handleImportVault = (jsonData) => {
    StorageService.importAllData(jsonData);
    syncStateFromStorage();
    setIsVaultUnlocked(true);
    setActiveTab('dashboard');
  };

  const handleQuickDemo = () => {
    StorageService.createNewVault({
      userName: 'College Student',
      profession: 'Student',
      defaultMonthlyLimit: 10000,
      currency: 'INR',
      currencySymbol: '₹',
      loadDemoData: true
    });
    syncStateFromStorage();
    setIsVaultUnlocked(true);
    setActiveTab('dashboard');
  };

  const handleLockVault = () => {
    StorageService.lockVault();
    setIsVaultUnlocked(false);
  };

  // --- Handlers: Settings, Export, Import ---
  const handleExportData = () => {
    const data = StorageService.exportAllData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expenso_Backup_${settings.userName ? settings.userName.replace(/\s+/g, '_') : 'Vault'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (json) => {
    try {
      StorageService.importAllData(json);
      syncStateFromStorage();
      return true;
    } catch (e) {
      throw e;
    }
  };

  const handleLoadSampleData = () => {
    StorageService.loadSampleData();
    syncStateFromStorage();
  };

  const handleClearAllData = () => {
    StorageService.clearAllData();
    setPeople([]);
    setTransactions([]);
    setSharedExpenses([]);
    setOwesDues([]);
    setSettings(StorageService.getSettings());
    setArchives([]);
    setIsVaultUnlocked(false);
  };

  const handleDismissReminder = () => {
    setIsReminderBannerOpen(false);
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = { ...settings, lastReminderDismissedDate: todayStr };
    updateSettings(updated);
    // Strictly Rule 4: "If user ignores the reminder, Expenso creates no transaction and does not record a 0 transaction."
  };

  // If vault is locked or not yet initialized, display the Login & Onboarding screen
  if (!isVaultUnlocked) {
    return (
      <VaultLogin
        onNewVault={handleCreateNewVault}
        onImportVault={handleImportVault}
        onQuickDemo={handleQuickDemo}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/40 relative overflow-x-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] ambient-orb-1" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] ambient-orb-2" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] ambient-orb-1" />
      </div>

      {/* 9:00 PM Reminder Banner (Rule 4) */}
      <ReminderBanner
        isOpen={isReminderBannerOpen}
        onDismiss={handleDismissReminder}
        onOpenAddExpense={() => {
          setIsReminderBannerOpen(false);
          setIsQuickAddOpen(true);
        }}
      />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        currencySymbol={settings.currencySymbol || '₹'}
        reminderTriggered={isReminderBannerOpen}
        userName={settings.userName}
        profession={settings.profession}
        profilePic={settings.profilePic}
        theme={settings.theme || 'dark'}
        onToggleTheme={handleToggleTheme}
        onLockVault={handleLockVault}
      />

      {/* Main Content Body with Smooth Spring Page Transitions */}
      <main ref={mainRef} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12">
        <div key={activeTab} className="page-enter">
          {activeTab === 'dashboard' && (
            <Dashboard
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              transactions={transactions}
              owesDues={owesDues}
              people={people}
              settings={settings}
              onOpenAddPersonal={() => setIsQuickAddOpen(true)}
              onOpenAddShared={() => setActiveTab('shared')}
              onNavigateTab={setActiveTab}
              onLockVault={handleLockVault}
            />
          )}

          {activeTab === 'personal' && (
            <PersonalExpenses
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              settings={settings}
            />
          )}

          {activeTab === 'shared' && (
            <SharedExpenses
              sharedExpenses={sharedExpenses}
              people={people}
              settings={settings}
              onSaveSharedExpense={handleSaveSharedExpense}
              onDeleteSharedExpense={handleDeleteSharedExpense}
              onAddPerson={handleAddPerson}
            />
          )}

          {activeTab === 'owes_dues' && (
            <OwesDues
              owesDues={owesDues}
              people={people}
              settings={settings}
              onAddOweDue={handleAddOweDue}
              onUpdateOweDue={handleUpdateOweDue}
              onDeleteOweDue={handleDeleteOweDue}
              onToggleSettled={handleToggleSettled}
              onPartialSettle={handlePartialSettle}
              onCleanupExpiredSettled={handleCleanupExpiredSettled}
              onAddPerson={handleAddPerson}
            />
          )}

          {activeTab === 'people' && (
            <PersonDirectory
              people={people}
              owesDues={owesDues}
              settings={settings}
              onAddPerson={handleAddPerson}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
            />
          )}

          {activeTab === 'archive' && (
            <AnnualArchive
              transactions={transactions}
              archives={archives}
              settings={settings}
              onSaveArchiveRecord={handleSaveArchiveRecord}
              onCleanupArchivedYear={handleCleanupArchivedYear}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsBackup
              settings={settings}
              onUpdateSettings={updateSettings}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onLoadSampleData={handleLoadSampleData}
              onClearAllData={handleClearAllData}
              selectedMonth={selectedMonth}
              onLockVault={handleLockVault}
            />
          )}
        </div>
      </main>

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        people={people}
        settings={settings}
        onAddPersonal={handleAddTransaction}
        onAddShared={handleSaveSharedExpense}
        onAddOweDue={handleAddOweDue}
        onAddPerson={handleAddPerson}
        onOpenSharedModal={() => {
          setActiveTab('shared');
        }}
      />
    </div>
  );
}
