import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ArrowRight, User as UserIcon, Phone, AlertCircle, Sparkles } from 'lucide-react';
import { Service, AvailableDate, TimeSlot, Booking, User } from '../../types';
import { api } from '../../services/api';

interface BookingWizardProps {
  services: Service[];
  selectedService: Service | null;
  user: User | null;
  onBookingSuccess: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  selectedService: initialService,
  user,
  onBookingSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<number>(initialService ? 2 : 1);
  const [service, setService] = useState<Service | null>(initialService);
  const [dates, setDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Client inputs
  const [clientName, setClientName] = useState<string>(user?.first_name || '');
  const [clientPhone, setClientPhone] = useState<string>(user?.phone || '');
  const [notes, setNotes] = useState<string>('');

  const [loadingDates, setLoadingDates] = useState<boolean>(false);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch available dates when service is selected
  useEffect(() => {
    if (service) {
      setLoadingDates(true);
      setErrorMsg('');
      api.getAvailableDates(service.id)
        .then((res) => {
          setDates(res.filter((d) => d.is_working && d.available_slots_count > 0));
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoadingDates(false));
    }
  }, [service]);

  // Fetch time slots when date is selected
  useEffect(() => {
    if (service && selectedDate) {
      setLoadingSlots(true);
      setErrorMsg('');
      api.getAvailableSlots(service.id, selectedDate)
        .then((res) => {
          setSlots(res.filter((s) => s.is_available));
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoadingSlots(false));
    }
  }, [service, selectedDate]);

  const handleSelectService = (s: Service) => {
    setService(s);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSelectDate = (d: string) => {
    setSelectedDate(d);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!service || !selectedDate || !selectedSlot) return;

    if (!clientName.trim() || clientName.trim().length < 2) {
      setErrorMsg('Пожалуйста, укажите ваше имя');
      return;
    }

    if (!clientPhone.trim() || clientPhone.trim().length < 5) {
      setErrorMsg('Пожалуйста, укажите контактный телефон');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const result = await api.createBooking({
        service_id: service.id,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        client_name: clientName,
        client_phone: clientPhone,
        notes: notes.trim() || undefined,
      });

      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      onBookingSuccess(result);
    } catch (err: any) {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
      setErrorMsg(err.message || 'Ошибка бронирования');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else onCancel();
          }}
          className="p-2 rounded-full text-[#6E665F] hover:bg-[#F4EFEA] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E665F]">
          <span className={step === 1 ? 'text-[#C5A059] font-bold' : ''}>1. Услуга</span>
          <span>→</span>
          <span className={step === 2 ? 'text-[#C5A059] font-bold' : ''}>2. Дата</span>
          <span>→</span>
          <span className={step === 3 ? 'text-[#C5A059] font-bold' : ''}>3. Время</span>
          <span>→</span>
          <span className={step === 4 ? 'text-[#C5A059] font-bold' : ''}>4. Итог</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Select Service */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#1A1817]">Шаг 1: Выберите услугу</h2>
          <div className="space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectService(s)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  service?.id === s.id
                    ? 'border-[#C5A059] bg-[#FAF6EE] shadow-sm'
                    : 'border-[#EAE3D9] bg-white hover:border-[#C5A059]'
                }`}
              >
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1A1817]">{s.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#6E665F] mt-1">
                    <span>⏱ {s.duration_minutes} мин</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-lg text-[#C5A059]">
                    {s.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Select Date */}
      {step === 2 && service && (
        <div className="space-y-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#C5A059] font-semibold">Услуга: {service.title}</span>
            <h2 className="font-serif text-2xl font-bold text-[#1A1817]">Шаг 2: Выберите удобную дату</h2>
          </div>

          {loadingDates ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-20 skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : dates.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-[#EAE3D9] space-y-2">
              <CalendarIcon className="w-8 h-8 text-[#C5A059] mx-auto opacity-50" />
              <p className="text-sm font-medium text-[#1A1817]">На ближайшие 30 дней свободных окон нет</p>
              <p className="text-xs text-[#6E665F]">Свяжитесь с мастером для записи в индивидуальном порядке</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {dates.map((d) => {
                const dt = new Date(d.date);
                const dayName = dt.toLocaleDateString('ru-RU', { weekday: 'short' });
                const dayNum = dt.getDate();
                const monthName = dt.toLocaleDateString('ru-RU', { month: 'short' });
                const isSelected = selectedDate === d.date;

                return (
                  <button
                    key={d.date}
                    onClick={() => handleSelectDate(d.date)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#1A1817] text-white shadow-md'
                        : 'border-[#EAE3D9] bg-white hover:border-[#C5A059] text-[#1A1817]'
                    }`}
                  >
                    <span className={`text-[11px] uppercase font-medium ${isSelected ? 'text-[#C5A059]' : 'text-[#6E665F]'}`}>
                      {dayName}
                    </span>
                    <span className="font-serif text-2xl font-bold my-0.5">{dayNum}</span>
                    <span className="text-[10px] opacity-80">{monthName}</span>
                    <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-[#C5A059] text-white' : 'bg-[#F4EFEA] text-[#6E665F]'}`}>
                      {d.available_slots_count} {d.available_slots_count === 1 ? 'окно' : 'окон'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Select Time Slot */}
      {step === 3 && selectedDate && (
        <div className="space-y-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#C5A059] font-semibold">
              Дата: {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A1817]">Шаг 3: Выберите время</h2>
          </div>

          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-14 skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-[#EAE3D9]">
              <p className="text-sm font-medium text-[#1A1817]">На эту дату все слоты уже заняты</p>
              <button
                onClick={() => setStep(2)}
                className="btn-outline text-xs mt-3"
              >
                Выбрать другую дату
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot, idx) => {
                const isSelected = selectedSlot?.start_time === slot.start_time;
                const timeStr = slot.start_time.substring(0, 5);

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectSlot(slot)}
                    className={`py-3.5 px-2 rounded-2xl border font-mono text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-md scale-105'
                        : 'bg-white text-[#1A1817] border-[#EAE3D9] hover:border-[#C5A059]'
                    }`}
                  >
                    {timeStr}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Confirm Summary & Client Info */}
      {step === 4 && service && selectedDate && selectedSlot && (
        <div className="space-y-6">
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-[#C5A059] mx-auto mb-1" />
            <h2 className="font-serif text-2xl font-bold text-[#1A1817]">Подтверждение записи</h2>
            <p className="text-xs text-[#6E665F]">Проверьте детали записи перед подтверждением</p>
          </div>

          {/* Luxury Ticket Summary */}
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="w-1.5 h-full bg-[#C5A059] absolute left-0 top-0 bottom-0"></div>

            <div className="flex justify-between items-start border-b border-[#F4EFEA] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#6E665F]">Услуга</span>
                <h3 className="font-serif font-bold text-lg text-[#1A1817]">{service.title}</h3>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-[#C5A059] hover:underline">
                Изменить
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-[#F4EFEA] pb-3 text-xs">
              <div>
                <span className="text-[#6E665F]">Дата и время</span>
                <p className="font-bold text-sm text-[#1A1817] mt-0.5">
                  {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {selectedSlot.start_time.substring(0, 5)}
                </p>
              </div>

              <div>
                <span className="text-[#6E665F]">Длительность</span>
                <p className="font-bold text-sm text-[#1A1817] mt-0.5">
                  ~ {service.duration_minutes} мин
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-medium text-[#6E665F]">Стоимость услуги</span>
              <span className="font-serif text-2xl font-bold text-[#C5A059]">
                {service.price.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {/* Client Info Form */}
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-5 space-y-4">
            <h4 className="font-serif font-bold text-base text-[#1A1817]">Ваши данные для связи</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#6E665F] mb-1">Ваше Имя</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Екатерина"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm text-[#1A1817] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E665F] mb-1">Номер телефона</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#C5A059] absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm text-[#1A1817] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E665F] mb-1">Пожелания или комментарий (опционально)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Например: нужен снятие старого геля"
                  rows={2}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm text-[#1A1817] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={submitting}
            className="w-full btn-gold text-base py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
          >
            {submitting ? (
              <span>Подтверждение...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Подтвердить запись</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
