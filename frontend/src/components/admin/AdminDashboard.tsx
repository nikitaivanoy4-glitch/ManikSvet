import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardData } from '../../types';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    api.getDashboardStats()
      .then((res) => setData(res))
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="h-28 skeleton rounded-3xl"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 skeleton rounded-2xl"></div>
          <div className="h-24 skeleton rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Кабинет Мастера</span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1817]">📊 Дашборд</h2>
        </div>

        <button onClick={loadData} className="p-2 rounded-full bg-white border border-[#EAE3D9] text-[#6E665F]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1A1817] text-white p-5 rounded-3xl space-y-1 shadow-md">
          <span className="text-[10px] uppercase tracking-wider text-[#C5A059]">Сегодня Выручка</span>
          <p className="font-serif text-2xl font-bold">
            {data.today.revenue.toLocaleString('ru-RU')} ₽
          </p>
          <span className="text-[10px] text-[#6E665F] block pt-1">
            Записей: {data.today.bookings_count}
          </span>
        </div>

        <div className="bg-white border border-[#EAE3D9] p-5 rounded-3xl space-y-1 shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[#6E665F]">Месяц Итого</span>
          <p className="font-serif text-2xl font-bold text-[#C5A059]">
            {data.month.revenue.toLocaleString('ru-RU')} ₽
          </p>
          <span className="text-[10px] text-[#6E665F] block pt-1">
            Записей: {data.month.bookings_count}
          </span>
        </div>
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#EAE3D9] p-4 rounded-2xl flex items-center gap-3">
          <Clock className="w-8 h-8 text-[#C5A059] shrink-0" />
          <div>
            <span className="text-[10px] text-[#6E665F] block">Свободно окон</span>
            <span className="font-serif text-xl font-bold text-[#1A1817]">
              {data.today.free_slots_count}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#EAE3D9] p-4 rounded-2xl flex items-center gap-3">
          <Users className="w-8 h-8 text-[#C5A059] shrink-0" />
          <div>
            <span className="text-[10px] text-[#6E665F] block">Всего клиентов</span>
            <span className="font-serif text-xl font-bold text-[#1A1817]">
              {data.total_clients}
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S APPOINTMENTS LIST */}
      <div className="bg-white border border-[#EAE3D9] rounded-3xl p-5 space-y-4 shadow-xs">
        <h3 className="font-serif text-xl font-bold text-[#1A1817]">Записи на Сегодня</h3>

        {data.today.bookings.length === 0 ? (
          <p className="text-xs text-[#6E665F] italic">На сегодня подтвержденных записей нет.</p>
        ) : (
          <div className="space-y-3">
            {data.today.bookings.map((b) => (
              <div key={b.id} className="p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-sm text-[#C5A059] block">
                    {b.start_time.substring(0, 5)}
                  </span>
                  <span className="font-bold text-[#1A1817] block text-sm">{b.client_name}</span>
                  <span className="text-[#6E665F] text-[11px]">{b.service?.title}</span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-base text-[#1A1817] block">
                    {b.price.toLocaleString('ru-RU')} ₽
                  </span>
                  <a href={`tel:${b.client_phone}`} className="text-[11px] text-[#C5A059] hover:underline">
                    {b.client_phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOMORROW APPOINTMENTS QUICK LOOK */}
      <div className="bg-white border border-[#EAE3D9] rounded-3xl p-5 space-y-3 shadow-xs">
        <h3 className="font-serif text-lg font-bold text-[#1A1817]">Записи на Завтра ({data.tomorrow.bookings_count})</h3>
        {data.tomorrow.bookings.length === 0 ? (
          <p className="text-xs text-[#6E665F] italic">Записей пока нет.</p>
        ) : (
          <div className="space-y-2">
            {data.tomorrow.bookings.map((b) => (
              <div key={b.id} className="p-2.5 bg-[#FAF8F5] rounded-xl text-xs flex justify-between">
                <span>{b.start_time.substring(0, 5)} — {b.client_name} ({b.service?.title})</span>
                <span className="font-bold">{b.price} ₽</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
