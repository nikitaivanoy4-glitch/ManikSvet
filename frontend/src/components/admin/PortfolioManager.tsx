import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { PortfolioItem } from '../../types';
import { api } from '../../services/api';

export const PortfolioManager: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<{ title: string; category: string; image_url: string; description: string }>({
    title: '',
    category: 'Френч & Дизайн',
    image_url: '',
    description: ''
  });

  const loadPortfolio = () => {
    setLoading(true);
    api.getAllPortfolioAdmin()
      .then((data) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleAdd = async () => {
    if (!newItem.title || !newItem.image_url) return;
    try {
      await api.createPortfolioItem(newItem);
      setAdding(false);
      setNewItem({ title: '', category: 'Френч & Дизайн', image_url: '', description: '' });
      loadPortfolio();
    } catch (err) {}
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить работу из галереи?')) return;
    try {
      await api.deletePortfolioItem(id);
      loadPortfolio();
    } catch (err) {}
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Управление Работами</span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1817]">🖼 Портфолио</h2>
        </div>

        <button onClick={() => setAdding(true)} className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Добавить фото</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-[#EAE3D9] overflow-hidden shadow-xs relative group">
            <img src={item.image_url} alt={item.title} className="w-full h-36 object-cover" />
            <div className="p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] block">{item.category}</span>
              <h4 className="font-serif font-bold text-sm text-[#1A1817] truncate">{item.title}</h4>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in">
            <h3 className="font-serif text-xl font-bold text-[#1A1817]">Добавить работу в Портфолио</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6E665F] mb-1">Название работы</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Минималистичный нюд"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">Категория</label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">URL изображения</label>
                <input
                  type="text"
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[#6E665F] mb-1">Описание</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setAdding(false)} className="flex-1 btn-outline text-xs py-3">
                Отмена
              </button>
              <button onClick={handleAdd} className="flex-1 btn-gold text-xs py-3">
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
