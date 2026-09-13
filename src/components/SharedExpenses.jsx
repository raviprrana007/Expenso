import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  X, 
  UserCheck, 
  UserPlus, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../services/storage';

export default function SharedExpenses({
  sharedExpenses,
  people,
  settings,
  onSaveSharedExpense,
  onDeleteSharedExpense,
  onAddPerson
}) {
  const currencySymbol = settings.currencySymbol || '₹';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState('');
  const [payerId, setPayerId] = useState('user'); // 'user' or personId
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' or 'custom'
  
  // Selected participants (list of { id, name, phone, shareAmount })
  const [participants, setParticipants] = useState([
    { id: 'user', name: 'You (Myself)', shareAmount: 0 }
  ]);

  // Quick Add Person state inside modal
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [suggestedId, setSuggestedId] = useState('');

  const openAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setTotalAmount('');
    setPayerId('user');
    setSplitMode('equal');
    setParticipants([{ id: 'user', name: 'You (Myself)', shareAmount: 0 }]);
    setSuggestedId(StorageService.generateUniquePersonId());
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setTitle(expense.title || '');
    setDate(expense.date || new Date().toISOString().split('T')[0]);
    setTotalAmount(expense.totalAmount ? String(expense.totalAmount) : '');
    setPayerId(expense.payerId || 'user');
    setSplitMode(expense.splitMode || 'equal');
    setParticipants(expense.participants || [{ id: 'user', name: 'You (Myself)', shareAmount: 0 }]);
    setSuggestedId(StorageService.generateUniquePersonId());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  // Add existing person from directory to participants
  const handleTogglePerson = (person) => {
    const exists = participants.some(p => p.id === person.id);
    if (exists) {
      if (person.id === 'user') return; // Cannot remove self
      setParticipants(participants.filter(p => p.id !== person.id));
    } else {
      setParticipants([
        ...participants,
        { id: person.id, name: person.name, phone: person.phone || '', shareAmount: 0 }
      ]);
    }
  };

  // Quick create new person directly from modal
  const handleCreateAndAddPerson = () => {
    if (!newPersonName.trim()) {
      alert('Please enter a name for the new person.');
      return;
    }
    const candidateId = suggestedId || StorageService.generateUniquePersonId();
    if (!StorageService.isPersonIdAvailable(candidateId)) {
      alert(`Person ID #${candidateId} is already in use. A new ID will be generated.`);
      setSuggestedId(StorageService.generateUniquePersonId());
      return;
    }

    const createdPerson = {
      id: candidateId,
      name: newPersonName.trim(),
      phone: newPersonPhone.trim(),
      createdAt: new Date().toISOString()
    };

    onAddPerson(createdPerson);
    setParticipants([
      ...participants,
      { id: createdPerson.id, name: createdPerson.name, phone: createdPerson.phone, shareAmount: 0 }
    ]);
    setNewPersonName('');
    setNewPersonPhone('');
    setSuggestedId(StorageService.generateUniquePersonId());
  };

  // Compute calculated shares
  const parsedTotal = parseFloat(totalAmount) || 0;
  const equalSharePerPerson = participants.length > 0 ? (parsedTotal / participants.length) : 0;

  const currentParticipantShares = participants.map(p => {
    const share = splitMode === 'equal' ? parseFloat(equalSharePerPerson.toFixed(2)) : (parseFloat(p.shareAmount) || 0);
    return { ...p, share };
  });

  const userShare = currentParticipantShares.find(p => p.id === 'user')?.share || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title or place for the shared expense.');
      return;
    }
    if (parsedTotal <= 0) {
      alert('Please enter a valid total amount.');
      return;
    }
    if (participants.length < 2) {
      alert('A shared expense requires at least 2 participants (you + at least one friend).');
      return;
    }

    let finalShares = [];
    if (splitMode === 'equal') {
      finalShares = participants.map(p => ({
        ...p,
        share: parseFloat(equalSharePerPerson.toFixed(2))
      }));
    } else {
      const sumShares = participants.reduce((acc, p) => acc + (parseFloat(p.shareAmount) || 0), 0);
      if (Math.abs(sumShares - parsedTotal) > 1.0) {
        if (!window.confirm(`Warning: The sum of individual shares (${currencySymbol}${sumShares}) does not match the total bill (${currencySymbol}${parsedTotal}). Proceed anyway?`)) {
          return;
        }
      }
      finalShares = participants.map(p => ({
        ...p,
        share: parseFloat(p.shareAmount) || 0
      }));
    }

    const payerObj = people.find(p => p.id === payerId);
    const payerName = payerId === 'user' ? 'You (Myself)' : (payerObj ? payerObj.name : 'Unknown');

    const calculatedUserShare = finalShares.find(p => p.id === 'user')?.share || 0;

    const expenseRecord = {
      id: editingExpense ? editingExpense.id : `se_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      date,
      totalAmount: parsedTotal,
      payerId,
      payerName,
      splitMode,
      participants: finalShares,
      userShare: calculatedUserShare,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString()
    };

    onSaveSharedExpense(expenseRecord);
    closeModal();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Shared Expenses</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Split group meals, trips, or flat bills. Automatically updates your personal budget and generates Dues & Owes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer btn-shimmer btn-press"
        >
          <Plus className="w-4 h-4" /> Create Shared Expense
        </button>
      </div>

      {/* Shared Expenses List */}
      {sharedExpenses.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel">
          <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No shared expenses logged yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Split a restaurant bill, party, or travel cost with college roommates or friends.
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer btn-press"
          >
            <Plus className="w-4 h-4" /> Split Your First Bill
          </button>
        </div>
      ) : (
        <div className="space-y-4 stagger-items">
          {sharedExpenses.map(expense => {
            const isUserPayer = expense.payerId === 'user';
            return (
              <div
                key={expense.id}
                className="p-5 rounded-2xl glass-panel-interactive space-y-4 border border-slate-800"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white tracking-tight">{expense.title}</h4>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {expense.date}
                        </span>
                        <span>•</span>
                        <span>{expense.participants.length} People</span>
                        <span>•</span>
                        <span className={isUserPayer ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          Paid by: {isUserPayer ? 'You' : expense.payerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400 font-medium">Total Bill</div>
                      <div className="text-lg font-black text-white tabular-nums">
                        {currencySymbol} {expense.totalAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer active:scale-90"
                        title="Edit Shared Expense"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete shared expense "${expense.title}"? This will remove its personal expense and linked Dues/Owes.`)) {
                            onDeleteSharedExpense(expense.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer active:scale-90"
                        title="Delete Shared Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workflow effect callout */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Personal Expense Share:</span>
                    <span className="font-bold text-indigo-400 tabular-nums">
                      {currencySymbol} {expense.userShare.toLocaleString()}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">(Deducted from Monthly Spending Limit)</span>
                  </div>

                  <div>
                    {isUserPayer ? (
                      <span className="text-emerald-400 font-semibold tabular-nums">
                        Generated Dues: {currencySymbol} {(expense.totalAmount - expense.userShare).toLocaleString()} from {expense.participants.length - 1} friend(s)
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold tabular-nums">
                        Generated Owe: {currencySymbol} {expense.userShare.toLocaleString()} payable to {expense.payerName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Participants Breakdown Pills */}
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Participant Breakdown</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {expense.participants.map(p => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate">
                          {p.name} {p.id !== 'user' && <span className="text-slate-500 text-[10px] font-mono">#{p.id}</span>}
                        </span>
                        <span className="font-bold text-white tabular-nums">
                          {currencySymbol} {p.share.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Shared Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto modal-overlay">
          <div className="w-full max-w-2xl rounded-2xl glass-modal p-6 shadow-2xl relative my-8 modal-sheet border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                {editingExpense ? 'Edit Shared Expense' : 'Create Shared Expense'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Title / Place */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Place / Event / Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Domino's Pizza Party, Goa Trip Fuel, Flat Wi-Fi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors font-medium"
                />
              </div>

              {/* Total & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Total Bill Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors tabular-nums"
                  />
                </div>
              </div>

              {/* Who Paid? */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Who Paid the Bill? *
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-medium cursor-pointer"
                >
                  <option value="user">You (Myself)</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {payerId === 'user' 
                    ? '✓ Your share becomes personal spending; others\' shares become Dues to collect.' 
                    : '✓ Your share becomes personal spending AND an Owe payable to this friend.'}
                </p>
              </div>

              {/* Participants Section */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Select Participants ({participants.length})
                  </label>
                  <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSplitMode('equal')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        splitMode === 'equal' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Equal Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('custom')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        splitMode === 'custom' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Custom Split
                    </button>
                  </div>
                </div>

                {/* Available people chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <UserCheck className="w-3.5 h-3.5" /> You (Myself)
                  </span>
                  {people.map(person => {
                    const isSelected = participants.some(p => p.id === person.id);
                    return (
                      <button
                        type="button"
                        key={person.id}
                        onClick={() => handleTogglePerson(person)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                        {person.name} <span className="text-[10px] text-slate-500 font-mono">#{person.id}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Add Person Form inside modal */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" /> Or Add New Person with 4-Digit ID
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Friend's Name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      maxLength="4"
                      placeholder="4-digit ID"
                      value={suggestedId}
                      onChange={(e) => setSuggestedId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCreateAndAddPerson}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                    >
                      + Save & Add
                    </button>
                  </div>
                </div>

                {/* Custom Split Inputs if custom mode */}
                {splitMode === 'custom' && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-xs font-semibold text-slate-300 mb-1">Enter Individual Shares:</div>
                    {participants.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-300 font-medium">{p.name}</span>
                        <div className="flex items-center gap-1 w-32">
                          <span className="text-slate-500">{currencySymbol}</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={p.shareAmount || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...participants];
                              updated[idx].shareAmount = val;
                              setParticipants(updated);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary of Effects */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Real-Time Effect Preview:
                </div>
                <div>• Your Personal Expense will increase by: <strong className="text-white tabular-nums">{currencySymbol} {userShare}</strong></div>
                {payerId === 'user' ? (
                  <div>• Dues to collect from friends: <strong className="text-emerald-400 tabular-nums">{currencySymbol} {(parsedTotal - userShare).toFixed(2)}</strong></div>
                ) : (
                  <div>• Owe to pay to {people.find(p => p.id === payerId)?.name || 'Friend'}: <strong className="text-rose-400 tabular-nums">{currencySymbol} {userShare}</strong></div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all cursor-pointer active:scale-95"
                >
                  {editingExpense ? 'Save Changes' : 'Record Shared Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
