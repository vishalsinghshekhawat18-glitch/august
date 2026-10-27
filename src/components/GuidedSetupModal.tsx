import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, BookOpen, GraduationCap, X } from 'lucide-react';
import { dbService } from '../services/db';
import { AppSettings, Subject } from '../types';

interface GuidedSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

export const GuidedSetupModal: React.FC<GuidedSetupModalProps> = ({ isOpen, onClose, onSetupComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [addRecommendedSubjects, setAddRecommendedSubjects] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleFinish = async () => {
    try {
      if (addRecommendedSubjects) {
        // Add starter essential subjects without fake syllabus
        const starterSubjects: Subject[] = [
          // IBPS RRB PO
          { id: 'sub_reasoning', name: 'Reasoning Ability', examIds: ['comm_ibps_rrb_po'], order: 1 },
          { id: 'sub_quant', name: 'Quantitative Aptitude', examIds: ['comm_ibps_rrb_po'], order: 2 },
          { id: 'sub_ga', name: 'General & Banking Awareness', examIds: ['comm_ibps_rrb_po', 'comm_iibf_dbf'], order: 3 }, // shared subject!
          // IIBF DBF
          { id: 'sub_dbf_principles', name: 'Principles & Practices of Banking', examIds: ['comm_iibf_dbf'], order: 1 },
          { id: 'sub_dbf_accounting', name: 'Accounting & Financial Management for Bankers', examIds: ['comm_iibf_dbf'], order: 2 },
          // UPSC APFC
          { id: 'sub_apfc_economy', name: 'Indian Economy & Labour Laws', examIds: ['comm_upsc_apfc'], order: 1 },
          // VMOU Kota
          { id: 'sub_vmou_micro', name: 'Microeconomics (MEC-01)', examIds: ['comm_vmou_ma_eco'], order: 1 },
          { id: 'sub_vmou_macro', name: 'Macroeconomics (MEC-02)', examIds: ['comm_vmou_ma_eco'], order: 2 },
        ];

        const existingSubs = await dbService.getAll<Subject>('subjects');
        if (existingSubs.length === 0) {
          await dbService.putMany<Subject>('subjects', starterSubjects);
        }
      }

      // Mark guided setup as completed in settings
      const settingsList = await dbService.getAll<AppSettings>('settings');
      if (settingsList[0]) {
        await dbService.put<AppSettings>('settings', {
          ...settingsList[0],
          guidedSetupCompleted: true,
          updatedAt: new Date().toISOString(),
        });
      }

      onSetupComplete();
      onClose();
    } catch (err) {
      console.error('Failed to complete setup:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Skip setup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candidate Workspace Initialization</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome to August Exam Tracker</h2>
          <p className="text-xs text-slate-300 mt-1">
            Minimalist, distraction-free study operating system for your competitive & university milestones.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Configured Initial Commitments</span>
                </p>
                <p>Four primary target streams have been initialized into your local storage:</p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      Primary Priority
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 mt-1">IBPS RRB PO (Officer Scale I)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Competitive banking focus • Reasoning, Quant, Financial Awareness</p>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                    Priority #1
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Priority #2</span>
                    <h5 className="text-xs font-semibold text-slate-900 mt-0.5">IIBF DBF</h5>
                    <p className="text-[11px] text-slate-500">Banking Diploma</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Priority #3</span>
                    <h5 className="text-xs font-semibold text-slate-900 mt-0.5">UPSC APFC</h5>
                    <p className="text-[11px] text-slate-500">EPFO Commissioner</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Priority #4</span>
                    <h5 className="text-xs font-semibold text-slate-900 mt-0.5">VMOU M.A. Economics</h5>
                    <p className="text-[11px] text-slate-500">University Degree</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
                <span>Verified Candidate DOB: <strong>31 October 1996</strong></span>
                <span className="text-slate-400">Strict local storage (no sign-in)</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Syllabus Setup Strategy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We believe in realistic, progressive syllabus building. No fictitious or bloated syllabi are loaded by default.
              </p>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addRecommendedSubjects}
                  onChange={(e) => setAddRecommendedSubjects(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    Create clean starter subjects for your commitments
                  </span>
                  <span className="text-slate-600 mt-0.5 block">
                    Includes Reasoning, Quant, Banking Awareness, and VMOU Micro/Macro modules. You can add, edit, reorder, and link topics anytime.
                  </span>
                </div>
              </label>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <span>Important: Local Browser Storage</span>
                </p>
                <p>
                  All your study records live safely in this browser&apos;s IndexedDB. Export your complete JSON backup from Settings regularly to move between your phone and laptop!
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Skip &amp; explore workspace
            </button>

            <div className="flex gap-2">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Start Tracking</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
