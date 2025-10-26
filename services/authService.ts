/**
 * Authentication Service - SmileAI Integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface SmileAIUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  plan?: string;
  credits?: number;
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

class AuthService {
  private readonly TOKEN_KEY = 'smileai_token';
  private readonly REFRESH_TOKEN_KEY = 'smileai_refresh_token';
  private readonly USER_KEY = 'smileai_user';

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        await fetch(`${API_BASE_URL}/auth/logout`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
   * Get current user
   */
  async getCurrentUser(): Promise<SmileAIUser | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const newToken = await this.refreshToken();
          if (newToken) {
            return this.getCurrentUser();
          }
        }
        return null;
      }

      const { data } = await response.json();
      this.saveUser(data);
      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
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
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
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
