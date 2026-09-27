import React, { useState, useEffect } from 'react';
import { Calendar, Phone, CheckCircle, XCircle, User as UserIcon, Filter } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { api } from '../../services/api';

export const BookingsManager: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadBookings = () => {
    setLoading(true);
    api.getAllBookingsAdmin(statusFilter || undefined)
      .then((data) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleStatusChange = async (id: number, newStatus: BookingStatus) => {
    try {
      await api.updateBookingStatus(id, newStatus);
      loadBookings();
    } catch (err) {}
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Записи клиентов</span>
        <h2 className="font-serif text-3xl font-bold text-[#1A1817]">📝 Все Записи</h2>
      </div>

      {/* STATUS FILTER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: '', label: 'Все' },
          { id: 'confirmed', label: 'Подтверждены' },
          { id: 'completed', label: 'Завершены' },
          { id: 'cancelled', label: 'Отменены' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === f.id
                ? 'bg-[#1A1817] text-white shadow-xs'
                : 'bg-white text-[#6E665F] border border-[#EAE3D9]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* BOOKINGS LIST */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE3D9]">
          <p className="text-sm text-[#6E665F]">Записи с выбранным фильтром не найдены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-3 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-serif text-lg font-bold text-[#1A1817] block">
                    {b.service?.title || 'Услуга'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#6E665F] mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{new Date(b.booking_date).toLocaleDateString('ru-RU')} в {b.start_time.substring(0, 5)}</span>
                  </div>
                </div>

                <span className="font-serif text-lg font-bold text-[#C5A059]">
                  {b.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-2xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[#1A1817]">👤 {b.client_name}</span>
                  <a href={`tel:${b.client_phone}`} className="text-[#C5A059] font-medium hover:underline">
                    📞 {b.client_phone}
                  </a>
                </div>
                {b.notes && <p className="text-[#6E665F] italic pt-1">💬 {b.notes}</p>}
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-medium ${
                  b.status === 'confirmed'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : b.status === 'completed'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {b.status === 'confirmed' ? 'Подтверждено' : b.status === 'completed' ? 'Завершено' : 'Отменено'}
                </span>

                <div className="flex gap-2">
                  {b.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(b.id, 'completed' as BookingStatus)}
                        className="px-3 py-1 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700"
                      >
                        Завершить
                      </button>

                      <button
                        onClick={() => handleStatusChange(b.id, 'cancelled' as BookingStatus)}
                        className="px-3 py-1 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200"
                      >
                        Отменить
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
