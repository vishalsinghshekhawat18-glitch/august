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
  Filter,
  RefreshCw,
  Plus,
  BookmarkCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
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
    setIsAddModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewOrg('');
    setNewQual('');
    setNewDesc('');
    setNewUrl('');
    setNewDeadline('');
  };

  const filtered = opportunityService.filterOpportunities(
    opportunities,
    selectedCategory,
    searchQuery,
    onlySaved
  );

  const totalTracked = opportunities.length;
  const primeFit = opportunities.filter((o) => o.matchPercentage >= 90).length;
  const totalSaved = opportunities.filter((o) => o.saved).length;
  const totalApplied = opportunities.filter((o) => o.applied).length;

  const categoryLabels: Record<OpportunityCategory | 'all', string> = {
    all: 'All Categories',
    regulatory_banking: 'Regulatory & Banking',
    engineering_psu: 'Engineering & PSUs',
    professional_certification: 'Certifications',
    fellowship_academic: 'Fellowships & Research',
  };

  const getStatusBadge = (status: Opportunity['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Applications Open
          </span>
        );
      case 'closing_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Closing Soon
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3" />
            Upcoming Cycle
          </span>
        );
      case 'archived':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Archived / Concluded
          </span>
        );
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Autonomous 24h Intelligence Radar
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Opportunities & Career Radar
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Autonomous background scanner screening regulatory examinations, power PSU engineer
              cadres, professional economic & financial credentials, and state administrative roles
              tailored to your dual degree profile.
            </p>

            {/* Profile Anchors Banner */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-300">
              <span className="font-semibold text-white">Target Profile:</span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 font-medium">
                ⚡ B.Tech in Electrical Engineering
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 font-medium">
                📊 M.A. in Economics (VMOU Kota)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-300 font-medium">
                🎂 DOB: 31-10-1996 (~30 Years)
              </span>
            </div>
          </div>

          {/* Radar Scanner Controls */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={handleRunRadarScan}
              disabled={scanning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning Internet...' : 'Run Radar Scan'}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Opp
            </button>
          </div>
        </div>

        {/* Diagnostic Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Radar Daemon: Active (Interval: 24h Scheduled / On-Demand)</span>
          </div>
          <div>
            Last Scanned:{' '}
            <span className="text-slate-200 font-medium">
              {new Date(scannerState.lastScannedAt).toLocaleDateString()} at{' '}
              {new Date(scannerState.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Opportunities
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalTracked}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Prime Fit (≥90%)
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{primeFit}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Watchlist (Saved)
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalSaved}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Applied
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalApplied}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, organization, syllabus, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setOnlySaved((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                onlySaved
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlySaved ? 'fill-current' : ''}`} />
              Watchlist Only
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('exam-status')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Go to Exam Status
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading opportunities from secure database...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
          <Compass className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No opportunities match criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting &ldquo;All Categories&rdquo;, or triggering a radar scan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              className={`group relative bg-white rounded-2xl border p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between ${
                opp.saved ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200'
              }`}
            >
              <div className="space-y-4">
                {/* Header: Organization & Match Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {opp.organization}
                      </span>
                      {getStatusBadge(opp.status)}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {opp.title}
                    </h3>
                  </div>

                  {/* Match Percentage Pill */}
                  <div className="shrink-0 flex flex-col items-end">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                        opp.matchPercentage >= 95
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : opp.matchPercentage >= 90
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {opp.matchPercentage}% Fit
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {opp.description}
                </p>

                {/* Qualification & Syllabus Highlights */}
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Eligibility Match: </span>
                      <span className="text-slate-700">{opp.qualificationMatch}</span>
                    </div>
                  </div>

                  {opp.syllabusOverlap && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">Syllabus Overlap: </span>
                        <span className="text-slate-700">{opp.syllabusOverlap}</span>
                      </div>
                    </div>
                  )}

                  {opp.ageLimitNote && (
                    <div className="flex items-start gap-2 text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{opp.ageLimitNote}</span>
                    </div>
                  )}
                </div>

                {/* Dates Information */}
                {(opp.applicationStartDate || opp.applicationDeadline || opp.examDate) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {opp.applicationDeadline && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {opp.applicationDeadline}
                      </span>
                    )}
                    {opp.examDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Exam: {opp.examDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {opp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={opp.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
                >
                  Official Portal
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleToggleApplied(opp.id, e)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      opp.applied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${opp.applied ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    {opp.applied ? 'Applied' : 'Mark Applied'}
                  </button>

                  <button
                    onClick={(e) => handleToggleSave(opp.id, e)}
                    title={opp.saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    className={`p-2 rounded-lg border transition-all ${
                      opp.saved
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${opp.saved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Opportunity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Track Custom Opportunity
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as OpportunityCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="regulatory_banking">Regulatory & Banking</option>
                    <option value="engineering_psu">Engineering & PSUs</option>
                    <option value="professional_certification">Certifications</option>
                    <option value="fellowship_academic">Fellowships & Research</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Match Percentage (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newMatch}
                    onChange={(e) => setNewMatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualification Match</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech in Electrical Engineering with min 60%"
                  value={newQual}
                  onChange={(e) => setNewQual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Notification URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key responsibilities, exam format, syllabus notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
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
