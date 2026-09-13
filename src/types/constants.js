export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'academics', name: 'Academics & Books', icon: 'GraduationCap', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'travel', name: 'Travel & Commute', icon: 'Bus', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'entertainment', name: 'Entertainment & Outings', icon: 'Film', color: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' },
  { id: 'rent_bills', name: 'Rent & Utilities', icon: 'Home', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'shopping', name: 'Shopping & Clothes', icon: 'ShoppingBag', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { id: 'healthcare', name: 'Health & Pharmacy', icon: 'HeartPulse', color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { id: 'misc', name: 'Miscellaneous', icon: 'Sparkles', color: 'from-slate-500 to-gray-500', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' }
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' }
];

export const DEFAULT_SETTINGS = {
  currency: 'INR',
  currencySymbol: '₹',
  defaultMonthlyLimit: 10000,
  monthlyLimits: {}, // map of 'YYYY-MM' -> number
  reminderTime: '21:00',
  reminderEnabled: true,
  lastReminderDismissedDate: null,
  autoDeleteSettledDays: 30
};
