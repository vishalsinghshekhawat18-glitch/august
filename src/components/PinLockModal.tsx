// 4-Digit Numeric PIN Entry & Cloud Authentication Screen
// Protects personal records while eliminating daily email/password friction

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  KeyRound,
  Cloud,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Unlock,
  Info,
  RotateCcw,
} from 'lucide-react';
import { cloudSyncService, SyncStatus } from '../services/supabase';

interface PinLockModalProps {
  isOpen: boolean;
  onUnlocked: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ isOpen, onUnlocked }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState<boolean>(false);

  // Fallback / One-time auth states
  const [showAuthFallback, setShowAuthFallback] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'config'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [initialPin, setInitialPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Supabase connection config
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [configSuccess, setConfigSuccess] = useState<string>('');

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('unconfigured');

  useEffect(() => {
    const unsub = cloudSyncService.onStatusChange((status) => {
      setSyncStatus(status);
    });
    const cfg = cloudSyncService.getConfig();
    if (cfg) {
      setSupabaseUrl(cfg.supabaseUrl);
      setSupabaseAnonKey(cfg.supabaseAnonKey);
    }
    return () => unsub();
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  // Handle PIN submission
  const handleVerifyPin = useCallback(async (pinToVerify: string) => {
    if (pinToVerify.length !== 4) return;
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isValid = await cloudSyncService.verifyAndUnlock(pinToVerify);
      if (isValid) {
        setPin('');
        onUnlocked();
      } else {
        triggerShake();
        setErrorMsg('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (e: any) {
      triggerShake();
      setErrorMsg(e.message || 'Verification error.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  }, [onUnlocked, triggerShake]);

  // Handle digit press
  const handleDigit = useCallback((digit: string) => {
    if (isVerifying) return;
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      if (next.length === 4) {
        setTimeout(() => handleVerifyPin(next), 50);
      }
      return next;
    });
  }, [isVerifying, handleVerifyPin]);

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  // Physical keyboard listeners
  useEffect(() => {
    if (!isOpen || showAuthFallback) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showAuthFallback, handleDigit]);

  // Emergency Reset 4-digit PIN for local device
  const handleConfirmResetPin = async () => {
    try {
      setIsVerifying(true);
      await cloudSyncService.clearPin();
      cloudSyncService.unlockLocally();
      setIsConfirmingReset(false);
      onUnlocked();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle master password login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!initialPin || initialPin.length !== 4) {
          throw new Error('Please enter a 4-digit numeric PIN.');
        }
        if (initialPin !== confirmPin) {
          throw new Error('PIN confirmation does not match.');
        }
        await cloudSyncService.signUp(email, password, initialPin);
      } else {
        const cfg = cloudSyncService.getConfig();
        if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
          // In local mode without Supabase, entering password directly unlocks local tracker
          cloudSyncService.unlockLocally();
          setShowAuthFallback(false);
          onUnlocked();
          return;
        }
        await cloudSyncService.signIn(email, password);
      }
      cloudSyncService.unlockLocally();
      setShowAuthFallback(false);
      onUnlocked();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle project config save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setAuthError('Both Project URL and Anon Public Key are required.');
      return;
    }
    cloudSyncService.saveConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    setConfigSuccess('Supabase credentials saved successfully.');
    setTimeout(() => {
      setConfigSuccess('');
      setAuthMode('signin');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {!showAuthFallback ? (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-inner">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Personal Exam Tracker</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your 4-digit PIN to access your study records
              </p>
            </div>

            {/* Reset PIN Confirmation Overlay / Card */}
            {isConfirmingReset ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center space-y-3 mb-6 animate-in fade-in zoom-in-95 duration-150">
                <div className="inline-flex p-2 bg-rose-100 text-rose-700 rounded-full">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-900">Reset 4-Digit Device PIN?</h4>
                  <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                    This will immediately clear the PIN lock on this device and grant access to your workspace. All your study logs, targets, and syllabus remain 100% safe.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmResetPin}
                    disabled={isVerifying}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
                  >
                    Confirm &amp; Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(false)}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 rounded-lg text-xs border border-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* PIN Indicators */}
                <div className="flex justify-center items-center gap-4 mb-6">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                          filled
                            ? 'border-indigo-600 bg-indigo-600 scale-110 shadow-sm shadow-indigo-300'
                            : 'border-slate-300 bg-slate-100'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="text-center text-xs font-medium text-rose-600 mb-4 bg-rose-50 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleDigit(digit)}
                      disabled={isVerifying}
                      className="h-14 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-xl font-semibold text-slate-800 transition active:scale-95 shadow-sm border border-slate-200/60"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isVerifying}
                    className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-500 transition active:scale-95 border border-slate-200/60"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit('0')}
                    disabled={isVerifying}
                    className="h-14 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-xl font-semibold text-slate-800 transition active:scale-95 shadow-sm border border-slate-200/60"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    disabled={isVerifying}
                    className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-600 transition active:scale-95 border border-slate-200/60"
                  >
                    ⌫
                  </button>
                </div>
              </>
            )}

            {/* Footer options */}
            <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthFallback(true);
                    setAuthMode('signin');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium py-1"
                >
                  Sign in with Master Password
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(true)}
                  className="text-rose-600 hover:text-rose-700 font-medium py-1"
                >
                  Forgot PIN? Reset PIN
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    cloudSyncService.unlockLocally();
                    onUnlocked();
                  }}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium text-[11px]"
                  title="Unlock tracker directly on this local device"
                >
                  <Unlock className="h-3 w-3 text-emerald-600" />
                  <span>Instant Local Access</span>
                </button>

                {syncStatus === 'unconfigured' && (
                  <>
                    <span className="text-slate-200">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthFallback(true);
                        setAuthMode('config');
                      }}
                      className="text-slate-400 hover:text-slate-600 flex items-center gap-1 font-normal text-[11px]"
                    >
                      <Cloud className="h-3 w-3 text-slate-400" />
                      Supabase Setup
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Cloud Account & Recovery Mode */
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {authMode === 'config'
                    ? 'Supabase Connection'
                    : authMode === 'signup'
                    ? 'Create Cloud Account'
                    : 'Sign In with Master Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthFallback(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Back to PIN
              </button>
            </div>

            {/* Config Mode */}
            {authMode === 'config' && (
              <form onSubmit={handleSaveConfig} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your Supabase project credentials. These are safe to store in your browser.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="eyJhbGciOi..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                {configSuccess && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {configSuccess}
                  </p>
                )}
                {authError && <p className="text-xs text-rose-600">{authError}</p>}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Save Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Sign In / Sign Up Mode */}
            {authMode !== 'config' && (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                    }}
                    className={`flex-1 rounded-md py-1.5 transition ${
                      authMode === 'signin'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError('');
                    }}
                    className={`flex-1 rounded-md py-1.5 transition ${
                      authMode === 'signup'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Account
                  </button>
                </div>

                {syncStatus === 'unconfigured' && authMode === 'signin' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Local Device Mode</span>
                        <span className="text-[11px] text-amber-800 leading-snug">
                          Supabase cloud is not configured on this device. You can unlock your study workspace directly without entering credentials.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        cloudSyncService.unlockLocally();
                        setShowAuthFallback(false);
                        onUnlocked();
                      }}
                      className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
                    >
                      Unlock Local Tracker Directly
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Set 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="\d{4}"
                        required
                        placeholder="1234"
                        value={initialPin}
                        onChange={(e) => setInitialPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 tracking-widest focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="\d{4}"
                        required
                        placeholder="1234"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 tracking-widest focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {authLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {authMode === 'signup' ? 'Create Account & Unlock' : 'Authenticate & Unlock'}
                </button>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode('config')}
                      className="text-slate-500 hover:text-indigo-600 font-medium text-[11px]"
                    >
                      Configure Supabase
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        cloudSyncService.unlockLocally();
                        setShowAuthFallback(false);
                        onUnlocked();
                      }}
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span>Unlock Locally</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthFallback(false);
                      setIsConfirmingReset(true);
                    }}
                    className="text-rose-600 hover:text-rose-700 text-center font-medium text-[11px]"
                  >
                    Forgot both? Reset 4-digit PIN on this device
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
