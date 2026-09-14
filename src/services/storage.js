import { DEFAULT_SETTINGS } from '../types/constants';

const STORAGE_KEYS = {
  TRANSACTIONS: 'expenso_transactions_v1',
  SHARED_EXPENSES: 'expenso_shared_expenses_v1',
  OWES_DUES: 'expenso_owes_dues_v1',
  PEOPLE: 'expenso_people_v1',
  SETTINGS: 'expenso_settings_v1',
  ARCHIVES: 'expenso_archives_v1'
};

export const StorageService = {
  // Helper to read from LocalStorage safely
  get(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  },

  // Transactions (Personal Expenses)
  getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS, []);
  },
  saveTransactions(transactions) {
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  // Shared Expenses
  getSharedExpenses() {
    return this.get(STORAGE_KEYS.SHARED_EXPENSES, []);
  },
  saveSharedExpenses(expenses) {
    this.set(STORAGE_KEYS.SHARED_EXPENSES, expenses);
  },

  // Owes & Dues
  getOwesDues() {
    return this.get(STORAGE_KEYS.OWES_DUES, []);
  },
  saveOwesDues(owesDues) {
    this.set(STORAGE_KEYS.OWES_DUES, owesDues);
  },

  // People Directory (Unique 4-digit ID)
  getPeople() {
    return this.get(STORAGE_KEYS.PEOPLE, []);
  },
  savePeople(people) {
    this.set(STORAGE_KEYS.PEOPLE, people);
  },

  // Settings
  getSettings() {
    const saved = this.get(STORAGE_KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...saved };
  },
  saveSettings(settings) {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  },

  // Archives
  getArchives() {
    return this.get(STORAGE_KEYS.ARCHIVES, []);
  },
  saveArchives(archives) {
    this.set(STORAGE_KEYS.ARCHIVES, archives);
  },

  // Generate Unique 4-digit ID (1000 - 9999)
  generateUniquePersonId() {
    const people = this.getPeople();
    const existingIds = new Set(people.map(p => String(p.id)));
    let candidate;
    let attempts = 0;
    do {
      candidate = String(Math.floor(1000 + Math.random() * 9000));
      attempts++;
    } while (existingIds.has(candidate) && attempts < 10000);
    return candidate;
  },

  // Check if Person ID is already used
  isPersonIdAvailable(id) {
    const people = this.getPeople();
    return !people.some(p => String(p.id) === String(id));
  },

  // Check if a vault is currently active
  hasActiveVault() {
    const settings = this.getSettings();
    return Boolean(settings.isVaultActive && settings.userName);
  },

  // Create and initialize a brand new vault
  createNewVault({ userName, profession, profilePic = '', defaultMonthlyLimit = 10000, currency = 'INR', currencySymbol = '₹', loadDemoData = false }) {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const newSettings = {
      ...DEFAULT_SETTINGS,
      userName: userName.trim(),
      profession: profession.trim(),
      profilePic: profilePic || '',
      isVaultActive: true,
      vaultCreatedAt: new Date().toISOString(),
      currency,
      currencySymbol,
      defaultMonthlyLimit: Number(defaultMonthlyLimit) || 10000,
      monthlyLimits: {}
    };

    if (loadDemoData) {
      this.loadSampleData();
      // Ensure custom profile settings overwrite default demo settings
      this.saveSettings(newSettings);
    } else {
      this.savePeople([]);
      this.saveTransactions([]);
      this.saveSharedExpenses([]);
      this.saveOwesDues([]);
      this.saveArchives([]);
      this.saveSettings(newSettings);
    }

    return newSettings;
  },

  // Lock / Logout of Vault
  lockVault() {
    const current = this.getSettings();
    this.saveSettings({ ...current, isVaultActive: false });
  },

  // Export full JSON Backup
  exportAllData() {
    const settings = this.getSettings();
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      vaultProfile: {
        userName: settings.userName || 'Expenso User',
        profession: settings.profession || 'Member',
        profilePic: settings.profilePic || '',
        vaultCreatedAt: settings.vaultCreatedAt || new Date().toISOString()
      },
      transactions: this.getTransactions(),
      sharedExpenses: this.getSharedExpenses(),
      owesDues: this.getOwesDues(),
      people: this.getPeople(),
      settings: settings,
      archives: this.getArchives()
    };
  },

  // Import JSON Backup
  importAllData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file format: Root must be a valid JSON object');
    }

    // Merge settings & ensure vault is active on import
    let importedSettings = { ...DEFAULT_SETTINGS };
    if (data.settings && typeof data.settings === 'object') {
      importedSettings = { ...importedSettings, ...data.settings };
    }
    
    // Support profile from vaultProfile or settings
    if (data.vaultProfile && typeof data.vaultProfile === 'object') {
      if (data.vaultProfile.userName) importedSettings.userName = data.vaultProfile.userName;
      if (data.vaultProfile.profession) importedSettings.profession = data.vaultProfile.profession;
      if (data.vaultProfile.profilePic !== undefined) importedSettings.profilePic = data.vaultProfile.profilePic;
      if (data.vaultProfile.vaultCreatedAt) importedSettings.vaultCreatedAt = data.vaultProfile.vaultCreatedAt;
    }

    // Always activate vault on successful import
    importedSettings.isVaultActive = true;
    if (!importedSettings.userName) {
      importedSettings.userName = 'Expenso User';
    }

    if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
    if (Array.isArray(data.sharedExpenses)) this.saveSharedExpenses(data.sharedExpenses);
    if (Array.isArray(data.owesDues)) this.saveOwesDues(data.owesDues);
    if (Array.isArray(data.people)) this.savePeople(data.people);
    this.saveSettings(importedSettings);
    if (Array.isArray(data.archives)) this.saveArchives(data.archives);

    return true;
  },

  // Clear all data
  clearAllData() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  // Load rich sample demo data for student testing
  loadSampleData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const prevMonth = String(today.getMonth() === 0 ? 12 : today.getMonth()).padStart(2, '0');
    const prevYear = today.getMonth() === 0 ? currentYear - 1 : currentYear;

    const people = [
      { id: '1042', name: 'Ravi Kumar', phone: '9876543210', createdAt: new Date().toISOString() },
      { id: '2105', name: 'Ananya Sharma', phone: '9123456780', createdAt: new Date().toISOString() },
      { id: '3489', name: 'Arjun Patel', phone: '9988776655', createdAt: new Date().toISOString() },
      { id: '4521', name: 'Priya Verma', phone: '9456123789', createdAt: new Date().toISOString() }
    ];

    const transactions = [
      {
        id: 'tx_1',
        title: 'Semester Textbooks & Lab Manuals',
        amount: 1450,
        category: 'academics',
        date: `${currentYear}-${currentMonth}-03`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_2',
        title: 'Cafeteria Breakfast & Coffee',
        amount: 180,
        category: 'food',
        date: `${currentYear}-${currentMonth}-05`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_3',
        title: 'Monthly Hostel Wi-Fi Bill',
        amount: 600,
        category: 'rent_bills',
        date: `${currentYear}-${currentMonth}-08`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_4',
        title: 'Weekend Movie Night & Popcorn',
        amount: 450,
        category: 'entertainment',
        date: `${currentYear}-${currentMonth}-10`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_5',
        title: 'Supermarket Snacks & Supplies',
        amount: 820,
        category: 'groceries',
        date: `${currentYear}-${currentMonth}-11`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_6',
        title: 'Metro Smart Card Recharge',
        amount: 500,
        category: 'travel',
        date: `${currentYear}-${currentMonth}-12`,
        createdAt: new Date().toISOString()
      },
      // Previous month sample for rollover demonstration
      {
        id: 'tx_prev_1',
        title: 'Course Exam Registration Fee',
        amount: 3500,
        category: 'academics',
        date: `${prevYear}-${prevMonth}-10`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_prev_2',
        title: 'Room Rent Contribution',
        amount: 4500,
        category: 'rent_bills',
        date: `${prevYear}-${prevMonth}-02`,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_prev_3',
        title: 'College Fest Outing',
        amount: 2800,
        category: 'entertainment',
        date: `${prevYear}-${prevMonth}-20`,
        createdAt: new Date().toISOString()
      }
    ];

    const owesDues = [
      {
        id: 'od_1',
        title: 'Shared Dinner at BBQ Nation',
        amount: 700,
        originalAmount: 700,
        personId: '1042',
        personName: 'Ravi Kumar',
        personPhone: '9876543210',
        type: 'due', // Ravi owes user 700
        status: 'in_process',
        date: `${currentYear}-${currentMonth}-02`,
        settlementDate: null
      },
      {
        id: 'od_2',
        title: 'Hostel Groceries & Milk',
        amount: 500,
        originalAmount: 500,
        personId: '1042',
        personName: 'Ravi Kumar',
        personPhone: '9876543210',
        type: 'owe', // User owes Ravi 500 (Net Ravi owes user 200!)
        status: 'in_process',
        date: `${currentYear}-${currentMonth}-04`,
        settlementDate: null
      },
      {
        id: 'od_3',
        title: 'Shared Uber to Airport',
        amount: 350,
        originalAmount: 350,
        personId: '2105',
        personName: 'Ananya Sharma',
        personPhone: '9123456780',
        type: 'due',
        status: 'in_process',
        date: `${currentYear}-${currentMonth}-07`,
        settlementDate: null
      },
      {
        id: 'od_4',
        title: 'Library Fine Settlement',
        amount: 120,
        originalAmount: 120,
        personId: '3489',
        personName: 'Arjun Patel',
        personPhone: '9988776655',
        type: 'due',
        status: 'settled',
        date: `${currentYear}-${currentMonth}-01`,
        settlementDate: new Date(Date.now() - 5 * 86400000).toISOString() // settled 5 days ago
      }
    ];

    const settings = {
      ...DEFAULT_SETTINGS,
      currency: 'INR',
      currencySymbol: '₹',
      defaultMonthlyLimit: 10000,
      monthlyLimits: {
        [`${prevYear}-${prevMonth}`]: 10000,
        [`${currentYear}-${currentMonth}`]: 10000
      }
    };

    this.savePeople(people);
    this.saveTransactions(transactions);
    this.saveOwesDues(owesDues);
    this.saveSharedExpenses([]);
    this.saveSettings(settings);
    this.saveArchives([]);
  }
};
