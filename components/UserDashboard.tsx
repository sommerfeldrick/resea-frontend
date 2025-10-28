import React, { useState, useEffect } from 'react';
import { smileaiAPI, type UserUsageData, type UserProfile } from '../services/smileaiAPI';

interface UserDashboardProps {
  className?: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ className = '' }) => {
  const [usageData, setUsageData] = useState<UserUsageData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Carrega os dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      if (!smileaiAPI.isAuthenticated()) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Carrega dados em paralelo
        const [usageResponse, profileResponse] = await Promise.all([
          smileaiAPI.getUserUsageData(),
          smileaiAPI.getUserProfile(),
        ]);

        setUsageData(usageResponse);
        setProfile(profileResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do usuário');
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [refreshTrigger]);

  // Função para atualizar os dados manualmente
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Calcula porcentagens
  const getUsagePercentage = (used: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <p className="text-red-800 text-sm">{error}</p>
        <button
          onClick={refreshData}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!usageData || !profile) {
    return null;
  }

  const wordsUsed = usageData.words_used || (usageData.total_words - usageData.words_left);
  const imagesUsed = usageData.images_used || (usageData.total_images - usageData.images_left);
  const wordsPercentage = getUsagePercentage(wordsUsed, usageData.total_words);
  const imagesPercentage = getUsagePercentage(imagesUsed, usageData.total_images);

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Cabeçalho com Perfil */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={`${profile.name} ${profile.surname}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
              {profile.name.charAt(0)}{profile.surname?.charAt(0) || ''}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-800">
              {profile.name} {profile.surname}
            </h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
          title="Atualizar dados"
        >
          🔄
        </button>
      </div>

      {/* Informações do Plano */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Plano Atual</p>
            <p className="text-xl font-bold text-indigo-700">{usageData.plan_name}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            usageData.plan_status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {usageData.plan_status === 'active' ? 'Ativo' : 'Inativo'}
          </div>
        </div>
      </div>

      {/* Uso de Créditos */}
      <div className="space-y-5">
        {/* Créditos de Palavras */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Créditos de Palavras</span>
            <span className="text-sm text-gray-500">
              {usageData.words_left.toLocaleString()} / {usageData.total_words.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                wordsPercentage > 75
                  ? 'bg-red-500'
                  : wordsPercentage > 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${100 - wordsPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {wordsPercentage}% utilizado
          </p>
        </div>

        {/* Créditos de Imagens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Créditos de Imagens</span>
            <span className="text-sm text-gray-500">
              {usageData.images_left} / {usageData.total_images}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                imagesPercentage > 75
                  ? 'bg-red-500'
                  : imagesPercentage > 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${100 - imagesPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {imagesPercentage}% utilizado
          </p>
        </div>
      </div>

      {/* Alerta de Créditos Baixos */}
      {(wordsPercentage > 90 || imagesPercentage > 90) && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Seus créditos estão acabando! Considere fazer upgrade do seu plano.
          </p>
          <a
            href="https://smileai.com.br/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline font-medium"
          >
            Ver Planos →
          </a>
        </div>
      )}

      {/* Botão de Upgrade (sempre visível) */}
      <div className="mt-6">
        <a
          href="https://smileai.com.br/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Fazer Upgrade do Plano
        </a>
      </div>
    </div>
  );
};

// Hook personalizado para usar em qualquer componente
export const useUserUsage = () => {
  const [usageData, setUsageData] = useState<UserUsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await smileaiAPI.getUserUsageData();
      setUsageData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dados';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (smileaiAPI.isAuthenticated()) {
      fetchUsageData();
    }
  }, []);

  return {
    usageData,
    loading,
    error,
    refresh: fetchUsageData,
    hasEnoughWords: (amount: number) => {
      return usageData ? usageData.words_left >= amount : false;
    },
    hasEnoughImages: (amount: number) => {
      return usageData ? usageData.images_left >= amount : false;
    },
  };
};
