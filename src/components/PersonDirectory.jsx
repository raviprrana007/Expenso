import React, { useState } from 'react';
import { 
  Contact, 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { BudgetCalculator } from '../services/budgetCalculator';

export default function PersonDirectory({
  people,
  owesDues,
  settings,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson
}) {
  const currencySymbol = settings.currencySymbol || '₹';
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [phone, setPhone] = useState('');
  const [idError, setIdError] = useState('');

  // Net summary
  const summary = BudgetCalculator.calculateOwesDuesSummary(owesDues, people);

  const openAddModal = () => {
    setEditingPerson(null);
    setName('');
    const suggested = StorageService.generateUniquePersonId();
    setCustomId(suggested);
    setPhone('');
    setIdError('');
    setIsModalOpen(true);
  };

  const openEditModal = (person) => {
    setEditingPerson(person);
    setName(person.name || '');
    setCustomId(String(person.id));
    setPhone(person.phone || '');
    setIdError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleIdChange = (val) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 4);
    setCustomId(clean);
    if (clean.length === 4) {
      if (!editingPerson && !StorageService.isPersonIdAvailable(clean)) {
        setIdError(`ID #${clean} is already assigned to another person.`);
      } else {
        setIdError('');
      }
    } else {
      setIdError('Person ID must be exactly 4 digits (e.g. 1042).');
    }
  };

  const handleRegenerateId = () => {
    const newId = StorageService.generateUniquePersonId();
    setCustomId(newId);
    setIdError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter the person\'s name.');
      return;
    }

    if (!editingPerson) {
      if (!customId || customId.length !== 4) {
        alert('Please provide a valid 4-digit ID.');
        return;
      }
      if (!StorageService.isPersonIdAvailable(customId)) {
        alert(`ID #${customId} is already in use. Please choose another 4-digit ID.`);
        return;
      }

      onAddPerson({
        id: customId,
        name: name.trim(),
        phone: phone.trim(),
        createdAt: new Date().toISOString()
      });
    } else {
      // Editing person (Note: Rule 11 specifies ID cannot be edited after assignment!)
      onUpdatePerson({
        ...editingPerson,
        name: name.trim(),
        phone: phone.trim()
      });
    }

    closeModal();
  };

  const filteredPeople = people.filter(p => {
    const matchName = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchId = String(p.id).includes(searchTerm);
    const matchPhone = p.phone?.includes(searchTerm);
    return matchName || matchId || matchPhone;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Contact className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">People & 4-Digit Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every person has an immutable unique 4-digit identifier to prevent confusion and duplicate accounts.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Person
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, 4-digit ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Total Registered: <strong className="text-white">{people.length} People</strong>
        </div>
      </div>

      {/* People Grid */}
      {filteredPeople.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel">
          <Sparkles className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No people found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add friends, roommates, or classmates with unique 4-digit IDs to quickly split expenses and track dues.
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Person Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map(person => {
            const personNet = summary.personNetList.find(p => String(p.id) === String(person.id));
            const netVal = personNet ? personNet.net : 0;
            const hasDue = netVal > 0;
            const hasOwe = netVal < 0;

            return (
              <div
                key={person.id}
                className="p-5 rounded-2xl glass-panel-interactive border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top row: Avatar + Name + 4-digit ID pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-bold text-white text-base">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{person.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            #{person.id}
                          </span>
                          <span className="text-[10px] text-slate-500">Unique ID</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(person)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${person.name} (#${person.id}) from directory?`)) {
                            onDeletePerson(person.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Delete Person"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Phone & Contact */}
                  {person.phone && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{person.phone}</span>
                    </div>
                  )}
                </div>

                {/* Net Financial Position Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                      Net Balance
                    </span>
                    <span className={`text-sm font-black ${
                      hasDue ? 'text-emerald-400' : hasOwe ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {hasDue ? `+${currencySymbol}${netVal.toLocaleString()}` : hasOwe ? `-${currencySymbol}${Math.abs(netVal).toLocaleString()}` : 'Settled (₹0)'}
                    </span>
                  </div>

                  {person.phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${person.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="WhatsApp Contact"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Person Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-modal p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Contact className="w-5 h-5 text-indigo-400" />
                {editingPerson ? 'Edit Person' : 'Register New Person'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Unique 4-Digit ID (Rule 11) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Unique 4-Digit ID * {editingPerson && '(Immutable)'}
                  </label>
                  {!editingPerson && (
                    <button
                      type="button"
                      onClick={handleRegenerateId}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Suggest Another ID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength="4"
                  disabled={!!editingPerson}
                  placeholder="e.g. 1042"
                  value={customId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white font-mono text-base font-bold tracking-widest text-center focus:outline-none transition-colors ${
                    editingPerson 
                      ? 'border-slate-800 bg-slate-950 text-slate-400 cursor-not-allowed'
                      : idError 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-800 focus:border-indigo-500'
                  }`}
                />
                {idError ? (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {idError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {editingPerson ? 'Rule 11: ID cannot be modified after creation.' : 'Rule 11: Unique 4-digit identifier for suggestions & tracking.'}
                  </p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 (For WhatsApp reminders)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingPerson && (customId.length !== 4 || !!idError)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg transition-all"
                >
                  {editingPerson ? 'Save Changes' : 'Create Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
