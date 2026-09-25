import React from 'react';
import { Sparkles, Calendar, Image as ImageIcon, BookmarkCheck, Info, LayoutDashboard, Clock, Users, Wrench, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdminMode }) => {
  const clientNav = [
    { id: 'services', label: 'Услуги', icon: Sparkles },
    { id: 'book', label: 'Записаться', icon: Calendar, highlight: true },
    { id: 'portfolio', label: 'Портфолио', icon: ImageIcon },
    { id: 'my-bookings', label: 'Мои записи', icon: BookmarkCheck },
    { id: 'info', label: 'О мастере', icon: Info },
  ];

  const adminNav = [
    { id: 'admin-dashboard', label: 'Обзор', icon: LayoutDashboard },
    { id: 'admin-schedule', label: 'График', icon: Clock },
    { id: 'admin-bookings', label: 'Записи', icon: Calendar },
    { id: 'admin-clients', label: 'Клиенты', icon: Users },
    { id: 'admin-services', label: 'Услуги', icon: Wrench },
    { id: 'admin-settings', label: 'Настройки', icon: Settings },
  ];

  const items = isAdminMode ? adminNav : clientNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-t border-[#EAE3D9] px-2 py-2 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHighlight = item.highlight;

          if (isHighlight) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                  setActiveTab(item.id);
                }}
                className={`relative -top-3 flex flex-col items-center justify-center p-3 rounded-full shadow-md transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#C5A059] text-white ring-4 ring-[#FAF8F5]'
                    : 'bg-[#1A1817] text-white ring-4 ring-[#FAF8F5]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-[#C5A059] font-semibold scale-105'
                  : 'text-[#6E665F] hover:text-[#1A1817]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
