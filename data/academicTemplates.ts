/**
 * Templates de Pesquisa Acadêmica
 * Cada template possui informações para guiar o usuário em diferentes etapas da escrita acadêmica
 */

export interface AcademicTemplate {
  id: string;
  category: 'introducao' | 'revisao' | 'metodologia' | 'resultados' | 'conclusao' | 'abstract';
  title: string;
  description: string;
  icon: string;
  estimatedTime: number; // em minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularityScore: number;

  // Campos que o usuário precisa preencher
  requiredFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'tags';
    placeholder?: string;
    options?: string[];
    required: boolean;
  }>;

  // Template do prompt que será enviado
  promptTemplate: string;
}

export const academicTemplates: AcademicTemplate[] = [
  // ===== INTRODUÇÃO =====
  {
    id: 'intro-contextualizacao',
    category: 'introducao',
    title: 'Contextualização do Tema',
    description: 'Apresenta o contexto geral e a importância do tema de pesquisa',
    icon: '📝',
    estimatedTime: 5,
    difficulty: 'beginner',
    popularityScore: 95,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', placeholder: 'Ex: Inteligência Artificial na Educação', required: true },
      { name: 'area', label: 'Área do Conhecimento', type: 'select', options: ['Ciências Humanas', 'Ciências Exatas', 'Ciências Biológicas', 'Ciências da Saúde', 'Engenharias', 'Ciências Sociais Aplicadas'], required: true },
      { name: 'keywords', label: 'Palavras-chave', type: 'tags', placeholder: 'Adicione palavras-chave...', required: true }
    ],
    promptTemplate: `Crie uma introdução acadêmica contextualizando o tema "{tema}" na área de {area}.

Estrutura desejada:
1. Contextualização geral e panorama atual
2. Importância e relevância do tema
3. Evolução histórica (breve)
4. Estado atual da pesquisa

Palavras-chave para considerar: {keywords}

Requisitos:
- Use fontes acadêmicas recentes (últimos 5 anos)
- Inclua citações relevantes no formato ABNT
- Tom formal acadêmico
- Tamanho: 600-800 palavras
- Forneça as referências completas ao final`
  },
  {
    id: 'intro-gap',
    category: 'introducao',
    title: 'Introdução com Gap de Pesquisa',
    description: 'Identifica lacunas na literatura e justifica a pesquisa',
    icon: '🔍',
    estimatedTime: 7,
    difficulty: 'intermediate',
    popularityScore: 88,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'area', label: 'Área do Conhecimento', type: 'select', options: ['Ciências Humanas', 'Ciências Exatas', 'Ciências Biológicas', 'Ciências da Saúde', 'Engenharias', 'Ciências Sociais Aplicadas'], required: true },
      { name: 'problema', label: 'Problema de Pesquisa (opcional)', type: 'textarea', placeholder: 'Qual problema você pretende resolver?', required: false },
      { name: 'keywords', label: 'Palavras-chave', type: 'tags', required: true }
    ],
    promptTemplate: `Crie uma introdução acadêmica sobre "{tema}" que identifique claramente gaps/lacunas na literatura.

Estrutura:
1. Contextualização do tema
2. Estado atual da pesquisa na área de {area}
3. IDENTIFICAÇÃO CLARA de lacunas/gaps na literatura
4. Justificativa: por que essa lacuna precisa ser preenchida
5. Como esta pesquisa pretende contribuir
{problema ? "6. Problema de pesquisa: " + problema : ""}

Palavras-chave: {keywords}

Requisitos:
- Análise crítica da literatura existente
- Identificação específica de gaps (seja explícito)
- Citações de autores relevantes (ABNT)
- Tom: Formal acadêmico
- Tamanho: 800-1000 palavras
- Referências completas ao final`
  },
  {
    id: 'intro-objetivos',
    category: 'introducao',
    title: 'Objetivos e Perguntas de Pesquisa',
    description: 'Define objetivos claros e perguntas de pesquisa',
    icon: '🎯',
    estimatedTime: 4,
    difficulty: 'beginner',
    popularityScore: 92,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'objetivo_geral', label: 'Objetivo Geral (opcional)', type: 'textarea', placeholder: 'Qual o objetivo principal?', required: false },
      { name: 'tipo_pesquisa', label: 'Tipo de Pesquisa', type: 'select', options: ['Exploratória', 'Descritiva', 'Explicativa', 'Aplicada', 'Básica'], required: true }
    ],
    promptTemplate: `Elabore objetivos de pesquisa (geral e específicos) e perguntas de pesquisa para o tema "{tema}".

Tipo de pesquisa: {tipo_pesquisa}
{objetivo_geral ? "Objetivo geral sugerido: " + objetivo_geral : ""}

Estruture da seguinte forma:
1. Objetivo Geral (1 objetivo amplo)
2. Objetivos Específicos (3-5 objetivos mensuráveis e alcançáveis)
3. Perguntas de Pesquisa (2-4 perguntas que guiarão a investigação)
4. Justificativa de como cada objetivo contribui para responder às perguntas

Requisitos:
- Objetivos devem usar verbos no infinitivo
- Objetivos específicos devem ser SMART (específicos, mensuráveis, alcançáveis, relevantes, temporais)
- Perguntas devem ser claras e investigativas
- Coerência entre objetivos e perguntas`
  },

  // ===== REVISÃO DE LITERATURA =====
  {
    id: 'revisao-sistematica',
    category: 'revisao',
    title: 'Mapeamento Sistemático',
    description: 'Organiza e mapeia a literatura existente sobre o tema',
    icon: '📚',
    estimatedTime: 10,
    difficulty: 'advanced',
    popularityScore: 85,
    requiredFields: [
      { name: 'tema', label: 'Tema da Revisão', type: 'text', required: true },
      { name: 'periodo', label: 'Período de Análise', type: 'select', options: ['Últimos 3 anos', 'Últimos 5 anos', 'Últimos 10 anos', 'Últimos 20 anos'], required: true },
      { name: 'keywords', label: 'Palavras-chave para busca', type: 'tags', required: true },
      { name: 'bases', label: 'Bases de Dados', type: 'tags', placeholder: 'Ex: Scielo, PubMed, IEEE...', required: false }
    ],
    promptTemplate: `Realize um mapeamento sistemático da literatura sobre "{tema}".

Período de análise: {periodo}
Palavras-chave: {keywords}
{bases ? "Bases de dados: " + bases : "Usar bases principais da área"}

Estrutura da revisão:
1. Metodologia de busca (strings de busca, bases de dados, critérios de inclusão/exclusão)
2. Panorama quantitativo (número de estudos encontrados, distribuição temporal)
3. Análise temática (principais temas e subtemas identificados)
4. Principais autores e obras de referência
5. Tendências e evolução do campo
6. Lacunas identificadas

Requisitos:
- Mínimo de 30 referências relevantes
- Análise crítica, não apenas descritiva
- Citações no formato ABNT
- Organização por temas/subtemas
- Tamanho: 2000-2500 palavras
- Lista completa de referências ao final`
  },
  {
    id: 'revisao-analitica',
    category: 'revisao',
    title: 'Análise Crítica de Autores',
    description: 'Compara e analisa criticamente diferentes perspectivas teóricas',
    icon: '🔬',
    estimatedTime: 8,
    difficulty: 'advanced',
    popularityScore: 78,
    requiredFields: [
      { name: 'tema', label: 'Tema/Conceito a Analisar', type: 'text', required: true },
      { name: 'autores', label: 'Autores Principais (opcional)', type: 'tags', placeholder: 'Ex: Foucault, Bourdieu...', required: false },
      { name: 'abordagem', label: 'Abordagem', type: 'select', options: ['Comparativa', 'Cronológica', 'Temática', 'Crítica'], required: true }
    ],
    promptTemplate: `Elabore uma análise crítica da literatura sobre "{tema}" usando abordagem {abordagem}.

{autores ? "Autores para focar: " + autores : "Identificar e analisar os principais autores da área"}

Estrutura:
1. Introdução ao conceito/tema
2. Diferentes perspectivas teóricas identificadas
3. Análise comparativa entre autores/teorias
4. Pontos de convergência e divergência
5. Avaliação crítica de cada perspectiva
6. Síntese integradora

Requisitos:
- Análise CRÍTICA, não apenas resumo
- Comparações explícitas entre autores
- Posicionamento teórico fundamentado
- Identificação de limitações das teorias
- 15-20 referências principais
- Citações diretas quando relevante (ABNT)
- Tamanho: 1500-2000 palavras
- Referências completas ao final`
  },
  {
    id: 'revisao-sintetica',
    category: 'revisao',
    title: 'Síntese Temática',
    description: 'Sintetiza literatura organizando por temas e subtemas',
    icon: '📊',
    estimatedTime: 6,
    difficulty: 'intermediate',
    popularityScore: 82,
    requiredFields: [
      { name: 'tema', label: 'Tema Central', type: 'text', required: true },
      { name: 'subtemas', label: 'Subtemas (opcional)', type: 'tags', placeholder: 'Ex: História, Aplicações, Desafios...', required: false },
      { name: 'keywords', label: 'Palavras-chave', type: 'tags', required: true }
    ],
    promptTemplate: `Crie uma revisão de literatura temática sobre "{tema}".

Palavras-chave: {keywords}
{subtemas ? "Subtemas sugeridos: " + subtemas : "Identifique e organize por subtemas relevantes"}

Estrutura por temas:
1. Para cada tema principal:
   - Contextualização do tema
   - Principais contribuições da literatura
   - Autores e estudos relevantes
   - Estado atual do conhecimento

2. Conexões entre os temas
3. Síntese integradora
4. Considerações finais sobre o campo

Requisitos:
- Organização clara por temas/subtemas
- Mínimo 3-4 temas principais
- 20-25 referências distribuídas pelos temas
- Transições fluidas entre temas
- Citações ABNT
- Tamanho: 1800-2200 palavras
- Referências completas ao final`
  },

  // ===== METODOLOGIA =====
  {
    id: 'metodo-qualitativo',
    category: 'metodologia',
    title: 'Metodologia Qualitativa',
    description: 'Descreve abordagem qualitativa de pesquisa',
    icon: '🎤',
    estimatedTime: 6,
    difficulty: 'intermediate',
    popularityScore: 87,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'metodo', label: 'Método Qualitativo', type: 'select', options: ['Estudo de Caso', 'Etnografia', 'Fenomenologia', 'Grounded Theory', 'Pesquisa-Ação', 'Análise de Discurso'], required: true },
      { name: 'coleta', label: 'Técnicas de Coleta', type: 'select', options: ['Entrevistas', 'Grupos Focais', 'Observação', 'Análise Documental', 'Múltiplas técnicas'], required: true },
      { name: 'participantes', label: 'Perfil dos Participantes', type: 'textarea', placeholder: 'Descreva o público-alvo...', required: true }
    ],
    promptTemplate: `Elabore a seção de metodologia para uma pesquisa qualitativa sobre "{tema}".

Método: {metodo}
Técnica de coleta: {coleta}
Participantes: {participantes}

Estrutura da metodologia:
1. Caracterização da pesquisa (qualitativa, {metodo})
2. Justificativa da escolha metodológica
3. População e amostra
   - Perfil dos participantes
   - Critérios de seleção
   - Tamanho da amostra e justificativa
4. Procedimentos de coleta de dados ({coleta})
   - Instrumentos utilizados
   - Roteiro/protocolo
5. Procedimentos de análise de dados
   - Técnica de análise (análise de conteúdo, temática, etc.)
   - Processo de categorização
6. Aspectos éticos
   - TCLE e aprovação em comitê de ética
   - Confidencialidade e anonimato

Requisitos:
- Detalhamento suficiente para replicação
- Justificativas metodológicas
- Citações de autores metodológicos (ABNT)
- Tom: Formal acadêmico, tempo verbal no passado ou futuro do pretérito
- Tamanho: 800-1200 palavras
- Referências metodológicas ao final`
  },
  {
    id: 'metodo-quantitativo',
    category: 'metodologia',
    title: 'Metodologia Quantitativa',
    description: 'Descreve abordagem quantitativa com análises estatísticas',
    icon: '📈',
    estimatedTime: 6,
    difficulty: 'intermediate',
    popularityScore: 84,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'tipo', label: 'Tipo de Estudo', type: 'select', options: ['Experimental', 'Quase-experimental', 'Survey', 'Correlacional', 'Ex-post-facto'], required: true },
      { name: 'amostra', label: 'Tamanho da Amostra', type: 'text', placeholder: 'Ex: 200 participantes', required: true },
      { name: 'instrumento', label: 'Instrumento', type: 'select', options: ['Questionário', 'Escala', 'Teste', 'Medições físicas', 'Dados secundários'], required: true }
    ],
    promptTemplate: `Elabore a seção de metodologia para uma pesquisa quantitativa sobre "{tema}".

Tipo de estudo: {tipo}
Amostra: {amostra}
Instrumento: {instrumento}

Estrutura da metodologia:
1. Caracterização da pesquisa (quantitativa, {tipo})
2. Design do estudo
   - Variáveis (independentes, dependentes, controle)
   - Hipóteses (se aplicável)
3. População e amostra
   - Critérios de inclusão/exclusão
   - Processo de amostragem
   - Cálculo amostral e poder estatístico
4. Instrumentos de coleta de dados ({instrumento})
   - Descrição do instrumento
   - Validade e confiabilidade
   - Pré-teste (se aplicável)
5. Procedimentos de coleta
6. Análise estatística
   - Estatística descritiva
   - Testes estatísticos a serem utilizados
   - Software estatístico
   - Nível de significância
7. Aspectos éticos

Requisitos:
- Clareza nos procedimentos estatísticos
- Justificativa para testes escolhidos
- Citações metodológicas (ABNT)
- Tom: Formal acadêmico
- Tamanho: 800-1200 palavras
- Referências ao final`
  },
  {
    id: 'metodo-misto',
    category: 'metodologia',
    title: 'Métodos Mistos',
    description: 'Combina abordagens qualitativas e quantitativas',
    icon: '🔄',
    estimatedTime: 8,
    difficulty: 'advanced',
    popularityScore: 76,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'design', label: 'Design de Métodos Mistos', type: 'select', options: ['Convergente', 'Explanatório Sequencial', 'Exploratório Sequencial', 'Embedded/Aninhado', 'Multifásico'], required: true },
      { name: 'justificativa', label: 'Por que métodos mistos?', type: 'textarea', placeholder: 'Justifique a necessidade de combinar abordagens...', required: true }
    ],
    promptTemplate: `Elabore a metodologia de métodos mistos para pesquisa sobre "{tema}".

Design: {design}
Justificativa para métodos mistos: {justificativa}

Estrutura:
1. Justificativa para métodos mistos
2. Design da pesquisa ({design})
   - Diagrama/sequência das fases
   - Prioridade (QUAL + quan, QUAN + qual, ou QUAL + QUAN)
   - Momento de integração
3. Fase Quantitativa
   - Participantes e amostra
   - Instrumentos
   - Análise estatística
4. Fase Qualitativa
   - Participantes
   - Técnicas de coleta
   - Análise de dados
5. Procedimentos de integração
   - Como os dados serão integrados
   - Matriz de integração
6. Aspectos éticos

Requisitos:
- Clareza no design de métodos mistos
- Justificativa sólida para a abordagem mista
- Detalhamento de ambas as fases
- Explicação da integração dos dados
- Citações de Creswell e outros autores de MM
- Tamanho: 1200-1500 palavras
- Referências ao final`
  },
  {
    id: 'metodo-revisao',
    category: 'metodologia',
    title: 'Revisão Sistemática',
    description: 'Metodologia para revisão sistemática da literatura',
    icon: '🔎',
    estimatedTime: 7,
    difficulty: 'advanced',
    popularityScore: 80,
    requiredFields: [
      { name: 'tema', label: 'Tema da Revisão', type: 'text', required: true },
      { name: 'pergunta', label: 'Pergunta de Revisão', type: 'textarea', placeholder: 'Qual a pergunta que guiará a revisão?', required: true },
      { name: 'protocolo', label: 'Protocolo', type: 'select', options: ['PRISMA', 'Cochrane', 'Joanna Briggs', 'Personalizado'], required: true }
    ],
    promptTemplate: `Elabore a metodologia para uma revisão sistemática sobre "{tema}".

Pergunta de revisão: {pergunta}
Protocolo: {protocolo}

Estrutura:
1. Protocolo de revisão ({protocolo})
2. Pergunta de pesquisa (estruturada - PICO se aplicável)
3. Estratégia de busca
   - Bases de dados selecionadas
   - Strings de busca detalhadas
   - Período de busca
4. Critérios de elegibilidade
   - Critérios de inclusão
   - Critérios de exclusão
5. Processo de seleção
   - Triagem (título e resumo)
   - Leitura completa
   - Avaliadores (consenso e kappa)
6. Extração de dados
   - Dados a serem extraídos
   - Formulário de extração
7. Avaliação da qualidade
   - Ferramenta de avaliação de risco de viés
8. Síntese dos dados
   - Meta-análise (se aplicável)
   - Síntese narrativa

Requisitos:
- Aderência ao protocolo {protocolo}
- Strings de busca reproduzíveis
- Fluxograma PRISMA
- Transparência e reprodutibilidade
- Citações de diretrizes metodológicas
- Tamanho: 1000-1400 palavras
- Referências ao final`
  },

  // ===== RESULTADOS E DISCUSSÃO =====
  {
    id: 'resultados-descritivos',
    category: 'resultados',
    title: 'Apresentação de Resultados Descritivos',
    description: 'Apresenta resultados quantitativos de forma clara',
    icon: '📊',
    estimatedTime: 5,
    difficulty: 'intermediate',
    popularityScore: 85,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'dados', label: 'Tipo de Dados', type: 'select', options: ['Survey/Questionário', 'Experimento', 'Dados Secundários', 'Medições', 'Outros'], required: true },
      { name: 'descricao', label: 'Breve Descrição dos Resultados', type: 'textarea', placeholder: 'Descreva os principais achados...', required: true }
    ],
    promptTemplate: `Elabore a seção de apresentação de resultados para pesquisa sobre "{tema}".

Tipo de dados: {dados}
Principais achados: {descricao}

Estrutura:
1. Caracterização da amostra/participantes
   - Dados demográficos
   - Estatísticas descritivas (média, DP, frequências)
2. Resultados principais
   - Organize por objetivos ou hipóteses
   - Apresente em ordem lógica
   - Use tabelas e gráficos (descreva o que devem conter)
3. Resultados secundários (se aplicável)
4. Testes estatísticos realizados
   - Resultados de cada teste
   - Valores de p, tamanhos de efeito
   - Intervalos de confiança

Requisitos:
- Apresentação OBJETIVA (sem interpretação nesta seção)
- Dados organizados em tabelas/figuras
- Texto complementa (não repete) tabelas
- Todos os dados relevantes apresentados
- Tamanho: 800-1200 palavras (+ tabelas/figuras)
- Use tempo passado
- Seja claro e preciso`
  },
  {
    id: 'discussao-achados',
    category: 'resultados',
    title: 'Discussão e Interpretação',
    description: 'Interpreta resultados e relaciona com a literatura',
    icon: '💡',
    estimatedTime: 8,
    difficulty: 'advanced',
    popularityScore: 90,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'resultados', label: 'Principais Resultados', type: 'textarea', placeholder: 'Resuma os principais achados...', required: true },
      { name: 'hipoteses', label: 'Hipóteses foram confirmadas?', type: 'select', options: ['Sim, totalmente', 'Parcialmente', 'Não', 'Não havia hipóteses'], required: false }
    ],
    promptTemplate: `Elabore a seção de discussão para pesquisa sobre "{tema}".

Principais resultados: {resultados}
{hipoteses ? "Hipóteses: " + hipoteses : ""}

Estrutura da discussão:
1. Síntese dos principais achados
2. Para cada resultado principal:
   - Interpretação do resultado
   - Comparação com estudos anteriores (convergências e divergências)
   - Possíveis explicações para os achados
   - Implicações teóricas e práticas
3. Resultados inesperados (se houver)
4. Limitações do estudo
   - Metodológicas
   - Amostrais
   - De generalização
5. Implicações para pesquisas futuras
6. Contribuições do estudo

Requisitos:
- Interpretação CRÍTICA, não apenas repetição dos resultados
- Diálogo constante com a literatura
- Reconhecimento de limitações de forma honesta
- Citações comparativas com estudos anteriores (ABNT)
- Tamanho: 1500-2000 palavras
- Equilíbrio entre confiança e humildade científica
- Referências ao final`
  },

  // ===== CONCLUSÃO =====
  {
    id: 'conclusao-completa',
    category: 'conclusao',
    title: 'Conclusão e Considerações Finais',
    description: 'Sintetiza o estudo e apresenta conclusões',
    icon: '✅',
    estimatedTime: 4,
    difficulty: 'intermediate',
    popularityScore: 93,
    requiredFields: [
      { name: 'tema', label: 'Tema da Pesquisa', type: 'text', required: true },
      { name: 'objetivos_alcancados', label: 'Objetivos foram alcançados?', type: 'select', options: ['Sim, todos', 'Parcialmente', 'Alguns objetivos'], required: true },
      { name: 'contribuicao', label: 'Principal Contribuição', type: 'textarea', placeholder: 'Qual a principal contribuição deste estudo?', required: true }
    ],
    promptTemplate: `Elabore a conclusão para pesquisa sobre "{tema}".

Objetivos alcançados: {objetivos_alcancados}
Principal contribuição: {contribuicao}

Estrutura da conclusão:
1. Retomada do problema e objetivos
2. Síntese dos principais achados
3. Retorno às perguntas/hipóteses de pesquisa
   - Foram respondidas/confirmadas?
4. Contribuições do estudo
   - Teóricas
   - Metodológicas
   - Práticas/aplicadas
5. Limitações (breve retomada)
6. Recomendações para pesquisas futuras
   - Lacunas que permanecem
   - Novos questionamentos emergentes
7. Considerações finais

Requisitos:
- NÃO introduzir informações novas
- Retomar de forma sintética o que foi desenvolvido
- Destacar contribuições originais
- Ser propositivo (pesquisas futuras)
- Tamanho: 500-800 palavras
- Tom conclusivo e fechamento adequado
- Coerência com o restante do trabalho`
  },

  // ===== ABSTRACT/RESUMO =====
  {
    id: 'abstract-completo',
    category: 'abstract',
    title: 'Resumo/Abstract Estruturado',
    description: 'Cria resumo acadêmico estruturado',
    icon: '📄',
    estimatedTime: 3,
    difficulty: 'beginner',
    popularityScore: 95,
    requiredFields: [
      { name: 'titulo', label: 'Título do Trabalho', type: 'text', required: true },
      { name: 'tema', label: 'Tema Central', type: 'text', required: true },
      { name: 'metodo', label: 'Método Utilizado', type: 'text', placeholder: 'Ex: Estudo de caso qualitativo', required: true },
      { name: 'resultados_chave', label: 'Resultados-chave', type: 'textarea', placeholder: 'Principais achados em poucas palavras...', required: true },
      { name: 'palavras_chave', label: 'Palavras-chave (3-5)', type: 'tags', required: true }
    ],
    promptTemplate: `Elabore um resumo acadêmico estruturado para o trabalho "{titulo}".

Tema: {tema}
Método: {metodo}
Principais resultados: {resultados_chave}
Palavras-chave: {palavras_chave}

Estrutura do resumo (250-300 palavras):
1. Contextualização (2-3 frases)
   - Importância do tema
   - Gap/problema
2. Objetivo(s) (1-2 frases)
3. Método (2-3 frases)
   - Tipo de pesquisa
   - Participantes/amostra
   - Instrumentos/procedimentos
4. Principais resultados (3-4 frases)
5. Conclusão/implicações (1-2 frases)

Palavras-chave: {palavras_chave}

Requisitos:
- Exatos 250-300 palavras
- Um único parágrafo
- Texto autossuficiente (compreensível sem ler o artigo completo)
- Sem citações
- Verbos no passado (para método e resultados)
- Claro e objetivo
- Incluir as palavras-chave ao final

Forneça também a versão em inglês (Abstract).`
  }
];

export const categoryInfo = {
  introducao: {
    label: 'Introdução',
    icon: '📝',
    color: 'indigo',
    description: 'Contextualize seu tema e apresente o problema de pesquisa'
  },
  revisao: {
    label: 'Revisão de Literatura',
    icon: '📚',
    color: 'purple',
    description: 'Mapeie e analise a literatura existente'
  },
  metodologia: {
    label: 'Metodologia',
    icon: '🔬',
    color: 'blue',
    description: 'Descreva os procedimentos metodológicos'
  },
  resultados: {
    label: 'Resultados e Discussão',
    icon: '📊',
    color: 'green',
    description: 'Apresente e interprete seus achados'
  },
  conclusao: {
    label: 'Conclusão',
    icon: '✅',
    color: 'teal',
    description: 'Sintetize e conclua seu trabalho'
  },
  abstract: {
    label: 'Resumo/Abstract',
    icon: '📄',
    color: 'gray',
    description: 'Crie um resumo estruturado do trabalho'
  }
};
