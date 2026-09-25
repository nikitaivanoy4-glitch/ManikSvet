import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Check } from 'lucide-react';
import { api } from '../../services/api';

export const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    api.getPublicSettings()
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.updateSettings(settings);
      setMsg('Настройки успешно обновлены!');
    } catch (err: any) {
      setMsg(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-3">
        <div className="h-40 skeleton rounded-3xl"></div>
      </div>
    );
  }

  const fields = [
    { key: 'business_name', label: 'Название студии / бизнеса', type: 'text' },
    { key: 'master_name', label: 'Имя мастера', type: 'text' },
    { key: 'tagline', label: 'Подзаголовок / слоган', type: 'text' },
    { key: 'phone', label: 'Телефон для связи', type: 'text' },
    { key: 'telegram', label: 'Telegram (username)', type: 'text' },
    { key: 'whatsapp', label: 'WhatsApp номер', type: 'text' },
    { key: 'address', label: 'Адрес студии', type: 'text' },
    { key: 'map_link', label: 'Ссылка на Яндекс.Карты', type: 'text' },
    { key: 'min_advance_hours', label: 'Минимальное время до записи (часы)', type: 'number' },
    { key: 'reminder_hours', label: 'Время отправки напоминаний (часы до визита через запятую)', type: 'text' },
    { key: 'welcome_text', label: 'Текст приветствия', type: 'textarea' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Конфигурация</span>
        <h2 className="font-serif text-3xl font-bold text-[#1A1817]">⚙️ Настройки Сервиса</h2>
      </div>

      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-4 shadow-xs">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1 text-xs">
            <label className="block font-semibold text-[#1A1817]">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                value={settings[f.key] || ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs"
              />
            ) : (
              <input
                type={f.type}
                value={settings[f.key] || ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-medium text-[#1A1817]"
              />
            )}
          </div>
        ))}

        {msg && (
          <p className="text-xs font-semibold text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
            {msg}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-gold text-xs py-3.5 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Сохранение...' : 'Сохранить все изменения'}</span>
        </button>
      </div>
    </div>
  );
};
