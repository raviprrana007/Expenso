export const PAYMENT_MODES = [
  { id: 'upi', name: 'UPI', icon: 'Smartphone', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'cash', name: 'Cash', icon: 'Banknote', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'card', name: 'Card', icon: 'CreditCard', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'netbanking', name: 'Net Banking', icon: 'Building2', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'mix', name: 'Mix', icon: 'Layers', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'custom', name: 'Custom', icon: 'PlusCircle', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' }
];

export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'academics', name: 'Academics & Books', icon: 'GraduationCap', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'travel', name: 'Travel & Commute', icon: 'Bus', color: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'entertainment', name: 'Entertainment & Outings', icon: 'Film', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'rent_bills', name: 'Rent & Utilities', icon: 'Home', color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'shopping', name: 'Shopping & Clothes', icon: 'ShoppingBag', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { id: 'healthcare', name: 'Health & Pharmacy', icon: 'HeartPulse', color: 'from-red-500 to-rose-600', bg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { id: 'others', name: 'Others', icon: 'Sparkles', color: 'from-slate-500 to-gray-500', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' }
];

// Curated unique high-contrast colors for all standard, alias, and sub-categories
export const CATEGORY_COLORS = {
  food: '#f97316',          // Vibrant Orange
  groceries: '#10b981',     // Fresh Emerald Green
  academics: '#3b82f6',     // Royal / Electric Blue
  travel: '#06b6d4',        // Vivid Cyan / Sky
  entertainment: '#a855f7', // Bright Violet Purple
  rent_bills: '#eab308',    // Warm Amber / Golden Sun
  shopping: '#ec4899',      // Hot Magenta Pink
  healthcare: '#ef4444',    // Vivid Crimson Red
  others: '#64748b',        // Cool Slate Silver
  // Aliases and sub-categories
  dining: '#ea580c',        // Deep Dark Orange
  transport: '#0284c7',     // Deep Ocean Blue
  fuel: '#d97706',          // Amber
  utilities: '#14b8a6',     // Aquamarine Teal
  bills: '#6366f1',         // Indigo
  medical: '#f43f5e',       // Rose Red
  investment: '#22c55e',    // Bright Mint Green
  education: '#2563eb',     // Cobalt Blue
  rent: '#8b5cf6',          // Deep Amethyst
  personal: '#d946ef'       // Fuchsia
};

// Rich palette of highly distinct colors for collision-free fallback
export const DISTINCT_PALETTE = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#eab308', // Yellow
  '#ec4899', // Pink
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#0284c7', // Sky Blue
  '#8b5cf6', // Violet
  '#64748b', // Slate
  '#ea580c', // Dark Orange
  '#22c55e', // Mint
  '#fbbf24', // Goldenrod
  '#059669'  // Dark Emerald
];

/**
 * Assigns a guaranteed unique color for a category slice, avoiding duplicates across active categories.
 */
export const getUniqueCategoryColor = (catId, index = 0, usedColors = new Set()) => {
  const normalizedId = String(catId || '').toLowerCase().trim();
  const baseColor = CATEGORY_COLORS[normalizedId];

  // 1. If base color is defined and not yet used in this chart, use it
  if (baseColor && !usedColors.has(baseColor.toLowerCase())) {
    usedColors.add(baseColor.toLowerCase());
    return baseColor;
  }

  // 2. Pick the first unused color from the curated distinct palette
  const unusedFromPalette = DISTINCT_PALETTE.find(c => !usedColors.has(c.toLowerCase()));
  if (unusedFromPalette) {
    usedColors.add(unusedFromPalette.toLowerCase());
    return unusedFromPalette;
  }

  // 3. Fallback to golden-angle HSL distribution for mathematically spaced unique hues
  const hue = Math.round((index * 137.508) % 360);
  const hslColor = `hsl(${hue}, 85%, 56%)`;
  usedColors.add(hslColor.toLowerCase());
  return hslColor;
};

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
