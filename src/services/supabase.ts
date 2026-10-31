// Cloud synchronization and authentication engine powered by Supabase
// Adheres strictly to Zero Privileged Secrets in frontend code

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { StoreName, dbService } from './db';
import { hashPin, generateSalt, verifyPin } from './crypto';
import { ApplicationDataPackage } from '../types';

export type SyncStatus =
  | 'unconfigured'
  | 'unauthenticated'
  | 'locked'
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'paused';

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface UserProfile {
  userId: string;
  pinHash: string;
  pinSalt: string;
  updatedAt: string;
}

// Table names mapping from StoreName to Supabase Postgres tables
export const STORE_TABLE_MAP: Record<StoreName, string> = {
  commitments: 'commitments',
  subjects: 'subjects',
  topics: 'topics',
  subtopics: 'subtopics',
  topicProgress: 'topic_progress',
  studyLogs: 'study_logs',
  weeklyPlans: 'weekly_plans',
  revisions: 'revisions',
  mockTests: 'mock_tests',
  mistakes: 'mistakes',
  universityCourses: 'university_courses',
  universityItems: 'university_items',
  dailyReviews: 'daily_reviews',
  weeklyReviews: 'weekly_reviews',
  settings: 'app_settings',
};

class CloudSyncService {
  private client: SupabaseClient | null = null;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private isUnlocked: boolean = false;
  private cachedProfile: UserProfile | null = null;
  private statusListeners: Array<(status: SyncStatus, message?: string) => void> = [];
  private currentStatus: SyncStatus = 'unconfigured';
  private lastErrorMessage: string = '';

  constructor() {
    this.initFromStorage();
  }

  public onStatusChange(callback: (status: SyncStatus, message?: string) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.currentStatus, this.lastErrorMessage);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private setStatus(status: SyncStatus, message: string = '') {
    this.currentStatus = status;
    this.lastErrorMessage = message;
    for (const listener of this.statusListeners) {
      listener(status, message);
    }
  }

  public getStatus(): { status: SyncStatus; message: string } {
    return { status: this.currentStatus, message: this.lastErrorMessage };
  }

  public getConfig(): CloudConfig | null {
    if (typeof window === 'undefined') return null;
    const url =
      (import.meta.env.VITE_SUPABASE_URL as string) ||
      localStorage.getItem('august_supabase_url') ||
      '';
    const key =
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
      localStorage.getItem('august_supabase_anon_key') ||
      '';
    if (!url || !key) return null;
    return { supabaseUrl: url.trim(), supabaseAnonKey: key.trim() };
  }

  public saveConfig(config: CloudConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('august_supabase_url', config.supabaseUrl.trim());
    localStorage.setItem('august_supabase_anon_key', config.supabaseAnonKey.trim());
    this.initFromStorage();
  }

  public clearConfig(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('august_supabase_url');
    localStorage.removeItem('august_supabase_anon_key');
    this.client = null;
    this.currentUser = null;
    this.currentSession = null;
    this.setStatus('unconfigured', 'Supabase credentials not set');
  }

  public initFromStorage(): void {
    const config = this.getConfig();
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
      this.client = null;
      this.setStatus('unconfigured', 'Supabase project not configured');
      return;
    }

