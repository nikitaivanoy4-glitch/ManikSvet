import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  settings: Record<string, string>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, settings, activeTab, setActiveTab }) => {
  const businessName = settings.business_name || 'ManikSvet';
  const tagline = settings.tagline || 'Премиальный маникюр & эстетика';

  const isAdmin = user?.is_admin;
  const inAdminMode = activeTab.startsWith('admin');

  return (
    <header className="relative bg-[#FFFFFF] border-b border-[#EAE3D9] px-4 py-5 shadow-xs sticky top-0 z-30">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1817] leading-none">
              {businessName}
            </h1>
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>
          <p className="text-xs text-[#6E665F] font-light mt-1 tracking-wide">
            {tagline}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setActiveTab(inAdminMode ? 'services' : 'admin-dashboard')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              inAdminMode
                ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                : 'bg-[#F4EFEA] text-[#C5A059] border border-[#C5A059]/30 hover:bg-[#EAE3D9]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{inAdminMode ? 'Выйти из Админки' : 'Кабинет Мастера'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
