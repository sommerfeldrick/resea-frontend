import React, { useState, useEffect } from 'react';
import { getVersions, restoreVersion } from '../services/enhancedStorageService';

interface Version {
  versionId: string;
  timestamp: number;
  content: string;
  outline: string;
  comment?: string;
}

interface VersionComparatorProps {
  researchId: string;
  currentContent: string;
  onRestore: (content: string, outline: string) => void;
  onClose: () => void;
}

export const VersionComparator: React.FC<VersionComparatorProps> = ({
  researchId,
  currentContent,
  onRestore,
  onClose
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [researchId]);

  const loadVersions = async () => {
    try {
      const versionsList = await getVersions(researchId);
      setVersions(versionsList as Version[]);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleSelectVersion = (version: Version) => {
    setSelectedVersion(version);
  };

  const handleRestore = () => {
    if (selectedVersion) {
      if (confirm(`Restaurar esta versão de ${formatDate(selectedVersion.timestamp)}?`)) {
        onRestore(selectedVersion.content, selectedVersion.outline);
        onClose();
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWordCount = (text: string) => {
    return text.split(/\s+/).filter(Boolean).length;
  };

  const calculateDiff = (oldText: string, newText: string) => {
    const oldWords = getWordCount(oldText);
    const newWords = getWordCount(newText);
    const diff = newWords - oldWords;

    return {
      diff,
      percentage: oldWords > 0 ? ((diff / oldWords) * 100).toFixed(1) : '0'
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Histórico de Versões
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Versions List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {versions.length} versões salvas
            </h3>
            <div className="space-y-2">
              {versions.map((version) => {
                const diff = calculateDiff(currentContent, version.content);
                const isSelected = selectedVersion?.versionId === version.versionId;

                return (
                  <button
                    key={version.versionId}
                    onClick={() => handleSelectVersion(version)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(version.timestamp)}
                        </div>
                        {version.comment && (
                          <div className="text-xs text-gray-600 mt-1">{version.comment}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {getWordCount(version.content).toLocaleString()} palavras
                        </div>
                      </div>
                      <div className="ml-2">
                        {diff.diff !== 0 && (
                          <div
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              diff.diff > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {diff.diff > 0 ? '+' : ''}
                            {diff.percentage}%
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedVersion ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Versão de {formatDate(selectedVersion.timestamp)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getWordCount(selectedVersion.content).toLocaleString()} palavras
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDiff(!showDiff)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      {showDiff ? '📄 Ver Conteúdo' : '🔍 Ver Diferenças'}
                    </button>
                    <button
                      onClick={handleRestore}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                      ↩️ Restaurar Esta Versão
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {showDiff ? (
                    <DiffView oldText={selectedVersion.content} newText={currentContent} />
                  ) : (
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: formatContent(selectedVersion.content) }} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Selecione uma versão para visualizar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple diff viewer
const DiffView: React.FC<{ oldText: string; newText: string }> = ({ oldText, newText }) => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  return (
    <div className="space-y-1 font-mono text-sm">
      {newLines.map((line, i) => {
        const oldLine = oldLines[i];
        const isChanged = oldLine !== line;
        const isAdded = !oldLine;
        const isRemoved = i < oldLines.length && !newLines[i];

        return (
          <div
            key={i}
            className={`p-2 ${
              isAdded
                ? 'bg-green-50 border-l-4 border-green-500'
                : isChanged
                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                : isRemoved
                ? 'bg-red-50 border-l-4 border-red-500 line-through'
                : ''
            }`}
          >
            {line || <span className="text-gray-400">(linha vazia)</span>}
          </div>
        );
      })}
    </div>
  );
};

function formatContent(content: string): string {
  return content
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');
}
