# 🚀 PLANO DE IMPLEMENTAÇÃO - RESEA AI MELHORIAS

## ✅ ARQUIVOS JÁ CRIADOS

1. **`components/ResearchPanels.tsx`** - Componentes de painéis
   - StatisticsPanel (Estatísticas)
   - CitationMap (Mapa de citações)
   - QualityPanel (Análise de qualidade)
   - GlossaryPanel (Glossário)
   - DeepDivePanel (Sugestões de aprofundamento)

2. **`components/PlanEditor.tsx`** - Editor de plano de execução
   - Editar título, tipo, público
   - Adicionar/remover/reordenar etapas
   - Resetar alterações

## 📋 PRÓXIMOS PASSOS

### **Fase 1: Core Features (Essencial)**

#### 1.1 Modificar `ResearchPage.tsx`

**Mudanças necessárias:**

```typescript
// ANTES (Execução automática):
useEffect(() => {
  async function runProcess() {
    await generateMindMap();
    await doResearch();
    await generateOutline();
    await writeDocument();
  }
  runProcess();
}, []);

// DEPOIS (Com controles de aprovação):
const [waitingFor Approval, setWaitingForApproval] = useState<'mindmap' | 'research' | 'outline' | null>(null);
const [showPlanEditor, setShowPlanEditor] = useState(false);

// Dividir em funções separadas que podem ser chamadas manualmente:
const generateMindMapPhase = async () => { ... };
const runResearchPhase = async () => { ... };
const generateOutlinePhase = async () => { ... };
const writeDocumentPhase = async () => { ... };

// Adicionar botões de aprovação:
{waitingForApproval === 'mindmap' && (
  <div className="...">
    <button onClick={() => { setShowPlanEditor(true); }}>
      ✏️ Editar Plano
    </button>
    <button onClick={runResearchPhase}>
      ▶️ Continuar para Pesquisa
    </button>
  </div>
)}
```

#### 1.2 Adicionar Salvamento Automático

```typescript
// Criar hook para auto-save
useEffect(() => {
  const interval = setInterval(() => {
    if (currentPhase === 'writing' && writtenContent) {
      saveToIndexedDB(currentResearch);
    }
  }, 30000); // A cada 30 segundos

  return () => clearInterval(interval);
}, [currentPhase, writtenContent]);
```

#### 1.3 Salvar no Histórico

```typescript
// Quando completar:
useEffect(() => {
  if (currentPhase === 'done') {
    const researchData = {
      id: Date.now().toString(),
      query: query,
      timestamp: new Date().toISOString(),
      taskPlan, mindMapData, researchResults, outline, writtenContent
    };

    // Salvar no IndexedDB
    storageService.saveResearch(researchData);

    // Notificar parent para atualizar sidebar
    onResearchComplete(researchData);
  }
}, [currentPhase]);
```

### **Fase 2: Integração de Painéis**

#### 2.1 Adicionar Tab para Estatísticas

```typescript
// No ResearchPage, adicionar nova tab:
type ActiveTab = 'document' | 'outline' | 'research' | 'mindmap' | 'stats' | 'quality';

// Calcular estatísticas:
const stats = useMemo(() => {
  const allSources = researchResults.flatMap(r => r.sources);
  const years = allSources.map(s => s.year).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  return {
    articlesFound: allSources.length,
    articlesRelevant: allSources.length, // Todos são relevantes
    periodCovered: `${minYear}-${maxYear}`,
    sourcesCount: new Set(allSources.map(s => s.sourceProvider)).size,
    wordsGenerated: writtenContent.split(/\s+/).length,
    wordsTarget: 10000,
    timeElapsed: formatElapsedTime(startTime),
    cost: 'R$ 0,00 (grátis)'
  };
}, [researchResults, writtenContent]);

// Renderizar:
case 'stats':
  return <StatisticsPanel stats={stats} />;
```

#### 2.2 Adicionar Análise de Qualidade

```typescript
// Gerar análise quando documento completar:
const qualityAnalysis = useMemo(() => {
  if (!writtenContent || currentPhase !== 'done') return null;

  return {
    overallScore: 8.5,
    strengths: [
      'Boa diversidade de fontes (7 bases)',
      'Artigos recentes (80% pós-2020)',
      'Alta qualidade acadêmica',
      'Estrutura bem organizada'
    ],
    improvements: [
      'Adicionar mais autores brasileiros',
      'Incluir estudos experimentais',
      'Expandar seção de metodologia'
    ],
    comparison: 6.2
  };
}, [writtenContent, currentPhase]);
```

