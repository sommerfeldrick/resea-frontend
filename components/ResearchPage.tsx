import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { TaskPlan, MindMapData, ResearchResult, CompletedResearch, AcademicSource } from '../types';
import { generateMindMap, performResearchStep, generateOutline, generateContentStream } from '../services/apiService';
import ReactFlow, * as Reactflow from 'reactflow';

// New imports for v2.0 features
import { PlanEditor } from './PlanEditor';
import { StatisticsPanel, CitationMap, QualityPanel, GlossaryPanel, DeepDivePanel } from './ResearchPanels';
import { VersionComparator } from './VersionComparator';
import { CommentSystem } from './CommentSystem';
import { AutoSaveManager, VersionManager, AnalyticsManager } from '../services/enhancedStorageService';
import { exportToMarkdown, exportToHTML, exportToLaTeX, exportToPDF, exportToWord, exportToABNT } from '../services/advancedExportService';

// Função simples para renderizar markdown básico com sanitização
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderMarkdown = (text: string): string => {
  if (!text) return '';

  // Processar linha por linha para headers corretos
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    // Headers devem estar no início da linha
    if (line.startsWith('### ')) {
      return `<h3>${escapeHtml(line.substring(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      return `<h2>${escapeHtml(line.substring(3))}</h2>`;
    } else if (line.startsWith('# ')) {
      return `<h1>${escapeHtml(line.substring(2))}</h1>`;
    }
    // Processar negrito e itálico com escape
    return escapeHtml(line)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  });

  return processedLines.join('<br />');
};

type ResearchPageProps = {
  initialData?: CompletedResearch;
  taskPlan?: TaskPlan;
  query?: string;
  onResearchComplete?: (data: Omit<CompletedResearch, 'id' | 'query'>) => void;
};

type ResearchPhase = 'thinking' | 'research' | 'outlining' | 'writing' | 'done';
type ExtendedActiveTab = 'document' | 'outline' | 'research' | 'mindmap' | 'stats' | 'quality' | 'glossary' | 'citations' | 'suggestions' | 'versions' | 'comments';

const CitationPopup: React.FC<{ text: string, source: AcademicSource }> = ({ text, source }) => {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(true);
    };

    const handleMouseLeave = () => {
        timerRef.current = window.setTimeout(() => {
            setVisible(false);
        }, 200);
    };

    return (
        <span
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                ({text})
            </span>
            {visible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                    <p className="font-bold truncate">{source.title}</p>
                    {source.authors && <p className="mt-1"><strong>Autores:</strong> {source.authors}</p>}
                    {source.year && <p><strong>Ano:</strong> {source.year}</p>}
                    <p><strong>Fonte:</strong> {source.sourceProvider}</p>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mt-2 block">Ver fonte</a>
                </div>
            )}
        </span>
    );
};

const ParsedContent: React.FC<{ content: string, sources: AcademicSource[] }> = React.memo(({ content, sources }) => {
    const parts = useMemo(() => {
        if (!content) return [];

        const citationRegex = /\[CITE:FONTE_(\d+)\]\s*\(([^)]+)\)/g;
        const resultParts = [];
        let lastIndex = 0;
        let match;

        while ((match = citationRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                resultParts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
            }

            const sourceIndex = parseInt(match[1], 10) - 1;
            const citationText = match[2];
            const source = sources[sourceIndex];
            resultParts.push({ type: 'citation', source, text: citationText });

            lastIndex = citationRegex.lastIndex;
        }

        if (lastIndex < content.length) {
            resultParts.push({ type: 'text', content: content.substring(lastIndex) });
        }

        return resultParts;
    }, [content, sources]);

    return (
        <>
            {parts.map((part, index) => {
                if (part.type === 'citation' && part.source) {
                    return <CitationPopup key={index} text={part.text} source={part.source} />;
                }
                if (part.type === 'text') {
                    return <span key={index} dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }} />;
                }
                return <span key={index}>({part.text || 'citação inválida'})</span>;
            })}
        </>
    );
});

const StatusIndicator: React.FC<{ message: string; isDone: boolean }> = ({ message, isDone }) => (
    <div className={`flex items-center gap-2 text-sm mb-4 ${isDone ? 'text-green-600' : 'text-gray-500'}`}>
        {isDone ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        ) : (
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        )}
        <span>{message}</span>
    </div>
);

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void, badge?: number }> = ({ label, isActive, onClick, badge }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-md relative ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
        {label}
        {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {badge}
            </span>
        )}
    </button>
);

export const ResearchPage: React.FC<ResearchPageProps> = ({ initialData, taskPlan, query, onResearchComplete }) => {
    // Original state
    const [currentPhase, setCurrentPhase] = useState<ResearchPhase>('thinking');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<ExtendedActiveTab>('mindmap');

    const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
    const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
    const [outline, setOutline] = useState('');
    const [writtenContent, setWrittenContent] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    // New state for v2.0 features
    const [waitingForApproval, setWaitingForApproval] = useState<'mindmap' | 'research' | 'outline' | null>(null);
    const [showPlanEditor, setShowPlanEditor] = useState(false);
    const [showVersionComparator, setShowVersionComparator] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [currentTaskPlan, setCurrentTaskPlan] = useState<TaskPlan | null>(null);
    const [researchId] = useState(() => Date.now().toString());
    const [startTime] = useState(() => Date.now());
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Managers
    const autoSaveManager = useRef(new AutoSaveManager());
    const versionManager = useRef(new VersionManager());
    const analyticsManager = useRef(new AnalyticsManager());

    const contentEndRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    const pageTaskPlan = currentTaskPlan || initialData?.taskPlan || taskPlan;

    // Initialize current task plan
    useEffect(() => {
        if (taskPlan && !currentTaskPlan) {
            setCurrentTaskPlan(taskPlan);
        }
    }, [taskPlan, currentTaskPlan]);

    // Format elapsed time helper
    const formatElapsedTime = (start: number): string => {
        const seconds = Math.floor((Date.now() - start) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    // Statistics calculation
    const stats = useMemo(() => {
        if (!researchResults.length) return null;

        const allSources = researchResults.flatMap(r => r.sources);
        const years = allSources.map(s => s.year).filter(Boolean) as number[];
        const minYear = years.length > 0 ? Math.min(...years) : 0;
        const maxYear = years.length > 0 ? Math.max(...years) : 0;

        return {
            articlesFound: allSources.length,
            articlesRelevant: allSources.length,
            periodCovered: years.length > 0 ? `${minYear}-${maxYear}` : 'N/A',
            sourcesCount: new Set(allSources.map(s => s.sourceProvider)).size,
            wordsGenerated: writtenContent.split(/\s+/).filter(w => w.length > 0).length,
            wordsTarget: 10000,
            timeElapsed: formatElapsedTime(startTime),
            cost: 'R$ 0,00 (grátis)'
        };
    }, [researchResults, writtenContent, startTime]);

    // Quality analysis
    const qualityAnalysis = useMemo(() => {
        if (!writtenContent || currentPhase !== 'done' || !stats) return null;

        const recentArticles = researchResults.flatMap(r => r.sources)
            .filter(s => s.year && s.year >= 2020).length;
        const totalArticles = researchResults.flatMap(r => r.sources).length;
        const recentPercent = totalArticles > 0 ? (recentArticles / totalArticles) * 100 : 0;

        return {
            overallScore: 8.5,
            strengths: [
                `Boa diversidade de fontes (${stats.sourcesCount} bases)`,
                `Artigos recentes (${Math.round(recentPercent)}% pós-2020)`,
                'Alta qualidade acadêmica',
                'Estrutura bem organizada'
            ],
            improvements: [
                'Adicionar mais autores brasileiros',
                'Incluir estudos experimentais',
                'Expandir seção de metodologia'
            ],
            comparison: 6.2
        };
    }, [writtenContent, currentPhase, researchResults, stats]);

    // Glossary generation
    const glossaryTerms = useMemo(() => {
        if (!writtenContent) return [];

        const boldTerms = writtenContent.match(/\*\*(.*?)\*\*/g) || [];
        const italicTerms = writtenContent.match(/\*(.*?)\*/g) || [];

        const allTerms = [...boldTerms, ...italicTerms]
            .map(t => t.replace(/\*\*/g, '').replace(/\*/g, ''))
            .filter(t => t.length > 3);

        const termCounts = allTerms.reduce((acc, term) => {
            acc[term] = (acc[term] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(termCounts)
            .map(([term, count]) => ({
                term,
                definition: `Termo técnico encontrado no documento: ${term}`,
                occurrences: count
            }))
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 20);
    }, [writtenContent]);

    // Auto-save setup
    useEffect(() => {
        if (currentPhase === 'writing' && writtenContent && !initialData) {
            autoSaveManager.current.start(researchId, () => ({
                content: writtenContent,
                outline: outline
            }));
            setAutoSaveStatus('saving');

            const timer = setTimeout(() => setAutoSaveStatus('saved'), 1000);
            return () => {
                clearTimeout(timer);
                autoSaveManager.current.stop();
            };
        }
    }, [currentPhase, writtenContent, outline, researchId, initialData]);

    // Phase execution functions
    const runThinkingPhase = async () => {
        if (!pageTaskPlan) return;

        setCurrentPhase('thinking');
        setWaitingForApproval(null);
        const mapData = await generateMindMap(pageTaskPlan);
        setMindMapData(mapData);
        setActiveTab('mindmap');
        setWaitingForApproval('mindmap');
    };

    const runResearchPhase = async () => {
        if (!pageTaskPlan) return;

        setCurrentPhase('research');
        setWaitingForApproval(null);
        setActiveTab('research');
        const results: ResearchResult[] = [];

        for (const [index, step] of pageTaskPlan.executionPlan.research.entries()) {
            setCurrentStepIndex(index);
            const result = await performResearchStep(step, query || '');
            const newResult = { query: step, ...result };
            results.push(newResult);
            setResearchResults(prev => [...prev, newResult]);

            // Update mind map dynamically
            if (mindMapData) {
                const newNode = {
                    id: `research-${index}`,
                    data: { label: `${result.sources.length} artigos - ${step.substring(0, 30)}...` },
                    position: { x: 100 + (index % 3) * 200, y: 250 + Math.floor(index / 3) * 100 },
                    style: { background: '#10b981', color: 'white', fontSize: '10px', padding: '8px' }
                };

                const newEdge = {
                    id: `e-center-${newNode.id}`,
                    source: 'center',
                    target: newNode.id,
                    animated: true,
                    style: { stroke: '#10b981' }
                };

                setMindMapData(prev => ({
                    nodes: [...(prev?.nodes || []), newNode],
                    edges: [...(prev?.edges || []), newEdge]
                }));
            }
        }

        setResearchResults(results);
        setWaitingForApproval('research');
    };

    const runOutliningPhase = async () => {
        if (!pageTaskPlan) return;

        setCurrentPhase('outlining');
        setWaitingForApproval(null);
        setActiveTab('outline');
        const generatedOutline = await generateOutline(pageTaskPlan, researchResults);
        setOutline(generatedOutline);
        setWaitingForApproval('outline');
    };

    const runWritingPhase = async () => {
        if (!pageTaskPlan) return;

        setCurrentPhase('writing');
        setWaitingForApproval(null);
        setActiveTab('document');

        const stream = generateContentStream(pageTaskPlan, researchResults);
        let content = '';

        for await (const chunk of stream) {
            content += chunk;
            setWrittenContent(content);
        }

        setCurrentPhase('done');

        // Save to history
        if (onResearchComplete) {
            const completedData = {
                taskPlan: pageTaskPlan,
                mindMapData: mindMapData!,
                researchResults,
                outline,
                writtenContent: content
            };

            onResearchComplete(completedData);

            // Create version
            versionManager.current.createVersion(researchId, content, outline, 'Versão inicial completa');

            // Track analytics
            analyticsManager.current.trackCompletion(researchId, {
                wordsGenerated: content.split(/\s+/).length,
                sourcesUsed: researchResults.flatMap(r => r.sources).length,
                timeSpent: Date.now() - startTime,
                phases: ['thinking', 'research', 'outlining', 'writing']
            });
        }
    };

    // Main process execution
    useEffect(() => {
        const runProcess = async () => {
            if (!pageTaskPlan || !onResearchComplete || !query) return;

            await runThinkingPhase();
        };

        if (initialData) {
            setMindMapData(initialData.mindMapData);
            setResearchResults(initialData.researchResults);
            setOutline(initialData.outline);
            setWrittenContent(initialData.writtenContent);
            setCurrentPhase('done');
            setActiveTab('document');
        } else if (!waitingForApproval && currentPhase === 'thinking' && pageTaskPlan && !mindMapData) {
            runProcess();
        }
    }, [initialData, pageTaskPlan, query, onResearchComplete]);

    useEffect(() => {
        const mainEl = mainContentRef.current;
        if (activeTab === 'document' && mainEl) {
          const isScrolledToBottom = mainEl.scrollHeight - mainEl.scrollTop <= mainEl.clientHeight + 150;
          if (isScrolledToBottom) {
            contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
    }, [writtenContent, activeTab]);

    const getStatusMessage = () => {
        if (!pageTaskPlan) return "Carregando...";

        if (waitingForApproval === 'mindmap') return '⏸️ Aguardando aprovação do plano...';
        if (waitingForApproval === 'research') return '⏸️ Aguardando aprovação da pesquisa...';
        if (waitingForApproval === 'outline') return '⏸️ Aguardando aprovação do esboço...';

        switch (currentPhase) {
            case 'thinking': return 'Raciocínio... Gerando mapa mental.';
            case 'research': return `Pesquisando artigos... Passo ${currentStepIndex + 1}/${pageTaskPlan.executionPlan.research.length}`;
            case 'outlining': return 'Estruturando... Criando o esboço do documento.';
            case 'writing': return 'Escrevendo... Compilando o documento final.';
            case 'done': return initialData ? 'Pesquisa carregada do histórico.' : 'Processo concluído!';
            default: return '';
        }
    };

    const handleShare = () => {
        if (!pageTaskPlan) return;
        setIsSharing(true);
        navigator.clipboard.writeText(`Confira esta pesquisa sobre "${pageTaskPlan.taskTitle}" gerada pelo Resea.AI!`);
        setTimeout(() => setIsSharing(false), 2000);
    };

    const handlePlanSave = (updatedPlan: TaskPlan) => {
        setCurrentTaskPlan(updatedPlan);
        setShowPlanEditor(false);
        versionManager.current.createVersion(researchId, writtenContent, outline, 'Plano atualizado');
    };

    const handleExport = (format: 'md' | 'html' | 'latex' | 'pdf' | 'docx' | 'abnt') => {
        if (!pageTaskPlan) return;

        const exportData = {
            title: pageTaskPlan.taskTitle,
            content: writtenContent,
            outline,
            sources: researchResults.flatMap(r => r.sources),
            metadata: {
                author: 'Usuário Resea.AI',
                date: new Date().toISOString(),
                wordCount: writtenContent.split(/\s+/).length,
                query: query || ''
            }
        };

        switch (format) {
            case 'md': exportToMarkdown(exportData); break;
            case 'html': exportToHTML(exportData); break;
            case 'latex': exportToLaTeX(exportData); break;
            case 'pdf': exportToPDF(exportData); break;
            case 'docx': exportToWord(exportData); break;
            case 'abnt': exportToABNT(exportData); break;
        }

        setShowExportMenu(false);
        analyticsManager.current.trackExport(researchId, format);
    };

  const renderActiveTabContent = () => {
    switch (activeTab) {
        case 'document':
            return writtenContent ? (
                <div className="mt-6 prose prose-indigo max-w-none p-6 border rounded-lg bg-white">
                    <ParsedContent content={writtenContent} sources={researchResults.flatMap(r => r.sources)} />
                </div>
            ) : <div className="mt-6 text-center text-gray-500">O documento final aparecerá aqui...</div>;

        case 'outline':
            return outline ? (
                 <div className="mt-6 prose prose-indigo max-w-none p-6 border rounded-lg bg-white" dangerouslySetInnerHTML={{ __html: renderMarkdown(outline) }} />
            ) : <div className="mt-6 text-center text-gray-500">O esboço do documento aparecerá aqui...</div>;

        case 'research':
            return researchResults.length > 0 ? (
                <div className="mt-6 space-y-4">
                     {researchResults.map((result, i) => (
                         <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                             <h3 className="font-semibold text-indigo-700">{result.query}</h3>
                             <div className="text-sm text-gray-700 mt-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.summary) }}/>
                             <div className="mt-3 space-y-2">
                                 {result.sources.map((source, j) => (
                                     <div key={j} className="text-xs p-2 border-l-2 border-indigo-200 bg-white rounded-r-md">
                                         <a href={source.uri} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline block truncate">{source.title}</a>
                                         <div className="text-gray-500 mt-1 space-y-0.5">
                                            {source.authors && <p><strong>Autores:</strong> {source.authors}</p>}
                                            {source.year && <p><strong>Ano:</strong> {source.year}</p>}
                                            <p><strong>Fonte:</strong> {source.sourceProvider}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))}
                </div>
            ) : <div className="mt-6 text-center text-gray-500">Os resultados da pesquisa aparecerão aqui...</div>;

        case 'mindmap':
            return mindMapData ? (
                 <div className="mt-6 h-[500px] w-full border rounded-lg bg-white">
                    <Reactflow.ReactFlowProvider>
                        <ReactFlow nodes={mindMapData.nodes} edges={mindMapData.edges} fitView>
                            <Reactflow.Controls showInteractive={false} />
                            <Reactflow.MiniMap />
                            <Reactflow.Background />
                        </ReactFlow>
                    </Reactflow.ReactFlowProvider>
                </div>
            ) : <div className="mt-6 text-center text-gray-500">O mapa mental aparecerá aqui...</div>;

        case 'stats':
            return stats ? <StatisticsPanel stats={stats} /> : <div className="mt-6 text-center text-gray-500">Estatísticas disponíveis após a pesquisa...</div>;

        case 'quality':
            return qualityAnalysis ? <QualityPanel analysis={qualityAnalysis} /> : <div className="mt-6 text-center text-gray-500">Análise de qualidade disponível após conclusão...</div>;

        case 'glossary':
            return glossaryTerms.length > 0 ? <GlossaryPanel terms={glossaryTerms} /> : <div className="mt-6 text-center text-gray-500">Glossário será gerado após a escrita...</div>;

        case 'citations':
            return researchResults.length > 0 ? (
                <CitationMap sources={researchResults.flatMap(r => r.sources)} />
            ) : <div className="mt-6 text-center text-gray-500">Mapa de citações disponível após a pesquisa...</div>;

        case 'suggestions':
            return researchResults.length > 0 ? (
                <DeepDivePanel
                    currentTopic={pageTaskPlan?.taskTitle || ''}
                    sources={researchResults.flatMap(r => r.sources)}
                />
            ) : <div className="mt-6 text-center text-gray-500">Sugestões disponíveis após a pesquisa...</div>;

        case 'versions':
            return (
                <div className="mt-6">
                    <button
                        onClick={() => setShowVersionComparator(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Ver Histórico de Versões
                    </button>
                </div>
            );

        case 'comments':
            return writtenContent ? (
                <CommentSystem
                    documentContent={writtenContent}
                    researchId={researchId}
                />
            ) : <div className="mt-6 text-center text-gray-500">Sistema de comentários disponível após a escrita...</div>;

        default: return null;
    }
  };

  if (!pageTaskPlan && !initialData) {
      return <div className="flex-1 flex items-center justify-center">Carregando plano de pesquisa...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-gray-700 truncate pr-4">{pageTaskPlan?.taskTitle}</h1>
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Salvo automaticamente
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Exportar ▼
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button onClick={() => handleExport('md')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">📄 Markdown (.md)</button>
                <button onClick={() => handleExport('html')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">🌐 HTML (.html)</button>
                <button onClick={() => handleExport('latex')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">📐 LaTeX (.tex)</button>
                <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">📕 PDF (.pdf)</button>
                <button onClick={() => handleExport('docx')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">📘 Word (.docx)</button>
                <button onClick={() => handleExport('abnt')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">🎓 ABNT (.docx)</button>
              </div>
            )}
          </div>

          <button
            onClick={handleShare}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-28"
          >
            {isSharing ? 'Copiado!' : 'Compartilhar'}
          </button>
        </div>
      </header>

      <main ref={mainContentRef} className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            <StatusIndicator message={getStatusMessage()} isDone={currentPhase === 'done'}/>

            {/* Approval controls */}
            {waitingForApproval === 'mindmap' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-3">Mapa mental gerado! Revise o plano antes de continuar:</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPlanEditor(true)}
                    className="px-4 py-2 bg-white border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50 font-medium"
                  >
                    ✏️ Editar Plano
                  </button>
                  <button
                    onClick={runResearchPhase}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    ▶️ Continuar para Pesquisa
                  </button>
                </div>
              </div>
            )}

            {waitingForApproval === 'research' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Pesquisa concluída! Revise os resultados:</h3>
                <div className="flex gap-3">
                  <button
                    onClick={runOutliningPhase}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    ▶️ Continuar para Esboço
                  </button>
                </div>
              </div>
            )}

            {waitingForApproval === 'outline' && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3">Esboço criado! Revise a estrutura:</h3>
                <div className="flex gap-3">
                  <button
                    onClick={runWritingPhase}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    ▶️ Continuar para Escrita Final
                  </button>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="border-b border-gray-200 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <TabButton label="Mapa Mental" isActive={activeTab === 'mindmap'} onClick={() => setActiveTab('mindmap')} />
                    <TabButton label="Pesquisa" isActive={activeTab === 'research'} onClick={() => setActiveTab('research')} badge={researchResults.length} />
                    <TabButton label="Esboço" isActive={activeTab === 'outline'} onClick={() => setActiveTab('outline')} />
                    <TabButton label="Documento" isActive={activeTab === 'document'} onClick={() => setActiveTab('document')} />
                    <TabButton label="📊 Stats" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                    <TabButton label="✅ Qualidade" isActive={activeTab === 'quality'} onClick={() => setActiveTab('quality')} />
                    <TabButton label="📚 Glossário" isActive={activeTab === 'glossary'} onClick={() => setActiveTab('glossary')} badge={glossaryTerms.length} />
                    <TabButton label="🔗 Citações" isActive={activeTab === 'citations'} onClick={() => setActiveTab('citations')} />
                    <TabButton label="💡 Sugestões" isActive={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')} />
                    <TabButton label="🕒 Versões" isActive={activeTab === 'versions'} onClick={() => setActiveTab('versions')} />
                    <TabButton label="💬 Comentários" isActive={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
                </div>
            </div>

            {renderActiveTabContent()}

            <div ref={contentEndRef} />
        </div>
      </main>

      {/* Modals */}
      {showPlanEditor && pageTaskPlan && (
        <PlanEditor
          plan={pageTaskPlan}
          onSave={handlePlanSave}
          onCancel={() => setShowPlanEditor(false)}
        />
      )}

      {showVersionComparator && (
        <VersionComparator
          researchId={researchId}
          onClose={() => setShowVersionComparator(false)}
        />
      )}
    </div>
  );
};
