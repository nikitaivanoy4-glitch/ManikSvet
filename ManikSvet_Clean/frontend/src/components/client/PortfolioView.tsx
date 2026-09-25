import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { PortfolioItem } from '../../types';

interface PortfolioViewProps {
  portfolio: PortfolioItem[];
  loading: boolean;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);

  const categories = ['Все', ...Array.from(new Set(portfolio.map((i) => i.category || 'Маникюр')))];

  const filteredItems = selectedCategory === 'Все'
    ? portfolio
    : portfolio.filter((i) => (i.category || 'Маникюр') === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="h-6 w-36 skeleton"></div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Галерея Работ</span>
        <h2 className="font-serif text-3xl text-[#1A1817] font-semibold">Портфолио & Вдохновение</h2>
        <div className="w-12 h-0.5 bg-[#C5A059] mx-auto mt-2 rounded-full"></div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#1A1817] text-[#FAF8F5] shadow-xs'
                : 'bg-white text-[#6E665F] border border-[#EAE3D9] hover:border-[#C5A059]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Portfolio Items */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE3D9]">
          <p className="text-sm text-[#6E665F]">В этой категории пока нет опубликованных работ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setPreviewItem(item)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-4/5 bg-[#EAE3D9] shadow-xs"
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[9px] uppercase font-semibold text-[#D4AF37] tracking-wider block">
                  {item.category || 'Маникюр'}
                </span>
                <h3 className="font-serif text-sm font-bold leading-tight line-clamp-2">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-80 bg-black overflow-hidden">
              <img src={previewItem.image_url} alt={previewItem.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-2">
              <span className="text-xs uppercase font-semibold text-[#C5A059]">
                {previewItem.category || 'Маникюр'}
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#1A1817]">{previewItem.title}</h3>
              {previewItem.description && (
                <p className="text-xs text-[#6E665F] leading-relaxed">{previewItem.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
