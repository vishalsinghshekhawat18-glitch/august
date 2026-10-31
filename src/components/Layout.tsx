import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  RotateCw,
  Award,
  GraduationCap,
  FileCheck2,
  BarChart2,
  Settings,
  Plus,
  Clock,
  Menu,
  X,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { dbService } from '../services/db';
import { getTodayDateString } from '../services/dateUtils';

interface LayoutProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  onOpenQuickAdd: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'logs', label: 'Study Logs', icon: Clock },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'revisions', label: 'Revisions', icon: RotateCw },
  { id: 'mocks', label: 'Mock Tests', icon: Award },
  { id: 'university', label: 'VMOU Kota', icon: GraduationCap },
  { id: 'reviews', label: 'Reviews', icon: FileCheck2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings & Data', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({
  activeView,
  onNavigate,
  onOpenQuickAdd,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());

  useEffect(() => {
    dbService.onSaveStateChange = (state, msg) => {
      setSaveState(state);
      setErrorMsg(msg);
    };
    setTodayStr(getTodayDateString());
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
            AU
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 tracking-tight block leading-tight">August</span>
            <span className="text-[10px] text-slate-400 font-medium">Personal Exam Tracker</span>
          </div>
        </div>

        {/* Center / Right Status & Quick Add */}
        <div className="flex items-center gap-2.5">
          {/* Local Device Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-medium border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Local Storage • No Login Needed</span>
            </span>
          </div>

          {/* Quick-Add Study Log */}
          <button
            onClick={onOpenQuickAdd}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            title="Log focused study session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Quick Log</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 gap-6">
        {/* Left Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1 select-none">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
            Study Workspace
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mt-auto pt-6 px-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${saveState === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span className="capitalize">{saveState === 'saved' ? 'Storage active' : saveState}</span>
            </div>
            {errorMsg && <div className="text-[10px] text-rose-500 font-mono">{errorMsg}</div>}
            <div className="text-[10px] text-slate-400">Date: {todayStr}</div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    AU
                  </div>
                  <span className="font-bold text-sm text-slate-900">August Tracker</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Single Laptop IndexedDB Mode
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
