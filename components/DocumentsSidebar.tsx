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

  const handleDelete = async () => {
    if (!confirm('Deseja realmente deletar este documento?')) return;

    setIsDeleting(true);
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
    try {
      await onDownload(document.id);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      alert('Erro ao baixar documento');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="document-item"
      style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: '8px',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
      onClick={() => onSelect?.(document.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={document.title}
          >
            {document.title}
          </h5>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {document.word_count.toLocaleString('pt-BR')} palavras • {formatDocumentType(document.document_type)}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
            {formatDate(document.created_at)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={isDownloading}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '4px',
              cursor: isDownloading ? 'wait' : 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              color: '#60a5fa',
              transition: 'all 0.2s ease',
              opacity: isDownloading ? 0.5 : 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            title="Baixar documento"
          >
            {isDownloading ? 'Baixando...' : 'Baixar'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              cursor: isDeleting ? 'wait' : 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              color: '#f87171',
              transition: 'all 0.2s ease',
              opacity: isDeleting ? 0.5 : 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            title="Deletar documento"
          >
            {isDeleting ? 'Deletando...' : 'Deletar'}
          </button>
        </div>
      </div>

      <style>{`
        .document-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        .document-item button:hover:not(:disabled) {
          opacity: 1;
          background-color: rgba(59, 130, 246, 0.25);
        }

        .document-item button:last-child:hover:not(:disabled) {
          background-color: rgba(239, 68, 68, 0.25);
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            margin: 0
          }}
        >
          Documentos Gerados
        </h3>
        <button
          onClick={loadDocuments}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease'
          }}
          title="Atualizar lista"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        >
          Atualizar
        </button>
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
