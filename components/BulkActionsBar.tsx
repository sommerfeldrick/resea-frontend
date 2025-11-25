/**
 * BulkActionsBar - Bulk actions for selected articles
 */

import React from 'react';
import { formatABNT, formatAPA, formatVancouver } from '../utils/citations';

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
}

interface Props {
  selectedIds: Set<string>;
  articles: Article[];
  onClearSelection: () => void;
  onRemoveSelected: () => void;
  onSuccess: (message: string) => void;
}

export const BulkActionsBar: React.FC<Props> = ({
  selectedIds,
  articles,
  onClearSelection,
  onRemoveSelected,
  onSuccess
}) => {
  const [bibliographyDropdownOpen, setBibliographyDropdownOpen] = React.useState(false);
  const dropdownTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  if (selectedIds.size === 0) return null;

  const selectedArticles = articles.filter(a => selectedIds.has(a.id));

  const handleDownloadPDFs = () => {
    const pdfs = selectedArticles.filter(a => a.pdfUrl);
    if (pdfs.length === 0) {
      alert('Nenhum dos artigos selecionados tem PDF disponível.');
      return;
    }

    // Open each PDF in a new tab
    pdfs.forEach(article => {
      if (article.pdfUrl) {
        window.open(article.pdfUrl, '_blank');
      }
    });

    onSuccess(`Abrindo ${pdfs.length} PDFs...`);
  };

  const handleGenerateBibliography = (format: 'abnt' | 'apa' | 'vancouver') => {
    let bibliography = '';

    selectedArticles.forEach((article, idx) => {
      if (format === 'abnt') {
        bibliography += formatABNT(article) + '\n\n';
      } else if (format === 'apa') {
        bibliography += formatAPA(article) + '\n\n';
      } else if (format === 'vancouver') {
        bibliography += formatVancouver(article, idx + 1) + '\n\n';
      }
    });

    navigator.clipboard.writeText(bibliography);
    onSuccess(`Bibliografia ${format.toUpperCase()} copiada (${selectedArticles.length} artigos)!`);
  };

  const handleExportBibTeX = () => {
    let bibtex = '';

    selectedArticles.forEach((article, idx) => {
      const key = `${article.authors[0]?.split(' ')[0] || 'Unknown'}${article.year}`;
      bibtex += `@article{${key}${idx},\n`;
      bibtex += `  title={${article.title}},\n`;
      bibtex += `  author={${article.authors.join(' and ')}},\n`;
      bibtex += `  year={${article.year}},\n`;
      if (article.journalInfo) {
        bibtex += `  journal={${article.journalInfo}},\n`;
      }
      if (article.doi) {
        bibtex += `  doi={${article.doi}},\n`;
      }
      if (article.url) {
        bibtex += `  url={${article.url}},\n`;
      }
      bibtex += `}\n\n`;
    });

    navigator.clipboard.writeText(bibtex);
    onSuccess(`BibTeX copiado (${selectedArticles.length} artigos)!`);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slideInUp">
      <div className="bg-indigo-600 text-white rounded-xl shadow-2xl p-4 flex items-center gap-4 border-2 border-indigo-400">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-4 border-r border-indigo-400">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
            {selectedIds.size}
          </div>
          <span className="font-medium">selecionados</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Download PDFs */}
          <button
            onClick={handleDownloadPDFs}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
            title="Baixar PDFs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">PDFs</span>
          </button>

          {/* Generate Bibliography - Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              // Cancel any pending close
              if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Delay closing by 500ms
              dropdownTimeoutRef.current = setTimeout(() => {
                setBibliographyDropdownOpen(false);
              }, 500);
            }}
          >
            <button
              onClick={() => setBibliographyDropdownOpen(!bibliographyDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              title="Gerar Bibliografia"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="hidden sm:inline">Bibliografia</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {bibliographyDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 min-w-[200px] border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleGenerateBibliography('abnt');
                    setBibliographyDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  📋 Copiar ABNT
                </button>
                <button
                  onClick={() => {
                    handleGenerateBibliography('apa');
                    setBibliographyDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  📋 Copiar APA
                </button>
                <button
                  onClick={() => {
                    handleGenerateBibliography('vancouver');
                    setBibliographyDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  📋 Copiar Vancouver
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => {
                    handleExportBibTeX();
                    setBibliographyDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  💾 Exportar BibTeX
                </button>
              </div>
            )}
          </div>

          {/* Remove selected */}
          <button
            onClick={onRemoveSelected}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-colors"
            title="Remover selecionados"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Remover</span>
          </button>

          {/* Clear selection */}
          <button
            onClick={onClearSelection}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors ml-2 border-l border-indigo-400 pl-4"
            title="Limpar seleção"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
