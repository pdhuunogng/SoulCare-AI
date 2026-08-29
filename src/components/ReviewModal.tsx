import React, { useState } from 'react';
import { ExpertProfile, ExpertReview } from '../types';
import { Star, Sparkles, Send, UserCheck, X } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: ExpertProfile;
  onSubmitReview: (review: ExpertReview) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  expert,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['#LoÂu', '#ÁpLựcWorkplace']);

  if (!isOpen) return null;

  const availableTags = [
    '#TrầmCảm',
    '#LoÂu',
    '#MấtNgủ',
    '#ÁpLựcWorkplace',
    '#MốiQuanHệ',
    '#ĐịnhHướngSựNghiệp',
    '#KhủngHoảngTuổiTrẻ',
    '#ChữaLànhTổnThương',
  ];

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newRev: ExpertReview = {
      id: `rev-${Date.now()}`,
      userName: isAnonymous ? 'Ẩn danh' : 'Thanh Hà',
      isAnonymous,
      rating,
      date: new Date().toLocaleDateString('vi-VN'),
      text: text.trim(),
      tags: selectedTags,
      isVerifiedSession: true,
    };

    audioSynth.playChime(528, 1);
    onSubmitReview(newRev);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#ffffff] border border-[#dfe4d9] rounded-3xl shadow-xl p-6 text-[#181d16] flex flex-col max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dfe4d9]">
          <div className="flex items-center gap-2 text-[#006e22]">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-base font-bold text-[#181d16]">Đánh Giá Buổi Tư Vấn</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f7faf8] hover:bg-[#f0f5ea] flex items-center justify-center text-[#6f7a6c] hover:text-[#181d16] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expert Info */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9]">
          <img
            src={expert.avatar}
            alt={expert.name}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#67c76c]/40"
          />
          <div>
            <h4 className="text-xs font-bold text-[#181d16]">{expert.name}</h4>
            <p className="text-[11px] text-[#6f7a6c]">{expert.title}</p>
            <div className="flex items-center gap-1 text-[10px] text-[#006e22] font-semibold mt-0.5">
              <UserCheck className="w-3 h-3" />
              <span>Đã xác thực tham gia tư vấn</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Star rating selector */}
          <div className="space-y-1 text-center">
            <label className="font-semibold text-[#181d16]">Bạn đánh giá buổi tư vấn bao nhiêu sao?</label>
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition transform hover:scale-125"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Hashtag topic picker */}
          <div className="space-y-2">
            <label className="font-semibold text-[#181d16]">Chủ đề Chuyên gia đã hỗ trợ bạn tốt nhất:</label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
                    selectedTags.includes(tag)
                      ? 'bg-[#006e22] text-white shadow-2xs'
                      : 'bg-[#f7faf8] text-[#6f7a6c] hover:text-[#181d16] border border-[#dfe4d9]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback textarea */}
          <div className="space-y-1">
            <label className="font-semibold text-[#181d16]">Cảm nhận và chia sẻ chi tiết của bạn:</label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Chia sẻ về sự thấu cảm, bài tập được hướng dẫn, hoặc điều bạn thấy hài lòng nhất..."
              className="w-full p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] placeholder-[#6f7a6c] focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none text-xs"
              required
            />
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-[#006e22] rounded"
            />
            <div>
              <span className="font-semibold text-[#181d16]">Đăng ẩn danh (Anonymous)</span>
              <p className="text-[10px] text-[#6f7a6c]">Tên thật và ảnh đại diện của bạn sẽ được ẩn trên hồ sơ công khai.</p>
            </div>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Gửi Đánh Giá Của Bạn
          </button>
        </form>
      </div>
    </div>
  );
};
