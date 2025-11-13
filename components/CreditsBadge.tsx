/**
 * Credits Badge Component
 *
 * Displays remaining documents/credits in the header
 * with detailed tooltip on hover
 */

import { useState, useEffect } from 'react';
import { creditService } from '../services/creditService';

interface CreditStats {
  totalWords: number;
  consumedWords: number;
  remainingWords: number;
  packageName: string;
  percentage?: number;
  isActive?: boolean;
  nextReset?: string;
  purchaseDate?: string;
}

export function CreditsBadge() {
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const data = await creditService.getWordsUsage();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar créditos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchCredits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="credits-badge loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) return null;

  // Calcular documentos restantes (assumindo ~1500 palavras por documento)
  const documentsRemaining = Math.floor(stats.remainingWords / 1500);
  const percentage = stats.percentage || 0;

  // Determinar cor baseada na porcentagem de uso
  const getColor = () => {
    if (percentage >= 90) return '#ef4444'; // vermelho
    if (percentage >= 70) return '#f59e0b'; // laranja
    return '#10b981'; // verde
  };

  return (
    <div
      className="credits-badge"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '20px' }}>📄</span>

      {/* Count */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: getColor()
          }}
        >
          {documentsRemaining}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1'
          }}
        >
          documentos
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="credits-tooltip"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            padding: '16px',
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            minWidth: '280px',
            zIndex: 1000,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Plan */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
              Plano Atual
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', textTransform: 'capitalize' }}>
              {stats.packageName}
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Limite mensal:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                {creditService.formatWords(stats.totalWords)} palavras
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Consumidas:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                {creditService.formatWords(stats.consumedWords)} palavras
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Restantes:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: getColor() }}>
                {creditService.formatWords(stats.remainingWords)} palavras
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  backgroundColor: getColor(),
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
              {percentage.toFixed(0)}% utilizado
            </div>
          </div>

          {/* Next Reset */}
          {stats.nextReset && (
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
              Renova em: <strong>{stats.nextReset}</strong>
            </div>
          )}

          {/* Status */}
          {stats.isActive !== undefined && (
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: stats.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: stats.isActive ? '#10b981' : '#ef4444'
                }}
              >
                {stats.isActive ? 'Plano Ativo' : 'Plano Inativo'}
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        .credits-badge.loading {
          padding: 6px 12px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .credits-badge:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }

        .credits-tooltip {
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
