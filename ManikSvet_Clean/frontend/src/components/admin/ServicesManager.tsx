import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Clock, Eye, EyeOff } from 'lucide-react';
import { Service } from '../../types';
import { api } from '../../services/api';

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const loadServices = () => {
    setLoading(true);
    api.getAllServicesAdmin()
      .then((data) => setServices(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSave = async () => {
    if (!editingService || !editingService.title || !editingService.price) return;
    setSaving(true);
    try {
      if (editingService.id) {
        await api.updateService(editingService.id, editingService);
      } else {
        await api.createService(editingService);
      }
      setEditingService(null);
      loadServices();
    } catch (err) {}
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Скрыть услугу из прайса?')) return;
    try {
      await api.deleteService(id);
      loadServices();
    } catch (err) {}
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Управление Каталогом</span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1817]">💅 Услуги и Прайс</h2>
        </div>

        <button
          onClick={() => setEditingService({ title: '', price: 2500, duration_minutes: 60, is_active: true })}
          className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className={`p-5 bg-white rounded-3xl border transition-all shadow-xs ${
                s.is_active ? 'border-[#EAE3D9]' : 'border-red-200 opacity-60 bg-red-50/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1A1817] flex items-center gap-2">
                    {s.title}
                    {!s.is_active && (
                      <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        Скрыта
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#6E665F] mt-1">{s.description}</p>
                </div>

                <span className="font-serif text-lg font-bold text-[#C5A059] whitespace-nowrap">
                  {s.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F4EFEA] text-xs text-[#6E665F]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{s.duration_minutes} мин</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingService(s)}
                    className="p-2 rounded-xl bg-[#FAF8F5] text-[#1A1817] hover:border-[#C5A059] border border-[#EAE3D9]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in">
            <h3 className="font-serif text-xl font-bold text-[#1A1817]">
              {editingService.id ? 'Редактировать услугу' : 'Новая услуга'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6E665F] mb-1">Название услуги</label>
                <input
                  type="text"
                  value={editingService.title || ''}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">Описание</label>
                <textarea
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E665F] mb-1">Цена (₽)</label>
                  <input
                    type="number"
                    value={editingService.price || 0}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[#6E665F] mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    value={editingService.duration_minutes || 60}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value) })}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">Ссылка на фото обложки</label>
                <input
                  type="text"
                  value={editingService.image_url || ''}
                  onChange={(e) => setEditingService({ ...editingService, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingService.is_active !== false}
                  onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#C5A059]"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-[#1A1817]">
                  Услуга активна для записи
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button onClick={() => setEditingService(null)} className="flex-1 btn-outline text-xs py-3">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-gold text-xs py-3">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
