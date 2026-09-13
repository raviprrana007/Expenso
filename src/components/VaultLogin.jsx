import React, { useState, useRef } from 'react';
import {
  Shield,
  KeyRound,
  FolderPlus,
  UploadCloud,
  Sparkles,
  User,
  Briefcase,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Coins,
  HardDriveDownload,
  Info,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { CURRENCIES, PROFESSIONS } from '../types/constants';

export default function VaultLogin({
  onNewVault,
  onImportVault,
  onQuickDemo
}) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'existing'

  // New Vault Form State
  const [userName, setUserName] = useState('');
  const [profession, setProfession] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(10000);
  const [currency, setCurrency] = useState('INR');
  const [loadDemoData, setLoadDemoData] = useState(false);
  const [newVaultError, setNewVaultError] = useState('');

  // Existing Vault Form State
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedBackupData, setParsedBackupData] = useState(null);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // Helper to compress and convert profile picture to compact base64
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNewVaultError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setProfilePic(compressedBase64);
        setNewVaultError('');
      };
      img.onerror = () => {
        setNewVaultError('Failed to process image. Please try another image.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick select profession helper
  const handleSelectProfession = (prof) => {
    setProfession(prof);
  };

  // Submit New Vault
  const handleCreateNewVault = (e) => {
    e.preventDefault();
    setNewVaultError('');

    if (!userName.trim()) {
      setNewVaultError('Please enter your full name or nickname.');
      return;
    }

    const currObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    onNewVault({
      userName: userName.trim(),
      profession: profession.trim() || 'Member',
      profilePic: profilePic || '',
      defaultMonthlyLimit: Number(monthlyLimit) || 10000,
      currency: currObj.code,
      currencySymbol: currObj.symbol,
      loadDemoData
    });
  };

  // Process File Object
  const processFile = (file) => {
    setImportError('');
    setSelectedFile(null);
    setParsedBackupData(null);

    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportError('Please provide a valid Expenso backup .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        if (typeof json !== 'object' || json === null) {
          throw new Error('Invalid JSON structure. Root must be a JSON object.');
        }

        const txCount = Array.isArray(json.transactions) ? json.transactions.length : 0;
        const peopleCount = Array.isArray(json.people) ? json.people.length : 0;
        const duesCount = Array.isArray(json.owesDues) ? json.owesDues.length : 0;
        const ownerName = json.settings?.userName || 'Expenso User';
        const ownerProfession = json.settings?.profession || 'Member';
        const ownerProfilePic = json.settings?.profilePic || '';
        const exportDate = json.exportDate ? new Date(json.exportDate).toLocaleDateString() : 'Recent';

        setSelectedFile(file);
        setParsedBackupData({
          rawJson: json,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          txCount,
          peopleCount,
          duesCount,
          ownerName,
          ownerProfession,
          ownerProfilePic,
          exportDate
        });
      } catch (err) {
        setImportError(`Invalid file format: ${err.message}. Please select an intact Expenso .json export.`);
      }
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Submit Import
  const handleUnlockExistingVault = () => {
    if (!parsedBackupData?.rawJson) {
      setImportError('Please select a valid Expenso backup file first.');
      return;
    }

    try {
      setIsImporting(true);
      onImportVault(parsedBackupData.rawJson);
    } catch (err) {
      setIsImporting(false);
      setImportError(`Import failed: ${err.message}`);
    }
  };

  const currentCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₹';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-indigo-500/40">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl shadow-indigo-500/25 mb-4 border border-indigo-400/30 overflow-hidden group hover:scale-105 transition-transform">
            <img src="/app-icon.png" alt="Expenso" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              EXPENSO VAULT
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              v1.0
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your private, offline-first expense manager & group split ledger. Choose how you want to unlock your vault.
          </p>
        </div>

        {/* Tab Selection Segmented Control */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab('new');
              setNewVaultError('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'new'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Vault</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              setImportError('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'existing'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Access Existing Vault</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800/80 relative">
          {/* TAB 1: NEW VAULT SETUP */}
          {activeTab === 'new' && (
            <form onSubmit={handleCreateNewVault} className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Setup Your Profile & Vault</h2>
                  <p className="text-xs text-slate-400">Configure your personal details and monthly budget limits.</p>
                </div>
              </div>

              {newVaultError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{newVaultError}</span>
                </div>
              )}

              {/* Profile Photo Upload (Optional) */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="relative group flex-shrink-0">
                  <div
                    onClick={() => profilePicInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 bg-slate-800/80 flex items-center justify-center cursor-pointer transition-all shadow-md group-hover:scale-105"
                    title="Click to upload profile photo"
                  >
                    {profilePic ? (
                      <img src={profilePic} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-300">
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-semibold">Add Photo</span>
                      </div>
                    )}
                  </div>
                  {profilePic && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfilePic('');
                      }}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-transform hover:scale-110"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Profile Photo (DP)</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Shown in the main header & ledger. Can be updated anytime in settings.
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => profilePicInputRef.current?.click()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{profilePic ? 'Change Photo' : 'Choose Image'}</span>
                    </button>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic('')}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={profilePicInputRef}
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* User Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Your Full Name / Nickname <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Ravi Rana, Alex, Sarah"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>

              {/* Profession with quick suggestions */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span>Profession / Role</span>
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Student, Software Engineer, Designer"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium mb-2.5"
                />

                {/* Quick Selection Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Suggestions:</span>
                  {PROFESSIONS.slice(0, 6).map((prof) => (
                    <button
                      type="button"
                      key={prof}
                      onClick={() => handleSelectProfession(prof)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        profession === prof
                          ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-indigo-400/50 hover:text-white'
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Spending Limit & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Monthly Spending Limit</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Currency</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Demo Starter Data Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setLoadDemoData(!loadDemoData)}>
                <input
                  type="checkbox"
                  id="loadDemo"
                  checked={loadDemoData}
                  onChange={(e) => setLoadDemoData(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="loadDemo" className="text-xs cursor-pointer select-none">
                  <span className="font-semibold text-white block">Pre-load realistic demo expenses & contacts</span>
                  <span className="text-slate-400">Great for first-time walkthrough. You can reset or clear anytime in Settings.</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <span>Initialize & Enter Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: EXISTING VAULT BACKUP RESTORE */}
          {activeTab === 'existing' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <HardDriveDownload className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Import Expenso Backup File</h2>
                  <p className="text-xs text-slate-400">Restore your previously exported JSON backup to unlock your vault.</p>
                </div>
              </div>

              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Drag and Drop Zone */}
              {!parsedBackupData && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                      : 'border-slate-700/80 hover:border-indigo-400/60 bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      Drag & Drop your <span className="text-indigo-400 font-mono">Expenso_Backup_*.json</span> here
                    </p>
                    <p className="text-xs text-slate-400">
                      or click to browse from your computer / phone
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-300 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60">
                    Supports Expenso v1.0 JSON Backups
                  </span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Parsed File Preview Card */}
              {parsedBackupData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {parsedBackupData.ownerProfilePic ? (
                          <img
                            src={parsedBackupData.ownerProfilePic}
                            alt={parsedBackupData.ownerName}
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
                          />
                        ) : (
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-bold text-white block truncate max-w-[280px]">
                            {parsedBackupData.fileName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {parsedBackupData.fileSize} • Exported on {parsedBackupData.exportDate}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setParsedBackupData(null);
                        }}
                        className="text-xs text-slate-400 hover:text-rose-400 underline font-medium cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner</span>
                        <span className="text-xs font-bold text-indigo-300 truncate block">
                          {parsedBackupData.ownerName}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Expenses</span>
                        <span className="text-xs font-bold text-white block tabular-nums">
                          {parsedBackupData.txCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Owes / Dues</span>
                        <span className="text-xs font-bold text-white block tabular-nums">
                          {parsedBackupData.duesCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacts</span>
                        <span className="text-xs font-bold text-white block tabular-nums">
                          {parsedBackupData.peopleCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unlock Button */}
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleUnlockExistingVault}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isImporting ? 'Restoring Vault...' : 'Unlock & Open Vault'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Demo Option & Privacy Callout */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 px-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>100% Offline & Private (Local-First Storage)</span>
          </div>

          <button
            type="button"
            onClick={onQuickDemo}
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 font-semibold hover:underline cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Launch Quick Student Demo Vault</span>
          </button>
        </div>
      </div>
    </div>
  );
}
