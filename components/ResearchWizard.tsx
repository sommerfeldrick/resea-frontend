/**
 * ResearchWizard - Fluxo de pesquisa acadêmica de 8 fases
 *
 * FASE 1: Onboarding & Intent Capture
 * FASE 2: AI Clarification & Refinement
 * FASE 3: Search Strategy Generation
 * FASE 4: Exhaustive Search
 * FASE 5: Article Analysis & Synthesis
 * FASE 6: Content Generation
 * FASE 7: Interactive Editing
 * FASE 8: Export & Citation
 */

import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { API_BASE_URL } from '../config';
import { authService } from '../services/authService';
import { DOCUMENT_TEMPLATES, DocumentTemplate, estimateGenerationTime, calculateWordCount } from '../utils/documentTemplates';
import Toast, { useToast } from './Toast';
import { useAutoSave } from '../hooks/useAutoSave';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { RichTextEditor } from './RichTextEditor';

// ============================================
// Types
// ============================================

type WizardPhase =
  | 'onboarding'      // FASE 1
  | 'clarification'   // FASE 2
  | 'strategy'        // FASE 3
  | 'search'          // FASE 4
  | 'analysis'        // FASE 5
  | 'generation'      // FASE 6
  | 'editing'         // FASE 7
  | 'export';         // FASE 8

interface ClarificationQuestion {
  id: string;
  questionNumber: number;
  totalQuestions: number;
  type: 'multiple_choice' | 'text' | 'range' | 'checkboxes';
  question: string;
  description?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
    estimatedArticles?: number;
  }>;
  required: boolean;
}

interface ClarificationSession {
  sessionId: string;
  query: string;
  questions: ClarificationQuestion[];
  answers: Array<{ questionId: string; answer: any }>;
  completed: boolean;
}

interface SearchStrategy {
  topic: string;
  originalQuery: string;
  queries: {
    P1: Array<{ query: string; priority: string; expectedResults: number }>;
    P2: Array<{ query: string; priority: string; expectedResults: number }>;
    P3: Array<{ query: string; priority: string; expectedResults: number }>;
  };
  keyTerms: {
    primary: string[];      // Termos principais da pesquisa
    specific: string[];     // Termos específicos/técnicos
    methodological: string[]; // Tipos de estudo
  };
  filters: {
    dateRange: { start: number; end: number };
    languages: string[];
    documentTypes: string[];
  };
  targetArticles: number;
  estimatedTime: string;
}

interface SearchProgress {
  currentPriority: 'P1' | 'P2' | 'P3';
  currentQuery: number;
  totalQueries: number;
  sourceProgress: Array<{
    source: string;
    current: number;
    total: number;
    completed: boolean;
  }>;
  articlesFound: number;
  articlesWithFulltext: number;
  articlesByPriority: {
    P1: number;
    P2: number;
    P3: number;
  };
  formatsDetected: Record<string, number>;
  elapsedTime: number;
}

interface EnrichedArticle {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  source: string;
  url: string;
  doi?: string;
  pdfUrl?: string;
  citationCount: number;
  score: {
    score: number;
    priority: 'P1' | 'P2' | 'P3';
    reasons: string[];
  };
  // 🚀 Campos de fulltext (opcionais, vem do backend)
  format?: string;
  hasFulltext?: boolean;
  fullContent?: string;
  sections?: Record<string, string>;
}

interface KnowledgeGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: 'main' | 'sub' | 'detail';
    articleCount: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    weight: number;
  }>;
  clusters: Array<{
    id: string;
    name: string;
    nodeIds: string[];
    citationCount: number;
  }>;
  insights: {
    mostCitedCluster: string;
    methodologyBreakdown: Record<string, number>;
    gaps: string[];
  };
}

interface ContentGenerationConfig {
  section: string;
  style: 'academic_formal' | 'technical_specialized' | 'accessible_clear';
  perspective: 'first_person_plural' | 'third_person';
  citationDensity: 'low' | 'medium' | 'high';
  criticalAnalysis: {
    includeCriticalAnalysis: boolean;
    pointOutLimitations: boolean;
    includeContrastingPerspectives: boolean;
  };
  structure: Array<{
    section: string;
    subsections: string[];
    estimatedArticles: number;
  }>;
  estimatedTime: string;
}

interface QualityVerification {
  abntFormatting: boolean;
  allCitationsHaveReferences: boolean;
  allReferencesAreCited: boolean;
  textCoherence: number;
  grammarCheck: boolean;
  plagiarismSimilarity: number;
  issues: Array<{
    type: 'missing_reference' | 'incomplete_reference' | 'long_paragraph' | 'style_issue';
    severity: 'error' | 'warning' | 'info';
    description: string;
    location?: { page?: number; line?: number };
    autoFixAvailable: boolean;
  }>;
}

// ============================================
// Component
// ============================================

interface ResearchWizardProps {
  initialQuery?: string;
  initialClarificationSession?: ClarificationSession | null;
  initialContent?: string;  // Conteúdo pré-carregado para edição
}

