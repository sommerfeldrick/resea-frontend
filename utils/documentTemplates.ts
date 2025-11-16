/**
 * Document Templates
 * Templates predefinidos para diferentes tipos de documentos acadêmicos
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  example: string; // Exemplo real de saída gerada, não o prompt
  defaultConfig: {
    style: 'academic_formal' | 'technical_specialized' | 'accessible_clear';
    perspective: 'first_person_plural' | 'third_person';
    citationDensity: 'low' | 'medium' | 'high';
    criticalAnalysis: {
      includeCriticalAnalysis: boolean;
      pointOutLimitations: boolean;
      includeContrastingPerspectives: boolean;
    };
  };
  estimatedWords: {
    min: number;
    max: number;
  };
  estimatedTimeMinutes: number;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tcc',
    name: 'TCC (Trabalho de Conclusão de Curso)',
    description: 'Estrutura completa para TCC com todas as seções obrigatórias',
    icon: '🎓',
    complexity: 'advanced',
    example: `## Introdução

A inteligência artificial (IA) tem transformado diversos setores da sociedade contemporânea, incluindo a educação. No contexto educacional brasileiro, observa-se um crescente interesse na implementação de sistemas de IA para personalização do ensino e otimização de processos pedagógicos (Silva, 2023; Oliveira & Santos, 2024).

Este trabalho investiga a aplicação de algoritmos de aprendizado de máquina na personalização de trilhas de aprendizagem em plataformas de ensino superior. O estudo justifica-se pela necessidade de compreender como essas tecnologias podem contribuir para a redução da evasão escolar e melhoria do desempenho acadêmico.

**Objetivo Geral:** Avaliar a eficácia de sistemas de IA na personalização de trilhas de aprendizagem em cursos superiores de tecnologia.

**Objetivos Específicos:**
- Identificar os principais algoritmos utilizados em sistemas de recomendação educacional
- Desenvolver um protótipo de sistema de personalização baseado em IA
- Avaliar o impacto do sistema no engajamento e desempenho dos estudantes

A pesquisa adota uma abordagem metodológica mista, combinando revisão sistemática da literatura com desenvolvimento experimental de software...`,
    sections: [
      'Introdução',
      'Fundamentação Teórica',
      'Metodologia',
      'Resultados e Discussão',
      'Conclusão'
    ],
    defaultConfig: {
      style: 'academic_formal',
      perspective: 'third_person',
      citationDensity: 'high',
      criticalAnalysis: {
        includeCriticalAnalysis: true,
        pointOutLimitations: true,
        includeContrastingPerspectives: true
      }
    },
    estimatedWords: {
      min: 8000,
      max: 15000
    },
    estimatedTimeMinutes: 8
  },
  {
    id: 'artigo_cientifico',
    name: 'Artigo Científico',
    description: 'Formato padrão para publicação em periódicos científicos',
    icon: '📄',
    complexity: 'advanced',
    example: `**Resumo:** Este estudo investigou o impacto de interfaces adaptativas baseadas em IA no engajamento de estudantes universitários. Participaram 120 alunos divididos em grupos controle e experimental. Os resultados indicaram aumento de 34% no tempo de engajamento (p<0.01) e melhoria de 23% nas taxas de conclusão de atividades. Conclui-se que sistemas adaptativos podem potencializar a aprendizagem quando alinhados aos estilos cognitivos dos estudantes.

**Palavras-chave:** Inteligência Artificial, Educação Adaptativa, Engajamento Estudantil, Tecnologia Educacional

## 1. Introdução

A personalização do ensino tem sido apontada como um dos principais desafios da educação contemporânea (Gardner, 2020; Vygotsky, 2023). Com o avanço de tecnologias de IA, tornou-se possível criar sistemas que se adaptam dinamicamente ao perfil de cada estudante...`,
    sections: [
      'Resumo/Abstract',
      'Introdução',
      'Revisão de Literatura',
      'Metodologia',
      'Resultados',
      'Discussão',
      'Conclusão'
    ],
    defaultConfig: {
      style: 'technical_specialized',
      perspective: 'third_person',
      citationDensity: 'high',
      criticalAnalysis: {
        includeCriticalAnalysis: true,
        pointOutLimitations: true,
        includeContrastingPerspectives: true
      }
    },
    estimatedWords: {
      min: 4000,
      max: 8000
    },
    estimatedTimeMinutes: 5
  },
  {
    id: 'dissertacao',
    name: 'Dissertação de Mestrado',
    description: 'Estrutura completa para dissertação de mestrado',
    icon: '📚',
    complexity: 'advanced',
    example: `## Capítulo 1 - Introdução\n\nA presente dissertação investiga os impactos da transformação digital no ensino superior brasileiro. Apresentamos uma análise sistemática de 150 instituições e proposta de modelo conceitual para implementação de tecnologias educacionais. Os resultados contribuem para a compreensão de como instituições podem navegar a transição digital mantendo qualidade pedagógica...`,
    sections: [
      'Introdução',
      'Revisão Bibliográfica',
      'Fundamentação Teórica',
      'Metodologia',
      'Resultados',
      'Discussão dos Resultados',
      'Conclusão e Trabalhos Futuros'
    ],
    defaultConfig: {
      style: 'academic_formal',
      perspective: 'first_person_plural',
      citationDensity: 'high',
      criticalAnalysis: {
        includeCriticalAnalysis: true,
        pointOutLimitations: true,
        includeContrastingPerspectives: true
      }
    },
    estimatedWords: {
      min: 20000,
      max: 40000
    },
    estimatedTimeMinutes: 15
  },
  {
    id: 'revisao_literatura',
    name: 'Revisão de Literatura',
    description: 'Revisão sistemática ou narrativa da literatura',
    icon: '📖',
    complexity: 'intermediate',
    example: `## Análise da Literatura sobre IA na Educação\n\nA revisão identificou 87 estudos publicados entre 2020-2024 sobre aplicações de IA em ambientes educacionais. Três categorias principais emergiram: sistemas de tutoria inteligente (n=34), análise preditiva de desempenho (n=28) e personalização adaptativa (n=25). Os resultados indicam crescimento de 340% nas publicações sobre o tema nos últimos 4 anos...`,
    sections: [
      'Introdução',
      'Metodologia de Busca',
      'Análise da Literatura',
      'Síntese e Discussão',
      'Conclusão'
    ],
    defaultConfig: {
      style: 'academic_formal',
      perspective: 'third_person',
      citationDensity: 'high',
      criticalAnalysis: {
        includeCriticalAnalysis: true,
        pointOutLimitations: false,
        includeContrastingPerspectives: true
      }
    },
    estimatedWords: {
      min: 5000,
      max: 10000
    },
    estimatedTimeMinutes: 6
  },
  {
    id: 'projeto_pesquisa',
    name: 'Projeto de Pesquisa',
    description: 'Proposta de pesquisa para aprovação ou financiamento',
    icon: '🔬',
    complexity: 'basic',
    example: `## Contextualização e Problema\n\nEste projeto propõe investigar o uso de gamificação no ensino de programação para estudantes de graduação. Pesquisas indicam baixas taxas de aprovação em disciplinas introdutórias (45% em média). Propomos desenvolver e avaliar uma plataforma gamificada durante 1 semestre acadêmico com 120 participantes...`,
    sections: [
      'Contextualização',
      'Problema de Pesquisa',
      'Objetivos',
      'Justificativa',
      'Revisão de Literatura',
      'Metodologia Proposta',
      'Cronograma e Recursos'
    ],
    defaultConfig: {
      style: 'accessible_clear',
      perspective: 'first_person_plural',
      citationDensity: 'medium',
      criticalAnalysis: {
        includeCriticalAnalysis: false,
        pointOutLimitations: true,
        includeContrastingPerspectives: false
      }
    },
    estimatedWords: {
      min: 3000,
      max: 6000
    },
    estimatedTimeMinutes: 4
  },
  {
    id: 'relatorio_tecnico',
    name: 'Relatório Técnico',
    description: 'Relatório técnico-científico',
    icon: '⚙️',
    complexity: 'intermediate',
    example: `## Resumo Executivo\n\nEste relatório apresenta os resultados da implementação do sistema de gestão acadêmica baseado em cloud computing. Foram migrados 45TB de dados, 12 sistemas legados integrados, resultando em redução de 67% nos custos operacionais e melhoria de 89% no tempo de resposta de consultas...`,
    sections: [
      'Resumo Executivo',
      'Introdução',
      'Desenvolvimento',
      'Resultados e Análises',
      'Recomendações',
      'Conclusão'
    ],
    defaultConfig: {
      style: 'technical_specialized',
      perspective: 'third_person',
      citationDensity: 'medium',
      criticalAnalysis: {
        includeCriticalAnalysis: true,
        pointOutLimitations: true,
        includeContrastingPerspectives: false
      }
    },
    estimatedWords: {
      min: 5000,
      max: 12000
    },
    estimatedTimeMinutes: 6
  }
];

export const getTemplateById = (id: string): DocumentTemplate | undefined => {
  return DOCUMENT_TEMPLATES.find(t => t.id === id);
};

export const estimateGenerationTime = (wordCount: number): string => {
  // Estimativa baseada em ~1000 palavras por minuto
  const minutes = Math.ceil(wordCount / 1000);

  if (minutes < 2) {
    return '1-2 minutos';
  } else if (minutes < 5) {
    return `${minutes} minutos`;
  } else if (minutes < 10) {
    return `${minutes}-${minutes + 2} minutos`;
  } else {
    return `${minutes}-${minutes + 5} minutos`;
  }
};

export const calculateWordCount = (sections: string[], wordsPerSection = 1000): number => {
  return sections.length * wordsPerSection;
};
