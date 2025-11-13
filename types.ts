import type * as Reactflow from 'reactflow';

export interface TaskDescription {
  type: string;
  style: string;
  audience: string;
  wordCount: string;
}

export interface ExecutionPlan {
  thinking: string[];
  research: string[];
  writing: string[];
}

export interface TaskPlan {
  taskTitle: string;
  taskDescription: TaskDescription;
  executionPlan: ExecutionPlan;
}

export interface MindMapData {
    nodes: Reactflow.Node[];
    edges: Reactflow.Edge[];
}

export interface AcademicSource {
    uri: string;
    title: string;
    authors?: string;
    year?: string | number;
    summary?: string; // abstract
    sourceProvider: string;
    citationCount?: number;
}

export interface ResearchResult {
    query: string;
    sources: AcademicSource[];
    summary: string;
}

export interface CompletedResearch {
    id: string;
    query: string;
    taskPlan: TaskPlan;
    mindMapData: MindMapData | null;
    researchResults: ResearchResult[];
    outline: string;
    writtenContent: string;
    timestamp?: number;
}

// ==========================================
// API Types - Credit System
// ==========================================

export interface CreditStats {
    success: boolean;
    plan: string;
    limit: number;
    consumed: number;
    remaining: number;
    percentage: number;
    is_active: boolean;
    next_reset: string;
    purchase_date?: string;
    message?: string;
}

export interface CreditHistoryItem {
    id: number;
    words_used: number;
    action: string;
    document_title: string;
    document_type: string;
    created_at: string;
}

export interface CreditHistoryResponse {
    success: boolean;
    history: CreditHistoryItem[];
    count: number;
}

// ==========================================
// API Types - Documents
// ==========================================

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocumentType = 'research' | 'article' | 'report' | 'essay' | 'other';
export type FileFormat = 'html' | 'pdf' | 'docx' | 'txt' | 'md';
export type StorageType = 'r2' | 'postgresql';

export interface Document {
    id: number;
    user_id?: number;
    title: string;
    content?: string;
    document_type: DocumentType;
    template_id?: string | null;
    research_query?: string;
    status: DocumentStatus;
    word_count: number;
    s3_key?: string | null;
    s3_url?: string | null;
    file_format: FileFormat;
    download_url?: string | null;
    storage_type: StorageType;
    created_at: string;
    updated_at?: string;
}

export interface DocumentsListResponse {
    success: boolean;
    data: Document[];
    pagination: {
        limit: number;
        offset: number;
    };
}

export interface DocumentResponse {
    success: boolean;
    data: Document;
}

export interface DocumentContentResponse {
    success: boolean;
    content: string;
    message?: string;
}

export interface DocumentStatsResponse {
    success: boolean;
    data: {
        total_documents: number;
        total_words: number;
        documents_this_month: number;
        most_used_type: string;
        storage_usage_mb: number;
    };
}

// ==========================================
// API Types - Search History
// ==========================================

export interface SearchHistoryItem {
    id: number;
    query: string;
    results_count: number;
    created_at: string;
}

export interface SearchHistoryResponse {
    success: boolean;
    data: SearchHistoryItem[];
}

// ==========================================
// Grouped Documents (for sidebar)
// ==========================================

export interface GroupedDocuments {
    today: Document[];
    yesterday: Document[];
    thisWeek: Document[];
    older: Document[];
}
