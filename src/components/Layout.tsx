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
  CheckCircle2,
  AlertCircle,
  Loader2,
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
        <div className="flex items-center gap-3">
          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {saveState === 'saved' && (
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved locally</span>
              </span>
            )}
            {saveState === 'saving' && (
              <span className="text-indigo-600 flex items-center gap-1 text-[11px] font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveState === 'error' && (
              <span className="text-rose-600 flex items-center gap-1 text-[11px] font-medium" title={errorMsg}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Storage error</span>
              </span>
            )}
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

      {/* Desktop Horizontal Navigation Bar */}
      <nav className="hidden md:block bg-white border-b border-slate-200/80 px-4 sm:px-8 overflow-x-auto">
        <div className="flex gap-1 max-w-7xl mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`py-3 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2">
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
                className={`w-full py-2.5 px-3 text-xs font-medium rounded-lg text-left flex items-center gap-3 transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {children}
      </main>

      {/* Mobile Bottom Quick-Access Bar (Fixed on mobile phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around">
        {[
          { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
          { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
          { id: 'planning', label: 'Plan', icon: Calendar },
          { id: 'revisions', label: 'Revise', icon: RotateCw },
          { id: 'settings', label: 'Data', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
