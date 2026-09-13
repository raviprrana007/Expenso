import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit3, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Split, 
  X, 
  Sparkles, 
  UserCheck,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BudgetCalculator } from '../services/budgetCalculator';
import { StorageService } from '../services/storage';
import { PAYMENT_MODES, getPaymentModeDisplay } from '../types/constants';

export default function OwesDues({
  owesDues,
  people,
  settings,
  onAddOweDue,
  onUpdateOweDue,
  onDeleteOweDue,
  onToggleSettled,
  onPartialSettle,
  onCleanupExpiredSettled,
  onAddPerson
}) {
  const currencySymbol = settings.currencySymbol || '₹';
  const [activeTab, setActiveTab] = useState('in_process'); // 'in_process' or 'settled'
  const [selectedPersonFilter, setSelectedPersonFilter] = useState('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'due', // 'due' (they owe me) or 'owe' (I owe them)
    personId: '',
    paymentMode: 'upi',
    customPaymentMode: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Quick on-the-spot person add inside Owes & Dues modal
  const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [suggestedId, setSuggestedId] = useState('');

  // Modal State for Partial Settlement
  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [partialTargetItem, setPartialTargetItem] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');

  // Calculate Net positions & summaries
  const summary = BudgetCalculator.calculateOwesDuesSummary(owesDues, people);

  // Filter items by status tab and person
  const tabItems = owesDues.filter(item => {
    const matchesTab = activeTab === 'in_process' ? item.status !== 'settled' : item.status === 'settled';
    const matchesPerson = selectedPersonFilter === 'all' || String(item.personId) === String(selectedPersonFilter);
    return matchesTab && matchesPerson;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const openAddModal = (defaultType = 'due', preselectedPersonId = '') => {
    setEditingItem(null);
    setIsAddingNewPerson(false);
    setNewPersonName('');
    setNewPersonPhone('');
    setSuggestedId(StorageService.generateUniquePersonId());
    setFormData({
      title: '',
      amount: '',
      type: defaultType,
      personId: preselectedPersonId || (people[0]?.id || ''),
      paymentMode: 'upi',
      customPaymentMode: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsAddingNewPerson(false);
    setSuggestedId(StorageService.generateUniquePersonId());
    const isPredefinedMode = PAYMENT_MODES.some(m => m.id === item.paymentMode);

    setFormData({
      title: item.title || '',
      amount: String(item.amount || ''),
      type: item.type || 'due',
      personId: String(item.personId || ''),
      paymentMode: isPredefinedMode ? (item.paymentMode || 'upi') : 'custom',
      customPaymentMode: isPredefinedMode ? '' : (item.customPaymentMode || item.paymentMode || ''),
      date: item.date || new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setIsAddingNewPerson(false);
  };

  const handleCreateAndSelectPerson = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      alert('Please enter a name for the new contact.');
      return;
    }
    const candidateId = suggestedId || StorageService.generateUniquePersonId();
    if (!StorageService.isPersonIdAvailable(candidateId)) {
      alert(`Person ID #${candidateId} is already in use. A new ID will be assigned.`);
      setSuggestedId(StorageService.generateUniquePersonId());
      return;
    }

    const created = {
      id: candidateId,
      name: newPersonName.trim(),
      phone: newPersonPhone.trim(),
      createdAt: new Date().toISOString()
    };

    onAddPerson(created);
    setFormData({ ...formData, personId: created.id });
    setIsAddingNewPerson(false);
    setNewPersonName('');
    setNewPersonPhone('');
    setSuggestedId(StorageService.generateUniquePersonId());
  };

  const openPartialModal = (item) => {
    setPartialTargetItem(item);
    setPartialAmount('');
    setIsPartialModalOpen(true);
  };

  const closePartialModal = () => {
    setIsPartialModalOpen(false);
    setPartialTargetItem(null);
    setPartialAmount('');
  };

  const handleToggle = (item) => {
    onToggleSettled(item.id);
    if (item.status !== 'settled') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!formData.title.trim()) {
      alert('Please enter a title or description.');
      return;
    }
    if (!formData.personId) {
      alert('Please select or add a person.');
      return;
    }

    const selectedPerson = people.find(p => String(p.id) === String(formData.personId));
    const personName = selectedPerson ? selectedPerson.name : 'Unknown';
    const personPhone = selectedPerson ? (selectedPerson.phone || '') : '';

    const finalPaymentMode = formData.paymentMode === 'custom'
      ? (formData.customPaymentMode.trim() || 'Custom')
      : formData.paymentMode;

    if (editingItem) {
      onUpdateOweDue({
        ...editingItem,
        title: formData.title.trim(),
        amount: amountNum,
        type: formData.type,
        personId: formData.personId,
        personName,
        personPhone,
        paymentMode: finalPaymentMode,
        customPaymentMode: formData.paymentMode === 'custom' ? formData.customPaymentMode.trim() : '',
        date: formData.date
      });
    } else {
      const newItem = {
        id: `od_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: formData.title.trim(),
        amount: amountNum,
        originalAmount: amountNum,
        type: formData.type,
        personId: formData.personId,
        personName,
        personPhone,
        paymentMode: finalPaymentMode,
        customPaymentMode: formData.paymentMode === 'custom' ? formData.customPaymentMode.trim() : '',
        status: 'in_process',
        date: formData.date,
        settlementDate: null,
        createdAt: new Date().toISOString()
      };
      onAddOweDue(newItem);
    }

    closeModal();
  };

  const handlePartialSubmit = (e) => {
    e.preventDefault();
    if (!partialTargetItem) return;
    const pAmt = parseFloat(partialAmount);
    if (isNaN(pAmt) || pAmt <= 0 || pAmt >= partialTargetItem.amount) {
      alert(`Partial settlement amount must be greater than 0 and less than ${currencySymbol}${partialTargetItem.amount}. For full settlement, check the checkbox instead.`);
      return;
    }

    onPartialSettle(partialTargetItem.id, pAmt);
    closePartialModal();
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
  };

  // WhatsApp quick link builder
  const getWhatsAppLink = (phone, personName, netAmount, isDue) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = isDue
      ? `Hi ${personName}, gentle reminder regarding the pending balance of ${currencySymbol}${netAmount} on Expenso. Whenever you get time, please settle it! Thanks!`
      : `Hi ${personName}, I'm preparing to settle the balance of ${currencySymbol}${Math.abs(netAmount)} I owe you on Expenso. Please share your UPI ID / details.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm flex-shrink-0">
              <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Owes & Dues Manager</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track money owed to you or payable by you, net calculations per person, and 30-day auto-settlement deletion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            onClick={() => openAddModal('due')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer btn-press btn-shimmer"
          >
            <ArrowDownLeft className="w-4 h-4" /> + Someone Owes Me
          </button>
          <button
            onClick={() => openAddModal('owe')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer btn-press btn-shimmer"
          >
            <ArrowUpRight className="w-4 h-4" /> + I Owe Someone
          </button>
        </div>
      </div>

      {/* Person-Wise Net Summary Grid */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Person-Wise Net Balance</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {summary.personNetList.filter(p => p.hasActivity).length} with active balances
          </span>
        </div>

        {summary.personNetList.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No people registered in your directory yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 stagger-items">
            {summary.personNetList.map(person => {
              const hasNetDue = person.net > 0;
              const hasNetOwe = person.net < 0;

              return (
                <div
                  key={person.id}
                  className={`p-3.5 rounded-xl border glass-panel-interactive transition-all ${
                    hasNetDue
                      ? 'bg-emerald-950/20 border-emerald-500/30 shadow-glow-success'
                      : hasNetOwe
                        ? 'bg-rose-950/20 border-rose-500/30 shadow-glow-danger'
                        : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{person.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">ID: #{person.id}</span>
                    </div>

                    <div className="text-right">
                      <div className={`text-base font-black tabular-nums ${
                        hasNetDue ? 'text-emerald-400' : hasNetOwe ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {hasNetDue ? `+${currencySymbol}${person.net.toLocaleString()}` : hasNetOwe ? `-${currencySymbol}${Math.abs(person.net).toLocaleString()}` : 'Settled'}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {hasNetDue ? 'They owe you' : hasNetOwe ? 'You owe them' : 'All Clear'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & WhatsApp Contact */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSelectedPersonFilter(selectedPersonFilter === person.id ? 'all' : person.id)}
                      className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedPersonFilter === person.id ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {selectedPersonFilter === person.id ? '✓ Filtering' : 'Filter records'}
                    </button>

                    {person.phone && (
                      <div className="flex items-center gap-1.5">
                        {person.net !== 0 && (
                          <a
                            href={getWhatsAppLink(person.phone, person.name, person.net, hasNetDue)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={`tel:${person.phone}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Call Phone"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* In Process vs Settled Tabs */}
        <div className="grid grid-cols-2 sm:flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('in_process')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'in_process'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In Process</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] tabular-nums font-bold">
              {owesDues.filter(i => i.status !== 'settled').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settled')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'settled'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settled</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] tabular-nums font-bold">
              {owesDues.filter(i => i.status === 'settled').length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Person filter clear button if active */}
          {selectedPersonFilter !== 'all' && (
            <button
              onClick={() => setSelectedPersonFilter('all')}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Person Filter
            </button>
          )}

          {/* 30-Day Cleanup Action in Settled tab */}
          {activeTab === 'settled' && (
            <button
              onClick={onCleanupExpiredSettled}
              className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Remove settled items older than 30 days"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clean Up Expired (&gt;30 Days)
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      {tabItems.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel">
          <Sparkles className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            {activeTab === 'in_process' ? 'No pending Owes or Dues' : 'No Settled records'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'in_process'
              ? 'All accounts are settled! Record new money owed or payable whenever needed.'
              : 'Settled items stay here for a 30-day deletion window.'}
          </p>
          {activeTab === 'in_process' && (
            <button
              onClick={() => openAddModal('due')}
              className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 stagger-items">
          {tabItems.map(item => {
            const isSettled = item.status === 'settled';
            const isDue = item.type === 'due'; // they owe me
            const deletionInfo = BudgetCalculator.getSettledDeletionInfo(item);

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl glass-panel-interactive border transition-all ${
                  isSettled ? 'border-slate-800/80 opacity-90' : isDue ? 'border-emerald-500/20' : 'border-rose-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Left: Checkbox + Description */}
                  <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
                    {/* Checkbox (Unchecked = In Process, Checked = Settled) */}
                    <button
                      onClick={() => handleToggle(item)}
                      className={`p-2 sm:p-1.5 rounded-xl border transition-all flex-shrink-0 mt-0.5 sm:mt-0 cursor-pointer active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center ${
                        isSettled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                      }`}
                      title={isSettled ? 'Uncheck to return to In Process' : 'Check to mark Settled'}
                    >
                      {isSettled ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isSettled ? 'line-through text-slate-400' : 'text-white'}`}>
                          {item.title}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          isDue ? 'badge-due' : 'badge-owe'
                        }`}>
                          {isDue ? 'Due (They owe you)' : 'Owe (You owe them)'}
                        </span>

                        {/* Mode of Transaction Badge */}
                        {item.paymentMode && (
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getPaymentModeDisplay(item.paymentMode, item.customPaymentMode).color}`}>
                            {getPaymentModeDisplay(item.paymentMode, item.customPaymentMode).name}
                          </span>
                        )}

                        {item.sharedExpenseId && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full badge-shared">
                            From Shared Bill
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 mt-1">
                        <span className="font-semibold text-slate-200">
                          {item.personName} <span className="text-slate-500 text-[10px] font-mono">#{item.personId}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {item.date}
                        </span>
                        {isSettled && item.settlementDate && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium tabular-nums">
                              Settled: {new Date(item.settlementDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="text-amber-400 font-medium tabular-nums">
                              {deletionInfo.daysRemaining}d left
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-left sm:text-right">
                      <span className={`text-base sm:text-lg font-black tabular-nums ${
                        isSettled ? 'text-slate-400' : isDue ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {currencySymbol} {(Number(item.amount) || 0).toLocaleString()}
                      </span>
                      {item.originalAmount && item.originalAmount > item.amount && (
                        <div className="text-[10px] text-slate-500 line-through tabular-nums">
                          Original: {currencySymbol}{item.originalAmount}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Partial Settlement Button */}
                      {!isSettled && (
                        <button
                          onClick={() => openPartialModal(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Partially settle this record"
                        >
                          <Split className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Partial</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer active:scale-90"
                        title="Edit Record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${item.title}" (${currencySymbol}${item.amount})?`)) {
                            onDeleteOweDue(item.id);
                          }
                        }}
                        className="p-2 sm:p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer active:scale-90"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto modal-overlay">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl glass-modal p-5 sm:p-6 shadow-2xl relative modal-sheet max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border-t sm:border border-slate-800 pb-safe">
            <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-400" />
                {editingItem ? 'Edit Owes / Dues Record' : 'Record New Owes / Dues'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Record Type *
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'due' })}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      formData.type === 'due'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Due (They owe me)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'owe' })}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      formData.type === 'owe'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="truncate">Owe (I owe them)</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lent cash for auto rickshaw, notes fee"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-purple-500 transition-colors font-medium"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-purple-500 transition-colors font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-purple-500 transition-colors tabular-nums"
                  />
                </div>
              </div>

              {/* Mode of Transaction in Owes & Dues */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mode of Transaction
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {PAYMENT_MODES.map((mode) => {
                    const isSelected = formData.paymentMode === mode.id;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setFormData({ ...formData, paymentMode: mode.id })}
                        className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {mode.name}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Mode Input */}
                {formData.paymentMode === 'custom' && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      required
                      placeholder="Enter custom mode (e.g. Crypto, Cheque, Gift Voucher)"
                      value={formData.customPaymentMode}
                      onChange={(e) => setFormData({ ...formData, customPaymentMode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/50 text-white text-base sm:text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Person Selector + On-The-Spot Person Adding */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Person (4-Digit ID) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewPerson(!isAddingNewPerson);
                      if (!suggestedId) setSuggestedId(StorageService.generateUniquePersonId());
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 cursor-pointer py-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingNewPerson ? 'Cancel' : '+ New Person'}</span>
                  </button>
                </div>

                {/* Inline On-the-spot Person Add Form */}
                {isAddingNewPerson && (
                  <div className="p-3 sm:p-3.5 mb-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5" /> Quick Add Person to Directory
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/50 text-purple-200">
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
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
                    >
                      Save & Select #{suggestedId}
                    </button>
                  </div>
                )}

                <select
                  required
                  value={formData.personId}
                  onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-purple-500 transition-colors font-medium cursor-pointer"
                >
                  <option value="">-- Select Person --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id}) {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer active:scale-95 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all cursor-pointer active:scale-95 text-center"
                >
                  {editingItem ? 'Save Changes' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial Settlement Modal */}
      {isPartialModalOpen && partialTargetItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm modal-overlay">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl glass-modal p-5 sm:p-6 shadow-2xl relative modal-sheet border-t sm:border border-slate-800 pb-safe">
            <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Split className="w-5 h-5 text-indigo-400" />
                Record Partial Settlement
              </h3>
              <button onClick={closePartialModal} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePartialSubmit} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Current Outstanding:</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {currencySymbol} {partialTargetItem.amount.toLocaleString()}
                </div>
                <div className="text-slate-400 mt-1">
                  For: <span className="text-white font-semibold">{partialTargetItem.title}</span> ({partialTargetItem.personName})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount Received / Paid Now ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  max={partialTargetItem.amount - 0.01}
                  placeholder="e.g. 200"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-base sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors font-bold tabular-nums"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  <span className="tabular-nums font-semibold text-slate-300">{currencySymbol}{partialAmount || 0}</span> will be marked as settled, and <span className="tabular-nums font-semibold text-slate-300">{currencySymbol}{Math.max(0, (partialTargetItem.amount - (parseFloat(partialAmount) || 0))).toFixed(2)}</span> will remain In Process.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closePartialModal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer active:scale-95 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 text-center"
                >
                  Confirm Partial Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
