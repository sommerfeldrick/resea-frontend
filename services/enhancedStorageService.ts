/**
 * Enhanced Storage Service
 * Adds versioning, auto-save, and advanced features
 */

import type { CompletedResearch } from '../types';
import { saveResearch, loadAllResearch } from './storageService';

// ==========================================
// VERSIONING SYSTEM
// ==========================================

interface ResearchVersion {
  versionId: string;
  researchId: string;
  timestamp: number;
  content: string;
  outline: string;
  comment?: string;
}

const VERSION_STORE = 'research_versions';

async function openVersionDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReseaDB', 2); // Bump version

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create versions store if doesn't exist
      if (!db.objectStoreNames.contains(VERSION_STORE)) {
        const store = db.createObjectStore(VERSION_STORE, { keyPath: 'versionId' });
        store.createIndex('researchId', 'researchId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export async function saveVersion(
  researchId: string,
  content: string,
  outline: string,
  comment?: string
): Promise<void> {
  const db = await openVersionDB();

  const version: ResearchVersion = {
    versionId: `${researchId}_v${Date.now()}`,
    researchId,
    timestamp: Date.now(),
    content,
    outline,
    comment
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VERSION_STORE], 'readwrite');
    const store = transaction.objectStore(VERSION_STORE);
    const request = store.add(version);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getVersions(researchId: string): Promise<ResearchVersion[]> {
  const db = await openVersionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VERSION_STORE], 'readonly');
    const store = transaction.objectStore(VERSION_STORE);
    const index = store.index('researchId');
    const request = index.getAll(researchId);

    request.onsuccess = () => {
      const versions = request.result as ResearchVersion[];
      resolve(versions.sort((a, b) => b.timestamp - a.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function restoreVersion(versionId: string): Promise<ResearchVersion | null> {
  const db = await openVersionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VERSION_STORE], 'readonly');
    const store = transaction.objectStore(VERSION_STORE);
    const request = store.get(versionId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// AUTO-SAVE SYSTEM
// ==========================================

interface AutoSaveState {
  researchId: string;
  content: string;
  outline: string;
  lastSaved: number;
}

const AUTO_SAVE_KEY = 'resea_autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export class AutoSaveManager {
  private intervalId: number | null = null;
  private currentState: AutoSaveState | null = null;

  start(researchId: string, getContent: () => { content: string; outline: string }) {
    // Clear existing interval
    this.stop();

    // Save immediately
    this.save(researchId, getContent);

    // Set up interval
    this.intervalId = window.setInterval(() => {
      this.save(researchId, getContent);
    }, AUTO_SAVE_INTERVAL);

    console.log('✅ Auto-save started');
  }

  private async save(researchId: string, getContent: () => { content: string; outline: string }) {
    try {
      const { content, outline } = getContent();

      // Check if content changed
      if (
        this.currentState &&
        this.currentState.content === content &&
        this.currentState.outline === outline
      ) {
        return; // No changes, skip save
      }

      // Update state
      this.currentState = {
        researchId,
        content,
        outline,
        lastSaved: Date.now()
      };

      // Save to localStorage (fast backup)
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(this.currentState));

      // Save version to IndexedDB
      await saveVersion(researchId, content, outline, 'Auto-save');

      console.log('💾 Auto-saved at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Auto-save stopped');
    }
  }

  async getLastSave(): Promise<AutoSaveState | null> {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  clearAutoSave() {
    localStorage.removeItem(AUTO_SAVE_KEY);
    this.currentState = null;
  }
}

// ==========================================
// ANALYTICS & STATS
// ==========================================

export async function getStorageStats() {
  try {
    const history = await loadAllResearch();

    const totalResearches = history.length;
    const totalWords = history.reduce((sum, r) => {
      return sum + (r.writtenContent?.split(/\s+/).length || 0);
    }, 0);

    const totalSources = history.reduce((sum, r) => {
      return sum + (r.researchResults?.reduce((s, rr) => s + rr.sources.length, 0) || 0);
    }, 0);

    // Estimate storage size
    const estimate = await (navigator.storage?.estimate?.() || Promise.resolve({ usage: 0, quota: 0 }));

    return {
      totalResearches,
      totalWords,
      totalSources,
      storageUsed: estimate.usage || 0,
      storageQuota: estimate.quota || 0,
      percentageUsed: estimate.quota ? (estimate.usage! / estimate.quota * 100).toFixed(2) : '0'
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
}

// ==========================================
// SEARCH & FILTER
// ==========================================

export async function searchResearches(query: string): Promise<CompletedResearch[]> {
  const history = await loadAllResearch();
  const lowerQuery = query.toLowerCase();

  return history.filter(research => {
    return (
      research.query.toLowerCase().includes(lowerQuery) ||
      research.taskPlan?.taskTitle.toLowerCase().includes(lowerQuery) ||
      research.writtenContent?.toLowerCase().includes(lowerQuery)
    );
  });
}

export async function filterResearchesByDate(
  startDate: Date,
  endDate: Date
): Promise<CompletedResearch[]> {
  const history = await loadAllResearch();

  return history.filter(research => {
    const timestamp = research.timestamp || 0;
    return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
  });
}

// ==========================================
// EXPORT DATA (Backup)
// ==========================================

export async function exportAllData(): Promise<string> {
  const history = await loadAllResearch();
  const stats = await getStorageStats();

  const backup = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    stats,
    researches: history
  };

  return JSON.stringify(backup, null, 2);
}

export async function downloadBackup() {
  const data = await exportAllData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `resea_backup_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// IMPORT DATA (Restore)
// ==========================================

export async function importBackup(jsonString: string): Promise<number> {
  try {
    const backup = JSON.parse(jsonString);

    if (!backup.researches || !Array.isArray(backup.researches)) {
      throw new Error('Invalid backup format');
    }

    let imported = 0;
    for (const research of backup.researches) {
      await saveResearch(research);
      imported++;
    }

    return imported;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// ==========================================
// CLEANUP
// ==========================================

export async function deleteOldResearches(daysOld: number): Promise<number> {
  const history = await loadAllResearch();
  const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  let deleted = 0;
  for (const research of history) {
    if ((research.timestamp || 0) < cutoffDate) {
      // Would need to implement deleteResearch in base storageService
      deleted++;
    }
  }

  return deleted;
}

// ==========================================
// COMMENTS SYSTEM
// ==========================================

interface Comment {
  id: string;
  researchId: string;
  position: number; // Character position in content
  text: string;
  author: string;
  timestamp: number;
  resolved: boolean;
}

const COMMENTS_KEY_PREFIX = 'resea_comments_';

export function saveComment(comment: Comment): void {
  const key = `${COMMENTS_KEY_PREFIX}${comment.researchId}`;
  const existing = getComments(comment.researchId);
  existing.push(comment);
  localStorage.setItem(key, JSON.stringify(existing));
}

export function getComments(researchId: string): Comment[] {
  const key = `${COMMENTS_KEY_PREFIX}${researchId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export function resolveComment(researchId: string, commentId: string): void {
  const comments = getComments(researchId);
  const comment = comments.find(c => c.id === commentId);
  if (comment) {
    comment.resolved = true;
    const key = `${COMMENTS_KEY_PREFIX}${researchId}`;
    localStorage.setItem(key, JSON.stringify(comments));
  }
}

export function deleteComment(researchId: string, commentId: string): void {
  const comments = getComments(researchId);
  const filtered = comments.filter(c => c.id !== commentId);
  const key = `${COMMENTS_KEY_PREFIX}${researchId}`;
  localStorage.setItem(key, JSON.stringify(filtered));
}

// ==========================================
// VERSION MANAGER CLASS
// ==========================================

export class VersionManager {
  createVersion(researchId: string, content: string, outline: string, comment?: string): void {
    saveVersion(researchId, content, outline, comment).catch(err => {
      console.error('Failed to create version:', err);
    });
  }

  async getVersionHistory(researchId: string): Promise<ResearchVersion[]> {
    return await getVersions(researchId);
  }

  async restore(versionId: string): Promise<ResearchVersion | null> {
    return await restoreVersion(versionId);
  }
}

// ==========================================
// ANALYTICS MANAGER CLASS
// ==========================================

interface CompletionData {
  wordsGenerated: number;
  sourcesUsed: number;
  timeSpent: number;
  phases: string[];
}

export class AnalyticsManager {
  private analytics: Map<string, CompletionData> = new Map();

  trackCompletion(researchId: string, data: CompletionData): void {
    this.analytics.set(researchId, data);
    
    // Salvar no localStorage
    try {
      const key = `resea_analytics_${researchId}`;
      localStorage.setItem(key, JSON.stringify(data));
      console.log('📊 Analytics tracked:', data);
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }

  getAnalytics(researchId: string): CompletionData | null {
    // Tentar obter do cache
    if (this.analytics.has(researchId)) {
      return this.analytics.get(researchId)!;
    }

    // Tentar obter do localStorage
    try {
      const key = `resea_analytics_${researchId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        this.analytics.set(researchId, data);
        return data;
      }
    } catch (error) {
      console.error('Failed to get analytics:', error);
    }

    return null;
  }

  async getAggregatedStats(): Promise<{
    totalResearches: number;
    totalWords: number;
    totalSources: number;
    averageTime: number;
  }> {
    try {
      const history = await loadAllResearch();
      
      let totalWords = 0;
      let totalSources = 0;
      let totalTime = 0;
      let count = 0;

      for (const research of history) {
        const analytics = this.getAnalytics(research.id);
        if (analytics) {
          totalWords += analytics.wordsGenerated;
          totalSources += analytics.sourcesUsed;
          totalTime += analytics.timeSpent;
          count++;
        }
      }

      return {
        totalResearches: history.length,
        totalWords,
        totalSources,
        averageTime: count > 0 ? totalTime / count : 0
      };
    } catch (error) {
      console.error('Failed to get aggregated stats:', error);
      return {
        totalResearches: 0,
        totalWords: 0,
        totalSources: 0,
        averageTime: 0
      };
    }
  }
}

// ==========================================
// EXPORT ALL
// ==========================================

export const enhancedStorageService = {
  saveVersion,
  getVersions,
  restoreVersion,
  AutoSaveManager,
  VersionManager,
  AnalyticsManager,
  getStorageStats,
  searchResearches,
  filterResearchesByDate,
  exportAllData,
  downloadBackup,
  importBackup,
  deleteOldResearches,
  saveComment,
  getComments,
  resolveComment,
  deleteComment
};
