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
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginBottom: '4px',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Marcador + Título */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <span style={{ color: '#1a1a1a', fontSize: '16px', marginRight: '8px', flexShrink: 0 }}>•</span>
          <h5
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#1a1a1a',
              margin: 0,
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer'
            }}
            title={document.title}
            onClick={handleOpen}
          >
            {document.title}
          </h5>
        </div>

        {/* Menu 3 pontinhos */}
        <div style={{ position: 'relative', flexShrink: 0, marginLeft: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            disabled={isDeleting || isDownloading}
            style={{
              padding: '4px 6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#1a1a1a',
              transition: 'all 0.2s ease',
              lineHeight: 1
            }}
            title="Opções"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
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
    <div style={{ marginBottom: '16px' }}>
      <h4
        style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '8px',
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

    // Escutar evento de documento salvo para atualizar imediatamente
    const handleDocumentSaved = () => {
      console.log('📄 Documento salvo - atualizando sidebar...');
      loadDocuments();
    };

    window.addEventListener('documentSaved', handleDocumentSaved);

    return () => {
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
    return null; // Não mostrar nada enquanto carrega
  }

  const grouped: GroupedDocuments = documents.length > 0
    ? groupDocumentsByDate(documents)
    : { today: [], yesterday: [], thisWeek: [], older: [] };

  return (
    <div
      className="documents-sidebar"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '16px'
      }}
    >
      {/* Divisor - sempre visível */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          marginBottom: '16px'
        }}
      />

      {/* Header - sempre visível */}
      <div
        style={{
          marginBottom: '16px'
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}
        >
          Histórico
        </h3>
      </div>

      {/* Mensagem de erro */}
      {error && (
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
      )}

      {/* Mensagem quando não há documentos */}
      {!error && documents.length === 0 && (
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
      )}

      {/* Document Groups - só renderiza se não houver erro */}
      {!error && (
        <>
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
        </>
      )}

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
