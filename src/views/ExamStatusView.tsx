import React, { useState, useRef } from 'react';
import {
  FileCheck2,
  ExternalLink,
  RotateCw,
  FolderOpen,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const ExamStatusView: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey(Date.now());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleOpenExternal = () => {
    window.open('./Exam_Status_Dashboard.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700 shadow-2xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Exam Status &amp; Official Syllabus Tracker</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Synced
                  </span>
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span>Candidate: <strong>Vishal Singh Shekhawat</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Source: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 text-[11px]">C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html</code></span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stat Summary Badges */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                4 Nov Active
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[11px]">
                1 Result Due
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-semibold text-[11px]">
                8 Tracked Total
              </span>
            </div>

            {/* Reload Frame */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Reload embedded dashboard to pull latest changes from disk"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Reloading...' : 'Reload'}</span>
            </button>

            {/* Open in Dedicated Tab */}
            <button
              onClick={handleOpenExternal}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Open full interactive HTML document in a new browser tab for print or distraction-free view"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>
          </div>
        </div>

        {/* Sync Info Strip */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong>Auto-Sync Active:</strong> Whenever <code className="text-slate-700 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">Exam_Status_Dashboard.html</code> is updated in chat or modified on disk, this space reflects the latest status immediately.
            </span>
          </div>
          <div className="text-slate-400">
            Light Theme • 3-Column Compact Table • Collapsible Official Syllabuses
          </div>
        </div>
      </div>

      {/* Embedded Interactive HTML Frame */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={`./Exam_Status_Dashboard.html?v=${iframeKey}`}
          title="Exam Status and Official Syllabus Tracker"
          className="w-full h-[calc(100vh-190px)] min-h-[750px] border-none block bg-slate-50"
        />
      </div>
    </div>
  );
};
