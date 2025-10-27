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
    <div className="group relative text-left bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:border-indigo-400 transition-all duration-200 overflow-hidden">
      {/* Botão de Favorito */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        {isFavorite ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-yellow-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )}
      </button>

      <button onClick={onSelect} className="w-full text-left">
        {/* Header com ícone e badges */}
        <div className="p-6 pb-4 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-md">
              <span className="text-3xl">{template.icon}</span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-xs font-semibold text-gray-700">{template.popularityScore}%</span>
              </div>
              {usageCount > 0 && (
                <div
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 rounded-md shadow-sm"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-white">{usageCount}x</span>
                  {showTooltip && (
                    <div className="absolute right-0 top-full mt-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
                      Você já usou este template
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors leading-snug">
            {template.title}
          </h3>
        </div>

        {/* Corpo do card */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{template.description}</p>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {template.estimatedTime} min
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              template.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
              template.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {template.difficulty === 'beginner' ? 'Iniciante' : template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </span>
          </div>
        </div>

        {showPreview && (
          <div className="px-6 pb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Show preview modal
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
