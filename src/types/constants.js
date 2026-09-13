export const PAYMENT_MODES = [
  { id: 'upi', name: 'UPI', icon: 'Smartphone', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'cash', name: 'Cash', icon: 'Banknote', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'card', name: 'Card', icon: 'CreditCard', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'netbanking', name: 'Net Banking', icon: 'Building2', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'mix', name: 'Mix', icon: 'Layers', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'custom', name: 'Custom', icon: 'PlusCircle', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' }
];

export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'academics', name: 'Academics & Books', icon: 'GraduationCap', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'travel', name: 'Travel & Commute', icon: 'Bus', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'entertainment', name: 'Entertainment & Outings', icon: 'Film', color: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' },
  { id: 'rent_bills', name: 'Rent & Utilities', icon: 'Home', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'shopping', name: 'Shopping & Clothes', icon: 'ShoppingBag', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { id: 'healthcare', name: 'Health & Pharmacy', icon: 'HeartPulse', color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { id: 'others', name: 'Others', icon: 'Sparkles', color: 'from-slate-500 to-gray-500', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' }
];

export const getCategoryDisplay = (catId, customName = '') => {
  if (catId === 'custom' && customName) {
    return { name: customName, bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
  }
  const found = CATEGORIES.find(c => c.id === catId);
  if (found) return found;
  if (catId && catId !== 'others' && catId !== 'misc') {
    return { name: catId, bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
  }
  return { name: 'Others', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
};

export const getPaymentModeDisplay = (modeId, customMode = '') => {
  if (modeId === 'custom' && customMode) {
    return { name: customMode, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' };
  }
  const found = PAYMENT_MODES.find(m => m.id === modeId);
  if (found) return found;
  return { name: modeId ? String(modeId).toUpperCase() : 'UPI', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
};

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' }
];

export const PROFESSIONS = [
  'Student',
  'Software Engineer',
  'Designer',
  'Product Manager',
  'Doctor / Healthcare',
  'Freelancer',
  'Chartered Accountant',
  'Business Owner / Founder',
  'Teacher / Professor',
  'Lawyer',
  'Researcher',
  'Content Creator'
];

export const DEFAULT_SETTINGS = {
  userName: '',
  profession: '',
  profilePic: '',
  theme: 'dark', // 'dark' | 'light' (dark by default)
  isVaultActive: false,
  currency: 'INR',
  currencySymbol: '₹',
  defaultMonthlyLimit: 10000,
  monthlyLimits: {}, // map of 'YYYY-MM' -> number
  reminderTime: '21:00',
  reminderEnabled: true,
  lastReminderDismissedDate: null,
  autoDeleteSettledDays: 30
};
