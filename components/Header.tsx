import React from 'react';
import { CreditsBadge } from './CreditsBadge';

interface HeaderProps {
  onBack?: () => void;
  showCredits?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onBack, showCredits = true }) => {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
      <div>
        {/* Theme toggle está no LandingPage */}
      </div>

      {/* Credits Badge - mostrado apenas quando usuário estiver autenticado */}
      {showCredits && (
        <div className="flex items-center gap-4">
          <CreditsBadge />
        </div>
      )}
    </div>
  );
};
