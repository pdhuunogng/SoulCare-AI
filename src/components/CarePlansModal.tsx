import React from 'react';
import { X, Check, Sparkles, Heart, ShieldCheck, ArrowRight, Star, Clock } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface CarePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planName: string) => void;
  userName?: string;
  recommendedPlan?: 'STARTER_FREE' | 'UNTANGLE_3S' | 'TRANSFORM_5S' | 'TRANSFORM_10S';
}

export const CarePlansModal: React.FC<CarePlansModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  userName = 'bạn',
  recommendedPlan = 'UNTANGLE_3S',
}) => {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'STARTER_FREE',
      name: 'Buổi Khởi Đầu (Tầm Soát & Kết Nối 1-1)',
      sessions: '1 buổi (60 phút)',
      price: '0đ',
      originalPrice: '500.000đ',
      tag: 'Miễn Phí Buổi Đầu',
      tagColor: 'bg-[#e0f5ea] text-[#006e22] border-[#67c76c]/40',
      description: 'Dành cho người mới bắt đầu muốn trải nghiệm tư vấn 1-1 cùng chuyên gia tâm lý và nhận bản đồ định hướng cá nhân.',
      features: [
        'Tư vấn trực tiếp 1-1 qua Google Meet bảo mật',
        'Đánh giá chuyên sâu 4 chỉ số PHQ-9, GAD-7, PSS-10, PSQI',
        'Bản tóm tắt y khoa (AI Medical Secretary Recap)',
      ],
      isPopular: false,
    },
    {
      id: 'UNTANGLE_3S',
      name: 'Gói Tháo Gỡ (Can Thiệp Ngắn Hạn)',
      sessions: '3 buổi tư vấn 1-1',
      price: '890.000đ',
      originalPrice: '1.500.000đ',
      tag: 'Khuyên Dùng Cho Lo Âu Cấp Tính',
      tagColor: 'bg-emerald-100 text-[#005116] border-emerald-300',
      description: 'Lộ trình tập trung tháo gỡ nút thắt tâm lý, xoa dịu cơn căng thẳng, lo âu cấp tính và tái tạo năng lượng.',
      features: [
        '3 buổi làm việc 1-1 chuyên sâu cùng chuyên gia',
        'Bài tập thở, nhật ký cảm xúc & bài tập CBT cá nhân hóa',
        'Trợ lý AI Hi theo sát nhắc nhở và đồng hành 24/7',
        'Recap y khoa chi tiết sau mỗi buổi',
      ],
      isPopular: recommendedPlan === 'UNTANGLE_3S',
    },
    {
      id: 'TRANSFORM_5S',
      name: 'Gói Chuyển Hóa Căn Bản (5 Buổi)',
      sessions: '5 buổi tư vấn 1-1',
      price: '1.500.000đ',
      originalPrice: '2.500.000đ',
      tag: 'Tiết Kiệm 40%',
      tagColor: 'bg-teal-100 text-teal-800 border-teal-300',
      description: 'Trị liệu chuyên sâu cho tình trạng mất ngủ kéo dài, căng thẳng kinh niên và thiết lập lối sống cân bằng bền vững.',
      features: [
        '5 buổi tư vấn chuyên sâu cùng lộ trình trị liệu riêng',
        'Theo dõi biến thiên giấc ngủ & cảm xúc 30 ngày',
        'Ưu tiên đặt lịch hẹn linh hoạt với chuyên gia hàng đầu',
        'AI Hi đồng hành phân tích biểu đồ tiến bộ',
      ],
      isPopular: recommendedPlan === 'TRANSFORM_5S',
    },
    {
      id: 'TRANSFORM_10S',
      name: 'Gói Chuyển Hóa Toàn Diện (10 Buổi)',
      sessions: '10 buổi tư vấn 1-1',
      price: '2.800.000đ',
      originalPrice: '5.000.000đ',
      tag: 'Tiết Kiệm 44% • Chuyên Sâu',
      tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'Hành trình chữa lành toàn diện cho các vấn đề tâm lý sâu kín, khủng hoảng cảm xúc và xây dựng nội lực vững vàng.',
      features: [
        '10 buổi trị liệu 1-1 với bác sĩ / chuyên gia cao cấp',
        'Bảo lãnh chuyên gia cố định xuyên suốt hành trình',
        'Kế hoạch duy trì phòng ngừa tái phát dài hạn',
        'Đồng hành không giới hạn cùng Trợ lý AI Hi',
      ],
      isPopular: recommendedPlan === 'TRANSFORM_10S',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#f6fbf0] rounded-3xl border border-[#dfe4d9] shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 bg-[#ffffff] border-b border-[#dfe4d9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#181d16]">
                Gói Đồng Hành Điều Trị
              </h3>
              <p className="text-[11px] text-[#6f7a6c]">
                Lộ trình cá nhân hóa đồng hành cùng {userName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f5ea] hover:bg-[#dfe4d9] text-[#181d16] flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          <div className="p-3 bg-[#e0f5ea] rounded-2xl border border-[#67c76c]/30 flex items-start gap-2.5 text-[#005116]">
            <Heart className="w-4 h-4 text-[#006e22] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Mọi đề xuất gói điều trị xuất phát từ mong muốn hỗ trợ bạn duy trì sự ổn định lâu dài. Bạn hoàn toàn chủ động lựa chọn lộ trình phù hợp với ngân sách của mình mà không có bất kỳ áp lực nào.
            </p>
          </div>

          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-2xl bg-[#ffffff] border transition-all ${
                  plan.isPopular
                    ? 'border-[#006e22] ring-2 ring-[#006e22]/20 shadow-md'
                    : 'border-[#dfe4d9] hover:border-[#67c76c] shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${plan.tagColor}`}
                    >
                      {plan.tag}
                    </span>
                    <h4 className="text-xs font-bold text-[#181d16]">{plan.name}</h4>
                    <span className="text-[11px] text-[#6f7a6c] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {plan.sessions}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-[#006e22]">{plan.price}</span>
                    {plan.originalPrice && plan.price !== plan.originalPrice && (
                      <span className="block text-[10px] text-[#8e998b] line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-[#4a6551] mt-2 leading-relaxed">
                  {plan.description}
                </p>

                <div className="mt-2.5 pt-2.5 border-t border-[#dfe4d9]/70 space-y-1">
                  {plan.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-[#181d16]">
                      <Check className="w-3 h-3 text-[#006e22] shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playChime(528, 0.8);
                    onSelectPlan(plan.name);
                    onClose();
                  }}
                  className={`w-full mt-3 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 ${
                    plan.isPopular
                      ? 'bg-[#006e22] hover:bg-[#005116] text-white shadow-sm'
                      : 'bg-[#e0f5ea] hover:bg-[#006e22] hover:text-white text-[#006e22]'
                  }`}
                >
                  <span>Chọn Lộ Trình Này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#ffffff] rounded-2xl border border-[#dfe4d9] text-[10px] text-[#6f7a6c] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#006e22] shrink-0" />
            <span>Cam kết bảo mật y tế tuyệt đối theo chuẩn HIPAA & quy chuẩn y đức.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
