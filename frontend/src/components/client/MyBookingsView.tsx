import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, RefreshCw, XCircle, Sparkles } from 'lucide-react';
import { Booking } from '../../types';
import { api } from '../../services/api';

interface MyBookingsViewProps {
  onNewBookingClick: () => void;
  settings: Record<string, string>;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onNewBookingClick, settings }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Modals state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  
  // Reschedule picker state
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchBookings = () => {
    setLoading(true);
    api.getMyBookings()
      .then((data) => setBookings(data))
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return;
    setActionLoading(true);
    try {
      await api.cancelBooking(cancellingBooking.id);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      setCancellingBooking(null);
      fetchBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось отменить запись');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!reschedulingBooking || !rescheduleDate || !rescheduleTime) return;
    setActionLoading(true);
    try {
      await api.rescheduleBooking(reschedulingBooking.id, {
        booking_date: rescheduleDate,
        start_time: rescheduleTime
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      setReschedulingBooking(null);
      fetchBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось перенести запись');
    } finally {
      setActionLoading(false);
    }
  };

  // Load slots when reschedule date is chosen
  useEffect(() => {
    if (reschedulingBooking && rescheduleDate) {
      setLoadingSlots(true);
      api.getAvailableSlots(reschedulingBooking.service_id, rescheduleDate)
        .then((res) => setAvailableSlots(res.filter(s => s.is_available)))
        .catch(() => {})
        .finally(() => setLoadingSlots(false));
    }
  }, [reschedulingBooking, rescheduleDate]);

  const studioAddress = settings.address || 'г. Москва, ул. Красная Пресня, д. 24';

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="h-6 w-36 skeleton"></div>
        {[1, 2].map((n) => (
          <div key={n} className="h-44 w-full skeleton rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status !== 'confirmed' && b.status !== 'pending');

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Ваш График</span>
        <h2 className="font-serif text-3xl text-[#1A1817] font-semibold">Мои Записи</h2>
        <div className="w-12 h-0.5 bg-[#C5A059] mx-auto mt-2 rounded-full"></div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* UPCOMING BOOKINGS SECTION */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#1A1817]">Предстоящие визиты</h3>

        {upcomingBookings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE3D9] space-y-3">
            <Calendar className="w-10 h-10 text-[#C5A059] mx-auto opacity-40" />
            <p className="text-sm font-medium text-[#1A1817]">У вас пока нет активных записей</p>
            <button onClick={onNewBookingClick} className="btn-gold text-xs px-5 py-2.5">
              Записаться сейчас
            </button>
          </div>
        ) : (
          upcomingBookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-[#EAE3D9] p-5 space-y-4 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-[#C5A059] absolute left-0 top-0 bottom-0"></div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF6EE] text-[#C5A059] border border-[#C5A059]/30 mb-1">
                    Подтверждено
                  </span>
                  <h4 className="font-serif font-bold text-lg text-[#1A1817]">
                    {b.service?.title || 'Услуга'}
                  </h4>
                </div>
                <span className="font-serif text-lg font-bold text-[#1A1817]">
                  {b.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-semibold text-[#1A1817]">
                    {new Date(b.booking_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-semibold text-[#1A1817]">
                    {b.start_time.substring(0, 5)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-[#6E665F]">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                <span>{studioAddress}</span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-[#F4EFEA] flex items-center justify-end gap-2">
                <button
                  onClick={() => setReschedulingBooking(b)}
                  className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Перенести</span>
                </button>

                <button
                  onClick={() => setCancellingBooking(b)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 border border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Отменить</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAST / CANCELLED HISTORY */}
      {pastBookings.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[#EAE3D9]">
          <h3 className="font-serif text-lg font-bold text-[#6E665F]">История записей</h3>
          <div className="space-y-2">
            {pastBookings.map((b) => (
              <div key={b.id} className="p-3 bg-white rounded-xl border border-[#F4EFEA] text-xs flex items-center justify-between opacity-75">
                <div>
                  <p className="font-bold text-[#1A1817]">{b.service?.title || 'Услуга'}</p>
                  <p className="text-[#6E665F]">
                    {new Date(b.booking_date).toLocaleDateString('ru-RU')} в {b.start_time.substring(0, 5)}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  b.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                }`}>
                  {b.status === 'cancelled' ? 'Отменена' : 'Завершено'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-xl animate-fade-in">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-[#1A1817]">
              Отмена записи
            </h3>
            <p className="text-xs text-[#6E665F]">
              Вы уверены, что хотите отменить запись на{' '}
              <span className="font-bold text-[#1A1817]">
                {new Date(cancellingBooking.booking_date).toLocaleDateString('ru-RU')} в {cancellingBooking.start_time.substring(0, 5)}
              </span>?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancellingBooking(null)}
                className="flex-1 btn-outline text-xs py-3"
              >
                Вернуться
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white text-xs font-semibold rounded-xl py-3 hover:bg-red-700 transition-colors"
              >
                {actionLoading ? 'Отмена...' : 'Да, отменить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-bold text-[#1A1817]">
              Перенос записи
            </h3>
            <p className="text-xs text-[#6E665F]">
              Выберите новую дату и доступное время для услуги "{reschedulingBooking.service?.title}":
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#6E665F] mb-1">Новая дата</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm font-medium text-[#1A1817]"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="block text-xs font-medium text-[#6E665F] mb-1">Доступные слоты</label>
                  {loadingSlots ? (
                    <div className="h-10 skeleton rounded-xl"></div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-red-500">На выбранную дату нет свободных окон</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                      {availableSlots.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setRescheduleTime(s.start_time)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                            rescheduleTime === s.start_time
                              ? 'bg-[#C5A059] text-white border-[#C5A059]'
                              : 'bg-[#FAF8F5] text-[#1A1817] border-[#EAE3D9]'
                          }`}
                        >
                          {s.start_time.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setReschedulingBooking(null)}
                className="flex-1 btn-outline text-xs py-3"
              >
                Отмена
              </button>
              <button
                onClick={handleRescheduleConfirm}
                disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                className="flex-1 btn-gold text-xs py-3"
              >
                {actionLoading ? 'Перенос...' : 'Подтвердить перенос'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