    try {
      this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });

      // Restore session
      this.client.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session) {
          this.currentUser = null;
          this.currentSession = null;
          this.setStatus('unauthenticated', 'Not signed in');
        } else {
          this.currentSession = session;
          this.currentUser = session.user;
          this.checkLockState();
        }
      });

      // Listen for auth state changes
      this.client.auth.onAuthStateChange(async (_event, session) => {
        this.currentSession = session;
        this.currentUser = session?.user || null;
        if (!session) {
          this.setStatus('unauthenticated', 'Signed out');
        } else {
          await this.checkLockState();
        }
      });
    } catch (e: any) {
      this.setStatus('error', e.message || 'Failed to initialize Supabase client');
    }
  }

  // --- PIN Lock & Authentication ---

  public hasPin(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.cachedProfile?.pinHash) return true;
    const localHash = localStorage.getItem('august_local_pin_hash');
    return !!localHash;
  }

  public isAppLocked(): boolean {
    if (typeof window === 'undefined') return false;
    // If user has set a PIN and current session is not unlocked, app is locked
    if (!this.hasPin()) return false;
    const sessionUnlocked = sessionStorage.getItem('august_unlocked') === 'true';
    return !sessionUnlocked;
  }

  public unlockLocally(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('august_unlocked', 'true');
    this.isUnlocked = true;
    this.setStatus('idle', 'App unlocked');
    if (this.isConnected()) {
      this.pullAllFromCloud();
    }
  }

  public lockApp(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('august_unlocked');
    this.isUnlocked = false;
    this.setStatus('locked', 'App locked with PIN');
  }

  public async checkLockState(): Promise<void> {
    if (!this.currentUser) {
      if (this.hasPin() && !sessionStorage.getItem('august_unlocked')) {
        this.setStatus('locked', 'Enter 4-digit PIN to access tracker');
      } else {
        this.setStatus('unauthenticated');
      }
      return;
    }

    // Check if we already unlocked in this browser tab session
    if (typeof window !== 'undefined' && sessionStorage.getItem('august_unlocked') === 'true') {
      this.isUnlocked = true;
      this.setStatus('idle', 'Ready and connected');
      this.pullAllFromCloud();
      return;
    }

    // Check if user has a PIN configured (either in cloud or locally)
    const profile = await this.fetchUserProfile();
    if ((profile && profile.pinHash) || this.hasPin()) {
      // If we have a local PIN but cloud profile does not have it yet, sync to cloud
      if (!profile?.pinHash && this.hasPin()) {
        try {
          const localHash = typeof window !== 'undefined' ? localStorage.getItem('august_local_pin_hash') : null;
          const localSalt = typeof window !== 'undefined' ? localStorage.getItem('august_local_pin_salt') : null;
          if (localHash && localSalt && this.client && this.currentUser) {
            await this.client.from('user_profiles').upsert({
              user_id: this.currentUser.id,
              pin_hash: localHash,
              pin_salt: localSalt,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          }
        } catch (e) {
          console.warn('Could not sync local PIN to cloud user profile:', e);
        }
      }
      this.isUnlocked = false;
      this.setStatus('locked', 'Enter 4-digit PIN to access tracker');
    } else {
      this.isUnlocked = true;
      sessionStorage.setItem('august_unlocked', 'true');
      this.setStatus('idle', 'Connected (PIN setup recommended)');
      this.pullAllFromCloud();
    }
  }

  public async fetchUserProfile(): Promise<UserProfile | null> {
    if (!this.client || !this.currentUser) return null;
    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch user profile:', error.message);
        return null;
      }
      if (!data) return null;

      this.cachedProfile = {
        userId: data.user_id,
        pinHash: data.pin_hash,
        pinSalt: data.pin_salt,
        updatedAt: data.updated_at,
      };
      // Keep local backup in sync
      if (typeof window !== 'undefined') {
        localStorage.setItem('august_local_pin_hash', data.pin_hash);
        localStorage.setItem('august_local_pin_salt', data.pin_salt);
      }
      return this.cachedProfile;
    } catch {
      return null;
    }
  }

  public async verifyAndUnlock(pin: string): Promise<boolean> {
    let profile = this.cachedProfile;
    if (!profile && this.currentUser) {
      profile = await this.fetchUserProfile();
    }

    let salt = profile?.pinSalt;
    let expectedHash = profile?.pinHash;

    if (!salt || !expectedHash) {
      if (typeof window !== 'undefined') {
        salt = localStorage.getItem('august_local_pin_salt') || '';
        expectedHash = localStorage.getItem('august_local_pin_hash') || '';
      }
    }

    if (!salt || !expectedHash) {
      // No PIN configured anywhere
      this.unlockLocally();
      return true;
    }

    const isValid = await verifyPin(pin, salt, expectedHash);
    if (isValid) {
      this.unlockLocally();
      return true;
    }
    return false;
  }

  public async setPin(newPin: string): Promise<void> {
    if (!/^\d{4}$/.test(newPin)) {
      throw new Error('PIN must be exactly 4 numeric digits.');
    }

    const salt = generateSalt();
    const hash = await hashPin(newPin, salt);
    const now = new Date().toISOString();

    // 1. Always save locally first so app lock works reliably on this device
    if (typeof window !== 'undefined') {
      localStorage.setItem('august_local_pin_hash', hash);
      localStorage.setItem('august_local_pin_salt', salt);
    }

    // 2. If connected to Supabase, sync to cloud user_profiles
    if (this.client && this.currentUser) {
      const { error } = await this.client.from('user_profiles').upsert({
        user_id: this.currentUser.id,
        pin_hash: hash,
        pin_salt: salt,
        updated_at: now,
      }, { onConflict: 'user_id' });

      if (error) {
        throw new Error(`Failed to update cloud PIN: ${error.message}`);
      }

      this.cachedProfile = {
        userId: this.currentUser.id,
        pinHash: hash,
        pinSalt: salt,
        updatedAt: now,
      };
    } else {
      this.cachedProfile = {
        userId: 'local_user',
        pinHash: hash,
        pinSalt: salt,
        updatedAt: now,
      };
    }
  }

  public async clearPin(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('august_local_pin_hash');
      localStorage.removeItem('august_local_pin_salt');
    }
    this.cachedProfile = null;

    if (this.client && this.currentUser) {
      try {
        await this.client.from('user_profiles').upsert({
          user_id: this.currentUser.id,
          pin_hash: '',
          pin_salt: '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Could not clear cloud PIN:', err);
      }
    }
    this.unlockLocally();
  }

  public async signUp(email: string, pass: string, initialPin?: string): Promise<void> {
    if (!this.client) throw new Error('Supabase client is not configured.');
    const { data, error } = await this.client.auth.signUp({
      email,
      password: pass,
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = data.user;
      this.currentSession = data.session;
      if (!data.session) {
        throw new Error('Account created, but email confirmation is required by Supabase. In Supabase Dashboard -> Authentication -> Users, click "..." next to your email and select "Auto-confirm user", then sign in.');
      }
      if (initialPin && /^\d{4}$/.test(initialPin)) {
        await this.setPin(initialPin);
      }
      this.unlockLocally();
    }
  }

  public async signIn(email: string, pass: string): Promise<void> {
    if (!this.client) throw new Error('Supabase client is not configured.');
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = data.user;
      this.currentSession = data.session;
      // Master password explicitly grants access: unlock immediately
      this.unlockLocally();
      await this.checkLockState();
    }
  }

  public async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.currentUser = null;
    this.currentSession = null;
    this.cachedProfile = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('august_unlocked');
    }
    this.setStatus('unauthenticated', 'Signed out');
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public isConnected(): boolean {
    return !!this.client && !!this.currentUser && !!this.currentSession;
  }

  // --- Bi-directional Cloud Synchronization ---

  public async pushItem(storeName: StoreName, item: any): Promise<void> {
    if (!this.isConnected() || !this.client || !this.currentUser) return;
    const table = STORE_TABLE_MAP[storeName];
    if (!table) return;

    try {
      this.setStatus('syncing', `Syncing ${storeName}...`);
      const { error } = await this.client.from(table).upsert({
        id: String(item.id),
        user_id: this.currentUser.id,
        data: item,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, id' });

      if (error) {
        console.warn(`Supabase push error on ${table}:`, error.message);
        if (error.message.includes('paused') || error.code === '57P01') {
          this.setStatus('paused', 'Database paused due to 7-day inactivity');
        } else {
          this.setStatus('error', error.message);
        }
      } else {
        this.setStatus('synced', 'Synced with cloud');
      }
    } catch (e: any) {
      console.warn(`Cloud push exception on ${storeName}:`, e);
      this.setStatus('error', e.message);
    }
  }

  public async deleteItem(storeName: StoreName, id: string): Promise<void> {
    if (!this.isConnected() || !this.client || !this.currentUser) return;
    const table = STORE_TABLE_MAP[storeName];
    if (!table) return;

    try {
      this.setStatus('syncing', `Deleting from ${storeName}...`);
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', String(id))
        .eq('user_id', this.currentUser.id);

      if (error) {
        console.warn(`Supabase delete error on ${table}:`, error.message);
        this.setStatus('error', error.message);
      } else {
        this.setStatus('synced', 'Synced with cloud');
      }
    } catch (e: any) {
      console.warn(`Cloud delete exception on ${storeName}:`, e);
      this.setStatus('error', e.message);
    }
  }

  public async pullAllFromCloud(): Promise<{ pulledCount: number; errors: string[] }> {
    if (!this.isConnected() || !this.client || !this.currentUser) {
      return { pulledCount: 0, errors: ['Not connected to cloud'] };
    }

    this.setStatus('syncing', 'Pulling updates from cloud...');
    let pulledCount = 0;
    const errors: string[] = [];

    const storeNames = Object.keys(STORE_TABLE_MAP) as StoreName[];

    for (const storeName of storeNames) {
      const table = STORE_TABLE_MAP[storeName];
      try {
        const { data, error } = await this.client
          .from(table)
          .select('id, data, updated_at')
          .eq('user_id', this.currentUser.id);

        if (error) {
          if (error.message.includes('paused') || error.code === '57P01') {
            this.setStatus('paused', 'Supabase free database is paused due to inactivity.');
            return { pulledCount, errors: ['Database paused'] };
          }
          errors.push(`${table}: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          for (const row of data) {
            if (row.data) {
              await dbService.putSilent(storeName, row.data);
              pulledCount++;
            }
          }
        }
      } catch (e: any) {
        errors.push(`${table}: ${e.message}`);
      }
    }

    if (errors.length > 0) {
      this.setStatus('error', `Sync issues: ${errors[0]}`);
    } else {
      this.setStatus('synced', `All records synced (${pulledCount} items)`);
    }

    return { pulledCount, errors };
  }

  public async getCloudRecordCount(): Promise<number> {
    if (!this.isConnected() || !this.client || !this.currentUser) return 0;
    let total = 0;
    const storeNames = Object.keys(STORE_TABLE_MAP) as StoreName[];
    for (const store of storeNames) {
      const table = STORE_TABLE_MAP[store];
      try {
        const { count, error } = await this.client
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.currentUser.id);
        if (!error && count) {
          total += count;
        }
      } catch {
        // ignore count probe error
      }
    }
    return total;
  }

  public async migrateLocalDataToCloud(mode: 'merge' | 'replace' = 'merge'): Promise<{
    success: boolean;
    totalUploaded: number;
    details: Record<string, number>;
    error?: string;
  }> {
    if (!this.isConnected() || !this.client || !this.currentUser || !this.currentSession) {
      throw new Error('You must be signed in with an active cloud session before migrating data. Please check your login state.');
    }

    this.setStatus('syncing', 'Uploading local data to cloud...');
    const details: Record<string, number> = {};
    let totalUploaded = 0;

    try {
      const pkg: ApplicationDataPackage = await dbService.exportFullPackage();
      const d = pkg.data;

      const mapping: Array<{ store: StoreName; items: any[] }> = [
        { store: 'commitments', items: d.commitments || [] },
        { store: 'subjects', items: d.subjects || [] },
        { store: 'topics', items: d.topics || [] },
        { store: 'subtopics', items: d.subtopics || [] },
        { store: 'topicProgress', items: d.topicProgress || [] },
        { store: 'studyLogs', items: d.studyLogs || [] },
        { store: 'weeklyPlans', items: d.weeklyPlans || [] },
        { store: 'revisions', items: d.revisions || [] },
        { store: 'mockTests', items: d.mockTests || [] },
        { store: 'mistakes', items: d.mistakes || [] },
        { store: 'universityCourses', items: d.universityCourses || [] },
        { store: 'universityItems', items: d.universityItems || [] },
        { store: 'dailyReviews', items: d.dailyReviews || [] },
        { store: 'weeklyReviews', items: d.weeklyReviews || [] },
        { store: 'settings', items: d.settings ? [d.settings] : [] },
      ];

      for (const { store, items } of mapping) {
        if (!items || items.length === 0) {
          details[store] = 0;
          continue;
        }

        const table = STORE_TABLE_MAP[store];

        // If replacing, clear cloud table for this user first
        if (mode === 'replace') {
          await this.client
            .from(table)
            .delete()
            .eq('user_id', this.currentUser.id);
        }

        const rows = items.map((item) => ({
          id: String(item.id),
          user_id: this.currentUser!.id,
          data: item,
          updated_at: new Date().toISOString(),
        }));

        // Batch upload in chunks of 50
        const CHUNK_SIZE = 50;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          const { error } = await this.client.from(table).upsert(chunk, { onConflict: 'user_id, id' });
          if (error) {
            throw new Error(`Failed to upload to ${table}: ${error.message}`);
          }
        }

        details[store] = items.length;
        totalUploaded += items.length;
      }

      // After upload, pull remote changes to ensure local IndexedDB has all unified records
      await this.pullAllFromCloud();

      this.setStatus('synced', `Migrated ${totalUploaded} records to cloud successfully`);
      return { success: true, totalUploaded, details };
    } catch (e: any) {
      this.setStatus('error', e.message);
      return { success: false, totalUploaded, details, error: e.message };
    }
  }
}

export const cloudSyncService = new CloudSyncService();

// Register the cloud sync hook into dbService for transparent write-through
dbService.setCloudHook({
  pushItem: (store, item) => cloudSyncService.pushItem(store, item),
  deleteItem: (store, id) => cloudSyncService.deleteItem(store, id),
});
