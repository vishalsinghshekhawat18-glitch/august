import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Building2,
  GraduationCap,
  RefreshCw,
  Plus,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { Opportunity, OpportunityCategory, OpportunityScannerState } from '../types';
import { opportunityService, CANDIDATE_PROFILE } from '../services/opportunityService';

interface OpportunitiesViewProps {
  onNavigate?: (viewId: string) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ onNavigate }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [onlyOpen, setOnlyOpen] = useState<boolean>(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [scannerState, setScannerState] = useState<OpportunityScannerState>(
    opportunityService.getScannerState()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New opportunity form state
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newCategory, setNewCategory] = useState<OpportunityCategory>('regulatory_banking');
  const [newMatch, setNewMatch] = useState('90');
  const [newQual, setNewQual] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await opportunityService.getOpportunities();
      setOpportunities(data);
      setScannerState(opportunityService.getScannerState());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await opportunityService.toggleSave(id);
    if (updated) {
      setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  };

  const handleToggleApplied = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await opportunityService.toggleApplied(id);
    if (updated) {
      setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  };

  const handleRunRadarScan = async () => {
    try {
      setScanning(true);
      const { updated, state } = await opportunityService.runRadarScan();
      setOpportunities(updated);
      setScannerState(state);
    } finally {
      setScanning(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = (itemsToExpand: Opportunity[]) => {
    setExpandedIds(new Set(itemsToExpand.map((o) => o.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleCreateCustomOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOrg.trim()) return;

    const newOpp: Opportunity = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      organization: newOrg.trim(),
      category: newCategory,
      qualificationMatch: newQual.trim() || 'B.Tech Electrical + M.A. Economics',
      matchPercentage: parseInt(newMatch, 10) || 85,
      description: newDesc.trim() || 'Custom tracked opportunity.',
      eligibilityCriteria: 'Candidate specified criteria.',
      officialUrl: newUrl.trim() || 'https://google.com',
      applicationDeadline: newDeadline || undefined,
      status: 'open',
      saved: true,
      applied: false,
      tags: ['Custom', 'Candidate Tracked'],
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      source: 'manual',
    };

    await opportunityService.saveOpportunity(newOpp);
    setOpportunities((prev) => [newOpp, ...prev]);
    setExpandedIds((prev) => new Set(prev).add(newOpp.id));
    setIsAddModalOpen(false);

    setNewTitle('');
    setNewOrg('');
    setNewQual('');
    setNewDesc('');
    setNewUrl('');
    setNewDeadline('');
  };

  // Filter list
  let filtered = opportunityService.filterOpportunities(
    opportunities,
    selectedCategory,
    searchQuery,
    onlySaved
  );

  if (onlyOpen) {
    filtered = filtered.filter((o) => o.status === 'open' || o.status === 'closing_soon');
  }

  const totalTracked = opportunities.length;
  const primeFit = opportunities.filter((o) => o.matchPercentage >= 90).length;
  const totalSaved = opportunities.filter((o) => o.saved).length;
  const totalApplied = opportunities.filter((o) => o.applied).length;
  const totalOpen = opportunities.filter(
    (o) => o.status === 'open' || o.status === 'closing_soon'
  ).length;

  const categoryLabels: Record<OpportunityCategory | 'all', string> = {
    all: 'All Categories',
    regulatory_banking: 'Regulatory & Banking',
    engineering_psu: 'Engineering & PSUs',
    professional_certification: 'Certifications',
    fellowship_academic: 'Fellowships & Research',
  };

  const getCategoryBorderColor = (cat: OpportunityCategory) => {
    switch (cat) {
      case 'regulatory_banking':
        return 'border-l-indigo-600';
      case 'engineering_psu':
        return 'border-l-teal-600';
      case 'professional_certification':
        return 'border-l-amber-500';
      case 'fellowship_academic':
        return 'border-l-purple-600';
      default:
        return 'border-l-sky-600';
    }
  };

  const getStatusBadge = (status: Opportunity['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Applications Open
          </span>
        );
      case 'closing_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Clock className="w-3 h-3 text-rose-600" />
            Closing Soon
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Calendar className="w-3 h-3 text-sky-600" />
            Upcoming Cycle
          </span>
        );
      case 'archived':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Archived
          </span>
        );
    }
  };

  const areAllExpanded = filtered.length > 0 && filtered.every((o) => expandedIds.has(o.id));

  return (
    <div className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Profile & Header Card (Modeled after Exam Status Dashboard) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs border-t-4 border-t-sky-600">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs">
                <Compass className="w-5 h-5 text-sky-700" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Opportunities &amp; Career Radar</span>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  24h AI Radar
                </span>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Screener
                </span>
              </h1>
            </div>

            {/* Candidate Qualifications Ribbon */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>
                Candidate: <strong className="text-slate-900">{CANDIDATE_PROFILE.name}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-medium text-slate-800">
                <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                B.Tech (Electrical Engineering)
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-medium text-slate-800">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                M.A. Economics (VMOU Kota)
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">DOB: 31-10-1996 (~30 Yrs)</span>
            </div>
          </div>

          {/* Quick Stat Counter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[75px]">
              <span className="text-lg font-extrabold text-sky-700 leading-none block">
                {totalTracked}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Total
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center min-w-[75px]">
              <span className="text-lg font-extrabold text-emerald-700 leading-none block">
                {primeFit}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider">
                &ge;90% Fit
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center min-w-[75px]">
              <span className="text-lg font-extrabold text-amber-700 leading-none block">
                {totalSaved}
              </span>
              <span className="text-[10px] uppercase font-semibold text-amber-700 tracking-wider">
                Watchlist
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-center min-w-[75px]">
              <span className="text-lg font-extrabold text-indigo-700 leading-none block">
                {totalApplied}
              </span>
              <span className="text-[10px] uppercase font-semibold text-indigo-700 tracking-wider">
                Applied
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostic Strip & Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Autonomous radar runs daily every 24h. Last verified:{' '}
              <strong className="text-slate-700">
                {new Date(scannerState.lastScannedAt).toLocaleDateString()} at{' '}
                {new Date(scannerState.lastScannedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunRadarScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-sky-600' : ''}`} />
              <span>{scanning ? 'Scanning Web...' : 'Run Radar Scan'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters (Modeled directly after Exam Status Toolbar) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search opportunity, exam, syllabus, organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
            />
          </div>

          {/* Action & Accordion Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Expand / Collapse All Details */}
            {areAllExpanded ? (
              <button
                onClick={handleCollapseAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                title="Collapse all detailed sections"
              >
                <ChevronsDownUp className="w-3.5 h-3.5 text-slate-600" />
                <span>Collapse All</span>
              </button>
            ) : (
              <button
                onClick={() => handleExpandAll(filtered)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition cursor-pointer"
                title="Expand all detailed sections"
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-sky-700" />
                <span>Expand All</span>
              </button>
            )}

            {/* Watchlist Filter */}
            <button
              onClick={() => setOnlySaved((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                onlySaved
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlySaved ? 'fill-current' : 'text-amber-500'}`} />
              <span>Watchlist ({totalSaved})</span>
            </button>

            {/* Active / Open Filter */}
            <button
              onClick={() => setOnlyOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                onlyOpen
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${onlyOpen ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>Active Open ({totalOpen})</span>
            </button>

            {/* Direct Link to Exam Status View */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('exam-status')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Exam Status Tab</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          {(
            [
              'all',
              'regulatory_banking',
              'engineering_psu',
              'professional_certification',
              'fellowship_academic',
            ] as const
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container (Exact 3-Column Compact Architecture from Exam Status Dashboard) */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-fixed min-w-[760px]">
            {/* Column Width Proportions */}
            <colgroup>
              <col style={{ width: '45%' }} />
              <col style={{ width: '27%' }} />
              <col style={{ width: '28%' }} />
            </colgroup>

            {/* Table Header */}
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b-2 border-slate-200">
                <th className="py-3 px-4">Opportunity &amp; Qualification Fit</th>
                <th className="py-3 px-4">Timeline &amp; Dates</th>
                <th className="py-3 px-4">Actions &amp; Details</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    <p className="font-medium text-xs">Loading opportunities from database...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">
                    <Compass className="w-7 h-7 mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-800 text-sm">No opportunities match criteria</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing search query or selecting &ldquo;All Categories&rdquo;.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((opp, idx) => {
                  const isExpanded = expandedIds.has(opp.id);
                  const borderClass = getCategoryBorderColor(opp.category);

                  return (
                    <React.Fragment key={opp.id}>
                      {/* Main Compact Row */}
                      <tr
                        onClick={() => toggleExpand(opp.id)}
                        className={`border-b border-slate-200 hover:bg-slate-50/80 transition-colors cursor-pointer select-none border-l-4 ${borderClass} ${
                          idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                        } ${opp.saved ? 'bg-amber-50/20' : ''}`}
                      >
                        {/* Col 1: Opportunity & Qualification */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded leading-none">
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 text-sm leading-snug hover:text-sky-700 transition">
                                {opp.title}
                              </span>
                              {/* Match Percentage Pill */}
                              <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                  opp.matchPercentage >= 95
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : opp.matchPercentage >= 90
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                    : 'bg-sky-100 text-sky-800 border border-sky-300'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {opp.matchPercentage}% Fit
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {opp.organization}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                                {categoryLabels[opp.category]}
                              </span>
                            </div>

                            {/* Eligibility Match snippet */}
                            <div className="text-[11px] text-slate-600 line-clamp-1 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span className="font-semibold text-slate-800">Match:</span>{' '}
                              <span className="truncate">{opp.qualificationMatch}</span>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Timeline & Dates */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1.5">
                            <div>{getStatusBadge(opp.status)}</div>

                            {opp.applicationDeadline && (
                              <div className="text-xs">
                                <span className="font-bold text-slate-900 block flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Deadline: {opp.applicationDeadline}
                                </span>
                              </div>
                            )}

                            {opp.examDate && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{opp.examDate}</span>
                              </div>
                            )}

                            {opp.ageLimitNote && (
                              <div className="text-[10px] text-slate-500 italic truncate max-w-[220px]">
                                {opp.ageLimitNote}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Col 3: Actions & Details Toggle */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Expand / Collapse Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(opp.id);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition cursor-pointer ${
                                  isExpanded
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Official Portal Link */}
                              <a
                                href={opp.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs"
                              >
                                <span>Portal</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              {/* Watchlist Star */}
                              <button
                                onClick={(e) => handleToggleSave(opp.id, e)}
                                title={opp.saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                className={`p-1 rounded-md border transition cursor-pointer ${
                                  opp.saved
                                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                                }`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${opp.saved ? 'fill-current text-amber-500' : ''}`}
                                />
                              </button>

                              {/* Applied Status */}
                              <button
                                onClick={(e) => handleToggleApplied(opp.id, e)}
                                title={opp.applied ? 'Mark as Not Applied' : 'Mark as Applied'}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                                  opp.applied
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <CheckCircle2
                                  className={`w-3 h-3 ${
                                    opp.applied ? 'text-emerald-600' : 'text-slate-300'
                                  }`}
                                />
                                <span>{opp.applied ? 'Applied' : 'Apply'}</span>
                              </button>
                            </div>

                            {/* Tags preview */}
                            <div className="flex flex-wrap gap-1">
                              {opp.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Collapsible Details Drawer (Modeled after Exam Status Accordion) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-slate-300 animate-fadeIn">
                          <td colSpan={3} className="p-4 sm:p-5">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                              {/* Stage 1: Role Overview & Strategic Relevance */}
                              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50">
                                <div className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <Compass className="w-3.5 h-3.5 text-sky-600" />
                                  Role Overview &amp; Strategic Value
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  {opp.description}
                                </p>
                              </div>

                              {/* Stage 2 & 3: Grid of Eligibility + Syllabus Overlap */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {/* Candidate Eligibility Alignment */}
                                <div className="border border-slate-200/80 rounded-lg p-3.5 bg-white space-y-1.5">
                                  <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                    Eligibility Alignment &amp; Qualification
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {opp.qualificationMatch}
                                  </p>
                                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                    <strong>Statutory Criteria:</strong> {opp.eligibilityCriteria}
                                  </div>
                                </div>

                                {/* Syllabus Overlap Breakdown */}
                                <div className="border border-slate-200/80 rounded-lg p-3.5 bg-white space-y-1.5">
                                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                    Syllabus Overlap &amp; Study Synergy
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed">
                                    {opp.syllabusOverlap ||
                                      'Strong curriculum alignment with your current technical & economic study assets.'}
                                  </p>
                                  {opp.ageLimitNote && (
                                    <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                                      <strong>Age Bracket Check:</strong> {opp.ageLimitNote}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Footer Details: Official URL & Full Tag Cloud */}
                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-slate-600">Tags:</span>
                                  {opp.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2">
                                  <a
                                    href={opp.officialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs transition shadow-2xs"
                                  >
                                    <span>Open Official Notification / Portal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>

                                  {onNavigate && (
                                    <button
                                      onClick={() => onNavigate('exam-status')}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition"
                                    >
                                      <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
                                      <span>View in Exam Status</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Opportunity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-600" />
                Track Custom Opportunity
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomOpportunity} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Examination / Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RVPNL Assistant Engineer (Electrical)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajasthan Rajya Vidyut Prasaran Nigam"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as OpportunityCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="regulatory_banking">Regulatory &amp; Banking</option>
                    <option value="engineering_psu">Engineering &amp; PSUs</option>
                    <option value="professional_certification">Certifications</option>
                    <option value="fellowship_academic">Fellowships &amp; Research</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Match Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newMatch}
                    onChange={(e) => setNewMatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Qualification Match
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech in Electrical Engineering with min 60%"
                  value={newQual}
                  onChange={(e) => setNewQual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Notification URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key responsibilities, exam format, syllabus notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save to Radar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
