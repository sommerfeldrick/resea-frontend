import React, { useState } from 'react';
import { SparkleIcon, PaperclipIcon } from './icons';
import { generateTaskPlan } from '../services/apiService';
import type { TaskPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onPlanGenerated: (plan: TaskPlan, query: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPlanGenerated }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, logout, refreshUser } = useAuth();

  const handleRefreshCredits = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Erro ao atualizar créditos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
                onClick={handleRefreshCredits}
                disabled={isRefreshing}
                title="Atualizar créditos"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    Atualizar
                  </>
                )}
              </button>
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg" title="Créditos disponíveis">
                {user?.credits ?? 50}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sair"
              >
                Sair
              </button>
          </div>
      </header>
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
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
                placeholder="Pergunte ao Resea..."
                className="w-full h-28 p-4 text-base border-none focus:ring-0 resize-none bg-transparent"
                disabled={isLoading}
              />
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button type="button" disabled className="flex items-center gap-2 rounded-lg bg-white p-2 border border-gray-200 text-sm font-medium text-gray-400 cursor-not-allowed" title="Funcionalidade em breve">
                        <PaperclipIcon className="w-5 h-5" />
                        Anexar Arquivos
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
          <p className="mt-4 text-xs text-gray-500 text-center">
            <span className="font-semibold">Exemplo:</span> 100% Pesquisa Humana sobre Aplicações de IA na Medicina
          </p>

          <div className="mt-12 p-5 bg-gradient-to-r from-gray-800 to-indigo-900 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-full">
                    <SparkleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-semibold">Assine para pesquisas 10X mais rápidas + 100% de conteúdo humano</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
                        <span>✓ Pensamento profundo, pesquisa e escrita</span>
                        <span>✓ Gerar conteúdo 100% humano</span>
                        <span>✓ Citações e referências precisas</span>
                        <span>✓ Edição de IA ilimitada</span>
                    </div>
                </div>
              </div>
              <button className="px-5 py-2.5 text-sm font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0">
                Atualizar
              </button>
          </div>
        </div>
      </main>
    </div>
  );
};