/**
 * Authentication Service - SmileAI Integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SmileAIUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  plan_name?: string;
  plan_status?: string;
  words_left?: number;
  total_words?: number;
  images_left?: number;
  total_images?: number;
  credits?: number;
  type?: string;
  status?: number;
  remaining_words?: string;
  remaining_images?: string;
  entity_credits?: {
    openai?: { [key: string]: { credit: number, isUnlimited: boolean } };
    stable_diffusion?: { [key: string]: { credit: number, isUnlimited: boolean } };
    anthropic?: { [key: string]: { credit: number, isUnlimited: boolean } };
    gemini?: { [key: string]: { credit: number, isUnlimited: boolean } };
    clipdrop?: { [key: string]: { credit: number, isUnlimited: boolean } };
    azure?: { [key: string]: { credit: number, isUnlimited: boolean } };
    pebblely?: { [key: string]: { credit: number, isUnlimited: boolean } };
    piapi?: { [key: string]: { credit: number, isUnlimited: boolean } };
    [key: string]: { [key: string]: { credit: number, isUnlimited: boolean } } | undefined;
  };
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  user: SmileAIUser;
  token: AuthToken;
}

// Cache configuration
const CACHE_TTL = 30 * 1000; // 30 seconds
const cache = new Map<string, {data: any, timestamp: number}>();

// Plan configuration
const PLAN_DETAILS: Record<string, { name: string; maxSearches: number; maxWords: number }> = {
  basic: { name: 'Básico', maxSearches: 5, maxWords: 50000 },
  standard: { name: 'Standard', maxSearches: 10, maxWords: 100000 },
  premium: { name: 'Premium', maxSearches: 20, maxWords: 200000 }
};

class AuthService {
  private readonly TOKEN_KEY = 'smileai_token';
  private readonly REFRESH_TOKEN_KEY = 'smileai_refresh_token';
  private readonly USER_KEY = 'smileai_user';

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Credenciais inválidas');
    }

    const { data } = await response.json();
    this.saveAuth(data);
    return data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearAuth();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthToken | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        this.clearAuth();
        return null;
      }

      const { data } = await response.json();
      this.saveToken(data);
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return null;
    }
  }

  /**
   * Cache wrapper
   */
  private async withCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Get current user with full profile (including credits/words)
   */
  async getCurrentUser(): Promise<SmileAIUser | null> {
    return this.withCache('currentUser', async () => {
      const token = this.getToken();
      if (!token) return null;

      try {
        console.log('Buscando dados do usuário...');
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log('Token expirado, tentando renovar...');
            const newToken = await this.refreshToken();
            if (newToken) {
              console.log('Token renovado com sucesso, tentando novamente...');
              return this.getCurrentUser();
            }
          }
          console.error('Falha ao buscar dados do usuário:', response.status);
          return null;
        }

        const { data: userData } = await response.json();
        
        // Calcula os totais baseado nos créditos das diferentes APIs
        const totalWords = Math.min(
          Object.values(userData.entity_credits || {}).reduce((sum, provider: any) => {
            if (!provider) return sum;
            return sum + Object.values(provider).reduce((total: number, model: any) => {
              if (model.isUnlimited) return total + 999999;
              return total + (model.credit || 0);
            }, 0);
          }, 0),
          88600 // Limite máximo corrigido
        );

        // Mapeia os dados do usuário com o plano correto
        const fullUserData: SmileAIUser = {
          ...userData,
          plan_name: PLAN_DETAILS[userData.plan_type]?.name || 'Básico',
          role: userData.type, // Mantém a função separada do plano
          words_left: Number(userData.remaining_words || 0),
          total_words: totalWords,
          plan_status: userData.status === 1 ? 'active' : 'inactive'
        };

        this.saveUser(fullUserData);
        return fullUserData;
      } catch (error) {
        console.error('Get current user error:', error);
        return null;
      }
    });
  }

  /**
   * Validate token
   */
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        return false;
      }

      const { valid } = await response.json();
      return valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save authentication data
   */
  private saveAuth(data: AuthResponse): void {
    this.saveToken(data.token);
    this.saveUser(data.user);
  }

  /**
   * Save token data
   */
  private saveToken(token: AuthToken): void {
    localStorage.setItem(this.TOKEN_KEY, token.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token.refresh_token);
  }

  /**
   * Save user data
   */
  private saveUser(user: SmileAIUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear all authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get stored user
   */
  getUser(): SmileAIUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Make authenticated API request
   */
  async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Try to refresh token
      const newToken = await this.refreshToken();
      if (newToken) {
        // Retry request with new token
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${newToken.access_token}`
        };
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await retryResponse.json();
        return data.data || data;
      } else {
        this.clearAuth();
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
  }
}

export const authService = new AuthService();
