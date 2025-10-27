/**
 * Serviço de Gestão de Créditos
 *
 * Gerencia o consumo de palavras baseado no pacote do usuário SmileAI
 */

import { authService } from './authService';

// Mapeamento de pacotes para palavras
const PACKAGE_WORDS: Record<string, number> = {
  'free': 10000,           // Pacote gratuito: 10k palavras
  'starter': 50000,        // Pacote starter: 50k palavras
  'basic': 100000,         // Pacote básico: 100k palavras
  'pro': 250000,           // Pacote pro: 250k palavras
  'premium': 500000,       // Pacote premium: 500k palavras
  'business': 1000000,     // Pacote business: 1M palavras
  'enterprise': 5000000,   // Pacote enterprise: 5M palavras
};

const STORAGE_KEY = 'smileai_words_consumed';

interface WordsUsage {
  totalWords: number;
  consumedWords: number;
  remainingWords: number;
  packageName: string;
  lastUpdated: Date;
}

class CreditService {
  /**
   * Obter pacote do usuário
   */
  private getUserPackage(): string {
    const user = authService.getUser();
    // A API do SmileAI deve retornar o campo 'plan' ou 'package'
    return user?.plan?.toLowerCase() || user?.package?.toLowerCase() || 'free';
  }

  /**
   * Obter total de palavras do pacote
   */
  getTotalWords(): number {
    const packageName = this.getUserPackage();
    return PACKAGE_WORDS[packageName] || PACKAGE_WORDS['free'];
  }

  /**
   * Obter palavras consumidas (do localStorage)
   */
  getConsumedWords(): number {
    try {
      const userId = authService.getUser()?.id;
      if (!userId) return 0;

      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (!stored) return 0;

      const data = JSON.parse(stored);
      return data.consumed || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Adicionar palavras consumidas
   */
  addConsumedWords(words: number): void {
    try {
      const userId = authService.getUser()?.id;
      if (!userId) return;

      const currentConsumed = this.getConsumedWords();
      const newConsumed = currentConsumed + words;

      localStorage.setItem(
        `${STORAGE_KEY}_${userId}`,
        JSON.stringify({
          consumed: newConsumed,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Erro ao salvar palavras consumidas:', error);
    }
  }

  /**
   * Obter uso de palavras completo
   */
  getWordsUsage(): WordsUsage {
    const totalWords = this.getTotalWords();
    const consumedWords = this.getConsumedWords();
    const remainingWords = Math.max(0, totalWords - consumedWords);
    const packageName = this.getUserPackage();

    return {
      totalWords,
      consumedWords,
      remainingWords,
      packageName,
      lastUpdated: new Date(),
    };
  }

  /**
   * Verificar se tem palavras disponíveis
   */
  hasWordsAvailable(requiredWords: number = 1): boolean {
    const usage = this.getWordsUsage();
    return usage.remainingWords >= requiredWords;
  }

  /**
   * Resetar contagem (útil para testes ou renovação de pacote)
   */
  resetConsumedWords(): void {
    try {
      const userId = authService.getUser()?.id;
      if (!userId) return;

      localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
    } catch (error) {
      console.error('Erro ao resetar palavras:', error);
    }
  }

  /**
   * Formatar número de palavras para exibição
   */
  formatWords(words: number): string {
    if (words >= 1000000) {
      return `${(words / 1000000).toFixed(1)}M`;
    }
    if (words >= 1000) {
      return `${(words / 1000).toFixed(0)}k`;
    }
    return words.toString();
  }

  /**
   * Calcular palavras estimadas para um texto
   */
  estimateWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Sincronizar com o servidor (se houver endpoint)
   */
  async syncWithServer(): Promise<void> {
    try {
      // Se a API tiver um endpoint para palavras consumidas, podemos sincronizar aqui
      // Por enquanto, mantemos apenas local
      const usage = this.getWordsUsage();
      console.log('Uso de palavras:', usage);
    } catch (error) {
      console.error('Erro ao sincronizar palavras:', error);
    }
  }
}

export const creditService = new CreditService();
