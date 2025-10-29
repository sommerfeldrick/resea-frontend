import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserDashboardProps {
  className?: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ className = '' }) => {
  const { user, loading, refreshUser } = useAuth();

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

  if (!user) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <p className="text-red-800 text-sm">Usuário não autenticado</p>
        <button
          onClick={refreshUser}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Log para debug
  console.log('Dados do usuário no dashboard:', user);

  // Usando os dados diretamente do user
  // Calcula os totais baseado nos créditos das diferentes APIs
  const totalWords = (
    (user.entity_credits?.openai?.credit || 0) +
    (user.entity_credits?.anthropic?.credit || 0) +
    (user.entity_credits?.gemini?.credit || 0)
  );

  const totalImages = (
    (user.entity_credits?.stable_diffusion?.credit || 0) +
    (user.entity_credits?.clipdrop?.credit || 0)
  );

  const usageData = {
    words_left: Number(user.remaining_words || 0),
    total_words: totalWords,
    images_left: Number(user.remaining_images || 0),
    total_images: totalImages,
    plan_name: user.type === 'super_admin' ? 'Super Admin' : 
              user.type === 'admin' ? 'Admin' : 
              user.type === 'user' ? 'Usuário' : 'Plano Básico',
    plan_status: user.status === 1 ? 'active' : 'inactive',
  };

  // Log detalhado dos dados de uso
  console.log('Dados de uso processados:', usageData);
  console.log('Entity Credits detalhados:', user.entity_credits);

  const wordsUsed = usageData.total_words - usageData.words_left;
  const imagesUsed = usageData.total_images - usageData.images_left;
  const wordsPercentage = getUsagePercentage(wordsUsed, usageData.total_words);
  const imagesPercentage = getUsagePercentage(imagesUsed, usageData.total_images);

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800">Painel de Controle</h3>
        <button
          onClick={refreshUser}
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
      </div>

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
