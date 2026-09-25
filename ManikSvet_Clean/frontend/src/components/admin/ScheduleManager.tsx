import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Check, X, Lock, Unlock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const ScheduleManager: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isWorking, setIsWorking] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [breakStart, setBreakStart] = useState<string>('14:00');
  const [breakEnd, setBreakEnd] = useState<string>('15:00');
  const [note, setNote] = useState<string>('');

  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const loadSlots = () => {
    setLoading(true);
    // Use dummy service ID 1 for slot preview
    api.getAvailableSlots(1, selectedDate)
      .then((res) => setSlots(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const handleSaveDayConfig = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      await api.updateScheduleDay({
        date: selectedDate,
        is_working: isWorking,
        start_time: startTime,
        end_time: endTime,
        break_start: breakStart || null,
        break_end: breakEnd || null,
        note: note.trim() || null
      });
      setStatusMsg('Сохранено успешно!');
      loadSlots();
    } catch (err: any) {
      setStatusMsg(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Управление временем</span>
        <h2 className="font-serif text-3xl font-bold text-[#1A1817]">📅 Настройка Расписания</h2>
      </div>

      {/* DATE SELECTOR */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-4 shadow-xs">
        <label className="block text-xs font-semibold uppercase text-[#6E665F]">Выберите День</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl text-base font-bold text-[#1A1817]"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#F4EFEA]">
          <span className="text-sm font-semibold text-[#1A1817]">Рабочий день</span>
          <button
            onClick={() => setIsWorking(!isWorking)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isWorking ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isWorking ? 'Открыт для записи' : 'Выходной день'}
          </button>
        </div>

        {isWorking && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#6E665F] mb-1">Начало работы</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">Конец работы</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#6E665F] mb-1">Перерыв с</label>
                <input
                  type="time"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">Перерыв до</label>
                <input
                  type="time"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#6E665F] mb-1">Заметка мастера</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Например: короткая смены или учеба"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {statusMsg && (
          <p className="text-xs font-semibold text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
            {statusMsg}
          </p>
        )}

        <button
          onClick={handleSaveDayConfig}
          disabled={saving}
          className="w-full btn-gold text-xs py-3"
        >
          {saving ? 'Сохранение...' : 'Сохранить график на день'}
        </button>
      </div>

      {/* VISUAL TIME SLOTS PREVIEW */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-3 shadow-xs">
        <h3 className="font-serif text-lg font-bold text-[#1A1817]">Свободные окна в этот день</h3>

        {!isWorking ? (
          <p className="text-xs text-red-500 italic">День отмечен как выходной.</p>
        ) : loading ? (
          <div className="h-16 skeleton rounded-2xl"></div>
        ) : slots.length === 0 ? (
          <p className="text-xs text-[#6E665F]">Нет доступных окон.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((s, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-center text-xs font-mono font-bold text-[#1A1817]"
              >
                {s.start_time.substring(0, 5)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
