import React, { useState, useEffect } from 'react';
import { SparkleIcon, PaperclipIcon } from './icons';
import { generateTaskPlan } from '../services/apiService';
import type { TaskPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AcademicTemplatesGallery } from './AcademicTemplatesGallery';
import { FileUploadModal } from './FileUploadModal';
import type { UploadedFile } from '../types/templates';
import { creditService } from '../services/creditService';

interface LandingPageProps {
  onPlanGenerated: (plan: TaskPlan, query: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPlanGenerated }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [wordsUsage, setWordsUsage] = useState(creditService.getWordsUsage());
  const { user } = useAuth();

  // Atualizar uso de palavras quando o usuário mudar
  useEffect(() => {
    if (user) {
      setWordsUsage(creditService.getWordsUsage());
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // Settings are now hardcoded in the service for deep research and humanized style.
      const plan = await generateTaskPlan(query);
      onPlanGenerated(plan, query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar o plano de pesquisa. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 flex justify-end">
          <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const html = document.documentElement;
                  html.classList.toggle('dark');
                  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
                }}
                title="Alternar tema"
                className="p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
              <div className="flex flex-col items-end gap-1">
                <div className="px-3 py-1 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-lg" title={`Pacote: ${wordsUsage.packageName.toUpperCase()}`}>
                  {creditService.formatWords(wordsUsage.remainingWords)} de {creditService.formatWords(wordsUsage.totalWords)}
                </div>
                <div className="text-xs text-gray-600">
                  palavras restantes
                </div>
              </div>
              <button
                onClick={() => window.location.href = 'https://smileai.com.br/dashboard'}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                title="Voltar ao Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
          </div>
      </header>
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-5xl">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl text-gray-600">
              Olá, {user?.name || 'Usuário'}
            </h1>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
              O que posso pesquisar para você?
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="relative p-1.5 bg-white rounded-xl shadow-lg border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pergunte ao SmileAI..."
                className="w-full h-28 p-4 text-base border-none focus:ring-0 resize-none bg-transparent"
                disabled={isLoading}
              />
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFileUpload(true)}
                      className="flex items-center gap-2 rounded-lg bg-white p-2 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      title="Anexar arquivos PDF, DOCX, TXT..."
                    >
                        <PaperclipIcon className="w-5 h-5" />
                        Anexar Arquivos
                        {attachedFiles.length > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {attachedFiles.length}
                          </span>
                        )}
                    </button>
                </div>
                 <button 
                    type="submit" 
                    className="w-10 h-10 flex items-center justify-center bg-gray-900 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    disabled={isLoading || !query.trim()}
                    aria-label="Submit search"
                 >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    )}
                 </button>
              </div>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}

          <div className="mt-12">
            <AcademicTemplatesGallery
              onTemplateSelect={(prompt) => {
                setQuery(prompt);
              }}
            />
          </div>
        </div>
      </main>

      {/* Modal de Upload */}
      {showFileUpload && (
        <FileUploadModal
          onClose={() => setShowFileUpload(false)}
          onFilesUploaded={(files) => {
            setAttachedFiles(files);
            setShowFileUpload(false);
          }}
          allowMultiple={true}
        />
      )}
    </div>
  );
};