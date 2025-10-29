import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { authService, type SmileAIUser, API_BASE_URL } from '../services/authService';
import { searchLimits } from '../services/searchLimits';
import { creditService } from '../services/creditSync';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper para configurar respostas da API
function mockApiResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: 'http://test.com',
    json: () => Promise.resolve(data)
  } as Response;
}

describe('Integração de Serviços', () => {
  beforeAll(() => {
    (global as any).cache = new Map();
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockClear();
    vi.useFakeTimers();
    localStorage.clear();
    (global as any).cache.clear();
    vi.stubGlobal('location', { hostname: 'test.com' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Autenticação e Cache', () => {
    it('deve usar cache na segunda chamada', async () => {
      const mockData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        status: 1,
        entity_credits: {
          openai: {
            'gpt-3.5-turbo': { credit: 1000, isUnlimited: false }
          }
        }
      };

      localStorage.setItem('smileai_token', 'test_token');
      mockFetch.mockImplementation((url) => {
        if (url === `${API_BASE_URL}/api/auth/me`) {
          return Promise.resolve(mockApiResponse({ data: mockData }));
        }
        return Promise.reject(new Error(`URL não mockada: ${url}`));
      });

      let time = 1000;
      vi.spyOn(Date, 'now').mockImplementation(() => time);

      // Primeira chamada
      const firstCall = await authService.getCurrentUser();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(firstCall).toBeDefined();
      
      // Segunda chamada
      const secondCall = await authService.getCurrentUser();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Não deve chamar novamente
      expect(secondCall).toBeDefined();
      expect(firstCall).toEqual(secondCall);
    });

    it('deve expirar o cache após o TTL', async () => {
      const mockData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        entity_credits: {
          openai: {
            'gpt-3.5-turbo': { credit: 1000, isUnlimited: false }
          }
        }
      };

      let time = 1000;
      vi.spyOn(Date, 'now').mockImplementation(() => time);
      localStorage.setItem('smileai_token', 'test_token');

      mockFetch.mockImplementation((url) => {
        if (url === `${API_BASE_URL}/api/auth/me`) {
          return Promise.resolve(mockApiResponse({ data: mockData }));
        }
        return Promise.reject(new Error(`URL não mockada: ${url}`));
      });

      // Primeira chamada
      const firstCall = await authService.getCurrentUser();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Avança o tempo
      time += 31 * 1000;
      
      // Segunda chamada
      const secondCall = await authService.getCurrentUser();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(firstCall).toEqual(secondCall);
    });

    it('deve processar fila quando conexão retorna', async () => {
      const mockData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        entity_credits: {
          openai: {
            'gpt-3.5-turbo': { credit: 1000, isUnlimited: false }
          }
        }
      };

      localStorage.setItem('smileai_token', 'test_token'); // Define o token
      localStorage.setItem('credit_sync_queue', JSON.stringify([
        { credits: 100, timestamp: Date.now(), attempts: 0 }
      ]));

      let fetchCount = 0;
      mockFetch.mockImplementation((url, options) => {
        fetchCount++;
        if (url === `${API_BASE_URL}/api/credits/sync`) {
          return Promise.resolve(mockApiResponse({ success: true }));
        }
        if (url === `${API_BASE_URL}/api/auth/me`) {
          return Promise.resolve(mockApiResponse({ data: mockData }));
        }
        return Promise.reject(new Error(`URL não mockada: ${url} (chamada #${fetchCount})`));
      });

      await (creditService as any).processQueue();
      
      // Avança o tempo do timer e aguarda todas as promessas pendentes
      vi.runAllTimers();
      await Promise.resolve();
      vi.runAllTimers();
      await Promise.resolve();
      
      const queue = JSON.parse(localStorage.getItem('credit_sync_queue') || '[]');
      expect(queue.length).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/credits/sync`, expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/auth/me`, expect.any(Object));
    });
  });
});