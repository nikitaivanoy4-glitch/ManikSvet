import React from 'react';
import { Clock, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { Service } from '../../types';

interface ServicesViewProps {
  services: Service[];
  loading: boolean;
  onSelectService: (service: Service) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ services, loading, onSelectService }) => {
  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
        <div className="h-28 w-full skeleton rounded-2xl"></div>
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 w-full skeleton rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 animate-fade-in">
      {/* Studio Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-xs h-32 bg-[#1A1817] flex items-end p-4 border border-[#EAE3D9]">
        <img
          src="/static/cover.jpg"
          alt="Маникюр Дрожжино"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="relative z-10 space-y-0.5 text-white">
          <div className="flex items-center gap-1.5 text-[#DFB86C] text-[10px] uppercase font-bold tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>Мастер Светлана</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-wide leading-tight">
            Маникюр Дрожжино
          </h2>
          <p className="text-[11px] text-gray-200 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#DFB86C]" />
            <span>Новое шоссе 5к2 • Онлайн-запись</span>
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass-card rounded-2xl overflow-hidden p-4 border border-[#EAE3D9] flex flex-col justify-between relative group"
          >
            {service.image_url && (
              <div className="h-28 -mx-4 -mt-4 mb-3 overflow-hidden relative">
                <img
                  src={service.image_url}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <span className="absolute bottom-2.5 left-3 text-white font-serif text-lg font-bold tracking-wide">
                  {service.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg font-bold text-[#1A1817] leading-snug">
                  {service.title}
                </h3>
                {!service.image_url && (
                  <span className="font-serif text-lg font-bold text-[#C5A059] whitespace-nowrap">
                    {service.price.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>

              {service.description && (
                <p className="text-xs text-[#5C554E] font-normal line-clamp-2 leading-relaxed">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-[#6E665F] pt-0.5">
                <Clock className="w-3 h-3 text-[#C5A059]" />
                <span>Время выполнения: {service.duration_minutes} мин</span>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-[#F4EFEA] flex justify-end">
              <button
                onClick={() => onSelectService(service)}
                className="btn-gold text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5"
              >
                <span>Выбрать услугу</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
