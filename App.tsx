import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { ResearchPage } from './components/ResearchPage';
import { LogoIcon, PlusIcon, BrainCircuitIcon, MoreHorizontalIcon } from './components/icons';
import type { TaskPlan, CompletedResearch, MindMapData, ResearchResult } from './types';
import { mockHistory } from './mockData';


const HistoryItem: React.FC<{
    item: CompletedResearch;
    isActive: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ item, isActive, onSelect, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`group flex items-center justify-between rounded-md ${isActive ? 'bg-indigo-100' : 'hover:bg-gray-200'}`}>
            <button 
                onClick={() => onSelect(item.id)} 
                className={`flex-grow text-left px-2 py-1.5 text-sm rounded-l-md truncate ${isActive ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}
            >
                {item.query}
            </button>
            <div className="relative pr-1" ref={menuRef}>
                <button onClick={() => setMenuOpen(prev => !prev)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-500 hover:text-gray-800 p-1 rounded-full" aria-label="Opções">
                    <MoreHorizontalIcon className="w-4 h-4" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                        <button onClick={() => { onDelete(item.id); setMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md">
                            Excluir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


const Sidebar: React.FC<{ 
    onNewSearch: () => void;
    onSelectHistory: (id: string) => void;
    onDeleteHistory: (id: string) => void;
    activeItemId: string | null;
    history: CompletedResearch[];
}> = ({ onNewSearch, onSelectHistory, onDeleteHistory, activeItemId, history }) => {
    
    // For demonstration, we'll split the mock history.
    const recents = history.slice(0, 1);
    const historyItems = history.slice(1);

    return (
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4">
            <div className="flex items-center gap-2 mb-8">
                <LogoIcon className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900">Resea.AI</span>
            </div>
            <button
                onClick={onNewSearch}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
                <PlusIcon className="h-5 w-5" />
                Novo Documento
            </button>
            <div className="mt-6">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recentes</h3>
                <div className="mt-2 space-y-1">
                    {recents.map((item) => (
                       <HistoryItem key={item.id} item={item} isActive={activeItemId === item.id} onSelect={onSelectHistory} onDelete={onDeleteHistory} />
                    ))}
                </div>
            </div>
            <div className="mt-6">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Histórico</h3>
                <div className="mt-2 space-y-1">
                    {historyItems.map((item) => (
                         <HistoryItem key={item.id} item={item} isActive={activeItemId === item.id} onSelect={onSelectHistory} onDelete={onDeleteHistory} />
                    ))}
                </div>
            </div>
            <div className="mt-auto">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        RS
                    </div>
                    <span className="text-sm font-medium text-gray-800">ricardo somme...</span>
                </div>
            </div>
        </aside>
    );
};


const PlanConfirmation: React.FC<{ plan: TaskPlan, onConfirm: () => void, onCancel: () => void }> = ({ plan, onConfirm, onCancel }) => {
    const renderPhaseList = (title: string, steps: string[]) => (
        <div>
            <h4 className="font-semibold text-gray-700 mt-4 mb-2 flex items-center gap-2">
                <BrainCircuitIcon className="w-5 h-5" /> Fase de {title}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {steps.map((step, i) => <li key={i}>{step}</li>)}
            </ul>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
                <h1 className="text-lg font-semibold text-gray-800">Plano de Execução da Tarefa</h1>
                <div>
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Voltar
                    </button>
                    <button onClick={onConfirm} className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                        Iniciar Pesquisa
                    </button>
                </div>
            </header>
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-700 mb-6">Aqui está o plano de pesquisa que preparei com base em sua solicitação. Por favor, revise e confirme para iniciar o processo.</p>

                    <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h2 className="text-lg font-bold text-indigo-900 mb-4">{plan.taskTitle}</h2>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Descrição da Tarefa</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <div><span className="text-gray-500">Tipo:</span> <span className="text-gray-800">{plan.taskDescription.type}</span></div>
                                <div><span className="text-gray-500">Público:</span> <span className="text-gray-800">{plan.taskDescription.audience}</span></div>
                                <div><span className="text-gray-500">Estilo:</span> <span className="text-gray-800">{plan.taskDescription.style}</span></div>
                                <div><span className="text-gray-500">Contagem de Palavras:</span> <span className="text-gray-800">{plan.taskDescription.wordCount}</span></div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Plano de Execução da Tarefa</h3>
                            {renderPhaseList('pensamento', plan.executionPlan.thinking)}
                            {renderPhaseList('pesquisa', plan.executionPlan.research)}
                            {renderPhaseList('escrita', plan.executionPlan.writing)}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'plan_confirmation' | 'research'>('landing');
  const [taskPlan, setTaskPlan] = useState<TaskPlan | null>(null);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<CompletedResearch[]>(mockHistory);
  const [currentResearch, setCurrentResearch] = useState<CompletedResearch | null>(null);

  const handlePlanGenerated = (plan: TaskPlan, userQuery: string) => {
    setTaskPlan(plan);
    setQuery(userQuery);
    setCurrentResearch(null);
    setView('plan_confirmation');
  };

  const handleStartResearch = () => {
    if (taskPlan) {
      setView('research');
    }
  };

  const handleNewSearch = () => {
    setView('landing');
    setTaskPlan(null);
    setQuery('');
    setCurrentResearch(null);
  };
  
  const handleSelectHistory = (id: string) => {
      const item = history.find(h => h.id === id);
      if (item) {
          setCurrentResearch(item);
          setTaskPlan(null);
          setQuery('');
          setView('research');
      }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentResearch?.id === id) {
        handleNewSearch();
    }
  };
  
  const handleResearchComplete = (data: Omit<CompletedResearch, 'id' | 'query'>) => {
      const newEntry: CompletedResearch = {
          id: `history-${Date.now()}`,
          query: query,
          ...data,
      };
      setHistory(prev => [newEntry, ...prev]);
      setCurrentResearch(newEntry);
  };

  const getActiveItemId = () => {
      if (currentResearch) {
          return currentResearch.id;
      }
      // If it's a new search that matches a historic query, also activate it.
      const existing = history.find(h => h.query === query);
      return existing?.id || null;
  }

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onPlanGenerated={handlePlanGenerated} />;
      case 'plan_confirmation':
        return taskPlan ? (
          <PlanConfirmation plan={taskPlan} onConfirm={handleStartResearch} onCancel={handleNewSearch} />
        ) : (
          <div className="flex items-center justify-center h-full">Error: No plan to confirm.</div>
        );
      case 'research':
        if (currentResearch) {
            return <ResearchPage key={currentResearch.id} initialData={currentResearch} />
        }
        if (taskPlan && query) {
            return <ResearchPage key={query} taskPlan={taskPlan} query={query} onResearchComplete={handleResearchComplete} />
        }
        return <div className="flex items-center justify-center h-full">Carregando...</div>;
      default:
        return <LandingPage onPlanGenerated={handlePlanGenerated} />;
    }
  }

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans">
      <Sidebar 
        onNewSearch={handleNewSearch}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        activeItemId={getActiveItemId()}
        history={history}
       />
      <main className="flex-1 flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
// Create a new file for mock data to keep App.tsx clean
const mockDataFile = 'mockData.ts';
const mockDataContent = `
import type { CompletedResearch } from './types';

export const mockHistory: CompletedResearch[] = [
    {
        id: 'hist-1',
        query: 'implantes hexágono externo...',
        taskPlan: {
            taskTitle: 'Revisão de Literatura: Aplicações de Implantes de Hexágono Externo',
            taskDescription: { type: 'Revisão Acadêmica', style: 'Científico', audience: 'Estudantes de Odontologia', wordCount: '5000' },
            executionPlan: { thinking: [], research: [], writing: [] }
        },
        mindMapData: {
            nodes: [{ id: '1', type: 'input', data: { label: 'Implantes Hexágono Externo' }, position: { x: 250, y: 25 } }],
            edges: []
        },
        researchResults: [],
        outline: '## Esboço de Exemplo',
        writtenContent: '# Documento de Exemplo para Histórico'
    },
    {
        id: 'hist-2',
        query: 'Revisão Sistemática da Liter...',
        taskPlan: {
            taskTitle: 'Revisão Sistemática da Literatura sobre IA',
            taskDescription: { type: 'Revisão Sistemática', style: 'Acadêmico', audience: 'Pesquisadores', wordCount: '10000' },
            executionPlan: { thinking: [], research: [], writing: [] }
        },
        mindMapData: null,
        researchResults: [],
        outline: '',
        writtenContent: '# Revisão Sistemática sobre IA'
    },
     {
        id: 'hist-3',
        query: 'Impacto das Mudanças Clim...',
        taskPlan: { taskTitle: 'Impacto das Mudanças Climáticas', taskDescription: { type: 'Artigo', style: 'Divulgação', audience: 'Público Geral', wordCount: '2000' }, executionPlan: { thinking: [], research: [], writing: [] }},
        mindMapData: null, researchResults: [], outline: '', writtenContent: ''
    },
     {
        id: 'hist-4',
        query: 'Análise do Cenário Competi...',
        taskPlan: { taskTitle: 'Análise do Cenário Competitivo de Startups', taskDescription: { type: 'Relatório', style: 'Negócios', audience: 'Investidores', wordCount: '3000' }, executionPlan: { thinking: [], research: [], writing: [] }},
        mindMapData: null, researchResults: [], outline: '', writtenContent: ''
    },
     {
        id: 'hist-5',
        query: 'Pesquisa de Posicionament...',
        taskPlan: { taskTitle: 'Pesquisa de Posicionamento de Marca', taskDescription: { type: 'Estudo de Caso', style: 'Marketing', audience: 'Gerentes de Produto', wordCount: '4000' }, executionPlan: { thinking: [], research: [], writing: [] }},
        mindMapData: null, researchResults: [], outline: '', writtenContent: ''
    },
     {
        id: 'hist-6',
        query: 'Apresentando Resea',
        taskPlan: { taskTitle: 'Apresentando Resea AI', taskDescription: { type: 'Apresentação', style: 'Técnico', audience: 'Desenvolvedores', wordCount: '1500' }, executionPlan: { thinking: [], research: [], writing: [] }},
        mindMapData: null, researchResults: [], outline: '', writtenContent: ''
    }
];
`;
// Note: In a real environment, you'd create this file. 
// For this tool, the content is just illustrative of the separation of concerns.
// Let's create `mockData.ts`
import { mockHistory as importedMock } from './mockData';