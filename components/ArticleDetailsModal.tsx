/**
 * ArticleDetailsModal - Full article details in a modal
 */

import React from 'react';

interface Article {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  source: string;
  url: string;
  doi?: string;
  journalInfo?: string;
  citationCount?: number;
  score: {
    score: number;
    priority: 'P1' | 'P2' | 'P3';
    reasons: string[];
  };
  hasFulltext: boolean;
  pdfUrl?: string;
  fullContent?: string;
  sections?: Record<string, string>;
}

interface Props {
  article: Article | null;
  onClose: () => void;
}

export const ArticleDetailsModal: React.FC<Props> = ({ article, onClose }) => {
  if (!article) return null;

  // Extract keywords from title and abstract
  const extractKeywords = (text: string): string[] => {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can']);
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const wordFreq: Record<string, number> = {};

    words.forEach(word => {
      if (!commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
  };

  const keywords = extractKeywords((article.title + ' ' + article.abstract).substring(0, 1000));

  // Detect methodology from abstract
  const detectMethodology = (abstract: string): string => {
    const lower = abstract.toLowerCase();
    if (lower.includes('systematic review') || lower.includes('meta-analysis')) return 'Revisão Sistemática';
    if (lower.includes('randomized') || lower.includes('controlled trial')) return 'Ensaio Clínico';
    if (lower.includes('survey') || lower.includes('questionnaire')) return 'Survey';
    if (lower.includes('finite element') || lower.includes('simulation')) return 'Simulação/Modelagem';
    if (lower.includes('in vitro')) return 'Estudo In Vitro';
    if (lower.includes('in vivo')) return 'Estudo In Vivo';
    if (lower.includes('retrospective')) return 'Estudo Retrospectivo';
    if (lower.includes('prospective')) return 'Estudo Prospectivo';
    if (lower.includes('case study')) return 'Estudo de Caso';
    return 'Não especificada';
  };

  const methodology = detectMethodology(article.abstract);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* Modal */}
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
                <p className="text-indigo-100 text-sm">
                  {article.authors.slice(0, 5).join(', ')}{article.authors.length > 5 ? ' et al.' : ''} • {article.year}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {article.score.score}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {article.score.priority}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Prioridade</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {article.citationCount || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Citações</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {article.hasFulltext ? 'Sim' : 'Não'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Fulltext</div>
              </div>
            </div>

            {/* Publication Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informações de Publicação
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Fonte:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{article.source}</span>
                </div>
                {article.journalInfo && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Journal:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{article.journalInfo}</span>
                  </div>
                )}
                {article.doi && (
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">DOI:</span>
                    <a
                      href={`https://doi.org/${article.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-xs"
                    >
                      {article.doi}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Metodologia:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{methodology}</span>
                </div>
              </div>
            </div>

            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Palavras-chave
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Relevance Reasons */}
            {article.score.reasons.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Por que é relevante
                </h3>
                <ul className="space-y-2">
                  {article.score.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Abstract */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Abstract Completo
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {article.abstract || 'Abstract não disponível.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {article.pdfUrl && (
                <a
                  href={article.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Abrir PDF
                </a>
              )}
              {article.doi && (
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver no DOI
                </a>
              )}
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Página Original
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