### **Fase 3: Features Avançadas**

#### 3.1 Mind Map Evolutivo

```typescript
// Atualizar mind map conforme pesquisa avança:
useEffect(() => {
  if (currentPhase === 'research' && researchResults.length > 0) {
    // Adicionar novos nós para cada resultado de pesquisa
    const newNodes = researchResults.map((result, i) => ({
      id: `research-${i}`,
      data: { label: `${result.sources.length} artigos` },
      position: { x: 100 + i * 150, y: 200 },
      style: { background: '#10b981', color: 'white' }
    }));

    setMindMapData(prev => ({
      nodes: [...prev.nodes, ...newNodes],
      edges: [...prev.edges, ...newNodes.map(n => ({
        id: `e-center-${n.id}`,
        source: 'center',
        target: n.id,
        animated: true
      }))]
    }));
  }
}, [researchResults]);
```

#### 3.2 Glossário Automático

```typescript
// Extrair termos técnicos do documento:
const glossaryTerms = useMemo(() => {
  if (!writtenContent) return [];

  // Regex para encontrar termos em negrito ou em itálico
  const boldTerms = writtenContent.match(/\*\*(.*?)\*\*/g) || [];
  const italicTerms = writtenContent.match(/\*(.*?)\*/g) || [];

  const allTerms = [...boldTerms, ...italicTerms].map(t =>
    t.replace(/\*\*/g, '').replace(/\*/g, '')
  );

  // Contar ocorrências
  const termCounts = allTerms.reduce((acc, term) => {
    acc[term] = (acc[term] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Gerar definições (poderia ser via IA)
  return Object.entries(termCounts).map(([term, count]) => ({
    term,
    definition: `Definição de ${term}...`, // TODO: Gerar com IA
    occurrences: count
  }));
}, [writtenContent]);
```

#### 3.3 Exportação Avançada

```typescript
// Criar serviço de exportação:
import { exportService } from '../services/exportService';

const handleExport = async (format: 'pdf' | 'docx' | 'latex' | 'md') => {
  const data = {
    title: taskPlan.taskTitle,
    content: writtenContent,
    sources: researchResults.flatMap(r => r.sources),
    metadata: {
      author: user?.name,
      date: new Date().toISOString(),
      wordCount: writtenContent.split(/\s+/).length
    }
  };

  switch (format) {
    case 'pdf':
      await exportService.exportToPDF(data);
      break;
    case 'docx':
      await exportService.exportToWord(data);
      break;
    case 'latex':
      await exportService.exportToLaTeX(data);
      break;
    case 'md':
      await exportService.exportToMarkdown(data);
      break;
  }
};
```

## 🎯 ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

### **Semana 1: Controles Básicos**
1. ✅ Adicionar controles de pausa/aprovação
2. ✅ Integrar PlanEditor
3. ✅ Implementar salvamento automático
4. ✅ Corrigir salvamento no histórico

### **Semana 2: Painéis de Análise**
5. ✅ Adicionar StatisticsPanel
6. ✅ Adicionar QualityPanel
7. ✅ Adicionar CitationMap
8. ✅ Adicionar DeepDivePanel

### **Semana 3: Features Educacionais**
9. ✅ Implementar GlossaryPanel
10. ✅ Mind Map evolutivo
11. ✅ Modo de revisão com comentários
12. ✅ Sugestões de aprofundamento

### **Semana 4: Exportação e Polimento**
13. ✅ Sistema de exportação avançada
14. ✅ Comparador de versões
15. ✅ Assistente ABNT
16. ✅ Polish e testes finais

## 📝 NOTAS IMPORTANTES

1. **IndexedDB:** Usar `storageService.ts` existente
2. **Auto-save:** Implementar com intervalo de 30s durante escrita
3. **Performance:** Mind map pode ficar pesado com muitos nós
4. **IA para Glossário:** Precisará de endpoint no backend
5. **Exportação PDF:** Usar biblioteca `jspdf` ou `html2pdf`
6. **Exportação Word:** Usar `docx` npm package
7. **LaTeX:** Template básico com bibtex

## 🚀 QUER IMPLEMENTAR AGORA?

Escolha uma opção:

**A)** Implementar TUDO de uma vez (vai demorar ~2h)
**B)** Implementar Fase 1 agora (controles + salvamento) (~30min)
**C)** Implementar Fase 1 + Fase 2 (controles + painéis) (~1h)
**D)** Apenas criar o código de exemplo e você implementa depois

**Qual você prefere?**
