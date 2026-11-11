// Native IndexedDB storage layer with versioned schema and zero external dependencies
import {
  Commitment,
  Subject,
  Topic,
  Subtopic,
  TopicProgress,
  StudyLog,
  WeeklyPlan,
  RevisionRecord,
  MockTest,
  MistakeEntry,
  UniversityCourse,
  UniversityItem,
  DailyReview,
  WeeklyReview,
  CoachDispatch,
  Opportunity,
  AppSettings,
  ApplicationDataPackage,
} from '../types';
import seedMockTests from '../data/mockTests.json';

const DB_NAME = 'August_ExamTracker_DB';
const DB_VERSION = 3;

export type StoreName =
  | 'commitments'
  | 'subjects'
  | 'topics'
  | 'subtopics'
  | 'topicProgress'
  | 'studyLogs'
  | 'weeklyPlans'
  | 'revisions'
  | 'mockTests'
  | 'mistakes'
  | 'universityCourses'
  | 'universityItems'
  | 'dailyReviews'
  | 'weeklyReviews'
  | 'coachDispatches'
  | 'opportunities'
  | 'settings';

export const INITIAL_COMMITMENTS: Commitment[] = [
  {
    id: 'comm_ibps_rrb_po',
    name: 'IBPS RRB PO (Officer Scale I)',
    code: 'IBPS-RRB-PO',
    type: 'competitive',
    priority: 1, // Primary immediate competitive priority
    targetDate: '2026-11-20',
    dateStatus: 'confirmed',
    dateSourceUrl: 'https://www.ibps.in',
    dateVerificationDate: '2026-10-27',
    description: 'Regional Rural Banks Officer Scale I examination covering Reasoning, Quantitative Aptitude, General Awareness, Financial Awareness, and Computer Knowledge.',
    officialNotificationUrl: 'https://www.ibps.in',
    eligibilityNotes: 'Age limit usually 21 to 30 years as of official notification cutoff date. Candidate DOB: 31 October 1996. Verify exact age criteria and relaxation rules against the active official notification.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm_rpsc_ras',
    name: 'RPSC RAS / RTS (Rajasthan Administrative Services)',
    code: 'RPSC-RAS',
    type: 'competitive',
    priority: 2,
    targetDate: '2027-02-15',
    dateStatus: 'unverified',
    dateSourceUrl: 'https://rpsc.rajasthan.gov.in',
    dateVerificationDate: '2026-11-01',
    description: 'Rajasthan State and Subordinate Services Combined Competitive Examination covering 18 specialized subjects across Prelims and Mains.',
    officialNotificationUrl: 'https://rpsc.rajasthan.gov.in',
    eligibilityNotes: 'Age limit 21 to 40 years as of official notification cutoff date. Candidate DOB: 31 October 1996. Exam conducted by Rajasthan Public Service Commission (RPSC).',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm_upsc_apfc',
    name: 'UPSC APFC (Assistant Provident Fund Commissioner)',
    code: 'UPSC-APFC',
    type: 'competitive',
    priority: 3,
    dateStatus: 'unverified',
    dateSourceUrl: 'https://upsc.gov.in',
    dateVerificationDate: '2026-10-27',
    description: 'Union Public Service Commission recruitment for EPFO covering General English, Indian Freedom Movement, Indian Economy, Auditing & Accounting, and Social Security.',
    officialNotificationUrl: 'https://upsc.gov.in',
    eligibilityNotes: 'Typically requires graduate degree, maximum age 35 with applicable category relaxations. Always check official UPSC notification for cutoff date.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm_vmou_ma_eco',
    name: 'Masters in Economics — VMOU Kota',
    code: 'VMOU-MA-ECO',
    type: 'university',
    priority: 4,
    dateStatus: 'unverified',
    dateSourceUrl: 'https://www.vmou.ac.in',
    dateVerificationDate: '2026-10-27',
    description: 'Vardhman Mahaveer Open University M.A. in Economics degree covering Micro, Macro, Public Economics, Development & Quantitative Methods.',
    officialNotificationUrl: 'https://www.vmou.ac.in',
    eligibilityNotes: 'Academic semester/term-end exams and internal assignment submissions as per VMOU academic calendar.',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global_settings',
  dateOfBirth: '1996-10-31',
  timeZone: 'Asia/Kolkata',
  lastUsedExamId: 'comm_ibps_rrb_po',
  guidedSetupCompleted: false,
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
};

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  public onSaveStateChange: ((state: 'saved' | 'saving' | 'error', errorMsg?: string) => void) | null = null;

  private notifySaveState(state: 'saved' | 'saving' | 'error', errorMsg?: string) {
    if (this.onSaveStateChange) {
      this.onSaveStateChange(state, errorMsg);
    }
  }

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported or available in this browser environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores if not exist
        const stores: { name: StoreName; keyPath: string; indexes?: { name: string; keyPath: string; unique?: boolean }[] }[] = [
          { name: 'commitments', keyPath: 'id' },
          { name: 'subjects', keyPath: 'id' },
          { name: 'topics', keyPath: 'id', indexes: [{ name: 'subjectId', keyPath: 'subjectId' }] },
          { name: 'subtopics', keyPath: 'id', indexes: [{ name: 'topicId', keyPath: 'topicId' }] },
          { name: 'topicProgress', keyPath: 'id', indexes: [{ name: 'examId', keyPath: 'examId' }, { name: 'topicId', keyPath: 'topicId' }] },
          { name: 'studyLogs', keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: 'examId', keyPath: 'examId' }] },
          { name: 'weeklyPlans', keyPath: 'id', indexes: [{ name: 'weekStartDate', keyPath: 'weekStartDate' }] },
          { name: 'revisions', keyPath: 'id', indexes: [{ name: 'scheduledDate', keyPath: 'scheduledDate' }, { name: 'status', keyPath: 'status' }] },
          { name: 'mockTests', keyPath: 'id', indexes: [{ name: 'examId', keyPath: 'examId' }, { name: 'date', keyPath: 'date' }] },
          { name: 'mistakes', keyPath: 'id', indexes: [{ name: 'examId', keyPath: 'examId' }, { name: 'mockTestId', keyPath: 'mockTestId' }] },
          { name: 'universityCourses', keyPath: 'id' },
          { name: 'universityItems', keyPath: 'id', indexes: [{ name: 'courseId', keyPath: 'courseId' }] },
          { name: 'dailyReviews', keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date', unique: true }] },
          { name: 'weeklyReviews', keyPath: 'id', indexes: [{ name: 'weekStartDate', keyPath: 'weekStartDate', unique: true }] },
          { name: 'coachDispatches', keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: 'type', keyPath: 'type' }] },
          { name: 'opportunities', keyPath: 'id', indexes: [{ name: 'category', keyPath: 'category' }, { name: 'status', keyPath: 'status' }] },
          { name: 'settings', keyPath: 'id' },
        ];

        for (const store of stores) {
          if (!db.objectStoreNames.contains(store.name)) {
            const os = db.createObjectStore(store.name, { keyPath: store.keyPath });
            if (store.indexes) {
              for (const idx of store.indexes) {
                os.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
              }
            }
          }
        }
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          await this.applyFreshStartMigration(db);
          await this.seedInitialCommitmentsIfEmpty(db);
          await this.seedInitialMockTestsIfEmpty(db);
        } catch (e) {
          console.warn('Database initialization / migration error:', e);
        }
        resolve(db);
      };

      request.onerror = (event) => {
        const err = (event.target as IDBOpenDBRequest).error;
        this.notifySaveState('error', err?.message || 'Failed to open local database');
        reject(err);
      };
    });

    return this.dbPromise;
  }

  // Ensures complete reset to zero history, Day 1 (Sunday, 2026-11-01), with IIBF completely removed
  private async applyFreshStartMigration(db: IDBDatabase): Promise<void> {
    if (typeof window === 'undefined') return;
    const FRESH_START_FLAG = 'august_fresh_start_2026_11_01';
    if (localStorage.getItem(FRESH_START_FLAG) === 'true') return;

    return new Promise((resolve, reject) => {
      const storesToClear: StoreName[] = [
        'studyLogs',
        'revisions',
        'mockTests',
        'mistakes',
        'weeklyPlans',
        'dailyReviews',
        'weeklyReviews',
        'topicProgress',
      ];

      const tx = db.transaction(
        [...storesToClear, 'commitments', 'subjects', 'settings'],
        'readwrite'
      );

      // 1. Wipe all historical activity, progress, logs, and revisions
      for (const storeName of storesToClear) {
        tx.objectStore(storeName).clear();
      }

      // 2. Remove IIBF DBF from commitments and ensure the 3 clean commitments
      const commStore = tx.objectStore('commitments');
      commStore.delete('comm_iibf_dbf');
      for (const c of INITIAL_COMMITMENTS) {
        commStore.put(c);
      }

      // 3. Remove DBF subjects and un-link comm_iibf_dbf from shared subjects
      const subStore = tx.objectStore('subjects');
      const getAllSubsReq = subStore.getAll();
      getAllSubsReq.onsuccess = () => {
        const subs = (getAllSubsReq.result as Subject[]) || [];
        for (const s of subs) {
          if (s.examIds && s.examIds.includes('comm_iibf_dbf')) {
            const remaining = s.examIds.filter((id) => id !== 'comm_iibf_dbf');
            if (remaining.length === 0 || s.id.startsWith('sub_dbf_')) {
              subStore.delete(s.id);
            } else {
              s.examIds = remaining;
              subStore.put(s);
            }
          }
        }
      };

      // 4. Ensure settings focus on IBPS RRB PO
      const settingsStore = tx.objectStore('settings');
      const getSetReq = settingsStore.get('global_settings');
      getSetReq.onsuccess = () => {
        const settings = (getSetReq.result as AppSettings) || DEFAULT_SETTINGS;
        settings.lastUsedExamId = 'comm_ibps_rrb_po';
        settings.updatedAt = new Date().toISOString();
        settingsStore.put(settings);
      };

      tx.oncomplete = () => {
        try {
          localStorage.removeItem('august_pin_hash');
          localStorage.removeItem('august_pin_salt');
          localStorage.removeItem('august_unlocked');
          localStorage.removeItem('august_supabase_url');
          localStorage.removeItem('august_supabase_anon_key');
          localStorage.setItem(FRESH_START_FLAG, 'true');
        } catch (e) {
          console.warn('LocalStorage migration flag set error:', e);
        }
        resolve();
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  private async seedInitialCommitmentsIfEmpty(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['commitments', 'settings'], 'readwrite');
      const commStore = tx.objectStore('commitments');
      const countReq = commStore.count();

      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          for (const c of INITIAL_COMMITMENTS) {
            commStore.put(c);
          }
        } else {
          // Permanently ensure comm_iibf_dbf is deleted
          commStore.delete('comm_iibf_dbf');

          // Ensure all initial commitments (such as comm_rpsc_ras) exist in DB
          for (const c of INITIAL_COMMITMENTS) {
            const getCReq = commStore.get(c.id);
            getCReq.onsuccess = () => {
              if (!getCReq.result) {
                commStore.put(c);
              }
            };
          }

          // Auto-patch outdated provisional date to confirmed 2026-11-20
          const getRrbReq = commStore.get('comm_ibps_rrb_po');
          getRrbReq.onsuccess = () => {
            const rrb = getRrbReq.result as Commitment | undefined;
            if (rrb && (rrb.targetDate === '2026-08-01' || !rrb.targetDate || rrb.dateStatus !== 'confirmed')) {
              rrb.targetDate = '2026-11-20';
              rrb.dateStatus = 'confirmed';
              commStore.put(rrb);
            }
          };
        }
      };

      const settingsStore = tx.objectStore('settings');
      const setReq = settingsStore.get('global_settings');
      setReq.onsuccess = () => {
        if (!setReq.result) {
          settingsStore.put(DEFAULT_SETTINGS);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async seedInitialMockTestsIfEmpty(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(seedMockTests) || seedMockTests.length === 0) {
        resolve();
        return;
      }

      const tx = db.transaction(['mockTests', 'studyLogs'], 'readwrite');
      const mockStore = tx.objectStore('mockTests');
      const studyStore = tx.objectStore('studyLogs');

      for (const m of seedMockTests as MockTest[]) {
        const req = mockStore.get(m.id);
        req.onsuccess = () => {
          if (!req.result) {
            mockStore.put(m);
            const mockLog: StudyLog = {
              id: `log_mock_${m.id}`,
              date: m.date,
              timestamp: m.createdAt || new Date().toISOString(),
              examId: m.examId,
              subjectId: '',
              durationMinutes: Number(m.timeTakenMinutes || 45),
              activityType: 'mock_test',
              notes: `Mock Test: ${m.testName} — Score: ${m.totalScore}/${m.maxScore} (${m.accuracyPercent}% acc)` + (m.notes ? ` • ${m.notes}` : ''),
              createdAt: m.createdAt || new Date().toISOString(),
            };
            studyStore.put(mockLog);
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: StoreName, item: T): Promise<T> {
    this.notifySaveState('saving');
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => {
        this.notifySaveState('saved');
        resolve(item);
      };
      req.onerror = () => {
        const errorMsg = req.error?.name === 'QuotaExceededError'
          ? 'Browser storage quota exceeded. Please export your data and free browser storage.'
          : req.error?.message || 'Save failed';
        this.notifySaveState('error', errorMsg);
        reject(req.error);
      };
    });
  }

  public async putSilent<T>(storeName: StoreName, item: T): Promise<T> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  public async putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    this.notifySaveState('saving');
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const item of items) {
        store.put(item);
      }

      tx.oncomplete = () => {
        this.notifySaveState('saved');
        resolve();
      };
      tx.onerror = () => {
        this.notifySaveState('error', tx.error?.message || 'Batch save failed');
        reject(tx.error);
      };
    });
  }

  public async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    this.notifySaveState('saving');
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => {
        this.notifySaveState('saved');
        resolve();
      };
      req.onerror = () => {
        this.notifySaveState('error', req.error?.message || 'Delete failed');
        reject(req.error);
      };
    });
  }

  public async clearStore(storeName: StoreName): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearAllStores(): Promise<void> {
    const db = await this.openDB();
    const storeNames = Array.from(db.objectStoreNames) as StoreName[];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const s of storeNames) {
        tx.objectStore(s).clear();
      }
      // Re-seed clean 3 commitments and default settings
      const commStore = tx.objectStore('commitments');
      for (const c of INITIAL_COMMITMENTS) {
        commStore.put(c);
      }
      const settingsStore = tx.objectStore('settings');
      settingsStore.put(DEFAULT_SETTINGS);

      tx.oncomplete = () => {
        this.notifySaveState('saved');
        resolve();
      };
      tx.onerror = () => {
        this.notifySaveState('error', tx.error?.message || 'Clear stores failed');
        reject(tx.error);
      };
    });
  }

  // Complete data export package
  public async exportFullPackage(): Promise<ApplicationDataPackage> {
    const [
      commitments,
      subjects,
      topics,
      subtopics,
      topicProgress,
      studyLogs,
      weeklyPlans,
      revisions,
      mockTests,
      mistakes,
      universityCourses,
      universityItems,
      dailyReviews,
      weeklyReviews,
      coachDispatches,
      opportunities,
      settingsList,
    ] = await Promise.all([
      this.getAll<Commitment>('commitments'),
      this.getAll<Subject>('subjects'),
      this.getAll<Topic>('topics'),
      this.getAll<Subtopic>('subtopics'),
      this.getAll<TopicProgress>('topicProgress'),
      this.getAll<StudyLog>('studyLogs'),
      this.getAll<WeeklyPlan>('weeklyPlans'),
      this.getAll<RevisionRecord>('revisions'),
      this.getAll<MockTest>('mockTests'),
      this.getAll<MistakeEntry>('mistakes'),
      this.getAll<UniversityCourse>('universityCourses'),
      this.getAll<UniversityItem>('universityItems'),
      this.getAll<DailyReview>('dailyReviews'),
      this.getAll<WeeklyReview>('weeklyReviews'),
      this.getAll<CoachDispatch>('coachDispatches'),
      this.getAll<Opportunity>('opportunities'),
      this.getAll<AppSettings>('settings'),
    ]);

    const settings = settingsList[0] || DEFAULT_SETTINGS;

    return {
      app: 'PersonalExamTracker',
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        commitments,
        subjects,
        topics,
        subtopics,
        topicProgress,
        studyLogs,
        weeklyPlans,
        revisions,
        mockTests,
        mistakes,
        universityCourses,
        universityItems,
        dailyReviews,
        weeklyReviews,
        coachDispatches,
        opportunities,
        settings,
      },
    };
  }

  // Restore or replace data package
  public async importFullPackage(pkg: ApplicationDataPackage, mode: 'replace' | 'merge'): Promise<void> {
    if (!pkg || pkg.app !== 'PersonalExamTracker' || !pkg.data) {
      throw new Error('Invalid data package. Not an authorized Personal Exam Tracker package.');
    }

    const db = await this.openDB();
    const storeNames: StoreName[] = [
      'commitments',
      'subjects',
      'topics',
      'subtopics',
      'topicProgress',
      'studyLogs',
      'weeklyPlans',
      'revisions',
      'mockTests',
      'mistakes',
      'universityCourses',
      'universityItems',
      'dailyReviews',
      'weeklyReviews',
      'coachDispatches',
      'opportunities',
      'settings',
    ];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');

      if (mode === 'replace') {
        for (const s of storeNames) {
          tx.objectStore(s).clear();
        }
      }

      // Insert all collections
      const d = pkg.data;
      const collections: [StoreName, unknown[] | unknown][] = [
        ['commitments', d.commitments || []],
        ['subjects', d.subjects || []],
        ['topics', d.topics || []],
        ['subtopics', d.subtopics || []],
        ['topicProgress', d.topicProgress || []],
        ['studyLogs', d.studyLogs || []],
        ['weeklyPlans', d.weeklyPlans || []],
        ['revisions', d.revisions || []],
        ['mockTests', d.mockTests || []],
        ['mistakes', d.mistakes || []],
        ['universityCourses', d.universityCourses || []],
        ['universityItems', d.universityItems || []],
        ['dailyReviews', d.dailyReviews || []],
        ['weeklyReviews', d.weeklyReviews || []],
        ['coachDispatches', d.coachDispatches || []],
        ['opportunities', d.opportunities || []],
        ['settings', d.settings ? [d.settings] : [DEFAULT_SETTINGS]],
      ];

      for (const [storeName, items] of collections) {
        const os = tx.objectStore(storeName);
        if (Array.isArray(items)) {
          for (const item of items) {
            os.put(item);
          }
        }
      }

      tx.oncomplete = () => {
        this.notifySaveState('saved');
        resolve();
      };
      tx.onerror = () => {
        this.notifySaveState('error', tx.error?.message || 'Import failed');
        reject(tx.error);
      };
    });
  }

  public async getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number; percent: number } | null> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usageMB = (est.usage || 0) / (1024 * 1024);
        const quotaMB = (est.quota || 0) / (1024 * 1024);
        const percent = quotaMB > 0 ? (usageMB / quotaMB) * 100 : 0;
        return {
          usageMB: Number(usageMB.toFixed(2)),
          quotaMB: Number(quotaMB.toFixed(2)),
          percent: Number(percent.toFixed(1)),
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const dbService = new IndexedDBStorage();
