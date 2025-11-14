/**
 * AutoSaveIndicator
 * Componente visual que mostra o status do auto-save
 */

import React from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  getTimeSinceLastSave: () => string;
  saveNow?: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  hasUnsavedChanges,
  getTimeSinceLastSave,
  saveNow
}) => {
  const getStatusColor = () => {
    if (isSaving) return 'text-blue-600 dark:text-blue-400';
    if (hasUnsavedChanges) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = () => {
    if (isSaving) return '⏳';
    if (hasUnsavedChanges) return '●';
    return '✓';
  };

  const getStatusText = () => {
    if (isSaving) return 'Salvando...';
    if (hasUnsavedChanges) return 'Não salvo';
    return getTimeSinceLastSave();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <span className={`text-sm font-medium ${getStatusColor()} transition-colors`}>
        {getStatusIcon()}
      </span>
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {getStatusText()}
      </span>
      {hasUnsavedChanges && saveNow && !isSaving && (
        <button
          onClick={saveNow}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
        >
          Salvar agora
        </button>
      )}
    </div>
  );
};
