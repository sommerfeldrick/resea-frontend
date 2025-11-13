/**
 * Document Service - API integration for documents management
 *
 * Handles all document-related operations including:
 * - Listing documents
 * - Getting document details
 * - Downloading documents
 * - Deleting documents
 * - Document statistics
 * - Search history
 */

import type {
  Document,
  DocumentsListResponse,
  DocumentResponse,
  DocumentContentResponse,
  DocumentStatsResponse,
  SearchHistoryResponse,
  GroupedDocuments
} from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Generic API request helper with authentication
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token
  const token = authService.getToken();

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || 'Request failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API request failed: ${endpoint}`, error);
    throw new Error(error.message || 'Failed to connect to server');
  }
}

// ==========================================
// Documents API
// ==========================================

/**
 * List user documents with pagination
 */
export async function listDocuments(
  limit: number = 50,
  offset: number = 0
): Promise<DocumentsListResponse> {
  return apiRequest<DocumentsListResponse>(
    `/api/documents?limit=${limit}&offset=${offset}`
  );
}

/**
 * Get specific document by ID
 */
export async function getDocument(documentId: number): Promise<Document> {
  const response = await apiRequest<DocumentResponse>(`/api/documents/${documentId}`);
  return response.data;
}

/**
 * Get document content (full HTML/text)
 */
export async function getDocumentContent(documentId: number): Promise<string> {
  const response = await apiRequest<DocumentContentResponse>(
    `/api/documents/${documentId}/content`
  );
  return response.content;
}

/**
 * Download document as file
 */
export async function downloadDocument(documentId: number): Promise<void> {
  const token = authService.getToken();
  const url = `${API_BASE_URL}/api/documents/${documentId}/download`;

  try {
    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || 'document.html';

    // Create download link
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    console.log('✅ Document downloaded:', filename);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Delete document by ID
 */
export async function deleteDocument(documentId: number): Promise<void> {
  await apiRequest(`/api/documents/${documentId}`, {
    method: 'DELETE'
  });
  console.log('✅ Document deleted:', documentId);
}

/**
 * Get user document statistics
 */
export async function getDocumentStats(): Promise<DocumentStatsResponse['data']> {
  const response = await apiRequest<DocumentStatsResponse>('/api/documents/stats/user');
  return response.data;
}

// ==========================================
// Search History API
// ==========================================

/**
 * Save search to history
 */
export async function saveSearch(
  query: string,
  resultsCount: number
): Promise<void> {
  await apiRequest('/api/documents/search/save', {
    method: 'POST',
    body: JSON.stringify({ query, results_count: resultsCount })
  });
  console.log('✅ Search saved to history');
}

/**
 * Get search history
 */
export async function getSearchHistory(limit: number = 20): Promise<SearchHistoryResponse['data']> {
  const response = await apiRequest<SearchHistoryResponse>(
    `/api/documents/search/history?limit=${limit}`
  );
  return response.data;
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Group documents by date for sidebar display
 */
export function groupDocumentsByDate(documents: Document[]): GroupedDocuments {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  return {
    today: documents.filter(d => {
      const date = new Date(d.created_at);
      return date >= today;
    }),
    yesterday: documents.filter(d => {
      const date = new Date(d.created_at);
      return date >= yesterday && date < today;
    }),
    thisWeek: documents.filter(d => {
      const date = new Date(d.created_at);
      return date >= thisWeek && date < yesterday;
    }),
    older: documents.filter(d => {
      const date = new Date(d.created_at);
      return date < thisWeek;
    })
  };
}

/**
 * Format document type for display
 */
export function formatDocumentType(type: string): string {
  const types: Record<string, string> = {
    'research': 'Pesquisa',
    'article': 'Artigo',
    'report': 'Relatório',
    'essay': 'Ensaio',
    'other': 'Outro'
  };
  return types[type] || type;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Document Service class for managing state and caching
 */
class DocumentService {
  private documentsCache: Document[] | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get documents with caching
   */
  async getDocuments(forceRefresh: boolean = false): Promise<Document[]> {
    const now = Date.now();

    // Return cache if valid and not forcing refresh
    if (!forceRefresh && this.documentsCache && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.documentsCache;
    }

    // Fetch fresh data
    const response = await listDocuments();
    this.documentsCache = response.data;
    this.cacheTime = now;

    return this.documentsCache;
  }

  /**
   * Invalidate cache
   */
  invalidateCache(): void {
    this.documentsCache = null;
    this.cacheTime = 0;
  }

  /**
   * Refresh documents
   */
  async refresh(): Promise<Document[]> {
    return this.getDocuments(true);
  }
}

export const documentService = new DocumentService();
