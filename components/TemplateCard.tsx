import React, { useState } from 'react';
import type { AcademicTemplate } from '../data/academicTemplates';
import { templateService } from '../services/templateService';

interface TemplateCardProps {
  template: AcademicTemplate;
  isFavorite: boolean;
  usageCount?: number;
  onSelect: () => void;
  onFavoriteToggle: () => void;
  showPreview?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isFavorite,
  usageCount = 0,
  onSelect,
  onFavoriteToggle,
  showPreview = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="group relative text-left p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-indigo-300 transition-all">
      {/* Botão de Favorito */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        {isFavorite ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )}
      </button>

      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between mb-3 pr-8">
          <span className="text-3xl">{template.icon}</span>
          <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {template.popularityScore}%
            </div>
            {usageCount > 0 && (
              <div
                className="flex items-center gap-1 text-indigo-600"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {usageCount}x usado
                {showTooltip && (
                  <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                    Você já usou este template
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {template.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ~{template.estimatedTime}min
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            template.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
            template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {template.difficulty === 'beginner' ? 'Iniciante' : template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
          </span>
        </div>

        {showPreview && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Show preview modal
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver exemplo
            </button>
          </div>
        )}
      </button>
    </div>
  );
};
