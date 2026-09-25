import React from 'react';
import { MapPin, Phone, Send, MessageCircle, Clock, Heart, Award, ShieldCheck, ExternalLink } from 'lucide-react';

interface InfoViewProps {
  settings: Record<string, string>;
  onBookClick: () => void;
}

export const InfoView: React.FC<InfoViewProps> = ({ settings, onBookClick }) => {
  const masterName = settings.master_name || 'Светлана';
  const businessName = settings.business_name || 'ManikSvet';
  const phone = settings.phone || '+7 (999) 000-00-00';
  const telegram = settings.telegram || '@manik_svet_master';
  const whatsapp = settings.whatsapp || '79990000000';
  const address = settings.address || 'г. Москва, ул. Красная Пресня, д. 24';
  const mapLink = settings.map_link || 'https://yandex.ru/maps';
  const welcomeText = settings.welcome_text || 'Добро пожаловать в ManikSvet — атмосферную студию авторского маникюра.';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* MASTER HERO CARD */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-6 space-y-4 text-center relative overflow-hidden shadow-xs">
        <div className="w-24 h-24 rounded-full bg-[#F4EFEA] border-2 border-[#C5A059] mx-auto overflow-hidden flex items-center justify-center shadow-md">
          <Heart className="w-10 h-10 text-[#C5A059]" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Топ-мастер студии</span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1817]">{masterName}</h2>
          <p className="text-xs text-[#6E665F] mt-1 italic">"{welcomeText}"</p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <div className="px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#EAE3D9] text-center">
            <Award className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
            <span className="text-[10px] font-bold text-[#1A1817] block">7+ лет опыта</span>
          </div>

          <div className="px-3 py-2 bg-[#FAF8F5] rounded-2xl border border-[#EAE3D9] text-center">
            <ShieldCheck className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
            <span className="text-[10px] font-bold text-[#1A1817] block">100% стерильность</span>
          </div>
        </div>

        <button onClick={onBookClick} className="w-full btn-gold text-xs py-3 mt-2">
          Записаться к мастеру
        </button>
      </div>

      {/* STUDIO LOCATION & CONTACTS */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#1A1817]">Локация & Контакты</h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-[#FAF8F5] rounded-2xl">
            <MapPin className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-[#1A1817] block">Адрес студии</span>
              <span className="text-[#6E665F]">{address}</span>
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 text-[11px] text-[#C5A059] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Открыть на Яндекс.Картах</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-2xl">
            <Phone className="w-5 h-5 text-[#C5A059] shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-[#1A1817] block">Телефон</span>
              <a href={`tel:${phone}`} className="text-[#6E665F] hover:text-[#C5A059] font-medium">
                {phone}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {telegram && (
              <a
                href={`https://t.me/${telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#1A1817] hover:border-[#C5A059]"
              >
                <Send className="w-4 h-4 text-[#C5A059]" />
                <span>Telegram</span>
              </a>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#1A1817] hover:border-[#C5A059]"
              >
                <MessageCircle className="w-4 h-4 text-[#C5A059]" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* WORKING HOURS SUMMARY */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-3 text-xs">
        <h3 className="font-serif text-xl font-bold text-[#1A1817]">График работы студии</h3>
        <div className="space-y-1.5 text-[#6E665F]">
          <div className="flex justify-between py-1 border-b border-[#F4EFEA]">
            <span>Понедельник — Суббота</span>
            <span className="font-bold text-[#1A1817]">10:00 — 20:00</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Воскресенье</span>
            <span className="font-bold text-[#C5A059]">По предварительной записи</span>
          </div>
        </div>
      </div>
    </div>
  );
};
