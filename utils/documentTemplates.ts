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
