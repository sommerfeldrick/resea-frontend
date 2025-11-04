import React, { useState } from 'react';
import { AcademicTemplatesGallery } from './AcademicTemplatesGallery';
import { DocumentEditor } from './DocumentEditor';
import { generateResearchContent } from '../services/apiService';
import { creditService } from '../services/creditService';

interface ContentGenerationFlowProps {
  onBack?: () => void;
}

type FlowState = 'selecting' | 'generating' | 'editing';

export const ContentGenerationFlow: React.FC<ContentGenerationFlowProps> = ({ onBack }) => {
  const [flowState, setFlowState] = useState<FlowState>('selecting');
  const [generatedContent, setGeneratedContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const handleTemplateSelect = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setFlowState('generating');
    setProgress('Coletando fontes acadêmicas...');

    try {
      // Extrai título do prompt se possível
      const titleMatch = prompt.match(/(?:título|title|tema|topic):\s*([^\n]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Documento Acadêmico';
      setDocumentTitle(title);

      setProgress('Gerando conteúdo acadêmico com IA...');

      // Gera o conteúdo
      const result = await generateResearchContent(prompt);

      setGeneratedContent(result.content);
      setWordCount(result.wordCount);
      setProgress('Conteúdo gerado com sucesso!');

      // Atualiza créditos
      await creditService.fetchCredits();

      // Aguarda 1s e mostra editor
      setTimeout(() => {
        setFlowState('editing');
        setIsGenerating(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar conteúdo');
      setIsGenerating(false);
      setFlowState('selecting');
      console.error('Error generating content:', err);
    }
  };

  const handleFinalize = async (result: { wordCount: number; remaining: number }) => {
    // Volta para seleção após finalizar
    setFlowState('selecting');
    setGeneratedContent('');
    setDocumentTitle('');
    setWordCount(0);

    // Atualiza créditos
    await creditService.fetchCredits();
  };

  const handleCancel = () => {
    setFlowState('selecting');
    setGeneratedContent('');
    setDocumentTitle('');
    setWordCount(0);
    setIsGenerating(false);
  };

  if (flowState === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          {/* Spinner animado */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 dark:border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Gerando seu documento...
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {progress}
          </p>

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Busca Acadêmica Avançada</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Consultando 15 bases científicas: OpenAlex, Semantic Scholar, arXiv, PubMed e mais
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">IA Multi-Modelo</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  DeepSeek V3.2-Exp, Gemini 2.0 Flash ou GPT-4o-mini com fallback automático
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Conteúdo Acadêmico</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gerando documento estruturado com citações ABNT e fundamentação científica
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (flowState === 'editing') {
    return (
      <DocumentEditor
        initialContent={generatedContent}
        initialTitle={documentTitle}
        wordCount={wordCount}
        onFinalize={handleFinalize}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AcademicTemplatesGallery onTemplateSelect={handleTemplateSelect} />
    </div>
  );
};
