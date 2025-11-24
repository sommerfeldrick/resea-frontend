/**
 * Phase 5 Analysis - Useful insights and recommendations
 * Instead of technical graph visualization, provides practical information
 */

import React, { useState, useMemo, useEffect } from 'react';
import { formatABNT, formatAPA, formatVancouver } from '../utils/citations';
import { ArticleDetailsModal } from './ArticleDetailsModal';
import { BulkActionsBar } from './BulkActionsBar';

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

interface KnowledgeGraph {
  nodes: any[];
  edges: any[];
  clusters: any[];
  insights: {
    mostCitedCluster: string;
    methodologyBreakdown: Record<string, number>;
    gaps: string[];
  };
}

interface Props {
  articles: Article[];
  knowledgeGraph: KnowledgeGraph | null;
  onBack: () => void;
  onProceed: () => void;
  onSuccess: (message: string) => void;
}

export const Phase5Analysis: React.FC<Props> = ({
  articles,
  knowledgeGraph,
  onBack,
  onProceed,
  onSuccess
}) => {
  // State management
  const [selectedArticleForDetails, setSelectedArticleForDetails] = useState<Article | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedSimilar, setExpandedSimilar] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'citations' | 'year' | 'title'>('score');
  const [filterP1Only, setFilterP1Only] = useState(false);
  const [filterFulltextOnly, setFilterFulltextOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 20;

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('resea-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('resea-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  if (!knowledgeGraph) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center py-12">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Analisando {articles.length} artigos e gerando insights...
          </p>
        </div>
      </div>
    );
  }

  // Sorting and filtering logic
  const sortedAndFilteredArticles = useMemo(() => {
    let result = [...articles];

    // Apply filters
    if (filterP1Only) {
      result = result.filter(a => a.score.priority === 'P1');
    }
    if (filterFulltextOnly) {
      result = result.filter(a => a.hasFulltext);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score.score - a.score.score;
        case 'citations':
          return (b.citationCount || 0) - (a.citationCount || 0);
        case 'year':
          return b.year - a.year;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [articles, sortBy, filterP1Only, filterFulltextOnly]);

  // Pagination
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    return sortedAndFilteredArticles.slice(startIndex, startIndex + articlesPerPage);
  }, [sortedAndFilteredArticles, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredArticles.length / articlesPerPage);

  // Get favorite articles
  const favoriteArticles = useMemo(() => {
    return articles.filter(a => favorites.has(a.id)).sort((a, b) => b.score.score - a.score.score);
  }, [articles, favorites]);

  // Top articles for insights section
  const topArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.score.score - a.score.score).slice(0, 10);
  }, [articles]);

  const recentArticles = useMemo(() => {
    return [...articles].filter(a => a.year >= 2023).slice(0, 3);
  }, [articles]);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Select all visible articles
  const selectAllVisible = () => {
    const visibleIds = paginatedArticles.map(a => a.id);
    setSelectedIds(new Set([...selectedIds, ...visibleIds]));
  };

  // Remove selected articles
  const handleRemoveSelected = () => {
    if (confirm(`Remover ${selectedIds.size} artigos selecionados?`)) {
      // Remove from favorites too
      const newFavorites = new Set(favorites);
      selectedIds.forEach(id => newFavorites.delete(id));
      setFavorites(newFavorites);

      // Clear selection
      setSelectedIds(new Set());
      onSuccess(`${selectedIds.size} artigos removidos`);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    onSuccess(`Citação ${format} copiada!`);
  };

  // Calculate statistics
  const totalCitations = articles.reduce((sum, a) => sum + (a.citationCount || 0), 0);
  const avgCitations = Math.round(totalCitations / articles.length);
  const withFulltext = articles.filter(a => a.hasFulltext).length;
  const fulltextPercent = Math.round((withFulltext / articles.length) * 100);

  // Group by priority
  const p1Count = articles.filter(a => a.score.priority === 'P1').length;
  const p2Count = articles.filter(a => a.score.priority === 'P2').length;
  const p3Count = articles.filter(a => a.score.priority === 'P3').length;

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    onSuccess(`Citação ${format} copiada!`);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">✨ Análise Inteligente Concluída</h2>
        <p className="text-indigo-100">{articles.length} artigos selecionados e prontos para uso</p>
      </div>

      {/* 5. RESUMO EXECUTIVO */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Resumo Executivo
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{articles.length}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Artigos encontrados</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{fulltextPercent}%</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Com texto completo</div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalCitations}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Citações totais</div>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{p1Count}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Artigos P1 (excelentes)</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📈</span> Tendências Identificadas
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-gray-800 dark:text-gray-200">
              <span className="font-semibold">Foco Principal:</span> {p1Count + p2Count} artigos altamente relevantes sobre o tema
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              <span className="font-semibold">Média de citações:</span> {avgCitations} citações/artigo (indica alta relevância)
            </p>
            {recentArticles.length > 0 && (
              <p className="text-gray-800 dark:text-gray-200">
                <span className="font-semibold">Artigos recentes:</span> {recentArticles.length} artigos de 2023-2025 com as últimas descobertas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FAVORITES SECTION */}
      {favoriteArticles.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl shadow-lg p-6 border-2 border-yellow-300 dark:border-yellow-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            Meus Favoritos ({favoriteArticles.length})
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Artigos marcados como favoritos serão priorizados na geração de conteúdo.
          </p>
          <div className="space-y-3">
            {favoriteArticles.map((article) => (
              <div key={article.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
                <button
                  onClick={() => toggleFavorite(article.id)}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  ⭐
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedArticleForDetails(article)}>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {article.authors.slice(0, 2).join(', ')}{article.authors.length > 2 ? ' et al.' : ''} • {article.year}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${
                  article.score.priority === 'P1'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : article.score.priority === 'P2'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {article.score.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS AND SORTING */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="score">Score (maior)</option>
              <option value="citations">Citações (maior)</option>
              <option value="year">Ano (mais recente)</option>
              <option value="title">Título (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterP1Only}
                onChange={(e) => setFilterP1Only(e.target.checked)}
                className="rounded"
              />
              Apenas P1
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterFulltextOnly}
                onChange={(e) => setFilterFulltextOnly(e.target.checked)}
                className="rounded"
              />
              Apenas com texto completo
            </label>
          </div>

          <button
            onClick={selectAllVisible}
            className="ml-auto text-sm px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
          >
            Selecionar todos ({paginatedArticles.length})
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {sortedAndFilteredArticles.length} artigos • Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* ALL ARTICLES WITH FULL FEATURES */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          Todos os Artigos Encontrados
        </h3>
        <div className="space-y-4">
          {paginatedArticles.map((article, idx) => {
            const isFavorite = favorites.has(article.id);
            const isSelected = selectedIds.has(article.id);
            const isExpanded = expandedSimilar === article.id;

            return (
              <div key={article.id}>
                <div className={`p-4 border-2 rounded-lg transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(article.id)}
                      className="mt-1 w-5 h-5 rounded"
                    />

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex-1 pr-4">{article.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${
                            article.score.priority === 'P1'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : article.score.priority === 'P2'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            Score {article.score.score}
                          </span>
                          <button
                            onClick={() => toggleFavorite(article.id)}
                            className="text-xl hover:scale-125 transition-transform"
                            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          >
                            {isFavorite ? '⭐' : '☆'}
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {article.authors.slice(0, 3).join(', ')}{article.authors.length > 3 ? ' et al.' : ''} • {article.year}
                        {article.journalInfo && ` • ${article.journalInfo}`}
                      </p>

                      {article.abstract && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                          {article.abstract.substring(0, 200)}...
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          📚 {article.citationCount || 0} citações
                        </span>
                        {article.hasFulltext && (
                          <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded">
                            📄 Texto completo
                          </span>
                        )}
                        {article.score.reasons.length > 0 && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">
                            ✨ {article.score.reasons[0]}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedArticleForDetails(article)}
                          className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          📖 Ver Detalhes
                        </button>

                        {article.doi && (
                          <a
                            href={`https://doi.org/${article.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            🔗 Abrir DOI
                          </a>
                        )}

                        {article.pdfUrl && (
                          <a
                            href={article.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            📄 Abrir PDF
                          </a>
                        )}

                        <button
                          onClick={() => setExpandedSimilar(isExpanded ? null : article.id)}
                          className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          {isExpanded ? '▲ Ocultar' : '🔍 Buscar Similares'}
                        </button>

                        {/* Citation Dropdown */}
                        <div className="relative group">
                          <button className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                            📋 Citação ▼
                          </button>
                          <div className="absolute bottom-full mb-1 left-0 hidden group-hover:block bg-white dark:bg-gray-700 rounded-lg shadow-xl py-1 min-w-[150px] border border-gray-200 dark:border-gray-600 z-10">
                            <button
                              onClick={() => copyToClipboard(formatABNT(article), 'ABNT')}
                              className="w-full px-3 py-1 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-xs"
                            >
                              Copiar ABNT
                            </button>
                            <button
                              onClick={() => copyToClipboard(formatAPA(article), 'APA')}
                              className="w-full px-3 py-1 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-xs"
                            >
                              Copiar APA
                            </button>
                            <button
                              onClick={() => copyToClipboard(formatVancouver(article, idx + 1), 'Vancouver')}
                              className="w-full px-3 py-1 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-xs"
                            >
                              Copiar Vancouver
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Similar Articles Section */}
                {isExpanded && (
                  <div className="ml-12 mt-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                      🔍 Artigos Similares
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Funcionalidade de busca de artigos similares será implementada em breve.
                      Por enquanto, você pode usar os filtros acima para encontrar artigos relacionados.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* 2. INSIGHTS ACIONÁVEIS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">💪</span>
          Recomendações de Uso
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              ✅ Use estes {p1Count} artigos P1 para fundamentação principal
            </h4>
            <p className="text-sm text-green-800 dark:text-green-400">
              Artigos de altíssima relevância e qualidade. Ideais para embasar seus argumentos centrais e revisão de literatura.
            </p>
          </div>

          {recentArticles.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🆕 {recentArticles.length} artigos recentes (2023-2025)
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                Use para mostrar atualidade da pesquisa:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                {recentArticles.map((article) => (
                  <li key={article.id} className="line-clamp-1">
                    • {article.title} ({article.year})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {knowledgeGraph.insights.gaps.length > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg">
              <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                🎯 Gap identificado: Oportunidade para seu trabalho
              </h4>
              <p className="text-sm text-orange-800 dark:text-orange-400">
                {knowledgeGraph.insights.gaps[0]} - Seu trabalho pode se destacar explorando este aspecto pouco estudado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. ESTRUTURA SUGERIDA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          Estrutura Sugerida para sua Introdução
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <h4 className="font-semibold text-gray-900 dark:text-white">Contextualização</h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-10 mb-2">
              Apresente o tema geral e sua importância. Use artigos altamente citados:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 ml-10 space-y-1">
              {topArticles.slice(0, 3).map((article) => (
                <li key={article.id} className="line-clamp-1">
                  → {article.authors[0]} ({article.year}) - {article.citationCount || 0} citações
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
              <h4 className="font-semibold text-gray-900 dark:text-white">Problema de Pesquisa</h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-10">
              {knowledgeGraph.insights.gaps.length > 0
                ? `Identifique a lacuna: "${knowledgeGraph.insights.gaps[0]}"`
                : 'Identifique limitações nos estudos atuais e justifique seu trabalho'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
              <h4 className="font-semibold text-gray-900 dark:text-white">Justificativa</h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-10">
              Reforce com números: {totalCitations} citações totais mostram a relevância do tema.
              Use artigos recentes para mostrar atualidade.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CITAÇÕES PRONTAS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          Citações Prontas - Top 3 Artigos
        </h3>
        <div className="space-y-6">
          {topArticles.slice(0, 3).map((article, idx) => (
            <div key={article.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                {idx + 1}. {article.title.substring(0, 60)}...
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">ABNT</span>
                    <button
                      onClick={() => copyToClipboard(formatABNT(article), 'ABNT')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {formatABNT(article)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">APA</span>
                    <button
                      onClick={() => copyToClipboard(formatAPA(article), 'APA')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {formatAPA(article)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Vancouver</span>
                    <button
                      onClick={() => copyToClipboard(formatVancouver(article, idx + 1), 'Vancouver')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {formatVancouver(article, idx + 1)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. GAPS COMO OPORTUNIDADES */}
      {knowledgeGraph.insights.gaps.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg p-6 border-2 border-orange-200 dark:border-orange-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Oportunidades de Pesquisa Identificadas
          </h3>
          <div className="space-y-4">
            {knowledgeGraph.insights.gaps.map((gap, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                  💡 Oportunidade {idx + 1}
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">
                  <span className="font-semibold">Gap identificado:</span> {gap}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  <span className="font-semibold">Como aproveitar:</span> Seu trabalho pode se destacar sendo um dos primeiros a explorar este aspecto.
                  Isso aumenta as chances de publicação e citações futuras.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                   rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
        >
          ← Voltar à busca
        </button>

        <button
          onClick={onProceed}
          className="flex-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                   hover:from-indigo-700 hover:to-purple-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          Gerar Conteúdo Agora
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Article Details Modal */}
      <ArticleDetailsModal
        article={selectedArticleForDetails}
        onClose={() => setSelectedArticleForDetails(null)}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        articles={articles}
        onClearSelection={() => setSelectedIds(new Set())}
        onRemoveSelected={handleRemoveSelected}
        onSuccess={onSuccess}
      />
    </div>
  );
};
