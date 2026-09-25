import React, { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Send, ShoppingBag, CreditCard } from 'lucide-react';
import { ClientStats } from '../../types';
import { api } from '../../services/api';

export const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getClientsList()
      .then((data) => setClients(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 skeleton rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">База Клиентов</span>
        <h2 className="font-serif text-3xl font-bold text-[#1A1817]">👥 Клиенты Студии ({clients.length})</h2>
      </div>

      <div className="space-y-3">
        {clients.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1817]">
                  {c.first_name} {c.last_name || ''}
                </h3>
                {c.username && (
                  <span className="text-xs text-[#C5A059] font-medium">@{c.username}</span>
                )}
              </div>

              <span className="font-serif font-bold text-lg text-[#1A1817]">
                {c.total_spent.toLocaleString('ru-RU')} ₽
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF8F5] p-3 rounded-2xl">
              <div>
                <span className="text-[#6E665F]">Всего визитов</span>
                <p className="font-bold text-[#1A1817] text-sm">{c.total_bookings}</p>
              </div>

              <div>
                <span className="text-[#6E665F]">Последний визит</span>
                <p className="font-bold text-[#1A1817] text-sm">{c.last_booking_date || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1 text-xs">
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-[#1A1817] font-medium hover:border-[#C5A059]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{c.phone}</span>
                </a>
              )}

              {c.username && (
                <a
                  href={`https://t.me/${c.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-[#1A1817] font-medium hover:border-[#C5A059]"
                >
                  <Send className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Telegram</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
