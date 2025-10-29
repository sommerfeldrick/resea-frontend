import React from 'react';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <div className="flex justify-end items-center px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        {/* Theme toggle será adicionado aqui quando implementarmos */}
      </div>
    </div>
  );
};
