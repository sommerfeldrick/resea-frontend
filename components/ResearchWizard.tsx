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

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

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
  prioritizedSources: Array<{
    name: string;
    reason: string;
    order: number;
  }>;
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
  articlesFound: number;
  articlesWithFulltext: number;
  articlesByPriority: {
    P1: number;
    P2: number;
    P3: number;
  };
  elapsedTime: number;
}

// ============================================
// Component
// ============================================

export const ResearchWizard: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<WizardPhase>('onboarding');
  const [query, setQuery] = useState('');
  const [clarificationSession, setClarificationSession] = useState<ClarificationSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy | null>(null);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(`${API_BASE_URL}/research-flow/clarification/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error('Falha ao gerar perguntas');

      const data = await response.json();
      setClarificationSession(data.data);
      setCurrentPhase('clarification');
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar pesquisa');
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
    if (currentQuestion.required && !answers[currentQuestion.id]) {
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

      const processResponse = await fetch(`${API_BASE_URL}/research-flow/clarification/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: clarificationSession.sessionId,
          answers: answersArray
        })
      });

      if (!processResponse.ok) throw new Error('Falha ao processar respostas');

      const processData = await processResponse.json();

      // Gerar estratégia de busca (FASE 3)
      const strategyResponse = await fetch(`${API_BASE_URL}/research-flow/strategy/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: clarificationSession.query,
          clarificationSummary: processData.data.summary
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
      // Usar EventSource para receber progresso em tempo real
      const eventSource = new EventSource(
        `${API_BASE_URL}/research-flow/search/execute`,
        {
          // withCredentials: true
        }
      );

      // Enviar estratégia via POST primeiro (hack: usar fetch tradicional)
      // Na prática, você precisaria usar um endpoint separado ou WebSocket

      // Por enquanto, vou simular com fetch normal
      const response = await fetch(`${API_BASE_URL}/research-flow/search/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: searchStrategy })
      });

      // TODO: Implementar SSE corretamente

    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar busca');
      setIsLoading(false);
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
    if (!clarificationSession || !clarificationSession.questions[currentQuestionIndex]) {
      return <div>Carregando...</div>;
    }

    const question = clarificationSession.questions[currentQuestionIndex];
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

          {question.type === 'multiple_choice' && question.options && (
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
                "{searchStrategy.topic}"
              </p>
            </div>

            {/* Queries */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Queries que usarei:
              </h3>

              {/* P1 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  P1 (Artigos Excelentes - Score ≥75):
                </h4>
                <ul className="space-y-1">
                  {searchStrategy.queries.P1.map((q, idx) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                      • "{q.query}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* P2 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  P2 (Artigos Bons - Score ≥50):
                </h4>
                <ul className="space-y-1">
                  {searchStrategy.queries.P2.map((q, idx) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                      • "{q.query}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* P3 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  P3 (Artigos Aceitáveis - Score ≥30):
                </h4>
                <ul className="space-y-1">
                  {searchStrategy.queries.P3.map((q, idx) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                      • "{q.query}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sources */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Fontes priorizadas:
              </h3>
              <ol className="space-y-2">
                {searchStrategy.prioritizedSources.map((source) => (
                  <li key={source.order} className="flex items-start gap-2">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {source.order}.
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {source.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        - {source.reason}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {searchStrategy.filters.dateRange.start} - {searchStrategy.filters.dateRange.end}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Meta de artigos</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {searchStrategy.targetArticles} artigos
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tempo estimado</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {searchStrategy.estimatedTime}
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Buscando artigos...
          </h2>

          {/* TODO: Implementar visualização de progresso em tempo real */}
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Executando busca exaustiva...
            </p>
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
      {currentPhase === 'onboarding' && renderPhase1Onboarding()}
      {currentPhase === 'clarification' && renderPhase2Clarification()}
      {currentPhase === 'strategy' && renderPhase3Strategy()}
      {currentPhase === 'search' && renderPhase4Search()}
      {currentPhase === 'analysis' && (
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">
          FASE 5: Article Analysis (em desenvolvimento)
        </div>
      )}
      {currentPhase === 'generation' && (
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">
          FASE 6: Content Generation (em desenvolvimento)
        </div>
      )}
      {currentPhase === 'editing' && (
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">
          FASE 7: Interactive Editing (em desenvolvimento)
        </div>
      )}
      {currentPhase === 'export' && (
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">
          FASE 8: Export & Citation (em desenvolvimento)
        </div>
      )}
    </div>
  );
};
