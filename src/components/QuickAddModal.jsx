import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Users, 
  ArrowLeftRight, 
  X, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Layers,
  PlusCircle,
  Tag,
  UserPlus
} from 'lucide-react';
import { CATEGORIES, PAYMENT_MODES } from '../types/constants';
import { StorageService } from '../services/storage';

export default function QuickAddModal({
  isOpen,
  onClose,
  people,
  settings,
  onAddPersonal,
  onAddShared,
  onAddOweDue,
  onAddPerson,
  onOpenSharedModal
}) {
  const currencySymbol = settings.currencySymbol || '₹';
  const [entryType, setEntryType] = useState('personal'); // 'personal' | 'shared' | 'due' | 'owe'

  // Personal / OweDue form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('others');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi');
  const [customPaymentMode, setCustomPaymentMode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personId, setPersonId] = useState(people[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Quick on-the-spot person add inside QuickAddModal
  const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [suggestedId, setSuggestedId] = useState('');

  // Requirement 3: Always reset form inputs when modal is opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setCategory('others');
      setCustomCategory('');
      setPaymentMode('upi');
      setCustomPaymentMode('');
      setDate(new Date().toISOString().split('T')[0]);
      setPersonId(people[0]?.id || '');
      setNotes('');
      setEntryType('personal');
      setIsAddingNewPerson(false);
      setNewPersonName('');
      setNewPersonPhone('');
      setSuggestedId(StorageService.generateUniquePersonId());
    }
  }, [isOpen, people]);

  if (!isOpen) return null;

  const handleCreateAndSelectPerson = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      alert('Please enter a name for the new contact.');
      return;
    }
    const candidateId = suggestedId || StorageService.generateUniquePersonId();
    if (!StorageService.isPersonIdAvailable(candidateId)) {
      alert(`Person ID #${candidateId} is already in use. Generating a new ID.`);
      setSuggestedId(StorageService.generateUniquePersonId());
      return;
    }

    const createdPerson = {
      id: candidateId,
      name: newPersonName.trim(),
      phone: newPersonPhone.trim(),
      createdAt: new Date().toISOString()
    };

    if (onAddPerson) {
      onAddPerson(createdPerson);
    }
    setPersonId(createdPerson.id);
    setNewPersonName('');
    setNewPersonPhone('');
    setIsAddingNewPerson(false);
    setSuggestedId(StorageService.generateUniquePersonId());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a description / title.');
      return;
    }

    // Mode of transaction
    const finalPaymentMode = paymentMode === 'custom' 
      ? (customPaymentMode.trim() || 'Custom') 
      : paymentMode;

    if (entryType === 'personal') {
      // Optional category falls back to 'others' or custom name
      let finalCategory = category || 'others';
      if (category === 'custom') {
        finalCategory = customCategory.trim() || 'others';
      }

      onAddPersonal({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        amount: amountNum,
        category: finalCategory,
        customCategory: category === 'custom' ? customCategory.trim() : '',
        paymentMode: finalPaymentMode,
        customPaymentMode: paymentMode === 'custom' ? customPaymentMode.trim() : '',
        date,
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      });
      onClose();
    } else if (entryType === 'due' || entryType === 'owe') {
      if (!personId) {
        alert('Please select an identified person with 4-digit ID.');
        return;
      }
      const personObj = people.find(p => String(p.id) === String(personId));
      onAddOweDue({
        id: `od_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        amount: amountNum,
        originalAmount: amountNum,
        type: entryType,
        personId,
        personName: personObj ? personObj.name : `Person #${personId}`,
        personPhone: personObj ? personObj.phone : '',
        paymentMode: finalPaymentMode,
        customPaymentMode: paymentMode === 'custom' ? customPaymentMode.trim() : '',
        status: 'in_process',
        date,
        settlementDate: null,
        createdAt: new Date().toISOString()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto modal-overlay">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-modal p-5 sm:p-7 shadow-2xl relative modal-sheet max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border-t sm:border border-slate-800/80 pb-safe">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mb-3.5 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner flex-shrink-0">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                Quick Add Transaction
              </h3>
              <p className="text-xs text-slate-400 font-medium">Record personal expenses or peer transfers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 sm:mt-5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => setEntryType('personal')}
            className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer btn-press ${
              entryType === 'personal'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Receipt className="w-4 h-4" /> 
            <span>Personal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSharedModal();
            }}
            className="py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all cursor-pointer btn-press group"
          >
            <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" /> 
            <span>Shared Bill &rarr;</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryType(entryType === 'due' ? 'owe' : 'due')}
            className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer btn-press ${
              entryType === 'due' || entryType === 'owe'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 border border-purple-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> 
            <span className="truncate">{entryType === 'due' ? 'Due (They Owe)' : entryType === 'owe' ? 'Owe (You Owe)' : 'Owe / Due'}</span>
          </button>
        </div>

        {/* Sub-type switcher if Owe/Due */}
        {(entryType === 'due' || entryType === 'owe') && (
          <div className="grid grid-cols-2 gap-2 mt-2.5 sm:mt-3 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setEntryType('due')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press flex items-center justify-center gap-1.5 ${
                entryType === 'due'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Due (They owe you)</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryType('owe')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press flex items-center justify-center gap-1.5 ${
                entryType === 'owe'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Owe (You owe them)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch at Cafeteria, Metro recharge, Books"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold font-mono tabular-nums transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium tabular-nums transition-all"
              />
            </div>
          </div>

          {/* If Personal: Mode of Transaction (Requirement 1) */}
          {entryType === 'personal' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>Mode of Transaction</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PAYMENT_MODES.map((mode) => {
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      type="button"
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer btn-press ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {mode.name}
                    </button>
                  );
                })}
              </div>

              {/* Custom Mode Input */}
              {paymentMode === 'custom' && (
                <div className="mt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom mode (e.g. Crypto, Cheque, Gift Voucher)"
                    value={customPaymentMode}
                    onChange={(e) => setCustomPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* If Personal: Category Selector & Custom Category (Requirement 2) */}
          {entryType === 'personal' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Category <span className="text-slate-500 font-normal lowercase">(optional - defaults to Others)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CATEGORIES.map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer btn-press ${
                      category === c.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCategory('custom')}
                  className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center gap-1.5 cursor-pointer btn-press ${
                    category === 'custom'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Custom...</span>
                </button>
              </div>

              {/* Custom Category input */}
              {category === 'custom' && (
                <div className="mt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name (e.g. Gym, Pet Care, Gadgets)"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* If Owe/Due: Mode of Transaction (Requirement 1) */}
          {(entryType === 'due' || entryType === 'owe') && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mode of Transaction
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PAYMENT_MODES.map((mode) => {
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      type="button"
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer btn-press ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {mode.name}
                    </button>
                  );
                })}
              </div>

              {/* Custom Mode Input */}
              {paymentMode === 'custom' && (
                <div className="mt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom mode (e.g. Crypto, Cheque, Gift Voucher)"
                    value={customPaymentMode}
                    onChange={(e) => setCustomPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-purple-500/50 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* If Owe/Due: Person Selector + On-The-Spot Person Adding (Requirement 2) */}
          {(entryType === 'due' || entryType === 'owe') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Person (4-Digit ID) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewPerson(!isAddingNewPerson);
                    if (!suggestedId) setSuggestedId(StorageService.generateUniquePersonId());
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors btn-press py-0.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingNewPerson ? 'Cancel' : '+ New Person'}</span>
                </button>
              </div>

              {/* Inline On-the-spot Person Add Form */}
              {isAddingNewPerson && (
                <div className="p-3 sm:p-3.5 mb-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2.5 animate-in fade-in shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> Quick Add Person to Directory
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-900/80 border border-purple-500/50 text-purple-200">
                      ID: #{suggestedId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={newPersonPhone}
                      onChange={(e) => setNewPersonPhone(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateAndSelectPerson}
                    className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer btn-press"
                  >
                    Save & Select #{suggestedId}
                  </button>
                </div>
              )}

              <select
                required
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer transition-all font-medium"
              >
                <option value="">-- Select Person --</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.id}) {p.phone ? `(${p.phone})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Additional details / note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer btn-press text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer btn-press btn-shimmer text-center min-h-[42px]"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
