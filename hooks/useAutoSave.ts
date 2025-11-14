/**
 * useAutoSave Hook
 * Hook para salvar automaticamente o conteúdo do documento
 */

import { useEffect, useRef, useState } from 'react';

export interface AutoSaveOptions {
  interval?: number; // Intervalo em milissegundos (padrão: 30000 = 30s)
  enabled?: boolean; // Se o auto-save está ativado
  onSave: (content: string) => Promise<void>; // Função de salvamento
  onSuccess?: () => void; // Callback de sucesso
  onError?: (error: Error) => void; // Callback de erro
}

export const useAutoSave = (
  content: string,
  options: AutoSaveOptions
) => {
  const {
    interval = 30000,
    enabled = true,
    onSave,
    onSuccess,
    onError
  } = options;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const previousContentRef = useRef<string>(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar mudanças no conteúdo
  useEffect(() => {
    if (content !== previousContentRef.current) {
      setHasUnsavedChanges(true);
      previousContentRef.current = content;
    }
  }, [content]);

  // Auto-save periódico
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const save = async () => {
      if (isSaving) return; // Evita saves simultâneos

      setIsSaving(true);
      try {
        await onSave(content);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        onSuccess?.();
      } catch (error) {
        console.error('Auto-save error:', error);
        onError?.(error as Error);
      } finally {
        setIsSaving(false);
      }
    };

    // Salva após o intervalo especificado
    saveTimeoutRef.current = setTimeout(save, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, enabled, hasUnsavedChanges, interval, isSaving, onSave, onSuccess, onError]);

  // Salvar manualmente
  const saveNow = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave(content);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      onSuccess?.();
    } catch (error) {
      console.error('Manual save error:', error);
      onError?.(error as Error);
    } finally {
      setIsSaving(false);
    }
  };

  // Formatar tempo desde o último save
  const getTimeSinceLastSave = (): string => {
    if (!lastSaved) return 'Nunca salvo';

    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000); // em segundos

    if (diff < 60) return `Salvo ${diff}s atrás`;
    if (diff < 3600) return `Salvo ${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `Salvo ${Math.floor(diff / 3600)}h atrás`;

    return lastSaved.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    saveNow,
    getTimeSinceLastSave
  };
};
