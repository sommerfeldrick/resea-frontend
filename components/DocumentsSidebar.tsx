/**
 * Documents Sidebar Component
 *
 * Displays user's document history grouped by date
 * with download and delete actions
 */

import { useState, useEffect } from 'react';
import type { Document, GroupedDocuments } from '../types';
import {
  documentService,
  groupDocumentsByDate,
  formatDocumentType,
  formatDate,
  downloadDocument,
  deleteDocument
} from '../services/documentService';

interface DocumentItemProps {
  document: Document;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onSelect?: (id: number) => void;
}

function DocumentItem({ document, onDelete, onDownload, onSelect }: DocumentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Deseja realmente deletar este documento?')) return;

    setIsDeleting(true);
    setMenuOpen(false);
    try {
      await onDelete(document.id);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      alert('Erro ao deletar documento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setMenuOpen(false);
    try {
      console.log('Iniciando download do documento:', document.id);
      await onDownload(document.id);
      console.log('Download concluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error);
      alert('❌ Erro ao baixar documento:\n' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpen = () => {
    setMenuOpen(false);
    console.log('Abrindo documento:', document.id, document.title);
    if (onSelect) {
      onSelect(document.id);
    } else {
      console.warn('onSelect não está definido - função de abertura não disponível');
      alert('Funcionalidade de abertura não está disponível no momento.');
    }
  };

  return (
    <div
      className="document-item"
      style={{
        padding: '12px 16px',
        borderRadius: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginBottom: '6px',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Título */}
        <h5
          style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#ffffff',
            margin: 0,
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingRight: '12px',
            cursor: 'pointer'
          }}
          title={document.title}
          onClick={handleOpen}
        >
          {document.title}
        </h5>

        {/* Menu 3 pontinhos */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            disabled={isDeleting || isDownloading}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.2s ease',
              lineHeight: 1
            }}
            title="Opções"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ...
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                minWidth: '140px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={handleOpen}
                disabled={isDeleting || isDownloading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Abrir
              </button>
              <button
                onClick={handleDownload}
                disabled={isDeleting || isDownloading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isDownloading ? 'Baixando...' : 'Baixar'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || isDownloading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: isDeleting ? 'wait' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <style>{`
        .document-item:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
      `}</style>
    </div>
  );
}

interface DocumentGroupProps {
  title: string;
  documents: Document[];
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onSelect?: (id: number) => void;
}

function DocumentGroup({ title, documents, onDelete, onDownload, onSelect }: DocumentGroupProps) {
  if (documents.length === 0) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h4
        style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {title}
      </h4>
      {documents.map(doc => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          onDownload={onDownload}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface DocumentsSidebarProps {
  onSelectDocument?: (documentId: number) => void;
}

export function DocumentsSidebar({ onSelectDocument }: DocumentsSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentService.getDocuments(true);
      setDocuments(docs);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();

    // Atualizar a cada 30 segundos para detectar novos documentos rapidamente
    const interval = setInterval(loadDocuments, 30 * 1000);

    // Escutar evento de documento salvo para atualizar imediatamente
    const handleDocumentSaved = () => {
      console.log('📄 Documento salvo - atualizando sidebar...');
      loadDocuments();
    };

    window.addEventListener('documentSaved', handleDocumentSaved);

    return () => {
      clearInterval(interval);
      window.removeEventListener('documentSaved', handleDocumentSaved);
    };
  }, []);

  const handleDelete = async (documentId: number) => {
    await deleteDocument(documentId);
    setDocuments(docs => docs.filter(d => d.id !== documentId));
  };

  const handleDownload = async (documentId: number) => {
    await downloadDocument(documentId);
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)'
        }}
      >
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <div style={{ marginTop: '12px' }}>Carregando documentos...</div>

        <style>{`
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.2);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#ef4444'
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
        <div>{error}</div>
        <button
          onClick={loadDocuments}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: '500' }}>Nenhum documento ainda</div>
        <div style={{ fontSize: '12px', marginTop: '8px', color: 'rgba(255, 255, 255, 0.4)' }}>
          Gere seu primeiro documento!
        </div>
      </div>
    );
  }

  const grouped: GroupedDocuments = groupDocumentsByDate(documents);

  return (
    <div
      className="documents-sidebar"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '16px'
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '20px'
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '400',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}
        >
          Histórico
        </h3>
      </div>

      {/* Document Groups */}
      <DocumentGroup
        title="Hoje"
        documents={grouped.today}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onSelect={onSelectDocument}
      />
      <DocumentGroup
        title="Ontem"
        documents={grouped.yesterday}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onSelect={onSelectDocument}
      />
      <DocumentGroup
        title="Esta Semana"
        documents={grouped.thisWeek}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onSelect={onSelectDocument}
      />
      <DocumentGroup
        title="Mais Antigos"
        documents={grouped.older}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onSelect={onSelectDocument}
      />

      <style>{`
        .documents-sidebar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .documents-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .documents-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .documents-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .documents-sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
