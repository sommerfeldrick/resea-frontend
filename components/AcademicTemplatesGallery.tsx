import React, { useState, useEffect, useMemo } from 'react';
import { academicTemplates, categoryInfo, AcademicTemplate } from '../data/academicTemplates';
import type { TaskPlan } from '../types';
import { templateService } from '../services/templateService';
import { TemplateCard } from './TemplateCard';
import { useTemplateFeatures } from '../hooks/useTemplateFeatures';

interface TemplateModalProps {
  template: AcademicTemplate;
  onClose: () => void;
  onSubmit: (filledTemplate: string, filledData: Record<string, any>) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [currentTag, setCurrentTag] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Preparar dados preenchidos combinando formData e tags
    const allFilledData: Record<string, any> = { ...formData };
    Object.entries(tags).forEach(([key, value]) => {
      allFilledData[key] = value;
    });

    // Substituir placeholders no template
    let filledPrompt = template.promptTemplate;
    template.requiredFields.forEach(field => {
      const value = field.type === 'tags' ? tags[field.name]?.join(', ') : formData[field.name];
      const placeholder = `{${field.name}}`;
      filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), value || '');
    });

    onSubmit(filledPrompt, allFilledData);
  };

  const handleAddTag = (fieldName: string) => {
    const tag = currentTag[fieldName]?.trim();
    if (tag) {
      setTags(prev => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), tag]
      }));
      setCurrentTag(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleRemoveTag = (fieldName: string, index: number) => {
    setTags(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{template.title}</h2>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~{template.estimatedTime} min
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium capitalize">
              {template.difficulty === 'beginner' ? 'Iniciante' : template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </span>
          </div>

          <div className="space-y-4">
            {template.requiredFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {field.type === 'tags' && (
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={currentTag[field.name] || ''}
                        onChange={(e) => setCurrentTag({ ...currentTag, [field.name]: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(field.name);
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(field.name)}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    {tags[field.name]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags[field.name].map((tag, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(field.name, index)}
                              className="hover:text-indigo-900"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Gerar Pesquisa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AcademicTemplatesGalleryProps {
  onTemplateSelect: (prompt: string) => void;
}

export const AcademicTemplatesGallery: React.FC<AcademicTemplatesGalleryProps> = ({ onTemplateSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('introducao');
  const [selectedTemplate, setSelectedTemplate] = useState<AcademicTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { favorites, usageCounts, toggleFavorite, addToHistory, isFavorite, getUsageCount } = useTemplateFeatures();

  const filteredTemplates = useMemo(() => {
    let templates = academicTemplates.filter(t => t.category === selectedCategory);

    // Filtrar por favoritos
    if (showFavoritesOnly) {
      templates = templates.filter(t => isFavorite(t.id));
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    return templates;
  }, [selectedCategory, showFavoritesOnly, searchQuery, favorites]);

  const categories = Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>;

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Modelos de Escrita Acadêmica</h2>
            <p className="text-gray-600 text-lg">Escolha um modelo pronto para iniciar sua pesquisa rapidamente</p>
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
              showFavoritesOnly
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400 shadow-yellow-200'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={showFavoritesOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Favoritos ({favorites.size})
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Tabs de Categorias */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const info = categoryInfo[cat];
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <span className="text-lg">{info.icon}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Descrição da Categoria */}
      <div className="mb-8 p-5 bg-gradient-to-br from-indigo-50 to-white rounded-xl border-2 border-indigo-100 shadow-sm">
        <p className="text-sm text-gray-700 leading-relaxed">{categoryInfo[selectedCategory as keyof typeof categoryInfo].description}</p>
      </div>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isFavorite={isFavorite(template.id)}
            usageCount={getUsageCount(template.id)}
            onSelect={() => setSelectedTemplate(template)}
            onFavoriteToggle={() => toggleFavorite(template.id)}
            showPreview={true}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">Nenhum template encontrado</p>
          {(searchQuery || showFavoritesOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowFavoritesOnly(false);
              }}
              className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSubmit={(prompt, filledData) => {
            // Salvar no histórico
            addToHistory(selectedTemplate.id, filledData, prompt);
            // Enviar prompt
            onTemplateSelect(prompt);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};
