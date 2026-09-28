import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Review } from '../../types';
import { api } from '../../services/api';

interface ReviewsViewProps {
  onBookClick: () => void;
}

const StarRating: React.FC<{ rating: number; onRate?: (r: number) => void; size?: number }> = ({
  rating,
  onRate,
  size = 5,
}) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          onMouseEnter={() => onRate && setHovered(star)}
          onMouseLeave={() => onRate && setHovered(0)}
          className={`transition-all ${onRate ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            className={`w-${size} h-${size} transition-colors ${
              star <= (hovered || rating) ? 'text-[#C5A059] fill-[#C5A059]' : 'text-[#D4CAC0]'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export const ReviewsView: React.FC<ReviewsViewProps> = ({ onBookClick }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async () => {
    if (!authorName.trim() || authorName.trim().length < 2) {
      setError('Укажите ваше имя (минимум 2 символа)');
      return;
    }
    if (!text.trim() || text.trim().length < 5) {
      setError('Напишите отзыв (минимум 5 символов)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.createReview({ author_name: authorName.trim(), rating, text: text.trim() });
      setSubmitted(true);
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'Ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="font-serif text-2xl font-bold text-[#1A1817]">Отзывы клиентов</h2>
        {avgRating && (
          <div className="flex items-center justify-center gap-2">
            <StarRating rating={Math.round(parseFloat(avgRating))} />
            <span className="font-serif text-lg font-bold text-[#C5A059]">{avgRating}</span>
            <span className="text-xs text-[#6E665F]">({reviews.length} отзывов)</span>
          </div>
        )}
      </div>

      {/* Leave review button */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full btn-gold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Оставить отзыв
        </button>
      )}

      {/* Success message */}
      {submitted && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Спасибо за ваш отзыв!</p>
            <p className="text-xs text-green-600 mt-0.5">Он появится после проверки мастером.</p>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] p-5 space-y-4 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#1A1817]">Ваш отзыв</h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#6E665F] mb-1">Ваша оценка</label>
            <StarRating rating={rating} onRate={setRating} size={7} />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E665F] mb-1">Ваше имя</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Екатерина"
              className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E665F] mb-1">Текст отзыва</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о вашем опыте посещения студии..."
              rows={4}
              maxLength={1000}
              className="w-full p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-sm focus:outline-none focus:border-[#C5A059] resize-none"
            />
            <p className="text-[10px] text-[#6E665F] text-right mt-0.5">{text.length}/1000</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="flex-1 py-2.5 rounded-xl border border-[#EAE3D9] text-sm text-[#6E665F] hover:bg-[#FAF8F5] transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 btn-gold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Отправляем...' : 'Отправить'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <MessageSquare className="w-12 h-12 text-[#D4CAC0] mx-auto" />
          <p className="font-serif text-lg font-bold text-[#1A1817]">Пока нет отзывов</p>
          <p className="text-xs text-[#6E665F]">Станьте первым, кто оставит отзыв!</p>
          <button onClick={onBookClick} className="btn-gold text-xs px-6 py-2 rounded-xl mt-2">
            Записаться к мастеру
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-[#EAE3D9] p-4 space-y-2 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif font-bold text-[#1A1817] text-sm">{review.author_name}</p>
                  <p className="text-[10px] text-[#6E665F]">{formatDate(review.created_at)}</p>
                </div>
                <StarRating rating={review.rating} size={4} />
              </div>
              <p className="text-sm text-[#1A1817] leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
