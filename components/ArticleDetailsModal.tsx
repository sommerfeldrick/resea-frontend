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

  // Round score to integer
  const roundedScore = Math.round(article.score.score);

  // Detect study type from abstract and title
  const detectStudyType = (text: string): string | null => {
    const lower = text.toLowerCase();

    // Systematic reviews and meta-analyses
    if (lower.match(/systematic\s+review|meta-analysis|revisão\s+sistemática|metanálise/)) {
      return 'Revisão Sistemática / Meta-análise';
    }
    // Clinical trials
    if (lower.match(/randomized.*trial|controlled.*trial|clinical.*trial|ensaio\s+clínico|estudo\s+controlado/)) {
      return 'Ensaio Clínico Controlado';
    }
    // Cohort studies
    if (lower.match(/cohort.*study|longitudinal.*study|estudo\s+de\s+coorte|estudo\s+longitudinal/)) {
      return 'Estudo de Coorte';
    }
    // Case-control studies
    if (lower.match(/case-control|caso-controle/)) {
      return 'Estudo Caso-Controle';
    }
    // Cross-sectional studies
    if (lower.match(/cross-sectional|transversal/)) {
      return 'Estudo Transversal';
    }
    // In vitro / In vivo
    if (lower.match(/in\s+vitro/) && lower.match(/in\s+vivo/)) {
      return 'Estudo In Vitro e In Vivo';
    }
    if (lower.match(/in\s+vitro/)) {
      return 'Estudo In Vitro';
    }
    if (lower.match(/in\s+vivo/)) {
      return 'Estudo In Vivo';
    }
    // Computational/simulation studies
    if (lower.match(/finite\s+element|simulation|computational|modelagem|simulação/)) {
      return 'Estudo Computacional / Simulação';
    }
    // Review articles (not systematic)
    if (lower.match(/^review|literature\s+review|revisão\s+da\s+literatura/) && !lower.match(/systematic/)) {
      return 'Revisão de Literatura';
    }
    // Case reports/series
    if (lower.match(/case\s+report|case\s+series|relato\s+de\s+caso|série\s+de\s+casos/)) {
      return 'Relato de Caso';
    }

    return null;
  };

  const studyType = detectStudyType(article.title + ' ' + article.abstract);

  // Extract structured information from abstract (improved algorithm)
  const extractStructuredInfo = (abstract: string) => {
    if (!abstract || abstract.trim().length === 0) {
      return { objective: null, results: null, conclusion: null, methodology: null };
    }

    let objective = null;
    let results = null;
    let conclusion = null;
    let methodology = null;

    const usedIndices = new Set<number>(); // Track which sentences we've used

    // Step 1: Try structured abstract with explicit labels
    const structuredPatterns = {
      objective: /(?:OBJECTIVE|OBJECTIVES|AIM|AIMS|PURPOSE|GOAL|OBJETIVO|OBJETIVOS)[:\s]+([^.]+(?:\.[^.]+){0,2})/i,
      methodology: /(?:METHODS?|METHODOLOGY|DESIGN|MATERIALS?\s+AND\s+METHODS?|MÉTODOS?|METODOLOGIA)[:\s]+([^.]+(?:\.[^.]+){0,2})/i,
      results: /(?:RESULTS?|FINDINGS?|OUTCOMES?|RESULTADOS?|ACHADOS?)[:\s]+([^.]+(?:\.[^.]+){0,2})/i,
      conclusion: /(?:CONCLUSIONS?|IMPLICATIONS?|SUMMARY|CONCLUSÕES?|IMPLICAÇÕES?)[:\s]+([^.]+(?:\.[^.]+){0,2})/i
    };

    const objMatch = abstract.match(structuredPatterns.objective);
    if (objMatch && objMatch[1].length > 20) {
      objective = objMatch[1].trim();
    }

    const methMatch = abstract.match(structuredPatterns.methodology);
    if (methMatch && methMatch[1].length > 20) {
      methodology = methMatch[1].trim();
    }

    const resMatch = abstract.match(structuredPatterns.results);
    if (resMatch && resMatch[1].length > 20) {
      results = resMatch[1].trim();
    }

    const concMatch = abstract.match(structuredPatterns.conclusion);
    if (concMatch && concMatch[1].length > 20) {
      conclusion = concMatch[1].trim();
    }

    // If we found structured labels, return now
    if (objective || methodology || results || conclusion) {
      return { objective, results, conclusion, methodology };
    }

    // Step 2: Fallback - sentence-based extraction with better validation
    const sentences = abstract
      .split(/[.!?]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20); // Filter out very short fragments

    // Helper: Check if sentence is informative (not just "was categorized into 4 Groups")
    const isInformative = (sentence: string): boolean => {
      const lower = sentence.toLowerCase();
      // Reject sentences that are too generic or fragmentary
      if (lower.match(/^(the|this|was|were|into|groups?|categories?)[\s\w]{0,30}$/)) return false;
      // Reject sentences that are just method descriptions without context
      if (lower.match(/^(was|were)\s+(categorized|divided|grouped|classified)/)) return false;
      return sentence.split(' ').length >= 8; // At least 8 words
    };

    // Extract objective (first 3 sentences, strong keywords)
    if (!objective) {
      for (let i = 0; i < Math.min(3, sentences.length); i++) {
        const sent = sentences[i];
        const lower = sent.toLowerCase();
        const hasStrongKeyword = /\b(objective|aim|purpose|goal|to\s+(investigate|examine|evaluate|assess|analyze|study|review))\b/i.test(lower);

        if (hasStrongKeyword && isInformative(sent) && !usedIndices.has(i)) {
          objective = sent;
          usedIndices.add(i);
          break;
        }
      }
    }

    // Extract methodology (sentences 2-6, method keywords)
    if (!methodology) {
      for (let i = 1; i < Math.min(6, sentences.length); i++) {
        if (usedIndices.has(i)) continue;

        const sent = sentences[i];
        const lower = sent.toLowerCase();
        const hasMethodKeyword = /\b(method|methodology|conducted|performed|carried\s+out|study\s+design|analysis|reviewed)\b/i.test(lower);

        if (hasMethodKeyword && isInformative(sent)) {
          methodology = sent;
          usedIndices.add(i);
          break;
        }
      }
    }

    // Extract results (middle third, results keywords)
    if (!results) {
      const start = Math.floor(sentences.length * 0.35);
      const end = Math.floor(sentences.length * 0.75);

      for (let i = start; i < end; i++) {
        if (usedIndices.has(i)) continue;

        const sent = sentences[i];
        const lower = sent.toLowerCase();
        const hasResultKeyword = /\b(result|found|showed|demonstrated|revealed|indicated|observed|significant|p\s*<|higher|lower)\b/i.test(lower);

        if (hasResultKeyword && isInformative(sent)) {
          // Take up to 2 sentences for results
          const endIdx = Math.min(i + 2, sentences.length);
          const resultSentences = [];
          for (let j = i; j < endIdx && resultSentences.length < 2; j++) {
            if (!usedIndices.has(j)) {
              resultSentences.push(sentences[j]);
              usedIndices.add(j);
            }
          }
          results = resultSentences.join('. ');
          break;
        }
      }
    }

    // Extract conclusion (last 3 sentences, conclusion keywords)
    if (!conclusion) {
      for (let i = Math.max(0, sentences.length - 3); i < sentences.length; i++) {
        if (usedIndices.has(i)) continue;

        const sent = sentences[i];
        const lower = sent.toLowerCase();
        const hasConclusionKeyword = /\b(conclusion|conclude|suggest|therefore|thus|indicate|demonstrate|findings|evidence|implication|recommend)\b/i.test(lower);

        if (hasConclusionKeyword && isInformative(sent)) {
          // Take remaining sentences for conclusion
          const conclusionSentences = [];
          for (let j = i; j < sentences.length; j++) {
            if (!usedIndices.has(j)) {
              conclusionSentences.push(sentences[j]);
              usedIndices.add(j);
            }
          }
          conclusion = conclusionSentences.join('. ');
          break;
        }
      }
    }

    // Very conservative fallbacks - only if we haven't found anything
    if (!objective && sentences.length > 0 && !usedIndices.has(0)) {
      objective = sentences[0];
    }

    return { objective, results, conclusion, methodology };
  };

  const structuredInfo = extractStructuredInfo(article.abstract);

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
                  {roundedScore}
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
              <div className="space-y-2 text-sm">
                {article.journalInfo && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-blue-900 dark:text-blue-300 font-semibold text-xs uppercase tracking-wide">Publicado em</span>
                    </div>
                    <span className="font-bold text-base text-gray-900 dark:text-white">{article.journalInfo}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 block text-xs mb-1">Ano:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{article.year}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 block text-xs mb-1">Citações:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{article.citationCount || 0}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400 block text-xs mb-1">Autores:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{article.authors.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Study Type */}
            {studyType && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <span className="text-purple-900 dark:text-purple-300 font-semibold text-xs uppercase tracking-wide block">Tipo de Estudo</span>
                    <span className="text-gray-900 dark:text-white font-bold">{studyType}</span>
                  </div>
                </div>
              </div>
            )}

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

            {/* Structured Study Information */}
            {(structuredInfo.objective || structuredInfo.methodology || structuredInfo.results || structuredInfo.conclusion) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Estrutura do Estudo
                </h3>

                {structuredInfo.objective && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <span>🎯</span> Objetivo
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {structuredInfo.objective}
                    </p>
                  </div>
                )}

                {structuredInfo.methodology && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                      <span>🔬</span> Metodologia
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {structuredInfo.methodology}
                    </p>
                  </div>
                )}

                {structuredInfo.results && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      <span>📊</span> Resultados Principais
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {structuredInfo.results}
                    </p>
                  </div>
                )}

                {structuredInfo.conclusion && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      <span>💡</span> Conclusão
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {structuredInfo.conclusion}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Abstract Completo */}
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