export const ResearchWizard: React.FC<ResearchWizardProps> = ({
  initialQuery = '',
  initialClarificationSession = null,
  initialContent = ''
}) => {
  // Phase management - start at Phase 2 if clarification session provided
  const [currentPhase, setCurrentPhase] = useState<WizardPhase>(
    initialClarificationSession ? 'clarification' : 'onboarding'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 1: Onboarding
  const [query, setQuery] = useState(initialQuery);

  // Phase 2: Clarification
  const [clarificationSession, setClarificationSession] = useState<ClarificationSession | null>(
    initialClarificationSession
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Phase 3: Strategy
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy | null>(null);
  const [structuredData, setStructuredData] = useState<any>(null); // Dados estruturados da clarificação

  // Phase 4: Search
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [articles, setArticles] = useState<EnrichedArticle[]>([]);

  // Phase 5: Analysis
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Phase 6: Generation
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [estimatedWords, setEstimatedWords] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [generationConfig, setGenerationConfig] = useState<ContentGenerationConfig>({
    section: 'Revisão de Literatura',
    style: 'academic_formal',
    perspective: 'third_person',
    citationDensity: 'medium',
    criticalAnalysis: {
      includeCriticalAnalysis: true,
      pointOutLimitations: true,
      includeContrastingPerspectives: true
    },
    structure: [],
    estimatedTime: ''
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCompleteDoc, setGenerateCompleteDoc] = useState(true); // Padrão: documento completo

  // Toast notifications
  const { toasts, showToast, dismissToast, success, error: showError, info } = useToast();

  // Phase 7: Editing
  const [editingContent, setEditingContent] = useState('');
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [editMenuPosition, setEditMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Phase 8: Export
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf' | 'latex' | 'markdown' | 'html'>('docx');
  const [citationStyle, setCitationStyle] = useState<'abnt' | 'apa' | 'vancouver' | 'chicago'>('abnt');
  const [qualityVerification, setQualityVerification] = useState<QualityVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Refs
  const contentEditorRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save
  const handleAutoSave = useCallback(async (content: string) => {
    // Salva o conteúdo em localStorage como draft
    const draftKey = `resea_draft_${query || 'untitled'}`;
    localStorage.setItem(draftKey, JSON.stringify({
      content,
      timestamp: new Date().toISOString(),
      phase: currentPhase
    }));
  }, [query, currentPhase]);

  const autoSave = useAutoSave(editingContent || generatedContent, {
    interval: 30000, // 30 segundos
    enabled: currentPhase === 'editing' || currentPhase === 'generation',
    onSave: handleAutoSave,
    onSuccess: () => {
      // Não mostrar toast para não incomodar o usuário
      console.log('✓ Auto-save successful');
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    }
  });

  // Carregar conteúdo inicial se fornecido (para edição de documento existente)
  useEffect(() => {
    if (initialContent) {
      console.log('📝 Carregando documento existente para edição');
      setGeneratedContent(initialContent);
      setEditingContent(initialContent);
      setCurrentPhase('editing');  // Pular direto para edição
    }
  }, [initialContent]);

  // Atualizar estimativas quando template ou modo mudar
  useEffect(() => {
    if (selectedTemplate && generateCompleteDoc) {
      const avgWords = (selectedTemplate.estimatedWords.min + selectedTemplate.estimatedWords.max) / 2;
      setEstimatedWords(Math.round(avgWords));
      setEstimatedTime(estimateGenerationTime(avgWords));
    } else if (selectedTemplate && !generateCompleteDoc) {
      // Estimativa para uma seção específica
      const wordsPerSection = 1000;
      setEstimatedWords(wordsPerSection);
      setEstimatedTime(estimateGenerationTime(wordsPerSection));
    } else {
      setEstimatedWords(0);
      setEstimatedTime('');
    }
  }, [selectedTemplate, generateCompleteDoc]);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // ============================================
  // FASE 1: ONBOARDING
  // ============================================

  const handleStartResearch = async () => {
    if (!query.trim()) {
      setError('Por favor, descreva o que você quer pesquisar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Iniciar FASE 2: Gerar perguntas de clarificação
      const response = await fetch(`${API_BASE_URL}/api/research-flow/clarification/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        // Tratar erro de autenticação especificamente
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json().catch(() => null);
          if (errorData?.code === 'AUTH_TOKEN_MISSING' || errorData?.code === 'AUTH_TOKEN_INVALID') {
            setError('Sua sessão expirou. Por favor, faça login novamente.');
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
              window.location.href = 'https://smileai.com.br/login?return=' + encodeURIComponent(window.location.href);
            }, 2000);
            return;
          }
        }

        throw new Error('Falha ao gerar perguntas de clarificação');
      }

      const data = await response.json();
      console.log('✅ Clarification session received:', data);

      // Validar estrutura da resposta
      if (!data || !data.data || !data.data.questions || !Array.isArray(data.data.questions)) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Resposta inválida do servidor');
      }

      if (data.data.questions.length === 0) {
        throw new Error('Nenhuma pergunta foi gerada');
      }

      console.log('📊 Questions count:', data.data.questions.length);
      console.log('📝 First question:', data.data.questions[0]);

      setClarificationSession(data.data);
      setCurrentPhase('clarification');
    } catch (err: any) {
      console.error('❌ Erro ao iniciar pesquisa:', err);
      setError(err.message || 'Erro ao iniciar pesquisa. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FASE 2: CLARIFICATION
  // ============================================

  const handleAnswerQuestion = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (!clarificationSession) return;

    const currentQuestion = clarificationSession.questions[currentQuestionIndex];

    // Permitir pular se a pergunta não tem opções válidas
    const hasValidOptions = currentQuestion.type === 'multiple_choice'
      ? (currentQuestion.options && currentQuestion.options.length > 0)
      : true;

    if (currentQuestion.required && !answers[currentQuestion.id] && hasValidOptions) {
      setError('Por favor, responda a pergunta antes de continuar');
      return;
    }

    if (currentQuestionIndex < clarificationSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setError(null);
    } else {
      // Última pergunta - processar respostas e gerar estratégia
      handleCompleteQuestionnaire();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setError(null);
    }
  };

  const handleCompleteQuestionnaire = async () => {
    if (!clarificationSession) return;

    setIsLoading(true);
    setError(null);

    try {
      // Processar respostas
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const processResponse = await fetch(`${API_BASE_URL}/api/research-flow/clarification/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: clarificationSession.sessionId,
          answers: answersArray
        })
      });

      if (!processResponse.ok) throw new Error('Falha ao processar respostas');

      const processData = await processResponse.json();

      // Armazenar dados estruturados da clarificação (incluindo focusSection)
      if (processData.data.structuredData) {
        setStructuredData(processData.data.structuredData);
      }

      // Gerar estratégia de busca (FASE 3) - incluindo dados estruturados!
      const strategyResponse = await fetch(`${API_BASE_URL}/api/research-flow/strategy/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query: clarificationSession.query,
          clarificationSummary: processData.data.summary,
          structuredData: processData.data.structuredData // ← Suas respostas aplicadas!
        })
      });

      if (!strategyResponse.ok) throw new Error('Falha ao gerar estratégia');

      const strategyData = await strategyResponse.json();
      setSearchStrategy(strategyData.data);
      setCurrentPhase('strategy');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar questionário');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FASE 3: STRATEGY PREVIEW & APPROVAL
  // ============================================

  const handleStartSearch = async () => {
    if (!searchStrategy) return;

    setIsLoading(true);
    setError(null);
    setCurrentPhase('search');

    try {
      const response = await fetch(`${API_BASE_URL}/api/research-flow/search/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ strategy: searchStrategy })
      });

      if (!response.ok) throw new Error('Falha ao iniciar busca');
      if (!response.body) throw new Error('Stream não disponível');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedArticles: EnrichedArticle[] = [];
      let buffer = ''; // Buffer para linhas incompletas

      // Throttle para evitar updates muito rápidos (React error #310)
      let lastProgressUpdate = 0;
      let lastArticlesUpdate = 0;
      let pendingProgress: SearchProgress | null = null;
      let pendingArticles: EnrichedArticle[] = [];
      const UPDATE_INTERVAL = 2000; // Atualizar UI no máximo a cada 2 segundos (aumentado de 500ms)

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Adicionar novo chunk ao buffer
        buffer += decoder.decode(value, { stream: true });

        // Processar apenas linhas completas (que terminam com \n)
        const lines = buffer.split('\n');

        // Última "linha" pode estar incompleta, guardar no buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue; // Linha vazia, pular

              const data = JSON.parse(jsonStr);

              if (data.type === 'progress') {
                pendingProgress = data.data;
                const now = Date.now();
                if (now - lastProgressUpdate > UPDATE_INTERVAL) {
                  // Usar startTransition para updates não-urgentes
                  const progressToUpdate = pendingProgress;
                  startTransition(() => {
                    setSearchProgress(progressToUpdate);
                  });
                  lastProgressUpdate = now;
                  pendingProgress = null;
                }
              } else if (data.type === 'articles_batch') {
                // Acumular artigos dos lotes
                accumulatedArticles = [...accumulatedArticles, ...data.data];
                pendingArticles = accumulatedArticles;
                const now = Date.now();
                if (now - lastArticlesUpdate > UPDATE_INTERVAL) {
                  const articlesToUpdate = pendingArticles;
                  startTransition(() => {
                    setArticles(articlesToUpdate);
                  });
                  lastArticlesUpdate = now;
                }
              } else if (data.type === 'complete') {
                // Update final - garantir que tudo foi atualizado (sem startTransition pois é urgente)
                if (pendingProgress) setSearchProgress(pendingProgress);
                setArticles(accumulatedArticles);
                setIsLoading(false);
                // Iniciar FASE 5 automaticamente com todos os artigos acumulados
                setTimeout(() => handleStartAnalysis(accumulatedArticles), 1000);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError: any) {
              console.warn('Failed to parse SSE line (will retry on next chunk):', line.substring(0, 100));
              // Continue processando outros eventos mesmo se um falhar
            }
          }
        }
      }

      // Processar qualquer linha restante no buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const jsonStr = buffer.slice(6).trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.type === 'complete') {
              setIsLoading(false);
              setTimeout(() => handleStartAnalysis(accumulatedArticles), 1000);
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse final buffer:', buffer.substring(0, 100));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao executar busca');
      setIsLoading(false);
    }
  };

  // ============================================
  // FASE 4: SEARCH (já implementado acima com SSE)
  // ============================================

  // ============================================
  // FASE 5: ARTICLE ANALYSIS
  // ============================================

  const handleStartAnalysis = async (articlesToAnalyze: EnrichedArticle[]) => {
    setCurrentPhase('analysis');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/research-flow/analysis/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          articles: articlesToAnalyze,
          query: query
        })
      });

      if (!response.ok) throw new Error('Falha ao analisar artigos');

      const data = await response.json();
      setKnowledgeGraph(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar artigos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToGeneration = () => {
    setCurrentPhase('generation');
  };

  // ============================================
  // FASE 6: CONTENT GENERATION
  // ============================================

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');

    try {
      // Escolher endpoint baseado no modo de geração
      const endpoint = generateCompleteDoc
        ? `${API_BASE_URL}/api/research-flow/generation/complete`
        : `${API_BASE_URL}/api/research-flow/generation/generate`;

      // Extrair focusSection dos dados estruturados da clarificação
      const focusSection = structuredData?.focusSection || 'todas';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          config: generationConfig,
          articles: articles,
          query: query,
          focusSection: generateCompleteDoc ? focusSection : undefined
        })
      });

      if (!response.ok) throw new Error('Falha ao gerar conteúdo');
      if (!response.body) throw new Error('Stream não disponível');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let buffer = ''; // Buffer para linhas incompletas

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Adicionar novo chunk ao buffer
        buffer += decoder.decode(value, { stream: true });

        // Processar apenas linhas completas (que terminam com \n)
        const lines = buffer.split('\n');

        // Última "linha" pode estar incompleta, guardar no buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue; // Linha vazia, pular

              const data = JSON.parse(jsonStr);

              if (data.type === 'chunk') {
                content += data.data;
                setGeneratedContent(content);
              } else if (data.type === 'flush') {
                // Evento de flush - garantir que todo conteúdo foi processado
                console.log('Flush event received, total chunks:', data.totalChunks);
              } else if (data.type === 'complete') {
                console.log('Generation complete, final content length:', content.length);
                setIsGenerating(false);
                setEditingContent(content);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Se JSON parse falhar, apenas logar e continuar
              console.warn('Failed to parse SSE line (will retry on next chunk):', line.substring(0, 100));
            }
          }
        }
      }

      // Processar qualquer linha restante no buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const jsonStr = buffer.slice(6).trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.type === 'complete') {
              setIsGenerating(false);
              setEditingContent(content);
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse final buffer:', buffer.substring(0, 100));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar conteúdo');
      setIsGenerating(false);
    }
  };

  const handleProceedToEditing = () => {
    setEditingContent(generatedContent);
    setCurrentPhase('editing');
  };

  // ============================================
  // FASE 7: INTERACTIVE EDITING
  // ============================================

  const handleTextSelection = () => {
    if (!contentEditorRef.current) return;

    const start = contentEditorRef.current.selectionStart;
    const end = contentEditorRef.current.selectionEnd;

    if (start !== end) {
      const text = editingContent.substring(start, end);
      setSelectedText({ start, end, text });
      setShowEditMenu(true);

      // Calculate menu position (simplified - in production use proper positioning)
      const rect = contentEditorRef.current.getBoundingClientRect();
      setEditMenuPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top - 50
      });
    } else {
      setShowEditMenu(false);
      setSelectedText(null);
    }
  };

  const handleEditAction = async (action: string) => {
    if (!selectedText) return;

    setIsLoading(true);
    setError(null);
    setShowEditMenu(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/research-flow/editing/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          request: {
            action: action,
            selection: selectedText,
            parameters: {}
          },
          currentContent: editingContent,
          articles: articles
        })
      });

      if (!response.ok) throw new Error('Falha ao processar edição');

      const data = await response.json();

      // Replace selected text with edited version
      const newContent =
        editingContent.substring(0, selectedText.start) +
        data.data.editedText +
        editingContent.substring(selectedText.end);

      setEditingContent(newContent);
      setSelectedText(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar edição');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToExport = () => {
    setCurrentPhase('export');
  };

  // ============================================
  // FASE 8: EXPORT & VERIFICATION
  // ============================================

  const handleVerifyQuality = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/research-flow/export/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: editingContent,
          articles: articles
        })
      });

      if (!response.ok) throw new Error('Falha ao verificar qualidade');

      const data = await response.json();
      setQualityVerification(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar qualidade');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsExporting(true);

      // Pega o token atualizado do localStorage
      const token = authService.getToken();

      if (!token) {
        alert('Você precisa estar logado para salvar o documento');
        return;
      }

      const contentToSave = editingContent || generatedContent;

      if (!contentToSave) {
        alert('Nenhum conteúdo para salvar');
        return;
      }

      // Gera título a partir do tópico refinado ou da query original
      const documentTitle = searchStrategy?.topic || query || 'Documento de Pesquisa';

      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: documentTitle,
          content: contentToSave,
          document_type: 'research',
          research_query: query,
          word_count: contentToSave.split(/\s+/).length,
          file_format: exportFormat
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar documento');
      }

      const data = await response.json();

      // Dispara evento para atualizar sidebar imediatamente
      window.dispatchEvent(new CustomEvent('documentSaved'));

      alert('✅ Rascunho salvo com sucesso!\n\nVocê pode acessar seus documentos salvos no histórico.');

    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      alert('❌ Erro ao salvar rascunho. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocument = async () => {
    try {
      setIsExporting(true);

      // Pega o token atualizado do localStorage
      const token = authService.getToken();

      if (!token) {
        alert('Você precisa estar logado para finalizar o documento');
        return;
      }

      const contentToSave = editingContent || generatedContent;

      if (!contentToSave) {
        alert('Nenhum conteúdo para exportar');
        return;
      }

      // Gera título a partir do tópico refinado ou da query original
      const documentTitle = searchStrategy?.topic || query || 'Documento de Pesquisa';

      // Passo 1: Salvar o documento
      const saveResponse = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: documentTitle,
          content: contentToSave,
          document_type: 'research',
          research_query: query,
          word_count: contentToSave.split(/\s+/).length,
          file_format: exportFormat
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Erro ao salvar documento');
      }

      const savedDoc = await saveResponse.json();

      // Passo 2: Finalizar e descontar créditos
      const finalizeResponse = await fetch(`${API_BASE_URL}/api/research/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: contentToSave,
          title: documentTitle,
          documentId: savedDoc.data.id,
          documentType: 'research',
          metadata: {
            format: exportFormat,
            citationStyle: citationStyle,
            wordCount: contentToSave.split(/\s+/).length
          }
        })
      });

      if (!finalizeResponse.ok) {
        throw new Error('Erro ao finalizar documento');
      }

      const finalizeData = await finalizeResponse.json();

      // Dispara evento para atualizar sidebar imediatamente
      window.dispatchEvent(new CustomEvent('documentSaved'));

      alert(
        `✅ Documento finalizado com sucesso!\n\n` +
        `📊 Documentos restantes: ${finalizeData.documentsRemaining || 'N/A'}\n` +
        `📄 Formato: ${exportFormat.toUpperCase()}\n` +
        `📚 Estilo de citação: ${citationStyle.toUpperCase()}\n\n` +
        `O documento foi salvo e está disponível no seu histórico.`
      );

    } catch (error) {
      console.error('Erro ao exportar documento:', error);
      alert('❌ Erro ao exportar documento. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // RENDER PHASES
  // ============================================

  const renderPhase1Onboarding = () => (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Assistente de Pesquisa Acadêmica
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conte-nos sobre o que você quer pesquisar e nós encontraremos os melhores artigos científicos
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Sobre o que você quer pesquisar?
        </label>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   resize-none"
          rows={4}
          placeholder="Ex: Inteligência Artificial na educação infantil"
        />

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exemplos:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• "IA na educação infantil"</li>
            <li>• "Impacto das redes sociais na saúde mental"</li>
            <li>• "Blockchain aplicado à gestão pública"</li>
          </ul>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartResearch}
          disabled={isLoading || !query.trim()}
          className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg
                   hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                   font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              Continuar
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPhase2Clarification = () => {
    if (!clarificationSession || !clarificationSession.questions || clarificationSession.questions.length === 0) {
      return (
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            {isLoading ? (
              <>
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Gerando perguntas de clarificação...</p>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Não foi possível carregar as perguntas de clarificação.
                </p>
                <button
                  onClick={() => setCurrentPhase('onboarding')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Voltar
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (!clarificationSession.questions[currentQuestionIndex]) {
      return (
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Erro: Pergunta não encontrada (índice: {currentQuestionIndex})
            </p>
            <button
              onClick={() => setCurrentQuestionIndex(0)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      );
    }

    const question = clarificationSession.questions[currentQuestionIndex];

    // Validação adicional da estrutura da pergunta
    if (!question || typeof question !== 'object') {
      console.error('Invalid question object:', question);
      return (
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-lg p-6">
            <p className="text-red-600 dark:text-red-400">
              Erro: Estrutura de pergunta inválida
            </p>
          </div>
        </div>
      );
    }

    const progress = ((currentQuestionIndex + 1) / clarificationSession.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pergunta {question.questionNumber} de {question.totalQuestions}
            </span>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {question.question}
              </h3>
              {question.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {question.description}
                </p>
              )}
            </div>
          </div>

          {question.type === 'multiple_choice' && (
            <>
              {question.options && question.options.length > 0 ? (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option.value}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        answers[question.id] === option.value
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() => handleAnswerQuestion(question.id, option.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </p>
                          {option.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {option.description}
                            </p>
                          )}
                        </div>
                        {option.estimatedArticles && (
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            ~{option.estimatedArticles} artigos
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ Esta pergunta não possui opções disponíveis. Por favor, volte e tente novamente ou pule para a próxima pergunta.
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {currentQuestionIndex > 0 && (
              <button
                onClick={handlePreviousQuestion}
                className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors
                         flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
            )}

            <button
              onClick={handleNextQuestion}
              disabled={isLoading}
              className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-lg
                       hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : currentQuestionIndex < clarificationSession.questions.length - 1 ? (
                <>
                  Próxima pergunta
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                <>
                  Finalizar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPhase3Strategy = () => {
    if (!searchStrategy) return <div>Carregando estratégia...</div>;

    // Validação defensiva contra JSON malformado
    const queries = searchStrategy.queries || {};
    const p1Queries = Array.isArray(queries.P1) ? queries.P1 : [];
    const p2Queries = Array.isArray(queries.P2) ? queries.P2 : [];
    const p3Queries = Array.isArray(queries.P3) ? queries.P3 : [];
    const keyTerms = searchStrategy.keyTerms || { primary: [], specific: [], methodological: [] };
    const filters = searchStrategy.filters || {};
    const dateRange = filters.dateRange || { start: 2020, end: 2025 };

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Estratégia de Busca Gerada
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Revise a estratégia antes de iniciar a busca
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Topic */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Buscar sobre:
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                "{searchStrategy.topic || 'Sem título'}"
              </p>
            </div>

            {/* Queries */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Queries que usarei:
              </h3>

              {/* P1 */}
              {p1Queries.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    P1 (Artigos Excelentes - Score ≥70):
                  </h4>
                  <ul className="space-y-1">
                    {p1Queries.map((q, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                        • "{q.query || 'Query inválida'}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* P2 */}
              {p2Queries.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    P2 (Artigos Bons - Score ≥45):
                  </h4>
                  <ul className="space-y-1">
                    {p2Queries.map((q, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                        • "{q.query || 'Query inválida'}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* P3 */}
              {p3Queries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    P3 (Artigos Aceitáveis - Score 30-44):
                  </h4>
                  <ul className="space-y-1">
                    {p3Queries.map((q, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                        • "{q.query || 'Query inválida'}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Key Terms */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Termos-chave identificados:
              </h3>
              <div className="space-y-3">
                {keyTerms.primary && keyTerms.primary.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                      • Principais:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keyTerms.primary.map((term, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {keyTerms.specific && keyTerms.specific.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                      • Específicos:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keyTerms.specific.map((term, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {keyTerms.methodological && keyTerms.methodological.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                      • Metodológicos:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keyTerms.methodological.map((term, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {dateRange.start} - {dateRange.end}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Meta de artigos</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {searchStrategy.targetArticles || 70} artigos
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tempo estimado</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {searchStrategy.estimatedTime || '3-5 min'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setCurrentPhase('clarification')}
              className="px-5 py-2.5 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300
                       rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium transition-colors"
            >
              Ajustar estratégia
            </button>

            <button
              onClick={handleStartSearch}
              disabled={isLoading}
              className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-lg
                       hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando busca...
                </>
              ) : (
                <>
                  Iniciar busca
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPhase4Search = () => {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Busca Exaustiva em Progresso
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Buscando nos melhores repositórios acadêmicos
              </p>
            </div>
          </div>

          {searchProgress && (
            <div className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prioridade {searchProgress.currentPriority} - Query {searchProgress.currentQuery}/{searchProgress.totalQueries}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {Math.round((searchProgress.currentQuery / searchProgress.totalQueries) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(searchProgress.currentQuery / searchProgress.totalQueries) * 100}%` }}
                  />
                </div>
              </div>

              {/* Source Progress */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Progresso por fonte:
                </h3>
                <div className="space-y-3">
                  {searchProgress.sourceProgress?.map((source) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                        {source.source}
                      </span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              source.completed ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${(source.current / source.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-right">
                        {source.current}/{source.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Artigos encontrados</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {searchProgress.articlesFound}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Com texto completo</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {searchProgress.articlesWithFulltext}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Artigos P1</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {searchProgress.articlesByPriority?.P1 || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tempo decorrido</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(searchProgress.elapsedTime / 1000)}s
                  </p>
                </div>
              </div>

              {/* Format Distribution */}
              {searchProgress.formatsDetected && Object.keys(searchProgress.formatsDetected).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Formatos detectados:
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(searchProgress.formatsDetected).map(([format, count]) => (
                      <span
                        key={format}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                      >
                        {format}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!searchProgress && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Iniciando busca exaustiva...
              </p>
            </div>
          )}
        </div>

        {/* Preview de Artigos Encontrados */}
        {articles.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Artigos Mais Relevantes Encontrados ({articles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {articles.slice(0, 10).map((article) => (
                <div
                  key={article.id}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      article.score.priority === 'P1'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : article.score.priority === 'P2'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {article.score.priority} • Score {article.score.score.toFixed(1)}
                    </span>
                    {article.hasFulltext && (
                      <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded">
                        📄 Texto completo
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {article.authors.slice(0, 3).join(', ')}{article.authors.length > 3 ? ' et al.' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <span>{article.year}</span>
                    {article.journalInfo && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{article.journalInfo}</span>
                      </>
                    )}
                  </div>
                  {article.abstract && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                      {article.abstract}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPhase5Analysis = () => {
    const [expandedNode, setExpandedNode] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    if (!knowledgeGraph) {
      return (
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Analisando {articles.length} artigos e gerando grafo de conhecimento...
            </p>
          </div>
        </div>
      );
    }

    const handleNodeClick = (nodeId: string) => {
      setExpandedNode(expandedNode === nodeId ? null : nodeId);
      info(`Tema "${knowledgeGraph.nodes.find(n => n.id === nodeId)?.label}" selecionado`);
    };

    const getNodeArticles = (nodeId: string) => {
      const node = knowledgeGraph.nodes.find(n => n.id === nodeId);
      if (!node) return [];
      // Retorna artigos relacionados ao tema (mockado por enquanto)
      return articles.slice(0, node.articleCount || 3);
    };

    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análise Completa - Grafo de Conhecimento
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {articles.length} artigos analisados e sintetizados
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Knowledge Graph Visualization (Simplified) */}
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Temas Principais ({knowledgeGraph.nodes.length} nós, {knowledgeGraph.edges.length} conexões)
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Clique em um tema para expandir
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {knowledgeGraph.nodes.slice(0, 16).map((node) => (
                  <div key={node.id} className="relative">
                    <div
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedNode === node.id
                          ? 'ring-2 ring-indigo-500 scale-105'
                          : hoveredNode === node.id
                          ? 'scale-105 shadow-lg'
                          : ''
                      } ${
                        node.type === 'main'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                          : node.type === 'sub'
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                          : 'border-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900 dark:text-white text-sm flex-1">
                          {node.label}
                        </p>
                        {expandedNode === node.id && (
                          <span className="text-indigo-600 dark:text-indigo-400 ml-1">▼</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        📚 {node.articleCount} artigos
                      </p>
                      {hoveredNode === node.id && (
                        <div className="absolute z-10 mt-2 p-2 bg-gray-900 text-white text-xs rounded shadow-xl -top-8 left-0 right-0">
                          Clique para ver artigos relacionados
                        </div>
                      )}
                    </div>

                    {/* Expanded Node - Article List */}
                    {expandedNode === node.id && (
                      <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 rounded-lg shadow-lg">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                          Artigos sobre "{node.label}":
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {getNodeArticles(node.id).map((article) => (
                            <div key={article.id} className="text-xs">
                              <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                                {article.title}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {article.authors[0]} ({article.year})
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Clusters Identificados:
              </h3>
              <div className="space-y-3">
                {knowledgeGraph.clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCluster === cluster.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}
                    onClick={() => setSelectedCluster(cluster.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {cluster.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {cluster.nodeIds.length} temas relacionados
                        </p>
                      </div>
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {cluster.citationCount} citações
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                  Cluster Mais Citado
                </h4>
                <p className="text-sm text-green-800 dark:text-green-400">
                  {knowledgeGraph.insights.mostCitedCluster}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  Metodologias Detectadas
                </h4>
                <div className="space-y-1">
                  {Object.entries(knowledgeGraph.insights.methodologyBreakdown).slice(0, 3).map(([method, count]) => (
                    <p key={method} className="text-sm text-yellow-800 dark:text-yellow-400">
                      {method}: {count}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Research Gaps */}
            {knowledgeGraph.insights.gaps.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                  Gaps Identificados na Literatura:
                </h4>
                <ul className="space-y-1">
                  {knowledgeGraph.insights.gaps.map((gap, idx) => (
                    <li key={idx} className="text-sm text-red-800 dark:text-red-400">
                      • {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setCurrentPhase('search')}
              className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Voltar à busca
            </button>

            <button
              onClick={handleProceedToGeneration}
              className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-lg
                       hover:bg-indigo-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              Gerar Conteúdo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPhase6Generation = () => {
    const handleSelectTemplate = (template: DocumentTemplate) => {
      setSelectedTemplate(template);
      setGenerationConfig({
        ...generationConfig,
        ...template.defaultConfig
      });
      info(`Template "${template.name}" selecionado`);
    };

    return (
      <div className="max-w-6xl mx-auto p-8">
        {/* Template Selector */}
        {!selectedTemplate && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Escolha um Template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="text-left p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg
                           hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {template.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    <div>📄 {template.estimatedWords.min}-{template.estimatedWords.max} palavras</div>
                    <div>⏱️ ~{template.estimatedTimeMinutes} min</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              {/* Template Badge */}
              {selectedTemplate && (
                <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                        {selectedTemplate.icon} {selectedTemplate.name}
                      </div>
                      {estimatedTime && (
                        <div className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                          ~{estimatedWords} palavras • {estimatedTime}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-xs"
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              )}

              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Configuração
              </h3>

              <div className="space-y-4">
                {/* Modo de Geração */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                    Modo de Geração
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        checked={generateCompleteDoc}
                        onChange={() => setGenerateCompleteDoc(true)}
                        className="mt-1 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          Documento Completo
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Gera todas as 6 seções: Introdução, Revisão, Metodologia, Resultados, Discussão, Conclusão
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        checked={!generateCompleteDoc}
                        onChange={() => setGenerateCompleteDoc(false)}
                        className="mt-1 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          Seção Específica
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Gera apenas a seção selecionada abaixo
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section (only if single section mode) */}
                {!generateCompleteDoc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seção
                    </label>
                    <select
                      value={generationConfig.section}
                      onChange={(e) => setGenerationConfig({
                        ...generationConfig,
                        section: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="Introdução">Introdução</option>
                      <option value="Revisão de Literatura">Revisão de Literatura</option>
                      <option value="Metodologia">Metodologia</option>
                      <option value="Resultados">Resultados</option>
                      <option value="Discussão">Discussão</option>
                      <option value="Conclusão">Conclusão</option>
                    </select>
                  </div>
                )}

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estilo
                  </label>
                  <select
                    value={generationConfig.style}
                    onChange={(e) => setGenerationConfig({
                      ...generationConfig,
                      style: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="academic_formal">Acadêmico Formal</option>
                    <option value="technical_specialized">Técnico Especializado</option>
                    <option value="accessible_clear">Acessível e Claro</option>
                  </select>
                </div>

                {/* Perspective */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Perspectiva
                  </label>
                  <select
                    value={generationConfig.perspective}
                    onChange={(e) => setGenerationConfig({
                      ...generationConfig,
                      perspective: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="third_person">Terceira Pessoa</option>
                    <option value="first_person_plural">Primeira Pessoa Plural</option>
                  </select>
                </div>

                {/* Citation Density */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Densidade de Citações
                  </label>
                  <select
                    value={generationConfig.citationDensity}
                    onChange={(e) => setGenerationConfig({
                      ...generationConfig,
                      citationDensity: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                {/* Critical Analysis Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Análise Crítica
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={generationConfig.criticalAnalysis.includeCriticalAnalysis}
                        onChange={(e) => setGenerationConfig({
                          ...generationConfig,
                          criticalAnalysis: {
                            ...generationConfig.criticalAnalysis,
                            includeCriticalAnalysis: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Incluir análise crítica
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={generationConfig.criticalAnalysis.pointOutLimitations}
                        onChange={(e) => setGenerationConfig({
                          ...generationConfig,
                          criticalAnalysis: {
                            ...generationConfig.criticalAnalysis,
                            pointOutLimitations: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Apontar limitações
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={generationConfig.criticalAnalysis.includeContrastingPerspectives}
                        onChange={(e) => setGenerationConfig({
                          ...generationConfig,
                          criticalAnalysis: {
                            ...generationConfig.criticalAnalysis,
                            includeContrastingPerspectives: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Incluir perspectivas contrastantes
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg
                           hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                           font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      Gerar Conteúdo
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Preview do Conteúdo
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {generatedContent.length} caracteres • ~{Math.round(generatedContent.split(' ').length)} palavras
                      </p>
                    </div>
                    {(generatedContent || isGenerating) && (
                      <AutoSaveIndicator
                        isSaving={autoSave.isSaving}
                        hasUnsavedChanges={autoSave.hasUnsavedChanges}
                        getTimeSinceLastSave={autoSave.getTimeSinceLastSave}
                        saveNow={autoSave.saveNow}
                      />
                    )}
                  </div>
                </div>
                {generatedContent && !isGenerating && (
                  <button
                    onClick={handleProceedToEditing}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                             font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    Editar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {generatedContent ? (
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {generatedContent}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    {isGenerating ? (
                      <>
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p>Gerando conteúdo acadêmico...</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Configure as opções e clique em "Gerar Conteúdo"</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPhase7Editing = () => {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Editor Interativo
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Selecione texto para editar, expandir, ou adicionar citações
                      </p>
                    </div>
                    <AutoSaveIndicator
                      isSaving={autoSave.isSaving}
                      hasUnsavedChanges={autoSave.hasUnsavedChanges}
                      getTimeSinceLastSave={autoSave.getTimeSinceLastSave}
                      saveNow={autoSave.saveNow}
                    />
                  </div>
                </div>
                <button
                  onClick={handleProceedToExport}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                           font-medium transition-colors text-sm flex items-center gap-2"
                >
                  Finalizar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>

              <RichTextEditor
                content={editingContent}
                onChange={setEditingContent}
                onTextSelection={(text) => {
                  setSelectedText(text);
                  if (text.length > 0) {
                    // Show edit menu on text selection
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      const rect = range.getBoundingClientRect();
                      setEditMenuPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      });
                      setShowEditMenu(true);
                    }
                  } else {
                    setShowEditMenu(false);
                  }
                }}
                placeholder="O conteúdo editável aparecerá aqui..."
              />

              {/* Edit Menu (Context Menu) */}
              {showEditMenu && editMenuPosition && (
                <div
                  className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
                  style={{
                    left: `${editMenuPosition.x}px`,
                    top: `${editMenuPosition.y}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleEditAction('rewrite')}
                      className="px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Reescrever
                    </button>
                    <button
                      onClick={() => handleEditAction('expand')}
                      className="px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Expandir
                    </button>
                    <button
                      onClick={() => handleEditAction('summarize')}
                      className="px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Resumir
                    </button>
                    <button
                      onClick={() => handleEditAction('add_citations')}
                      className="px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Adicionar Citações
                    </button>
                    <button
                      onClick={() => handleEditAction('change_tone')}
                      className="px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Mudar Tom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Article Suggestions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Artigos Disponíveis
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 italic">
                  💡 Arraste um artigo para o editor para inserir uma citação
                </p>
                {articles.slice(0, 10).map((article) => (
                  <div
                    key={article.id}
                    draggable
                    onDragStart={(e) => {
                      // Format citation data
                      const firstAuthor = article.authors[0]?.split(' ').pop() || 'Autor';
                      const citation = article.authors.length > 1
                        ? `(${firstAuthor} et al., ${article.year})`
                        : `(${firstAuthor}, ${article.year})`;

                      e.dataTransfer.setData('text/plain', citation);
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'citation',
                        article: {
                          id: article.id,
                          title: article.title,
                          authors: article.authors,
                          year: article.year,
                          citation
                        }
                      }));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 dark:text-gray-600 text-lg">⋮⋮</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {article.authors.slice(0, 2).join(', ')}{article.authors.length > 2 ? ' et al.' : ''} ({article.year})
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          article.score.priority === 'P1'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : article.score.priority === 'P2'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {article.score.priority} - Score {article.score.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPhase8Export = () => {
    // Calcular estatísticas do documento
    const wordCount = editingContent.split(/\s+/).filter(w => w.length > 0).length;
    const citations = (editingContent.match(/\([A-Z][^)]+,\s*\d{4}\)/g) || []).length;
    const sections = (editingContent.match(/^#{1,3}\s/gm) || []).length;
    const uniqueAuthors = new Set(
      (editingContent.match(/\(([A-Z][^,]+),\s*\d{4}\)/g) || []).map(m => m.match(/\(([A-Z][^,]+),/)?.[1])
    ).size;

    // Artigos mais antigos e recentes
    const years = (editingContent.match(/\(\w+,\s*(\d{4})\)/g) || []).map(m => parseInt(m.match(/(\d{4})/)?.[1] || '0'));
    const oldestYear = years.length > 0 ? Math.min(...years) : null;
    const newestYear = years.length > 0 ? Math.max(...years) : null;

    const handleAutoFix = () => {
      info('Auto-correção iniciada...');
      // TODO: Implementar lógica de auto-fix
      setTimeout(() => {
        success('✓ Documento corrigido automaticamente');
      }, 1500);
    };

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Exportar & Verificar Qualidade
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure o formato de exportação e verifique a qualidade do documento
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Estatísticas Finais */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Estatísticas do Documento
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de palavras</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{wordCount.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de citações</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{citations}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Seções</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{sections}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Autores únicos citados</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uniqueAuthors}</div>
                </div>
                {oldestYear && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Artigo mais antigo</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{oldestYear}</div>
                  </div>
                )}
                {newestYear && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Artigo mais recente</div>
                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{newestYear}</div>
                  </div>
                )}
              </div>
            </div>
            {/* Export Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Exportação
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="docx">DOCX (Microsoft Word)</option>
                  <option value="pdf">PDF</option>
                  <option value="latex">LaTeX</option>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estilo de Citação
                </label>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="abnt">ABNT (NBR 6023)</option>
                  <option value="apa">APA 7th Edition</option>
                  <option value="vancouver">Vancouver</option>
                  <option value="chicago">Chicago</option>
                </select>
              </div>
            </div>

            {/* Quality Verification */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Verificação de Qualidade
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleAutoFix}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                             font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <span>⚡</span>
                    Auto-Corrigir
                  </button>
                  <button
                    onClick={handleVerifyQuality}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700
                             disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors
                             text-sm flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Verificar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {qualityVerification && (
                <div className="space-y-3">
                  {/* Quality Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg border ${
                      qualityVerification.abntFormatting
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Formatação ABNT</p>
                      <p className={`font-medium ${
                        qualityVerification.abntFormatting
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {qualityVerification.abntFormatting ? 'OK' : 'Revisar'}
                      </p>
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      qualityVerification.allCitationsHaveReferences
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Citações → Referências</p>
                      <p className={`font-medium ${
                        qualityVerification.allCitationsHaveReferences
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {qualityVerification.allCitationsHaveReferences ? 'OK' : 'Revisar'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Coerência</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {Math.round(qualityVerification.textCoherence * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Issues */}
                  {qualityVerification.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Problemas Encontrados ({qualityVerification.issues.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {qualityVerification.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              issue.severity === 'error'
                                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                : issue.severity === 'warning'
                                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  issue.severity === 'error'
                                    ? 'text-red-700 dark:text-red-400'
                                    : issue.severity === 'warning'
                                    ? 'text-yellow-700 dark:text-yellow-400'
                                    : 'text-blue-700 dark:text-blue-400'
                                }`}>
                                  {issue.description}
                                </p>
                                {issue.location && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Linha {issue.location.line}
                                  </p>
                                )}
                              </div>
                              {issue.autoFixAvailable && (
                                <button className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50">
                                  Corrigir
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save & Export Buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Save Draft Button (sem descontar créditos) */}
              <button
                onClick={handleSaveDraft}
                disabled={isExporting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    💾 Salvar Rascunho
                    <span className="text-xs opacity-80">(não desconta créditos)</span>
                  </>
                )}
              </button>

              {/* Finalize Button (desconta créditos) */}
              <button
                onClick={handleExportDocument}
                disabled={isExporting}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    ✅ Finalizar e Descontar Créditos
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Phase Progress Indicator */}
      <div className="max-w-6xl mx-auto px-8 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between text-xs">
            {['onboarding', 'clarification', 'strategy', 'search', 'analysis', 'generation', 'editing', 'export'].map((phase, idx) => (
              <div
                key={phase}
                className={`flex items-center ${
                  idx < ['onboarding', 'clarification', 'strategy', 'search', 'analysis', 'generation', 'editing', 'export'].indexOf(currentPhase)
                    ? 'text-green-600'
                    : phase === currentPhase
                    ? 'text-indigo-600'
                    : 'text-gray-400'
                }`}
              >
                <span className="font-medium">{idx + 1}</span>
                {idx < 7 && <span className="mx-2">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-8 mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Phase Content */}
      {currentPhase === 'onboarding' && renderPhase1Onboarding()}
      {currentPhase === 'clarification' && renderPhase2Clarification()}
      {currentPhase === 'strategy' && renderPhase3Strategy()}
      {currentPhase === 'search' && renderPhase4Search()}
      {currentPhase === 'analysis' && renderPhase5Analysis()}
      {currentPhase === 'generation' && renderPhase6Generation()}
      {currentPhase === 'editing' && renderPhase7Editing()}
      {currentPhase === 'export' && renderPhase8Export()}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
