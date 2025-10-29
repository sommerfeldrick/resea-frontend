import React from 'react';
import { UserProfileMenu } from './UserProfileMenu';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
      <button 
        onClick={onBack || (() => window.history.back())}
        className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        ← Voltar
      </button>
      
      <div className="flex items-center space-x-4">
        {/* Theme toggle será adicionado aqui quando implementarmos */}
        <UserProfileMenu />
      </div>
    </div>
  );
};
