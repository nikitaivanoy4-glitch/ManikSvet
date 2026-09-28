import React, { useState, useEffect } from 'react';
import { Check, Trash2, Star, Clock, AlertCircle } from 'lucide-react';
import { Review } from '../../types';
import { api } from '../../services/api';

export const ReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    api.getAllReviewsAdmin()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const updated = await api.approveReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      alert('Ошибка при одобрении отзыва');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить отзыв? Это действие необратимо.')) return;
    try {
      await api.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert('Ошибка при удалении');
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1817]">Отзывы</h2>
          <p className="text-xs text-[#6E665F] mt-0.5">Модерация отзывов клиентов</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700">{pendingCount} на проверке</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          ['pending', 'На проверке'],
          ['approved', 'Одобренные'],
          ['all', 'Все'],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === val
                ? 'bg-[#C5A059] text-white shadow-sm'
                : 'bg-[#F4EFEA] text-[#6E665F] hover:bg-[#EAE3D9]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[#6E665F] text-sm">Отзывов нет</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl border p-4 space-y-2 ${
                review.is_approved ? 'border-[#EAE3D9]' : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif font-bold text-[#1A1817] text-sm">{review.author_name}</p>
                    {!review.is_approved && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Ожидает
                      </span>
                    )}
                    {review.is_approved && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Опубликован
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-[#D4CAC0]'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#6E665F]">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="p-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors"
                      title="Одобрить"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#1A1817] leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
