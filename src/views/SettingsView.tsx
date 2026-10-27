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
} from 'lucide-react';
import { dbService } from '../services/db';
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

  // Import State
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [pendingPackage, setPendingPackage] = useState<ApplicationDataPackage | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const loadSettingsData = async () => {
    const est = await dbService.getStorageEstimate();
    setQuota(est);
  };

  useEffect(() => {
    loadSettingsData();
    dbService.onSaveStateChange = (state, msg) => {
      setSaveState(state);
      setSaveErrorMsg(msg);
    };
  }, []);

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
      } catch (err) {
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

      // Pre-replacement safety: If replacing, auto-export backup first
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Management &amp; Device Portability</h1>
        <p className="text-xs text-slate-500 mt-1">
          Zero-backend privacy • Device-to-device migration • Structured CSV &amp; JSON recovery packages
        </p>
      </div>

      {/* Critical Rules & Local Storage Architecture Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3 text-amber-950">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
          <h3 className="text-sm font-bold">Local-Only Storage Guarantee &amp; Boundaries</h3>
        </div>
        <p className="text-xs leading-relaxed">
          Your records are saved strictly in your browser&apos;s <strong>IndexedDB</strong> database on this physical
          device. Data persists across normal browser restarts, reboots, and application updates published on GitHub
          Pages.
        </p>
        <ul className="text-xs space-y-1 list-disc list-inside text-amber-900/90 pl-1">
          <li>
            <strong>Device Scoped:</strong> Records entered on your laptop remain on your laptop; records on your
            iPhone stay on your iPhone.
          </li>
          <li>
            <strong>No Cloud Synchronization:</strong> To move your data between devices, export the JSON package below
            and import it on your other device.
          </li>
          <li>
            <strong>Cache Clearance Risk:</strong> If you explicitly choose &quot;Clear all website data&quot; in
            browser settings, local storage will be erased. Always keep an exported JSON backup in your files or cloud
            drive!
          </li>
        </ul>
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
    </div>
  );
};
