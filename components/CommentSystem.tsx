import React, { useState, useRef, useEffect } from 'react';
import { saveComment, getComments, resolveComment, deleteComment } from '../services/enhancedStorageService';

interface Comment {
  id: string;
  researchId: string;
  position: number;
  text: string;
  author: string;
  timestamp: number;
  resolved: boolean;
}

interface CommentSystemProps {
  researchId: string;
  content: string;
  onAddComment: () => void;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({ researchId, content }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    loadComments();
  }, [researchId]);

  const loadComments = () => {
    const loaded = getComments(researchId);
    setComments(loaded);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      researchId,
      position: selectedPosition,
      text: newCommentText,
      author: 'Você',
      timestamp: Date.now(),
      resolved: false
    };

    saveComment(comment);
    setComments([...comments, comment]);
    setNewCommentText('');
    setShowCommentBox(false);
  };

  const handleResolveComment = (commentId: string) => {
    resolveComment(researchId, commentId);
    loadComments();
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Excluir este comentário?')) {
      deleteComment(researchId, commentId);
      loadComments();
    }
  };

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  return (
    <div className="relative">
      {/* Comments Toggle Button */}
      <button
        onClick={() => setShowAllComments(!showAllComments)}
        className="fixed right-6 top-24 z-40 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-all"
        title="Ver comentários"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        {unresolvedCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unresolvedCount}
          </div>
        )}
      </button>

      {/* Comments Sidebar */}
      {showAllComments && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Comentários ({comments.length})
            </h3>
            <button
              onClick={() => setShowAllComments(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Nenhum comentário ainda</p>
                <p className="text-sm mt-2">Selecione texto e clique em "Comentar"</p>
              </div>
            ) : (
              comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onResolve={() => handleResolveComment(comment.id)}
                  onDelete={() => handleDeleteComment(comment.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Comment Box */}
      {showCommentBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Comentário</h3>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Digite seu comentário..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowCommentBox(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CommentCard: React.FC<{
  comment: Comment;
  onResolve: () => void;
  onDelete: () => void;
}> = ({ comment, onResolve, onDelete }) => {
  return (
    <div className={`p-4 rounded-lg border-2 ${comment.resolved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
            {comment.author[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{comment.author}</div>
            <div className="text-xs text-gray-500">
              {new Date(comment.timestamp).toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
        {comment.resolved && (
          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
            ✓ Resolvido
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-3">{comment.text}</p>

      <div className="flex gap-2">
        {!comment.resolved && (
          <button
            onClick={onResolve}
            className="text-xs font-medium text-green-600 hover:text-green-800"
          >
            ✓ Marcar como resolvido
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-xs font-medium text-red-600 hover:text-red-800"
        >
          🗑️ Excluir
        </button>
      </div>
    </div>
  );
};

// Hook para adicionar comentários inline no texto
export function useInlineComments(
  researchId: string,
  contentRef: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString();
      if (selectedText.length < 3) return;

      // Show comment button near selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Here you would show a floating button to add comment
      console.log('Selected text:', selectedText, 'at position:', rect);
    };

    element.addEventListener('mouseup', handleSelection);
    return () => element.removeEventListener('mouseup', handleSelection);
  }, [researchId, contentRef]);
}
