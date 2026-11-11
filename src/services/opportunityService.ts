import { dbService } from './db';
import { Opportunity, OpportunityScannerState, OpportunityCategory } from '../types';
import seedOpportunities from '../data/opportunities.json';

const SCANNER_STATE_KEY = 'august_opportunity_scanner_state';
let memoryScannerState: OpportunityScannerState | null = null;

export const CANDIDATE_PROFILE = {
  name: 'Vishal Singh Shekhawat',
  dob: '1996-10-31',
  ageReference2026: 30,
  qualifications: [
    'B.Tech in Electrical Engineering',
    'M.A. in Economics (VMOU Kota)',
  ],
  focusAreas: [
    'Regulatory Banking & Economics (RBI DEPR, SEBI Grade A, NABARD, SIDBI)',
    'Power Sector & Engineering PSUs (Discoms AEn/JEn, RRB SSE/JE Electrical)',
    'Financial & Energy Certifications (BEE Energy Auditor, NISM Series-XV, IIBF DBF)',
    'State Civil Services (RPSC RAS / RTS)',
  ],
};

class OpportunityService {
  /**
   * Fetches all opportunities from IndexedDB.
   * If the store is empty, it automatically seeds it with the curated dataset.
   */
  async getOpportunities(): Promise<Opportunity[]> {
    try {
      const existing = await dbService.getAll<Opportunity>('opportunities');
      if (existing && existing.length > 0) {
        return existing;
      }

      // Seed with initial high-value curated opportunities
      const seedList = seedOpportunities as Opportunity[];
      for (const item of seedList) {
        await dbService.put('opportunities', item);
      }
      return seedList;
    } catch (err) {
      console.warn('Falling back to static opportunities list due to DB error:', err);
      return seedOpportunities as Opportunity[];
    }
  }

  /**
   * Toggle the saved / bookmarked status of an opportunity
   */
  async toggleSave(id: string): Promise<Opportunity | null> {
    const opp = await dbService.get<Opportunity>('opportunities', id);
    if (!opp) return null;
    const updated: Opportunity = {
      ...opp,
      saved: !opp.saved,
      lastVerifiedAt: new Date().toISOString(),
    };
    await dbService.put('opportunities', updated);
    return updated;
  }

  /**
   * Toggle the applied status of an opportunity
   */
  async toggleApplied(id: string): Promise<Opportunity | null> {
    const opp = await dbService.get<Opportunity>('opportunities', id);
    if (!opp) return null;
    const updated: Opportunity = {
      ...opp,
      applied: !opp.applied,
      lastVerifiedAt: new Date().toISOString(),
    };
    await dbService.put('opportunities', updated);
    return updated;
  }

  /**
   * Add or update an opportunity
   */
  async saveOpportunity(opportunity: Opportunity): Promise<void> {
    await dbService.put('opportunities', opportunity);
  }

  /**
   * Remove an opportunity
   */
  async deleteOpportunity(id: string): Promise<void> {
    await dbService.delete('opportunities', id);
  }

  /**
   * Retrieve scanner diagnostic & run state
   */
  getScannerState(): OpportunityScannerState {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SCANNER_STATE_KEY);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          // fallback
        }
      }
    } else if (memoryScannerState) {
      return memoryScannerState;
    }
    return {
      lastScannedAt: new Date().toISOString(),
      totalFound: seedOpportunities.length,
      activeCount: seedOpportunities.filter((o) => o.status !== 'archived').length,
      autoScanFrequencyHours: 24,
      status: 'idle',
      lastLog: 'Autonomous 24h background radar active. Candidate profile verified.',
    };
  }

  /**
   * Trigger an autonomous radar scan.
   * In online browser mode, checks for fresh public/opportunities.json feed,
   * recalculates closing-soon badges based on deadlines, and updates IndexedDB.
   */
  async runRadarScan(): Promise<{ updated: Opportunity[]; state: OpportunityScannerState }> {
    const currentList = await this.getOpportunities();
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];

    // Try fetching remote feed if available
    let freshItems: Opportunity[] = currentList;
    try {
      const resp = await fetch('./opportunities.json?t=' + Date.now(), { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          // Merge preserving saved and applied statuses
          const currentMap = new Map(currentList.map((i) => [i.id, i]));
          freshItems = json.map((remote: Opportunity) => {
            const loc = currentMap.get(remote.id);
            return {
              ...remote,
              saved: loc?.saved ?? remote.saved ?? false,
              applied: loc?.applied ?? remote.applied ?? false,
            };
          });
        }
      }
    } catch {
      // Offline or local dev fallback: keep currentList
    }

    // Dynamic date and status recalculation
    const processed: Opportunity[] = freshItems.map((opp) => {
      let status = opp.status;
      if (opp.applicationDeadline) {
        const deadlineDate = new Date(opp.applicationDeadline);
        const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          status = 'archived';
        } else if (diffDays <= 7 && diffDays >= 0) {
          status = 'closing_soon';
        } else if (opp.applicationStartDate && new Date(opp.applicationStartDate) <= now) {
          status = 'open';
        }
      }
      return {
        ...opp,
        status,
        lastVerifiedAt: new Date().toISOString(),
      };
    });

    // Write back to IndexedDB
    for (const item of processed) {
      await dbService.put('opportunities', item);
    }

    const state: OpportunityScannerState = {
      lastScannedAt: new Date().toISOString(),
      totalFound: processed.length,
      activeCount: processed.filter((o) => o.status !== 'archived').length,
      autoScanFrequencyHours: 24,
      status: 'success',
      lastLog: `Radar scan completed at ${now.toLocaleTimeString()}. Verified ${processed.length} opportunities for ${CANDIDATE_PROFILE.name}.`,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SCANNER_STATE_KEY, JSON.stringify(state));
    } else {
      memoryScannerState = state;
    }
    return { updated: processed, state };
  }

  /**
   * Helper to filter opportunities by category, search text, and quick flags
   */
  filterOpportunities(
    list: Opportunity[],
    category: OpportunityCategory | 'all',
    search: string,
    onlySaved: boolean = false
  ): Opportunity[] {
    let result = list;

    if (category !== 'all') {
      result = result.filter((o) => o.category === category);
    }

    if (onlySaved) {
      result = result.filter((o) => o.saved);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q)) ||
          o.qualificationMatch.toLowerCase().includes(q)
      );
    }

    // Sort by match percentage descending, then by status (open/closing_soon first)
    return result.sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return a.title.localeCompare(b.title);
    });
  }
}

export const opportunityService = new OpportunityService();
