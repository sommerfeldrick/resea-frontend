import React, { useState } from 'react';
import type { AcademicSource, ResearchResult } from '../types';

// ==========================================
// PAINEL DE ESTATÍSTICAS
// ==========================================
interface StatsData {
  articlesFound: number;
  articlesRelevant: number;
  periodCovered: string;
  sourcesCount: number;
  wordsGenerated: number;
  wordsTarget: number;
  timeElapsed: string;
  cost: string;
}

export const StatisticsPanel: React.FC<{ stats: StatsData }> = ({ stats }) => {
  const relevancePercent = stats.articlesFound > 0
    ? Math.round((stats.articlesRelevant / stats.articlesFound) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Estatísticas da Pesquisa
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">{stats.articlesFound}</div>
          <div className="text-xs text-gray-600">Artigos encontrados</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{stats.articlesRelevant}</div>
          <div className="text-xs text-gray-600">Relevantes ({relevancePercent}%)</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-700">{stats.sourcesCount}</div>
          <div className="text-xs text-gray-600">Fontes acadêmicas</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-indigo-700">{stats.periodCovered}</div>
          <div className="text-xs text-gray-600">Período coberto</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-lg font-bold text-yellow-700">
            {stats.wordsGenerated.toLocaleString()} / {stats.wordsTarget.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Palavras geradas</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-3">
          <div className="text-lg font-bold text-pink-700">{stats.timeElapsed}</div>
          <div className="text-xs text-gray-600">Tempo decorrido</div>
        </div>
        <div className="bg-teal-50 rounded-lg p-3">
          <div className="text-lg font-bold text-teal-700">{stats.cost}</div>
          <div className="text-xs text-gray-600">Custo estimado</div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// VISUALIZADOR DE FONTES (CITATION MAP)
// ==========================================
export const CitationMap: React.FC<{ sources: AcademicSource[] }> = ({ sources }) => {
  const sourcesByProvider = sources.reduce((acc, source) => {
    const provider = source.sourceProvider || 'Desconhecido';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourcesByYear = sources.reduce((acc, source) => {
    const year = source.year || 'N/A';
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedByYear = Object.entries(sourcesByYear)
    .filter(([year]) => year !== 'N/A')
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const maxCount = Math.max(...Object.values(sourcesByProvider));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Mapa de Citações
      </h3>

      {/* Timeline */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline:</h4>
        <div className="flex items-center gap-2 overflow-x-auto">
          {sortedByYear.map(([year, count], index) => (
            <div key={year} className="flex items-center">
              {index > 0 && <div className="w-8 h-0.5 bg-gray-300" />}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                  {count}
                </div>
                <div className="text-xs text-gray-600 mt-1">{year}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por Fonte */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Por Fonte:</h4>
        <div className="space-y-2">
          {Object.entries(sourcesByProvider)
            .sort(([, a], [, b]) => b - a)
            .map(([provider, count]) => {
              const width = (count / maxCount) * 100;
              return (
                <div key={provider} className="flex items-center gap-2">
                  <div className="w-32 text-xs text-gray-600 truncate">{provider}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 flex items-center justify-end px-2"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs font-medium text-white">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ANÁLISE DE QUALIDADE
// ==========================================
interface QualityAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  comparison: number;
}

export const QualityPanel: React.FC<{ analysis: QualityAnalysis }> = ({ analysis }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Análise de Qualidade
      </h3>

      {/* Nota Geral */}
      <div className="mb-6 text-center">
        <div className="text-5xl font-bold text-indigo-700">{analysis.overallScore}<span className="text-2xl text-gray-500">/10</span></div>
        <div className="text-sm text-gray-600">Nota Geral</div>
      </div>

      {/* Pontos Fortes */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Pontos Fortes:
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {analysis.strengths.map((strength, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sugestões de Melhoria */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Sugestões de Melhoria:
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {analysis.improvements.map((improvement, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">•</span>
              <span>{improvement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Comparação */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Comparado com trabalhos similares:</h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Seu trabalho</span>
              <span>{analysis.overallScore}/10</span>
            </div>
            <div className="h-4 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${analysis.overallScore * 10}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Média geral</span>
              <span>{analysis.comparison}/10</span>
            </div>
            <div className="h-4 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-gray-400" style={{ width: `${analysis.comparison * 10}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// GLOSSÁRIO AUTOMÁTICO
// ==========================================
interface GlossaryTerm {
  term: string;
  definition: string;
  occurrences: number;
}

export const GlossaryPanel: React.FC<{ terms: GlossaryTerm[] }> = ({ terms }) => {
  const [search, setSearch] = useState('');

  const filteredTerms = terms.filter(term =>
    term.term.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const firstLetter = term.term[0].toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Glossário Gerado Automaticamente
      </h3>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar termo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Terms */}
      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.entries(groupedTerms).sort().map(([letter, terms]) => (
          <div key={letter}>
            <div className="text-lg font-bold text-indigo-700 mb-2">{letter}</div>
            <div className="space-y-2">
              {terms.map((term, i) => (
                <div key={i} className="pl-4 border-l-2 border-gray-200">
                  <div className="font-semibold text-gray-900">{term.term}</div>
                  <div className="text-sm text-gray-600 mt-1">{term.definition}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    📄 Usado em {term.occurrences} contextos no documento
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          Exportar Glossário
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          Adicionar ao Doc
        </button>
      </div>
    </div>
  );
};

// ==========================================
// SUGESTÕES DE APROFUNDAMENTO
// ==========================================
export const DeepDivePanel: React.FC<{ suggestions: any }> = ({ suggestions }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Sugestões de Aprofundamento
      </h3>
      <p className="text-sm text-gray-600 mb-4">Com base na sua pesquisa, você poderia:</p>

      {/* Explore mais sobre */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">🔍 Explorar mais sobre:</h4>
        <div className="space-y-2">
          {suggestions.topics?.map((topic: string, i: number) => (
            <div key={i} className="flex items-start justify-between gap-2 p-2 hover:bg-gray-50 rounded">
              <span className="text-sm text-gray-700">• {topic}</span>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                + Adicionar à pesquisa
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps identificados */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Gaps de pesquisa identificados:</h4>
        <div className="space-y-2">
          {suggestions.gaps?.map((gap: string, i: number) => (
            <div key={i} className="flex items-start justify-between gap-2 p-2 hover:bg-gray-50 rounded">
              <span className="text-sm text-gray-700">• {gap}</span>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                + Adicionar ao documento
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
