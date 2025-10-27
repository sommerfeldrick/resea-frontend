import React, { useState } from 'react';
import { academicTemplates, categoryInfo, AcademicTemplate } from '../data/academicTemplates';
import type { TaskPlan } from '../types';

interface TemplateModalProps {
  template: AcademicTemplate;
  onClose: () => void;
  onSubmit: (filledTemplate: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [currentTag, setCurrentTag] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Substituir placeholders no template
    let filledPrompt = template.promptTemplate;
    template.requiredFields.forEach(field => {
      const value = field.type === 'tags' ? tags[field.name]?.join(', ') : formData[field.name];
      const placeholder = `{${field.name}}`;
      filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), value || '');
    });

    onSubmit(filledPrompt);
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

  const filteredTemplates = academicTemplates.filter(t => t.category === selectedCategory);
  const categories = Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Modelos de Escrita Acadêmica</h2>
        <p className="text-gray-600">Escolha um modelo pronto para iniciar sua pesquisa rapidamente</p>
      </div>

      {/* Tabs de Categorias */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const info = categoryInfo[cat];
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Descrição da Categoria */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">{categoryInfo[selectedCategory as keyof typeof categoryInfo].description}</p>
      </div>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{template.icon}</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {template.popularityScore}%
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
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSubmit={(prompt) => {
            onTemplateSelect(prompt);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};
