import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle2,
  Trash2,
  Cloud,
  CloudOff,
  Lock,
  KeyRound,
  Shield,
  ArrowRight,
  Info,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from 'lucide-react';
import { dbService } from '../services/db';
import { cloudSyncService, SyncStatus, CloudConfig } from '../services/supabase';
import {
  exportApplicationDataPackage,
  exportStudyLogsCSV,
  exportSyllabusCSV,
  exportMockTestsCSV,
  exportMistakesCSV,
  exportRevisionsCSV,
  validateDataPackage,
  ImportPreview,
} from '../services/exportImport';
import { ApplicationDataPackage, AppSettings } from '../types';

export const SettingsView: React.FC = () => {
  const [quota, setQuota] = useState<{ usageMB: number; quotaMB: number; percent: number } | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | undefined>();

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('unconfigured');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [configSuccess, setConfigSuccess] = useState<string>('');

  // 4-Digit PIN State
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // Inline Cloud Auth State (for connecting device)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authPin, setAuthPin] = useState<string>('');
  const [authConfirmPin, setAuthConfirmPin] = useState<string>('');
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Cloud Migration Wizard State
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    totalUploaded: number;
    error?: string;
  } | null>(null);

  // Import State
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [pendingPackage, setPendingPackage] = useState<ApplicationDataPackage | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const loadSettingsData = async () => {
    const est = await dbService.getStorageEstimate();
    setQuota(est);
    setHasPin(cloudSyncService.hasPin());

    // Calculate local record counts for migration preview
    try {
      const pkg = await dbService.exportFullPackage();
      const d = pkg.data;
      setLocalCounts({
        commitments: d.commitments?.length || 0,
        subjects: d.subjects?.length || 0,
        topics: d.topics?.length || 0,
        studyLogs: d.studyLogs?.length || 0,
        weeklyPlans: d.weeklyPlans?.length || 0,
        revisions: d.revisions?.length || 0,
        mockTests: d.mockTests?.length || 0,
        mistakes: d.mistakes?.length || 0,
        universityItems: d.universityItems?.length || 0,
        reviews: (d.dailyReviews?.length || 0) + (d.weeklyReviews?.length || 0),
      });
    } catch (e) {
      console.warn('Failed to calculate local counts:', e);
    }
  };

  useEffect(() => {
    loadSettingsData();
    dbService.onSaveStateChange = (state, msg) => {
      setSaveState(state);
      setSaveErrorMsg(msg);
    };

    const unsub = cloudSyncService.onStatusChange((status, msg) => {
      setSyncStatus(status);
      setSyncStatusMsg(msg || '');
      const user = cloudSyncService.getUser();
      setCurrentUserEmail(user?.email || '');
      setHasPin(cloudSyncService.hasPin());
    });

    const cfg = cloudSyncService.getConfig();
    if (cfg) {
      setSupabaseUrl(cfg.supabaseUrl);
      setSupabaseAnonKey(cfg.supabaseAnonKey);
    }

    return () => unsub();
  }, []);

  // Save Supabase credentials
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('Please provide both Project URL and Anon Public Key.');
      return;
    }
    cloudSyncService.saveConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    setConfigSuccess('Credentials saved! You can now sign in or create an account below.');
    setTimeout(() => {
      setConfigSuccess('');
      setIsConfigModalOpen(false);
    }, 1500);
  };

  // Change or Set 4-digit PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess('');

    if (!/^\d{4}$/.test(newPin)) {
      setPinChangeError('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinChangeError('New PIN confirmation does not match.');
      return;
    }

    try {
      setIsChangingPin(true);
      await cloudSyncService.setPin(newPin);
      setHasPin(true);
      setPinChangeSuccess('4-digit PIN updated successfully!');
      setTimeout(() => {
        setIsPinModalOpen(false);
        setNewPin('');
        setConfirmNewPin('');
        setPinChangeSuccess('');
      }, 1500);
    } catch (err: any) {
      setPinChangeError(err.message || 'Failed to update PIN.');
    } finally {
      setIsChangingPin(false);
    }
  };

  // Inline Auth Submit (Sign In or Create Account)
  const handleInlineAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cfg = cloudSyncService.getConfig();
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      setAuthError('Please configure your Supabase Project URL and Anon Key first.');
      setIsConfigModalOpen(true);
      return;
    }

    if (authMode === 'signup') {
      if (!authPin || authPin.length !== 4) {
        setAuthError('Please set a 4-digit numeric PIN.');
        return;
      }
      if (authPin !== authConfirmPin) {
        setAuthError('PIN confirmation does not match.');
        return;
      }
    }

    try {
      setAuthLoading(true);
      if (authMode === 'signup') {
        await cloudSyncService.signUp(authEmail, authPassword, authPin);
        setHasPin(true);
        setAuthSuccess('Account created and 4-digit PIN set! Cloud sync is now active.');
      } else {
        await cloudSyncService.signIn(authEmail, authPassword);
        setAuthSuccess('Signed in successfully! Device linked to cloud.');
      }
      loadSettingsData();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Run Cloud Migration
  const handleRunMigration = async () => {
    if (!cloudSyncService.isConnected()) {
      alert('Please sign in to Supabase first before uploading local records.');
      return;
    }

    try {
      setIsMigrating(true);
      const existingCloudCount = await cloudSyncService.getCloudRecordCount();

      let confirmMsg = `Upload and merge your ${totalLocalRecords} local records with your private Supabase cloud database?`;
      if (existingCloudCount > 0) {
        confirmMsg = `Your cloud database contains ${existingCloudCount} records.\n\nLocal records will be safely merged with cloud records without overwriting.\n\nProceed with cloud sync?`;
      }

      const confirmed = window.confirm(confirmMsg);
      if (!confirmed) {
        setIsMigrating(false);
        return;
      }

      const result = await cloudSyncService.migrateLocalDataToCloud('merge');
      setMigrationResult(result);
      if (result.success) {
        loadSettingsData();
      }
    } catch (err: any) {
      setMigrationResult({ success: false, totalUploaded: 0, error: err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle JSON File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const preview = validateDataPackage(raw);
        setImportPreview(preview);
        if (preview.valid) {
          setPendingPackage(raw as ApplicationDataPackage);
        } else {
          setPendingPackage(null);
        }
      } catch {
        setImportPreview({
          valid: false,
          errors: ['Failed to parse file: Selected file is not valid JSON.'],
          version: 0,
          exportedAt: '',
          counts: {
            commitments: 0,
            subjects: 0,
            topics: 0,
            studyLogs: 0,
            weeklyPlans: 0,
            revisions: 0,
            mockTests: 0,
            mistakes: 0,
            universityItems: 0,
          },
        });
        setPendingPackage(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Import
  const handleConfirmImport = async () => {
    if (!pendingPackage) return;

    try {
      setIsImporting(true);
      if (importMode === 'replace') {
        await exportApplicationDataPackage();
      }

      await dbService.importFullPackage(pendingPackage, importMode);
      alert('Data package imported successfully! Page will now refresh to load updated records.');
      window.location.reload();
    } catch (err: unknown) {
      console.error('Import failed:', err);
      const msg = err instanceof Error ? err.message : 'Import failed';
      alert(`Import error: ${msg}`);
    } finally {
      setIsImporting(false);
    }
  };

  const totalLocalRecords = Object.values(localCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security, Cloud Sync &amp; Data</h1>
          <p className="text-xs text-slate-500 mt-1">
            4-digit PIN protection • Cross-device synchronization • Safe local migration • Zero privileged secrets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPin && (
            <button
              onClick={() => cloudSyncService.lockApp()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock with PIN</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Dedicated 4-Digit PIN Security Card (Always Accessible) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">4-Digit Numeric PIN Lock</h3>
                {hasPin ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active on this Device</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Not Set Up Yet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Convenient device-level lock so you never need to type your master email and password daily
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{hasPin ? 'Change 4-Digit PIN' : 'Set 4-Digit PIN Now'}</span>
            </button>
            {hasPin && (
              <button
                onClick={() => cloudSyncService.lockApp()}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1"
                title="Lock application immediately"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Now</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The 4-digit PIN uses native Web Crypto salted SHA-256 hashing. Once configured, simply enter your 4 digits to access your study logs and syllabus on laptop or iPhone without entering full credentials.
        </p>
      </div>

      {/* 2. Cloud Synchronization & Supabase Connection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Cloud Synchronization (Supabase)</h3>
                {syncStatus === 'synced' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Synchronized</span>
                  </span>
                )}
                {syncStatus === 'syncing' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                )}
                {syncStatus === 'paused' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Database Paused</span>
                  </span>
                )}
                {(syncStatus === 'unconfigured' || syncStatus === 'unauthenticated') && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {currentUserEmail ? 'Signed in' : 'Local Only — Needs Account'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUserEmail ? `Connected as ${currentUserEmail}` : 'Connect your Supabase project to synchronize across laptop and iPhone'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              Supabase Project API
            </button>
            {cloudSyncService.isConnected() && (
              <>
                <button
                  onClick={() => cloudSyncService.pullAllFromCloud()}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
                <button
                  onClick={async () => {
                    await cloudSyncService.signOut();
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* INLINE AUTH FORM: Shown when user is not connected yet */}
        {!cloudSyncService.isConnected() && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>One-Time Cloud Account &amp; Device Pairing</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Create your private account or sign in to link this device. Row-Level Security ensures only you can access your data.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    authMode === 'signup' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account &amp; Set PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    authMode === 'signin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In Existing
                </button>
              </div>
            </div>

            <form onSubmit={handleInlineAuthSubmit} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Account Email</label>
                  <input
                    type="email"
                    required
                    placeholder="your-email@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Master Password</label>
                  <div className="relative">
                    <input
                      type={showAuthPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none pr-8 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showAuthPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Choose 4-Digit Numeric PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      placeholder="1234"
                      value={authPin}
                      onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-center font-bold tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Used for normal daily entry on this device</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Confirm 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      placeholder="1234"
                      value={authConfirmPin}
                      onChange={(e) => setAuthConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-center font-bold tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {authError && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium space-y-2">
                  <div>{authError}</div>
                  {authError.toLowerCase().includes('email not confirmed') && (
                    <div className="text-[11px] font-normal text-rose-800 pt-1 border-t border-rose-200">
                      <strong>To fix instantly:</strong> In Supabase Dashboard &rarr; <strong>Authentication</strong> &rarr; <strong>Users</strong>, scroll right and click the <code>...</code> menu next to your email &rarr; <strong>Auto-confirm user</strong>.
                    </div>
                  )}
                  {authMode === 'signup' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setAuthError('');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Account already created? Switch to Sign In Existing</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {authSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{authSuccess}</span>
                </p>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {authMode === 'signup' ? (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account &amp; Link PIN</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In &amp; Connect Device</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-slate-400">
                  Password is sent securely over HTTPS directly to Supabase and is never logged or exposed.
                </span>
              </div>
            </form>
          </div>
        )}

        {/* Free-Tier 7-Day Inactivity Warning & Recovery Guide */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Supabase Free-Tier 7-Day Pausing &amp; Recovery Notice</span>
          </div>
          <p className="leading-relaxed">
            Supabase automatically pauses projects on the <strong>Free Plan</strong> if there are <strong>7 consecutive days</strong> of no database activity.
            When paused, your data is <em>safely preserved</em>, but cloud sync stops until you restore the project.
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200 font-mono text-[11px] space-y-1">
            <div className="font-sans font-bold text-amber-900 mb-1">To Unpause in 1 Click:</div>
            <div>1. Visit <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 underline">supabase.com/dashboard</a></div>
            <div>2. Click on your project (&quot;august-exam-tracker&quot;)</div>
            <div>3. Click the green <strong>&quot;Restore project&quot;</strong> button. (Compute resumes in ~20 seconds).</div>
          </div>
          <p className="text-[11px] text-amber-900/80">
            <em>Local protection:</em> While paused, this tracker continues working seamlessly using your local IndexedDB records. Once unpaused, sync resumes automatically.
          </p>
        </div>

        {/* Cloud Migration Wizard Section (Visible when connected) */}
        {cloudSyncService.isConnected() && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Migrate Existing Local Records to Cloud Database</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Upload all {totalLocalRecords} records currently in your local IndexedDB to your private Supabase database.
                </p>
              </div>
              <button
                onClick={handleRunMigration}
                disabled={isMigrating || totalLocalRecords === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Merge to Cloud</span>
                  </>
                )}
              </button>
            </div>

            {/* Local Records Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Study Sessions</span>
                <span className="font-bold text-slate-800 text-sm">{localCounts.studyLogs || 0}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Syllabus Topics</span>
                <span className="font-bold text-slate-800 text-sm">{localCounts.topics || 0}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Revisions</span>
                <span className="font-bold text-slate-800 text-sm">{localCounts.revisions || 0}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Mock Tests</span>
                <span className="font-bold text-slate-800 text-sm">{localCounts.mockTests || 0}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Weekly Plans</span>
                <span className="font-bold text-slate-800 text-sm">{localCounts.weeklyPlans || 0}</span>
              </div>
            </div>

            {migrationResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  migrationResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {migrationResult.success ? (
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Successfully uploaded {migrationResult.totalUploaded} records to Supabase! Your devices are now in sync.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Migration issue: {migrationResult.error}</span>
                    </div>
                    {migrationResult.error?.includes('permission denied') && (
                      <div className="text-[11px] text-rose-700 pl-5 space-y-1">
                        <p>PostgreSQL requires table permissions for authenticated users. In your Supabase Dashboard &rarr; SQL Editor, run:</p>
                        <code className="block p-2 bg-rose-100 rounded text-rose-950 font-mono text-[10px]">
                          GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
                        </code>
                        <p>After running that query, click &quot;Upload &amp; Merge to Cloud&quot; again.</p>
                      </div>
                    )}
                    {migrationResult.error?.includes('row-level security') && (
                      <div className="text-[11px] text-rose-700 pl-5 space-y-1">
                        <p>Your session token is unauthenticated or expired (usually because the user account was not confirmed yet). To fix:</p>
                        <ol className="list-decimal pl-4 space-y-0.5">
                          <li>Auto-confirm your user in Supabase Dashboard &rarr; Authentication &rarr; Users (click ... &rarr; Auto-confirm user).</li>
                          <li>Click &quot;Sign Out&quot; above and sign in under &quot;Sign In Existing&quot; to establish an active session token.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Storage Quota Card */}
      {quota && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-2">
            <span className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>Browser Storage Quota</span>
            </span>
            <span className="font-mono text-slate-500">
              {quota.usageMB} MB used of {quota.quotaMB} MB ({quota.percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                quota.percent > 80 ? 'bg-rose-500' : quota.percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(quota.percent, 1)}%` }}
            />
          </div>
        </div>
      )}

      {/* 2-Column: Full JSON Portability & Structured CSV Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Full JSON Portability */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Complete JSON Data Package</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Exports every commitment, syllabus topic, study log, weekly plan, revision cycle, mock test, and VMOU
            academic item into a single validated portable JSON backup.
          </p>

          <button
            onClick={() => exportApplicationDataPackage()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Complete JSON Backup</span>
          </button>

          {/* Import Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">Restore or Move Data from Another Device</h4>
            </div>

            <label className="block">
              <span className="sr-only">Choose JSON file</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </label>

            {/* Import Preview Modal / Card */}
            {importPreview && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-3 ${
                  importPreview.valid ? 'bg-indigo-50/50 border-indigo-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                {importPreview.valid ? (
                  <>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Valid Package Verified (Exported: {importPreview.exportedAt.slice(0, 10)})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
                      <div>• {importPreview.counts.studyLogs} Study Sessions</div>
                      <div>• {importPreview.counts.topics} Syllabus Topics</div>
                      <div>• {importPreview.counts.weeklyPlans} Weekly Plans</div>
                      <div>• {importPreview.counts.revisions} Revisions</div>
                      <div>• {importPreview.counts.mockTests} Mock Tests</div>
                      <div>• {importPreview.counts.universityItems} University Items</div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block font-medium text-slate-700">Import Mode:</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                            className="text-indigo-600"
                          />
                          <span>Replace all existing (Auto-saves backup first)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="text-indigo-600"
                          />
                          <span>Merge with existing</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmImport}
                      disabled={isImporting}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isImporting ? 'Restoring Data...' : 'Confirm & Apply Data Package'}
                    </button>
                  </>
                ) : (
                  <div className="text-rose-700 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Validation Failed</span>
                    </p>
                    {importPreview.errors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Structured CSV Downloads */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Structured CSV Reports</h3>
          </div>
          <p className="text-xs text-slate-600">
            Download standard spreadsheet files for external analysis in Excel, Google Sheets, or Numbers:
          </p>

          <div className="space-y-2">
            {[
              { label: 'Study Logs CSV', fn: exportStudyLogsCSV, desc: 'Every focused minute, date, and activity' },
              { label: 'Syllabus & Progress CSV', fn: exportSyllabusCSV, desc: 'Exam-specific 3-dimension status' },
              { label: 'Mock Tests CSV', fn: exportMockTestsCSV, desc: 'Scores, accuracy, and question metrics' },
              { label: 'Mistakes & Diagnostics CSV', fn: exportMistakesCSV, desc: 'Root cause errors & takeaways' },
              { label: 'Revisions Schedule CSV', fn: exportRevisionsCSV, desc: 'Spaced intervals & completion' },
            ].map((csv) => (
              <div
                key={csv.label}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{csv.label}</h4>
                  <p className="text-[10px] text-slate-400">{csv.desc}</p>
                </div>
                <button
                  onClick={() => csv.fn()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Eligibility Reference Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Candidate Eligibility Verification Reference</h3>
        <p className="text-xs text-slate-600">
          Candidate Date of Birth: <strong>31 October 1996</strong>. Official eligibility rules must always be checked
          against the specific notification cutoff date:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 space-y-1">
            <span className="font-semibold text-slate-900">IBPS RRB PO (Officer Scale I)</span>
            <p className="text-slate-600 text-[11px]">
              Typically age limit: 21–30 years as of notification cutoff date. Refer to official notification for
              applicable relaxations.
            </p>
            <a
              href="https://www.ibps.in"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Official IBPS Portal</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 space-y-1">
            <span className="font-semibold text-slate-900">UPSC APFC</span>
            <p className="text-slate-600 text-[11px]">
              Typically maximum age: 35 years as of notification cutoff date, with standard reservation relaxations.
            </p>
            <a
              href="https://upsc.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Official UPSC Portal</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Change PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {hasPin ? 'Change 4-Digit PIN' : 'Set Up 4-Digit PIN'}
                </h3>
                <p className="text-xs text-slate-500">Protects tracker access on this device</p>
              </div>
            </div>

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {hasPin ? 'New 4-Digit PIN' : 'Enter 4-Digit PIN'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest font-bold text-lg rounded-xl border border-slate-300 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  placeholder="••••"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest font-bold text-lg rounded-xl border border-slate-300 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {pinChangeError && <p className="text-xs text-rose-600 font-medium">{pinChangeError}</p>}
              {pinChangeSuccess && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{pinChangeSuccess}</span>
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isChangingPin}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isChangingPin ? 'Saving...' : 'Save PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Connection Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Supabase Project API Configuration</h3>
                <p className="text-xs text-slate-500">Public credentials safe to keep in browser storage</p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Supabase Project URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Supabase Anon Public Key</label>
                <input
                  type="text"
                  required
                  placeholder="eyJhbGciOi..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {configSuccess && (
                <p className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{configSuccess}</span>
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Save API Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
