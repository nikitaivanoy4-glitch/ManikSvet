import React from 'react';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Service } from '../../types';

interface ServicesViewProps {
  services: Service[];
  loading: boolean;
  onSelectService: (service: Service) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ services, loading, onSelectService }) => {
  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="h-6 w-40 skeleton"></div>
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-44 w-full skeleton rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Услуги и Прайс</span>
        <h2 className="font-serif text-3xl text-[#1A1817] font-semibold">Авторский уход & Забота</h2>
        <div className="w-12 h-0.5 bg-[#C5A059] mx-auto mt-2 rounded-full"></div>
      </div>

      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass-card rounded-2xl overflow-hidden p-5 border border-[#EAE3D9] flex flex-col justify-between relative group"
          >
            {service.image_url && (
              <div className="h-36 -mx-5 -mt-5 mb-4 overflow-hidden relative">
                <img
                  src={service.image_url}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <span className="absolute bottom-3 left-4 text-white font-serif text-xl font-bold tracking-wide">
                  {service.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-xl font-bold text-[#1A1817] leading-snug">
                  {service.title}
                </h3>
                {!service.image_url && (
                  <span className="font-serif text-xl font-bold text-[#C5A059] whitespace-nowrap">
                    {service.price.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>

              {service.description && (
                <p className="text-xs text-[#6E665F] font-normal line-clamp-3 leading-relaxed">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-[#6E665F] pt-1">
                <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Продолжительность: {service.duration_minutes} мин</span>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[#F4EFEA] flex justify-end">
              <button
                onClick={() => onSelectService(service)}
                className="btn-gold text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2"
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
