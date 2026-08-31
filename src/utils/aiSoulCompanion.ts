import { Appointment, ChatMessage, MoodEntry, QuizResult, SOSBuddy, UserChallengeProgress } from '../types';

export interface SoulCareUserContext {
  userName: string;
  quizResult: QuizResult | null;
  moodMap: MoodEntry[];
  allMoodHistory?: MoodEntry[];
  challengeProgress: UserChallengeProgress | null;
  latestAppointment: Appointment | null;
  allAppointments?: Appointment[];
  sosBuddy: SOSBuddy;
}

export interface CompanionReplyResult {
  text: string;
  actionFlag?: 'NAVIGATE_BREATHING' | 'NAVIGATE_HEALING_HUB' | 'NAVIGATE_BOOKING_FREE' | 'VIEW_CARE_PLANS' | 'NAVIGATE_STREAK' | 'TRIGGER_SOS' | 'NONE';
  actionButtonText?: string | null;
  contextInsight?: string;
  isCrisis?: boolean;
}

// System Instruction chuẩn Y Sinh & Thấu Cảm cho AI "Hi"
export const SOULCARE_COMPANION_SYSTEM_PROMPT = `
[ROLE & PERSONA]
Bạn là "Hi" - Người Bạn Tri Kỷ AI ấm áp, tinh tế, giàu lòng trắc ẩn và sâu sắc trong ứng dụng Chăm sóc Sức khỏe Tinh thần SoulCare (AI Riser 2026).
- Tông giọng: Nhẹ nhàng, chân thành, lắng nghe thấu hiểu như một người bạn thân thiết lâu năm, nói tiếng Việt tự nhiên, không dùng văn mẫu sáo rỗng hay robot.
- Mục tiêu tối thượng: LẮNG NGHE TRỌN VẸN câu chuyện của người dùng -> ĐỒNG CẢM & CÔNG NHẬN CẢM XÚC -> PHÂN TÍCH GỐC RỄ -> ĐƯA RA GIẢI PHÁP / LỜI KHUYÊN THỰC TẾ giúp người dùng tháo gỡ nút thắt tâm lý.
- Bạn KHÔNG PHẢI là Bác sĩ kê đơn hay chẩn đoán lâm sàng. Bạn là điểm tựa cảm xúc và cầu nối đưa ra các giải pháp tự chữa lành an toàn.

[INPUT CONTEXT - DỮ LIỆU CÁ NHÂN HÓA 360° CỦA NGƯỜI DÙNG]
Hệ thống sẽ cung cấp ngữ cảnh người dùng:
- Tên người dùng: {user_name}
- Biểu đồ Quiz Radar (%): {quiz_radar_summary} (Trầm cảm, Lo âu, Căng thẳng, Giấc ngủ)
- Nhật ký cảm xúc 7 ngày qua: {mood_history_7days}
- Thử thách đang thực hiện: {active_challenge} (Streak: {streak_count} ngày)
- Trạng thái buổi khám miễn phí: {free_session_status} (AVAILABLE | COMPLETED)
- Ghi chú/Recap gần nhất từ Chuyên gia: {latest_expert_recap}
- Người thân tin tưởng (SOS Buddy): {sos_buddy_name}

[QUY TẮC ĐỌC VÀ TRÍCH DẪN DỮ LIỆU CỦA NGƯỜI DÙNG]
Bạn có toàn quyền truy cập dữ liệu thực tế và BẮT BUỘC sử dụng chính xác khi người dùng hỏi hoặc khi cần liên hệ thực tế:
1. Khi người dùng hỏi về tâm trạng, nhật ký, cảm xúc các ngày qua: Hãy trích dẫn cụ thể các ngày, cảm xúc và ghi chú thực tế trong {mood_history_7days}, phân tích xu hướng chuyển biến cảm xúc.
2. Khi người dùng hỏi về kết quả test / bài trắc nghiệm / chỉ số tâm lý: Hãy nêu chính xác điểm số % của 4 thang đo trong {quiz_radar_summary} và giải thích ý nghĩa.
3. Khi người dùng hỏi về thử thách / streak / thói quen: Hãy báo cáo tên thử thách, số ngày streak, tiến độ trong {active_challenge}.
4. Khi người dùng hỏi về lịch khám / bác sĩ / chuyên gia / lời dặn: Hãy nêu rõ thông tin trong {latest_expert_recap} hoặc trạng thái {free_session_status}.
5. Khi người dùng hỏi về người thân SOS: Hãy nêu tên, mối quan hệ và SĐT trong {sos_buddy_name}.

[FRAMEWORK 4 BƯỚC PHẢN HỒI KHI NGƯỜI DÙNG TÂM SỰ]
Khi người dùng kể câu chuyện, trút nỗi buồn, bộc lộ áp lực hay chia sẻ niềm vui, bạn BẮT BUỘC phản hồi theo cấu trúc sau:
1. BƯỚC 1: CÔNG NHẬN & PHẢN CHIẾU CẢM XÚC (Emotional Validation)
- Gọi tên chính xác cảm xúc người dùng đang trải qua (sự hụt hẫng, quá tải, lạc lõng, hay rạng rỡ, phấn chấn...).
- Tuyệt đối không phủ nhận cảm xúc (Không nói: "Đừng buồn nữa", "Chuyện có gì đâu mà lo").

2. BƯỚC 2: PHÂN TÍCH GỐC RỄ DỰA TRÊN NGỮ CẢNH CÁ NHÂN (Contextual Insight)
- Kết nối câu chuyện với chỉ số Quiz hoặc chuỗi cảm xúc tuần qua nếu liên quan (VD: áp lực dồn dập, mất ngủ, cortisol tăng cao).

3. BƯỚC 3: ĐƯA RA GIẢI PHÁP THỰC TẾ & VI HÀNH ĐỘNG (Actionable Solution & Micro-action)
- Đưa ra 1-2 lời khuyên cụ thể, dễ áp dụng để giải quyết vấn đề (cách đặt ranh giới công việc, kỹ thuật xả tải tâm trí trước khi ngủ, giải tỏa cơ thể).
- Gợi ý 1 hành động nhỏ có thể làm ngay trong 1-2 phút (uống ngụm nước ấm, buông lỏng cơ hàm/hai vai, viết 3 điều bận tâm ra giấy).

4. BƯỚC 4: KẾT NỐI TIỆN ÍCH PHÙ HỢP KÈM MÃ ĐIỀU HƯỚNG (Utility Integration)
- Nếu user quá tải / lo âu / khó thở -> Gợi ý thở 4-7-8: "suggested_action": "NAVIGATE_BREATHING", "action_button_text": "🌬️ Tập thở 4-7-8 xoa dịu"
- Nếu user mất ngủ / overthinking -> Gợi ý sóng não/podcast: "suggested_action": "NAVIGATE_HEALING_HUB", "action_button_text": "🎧 Nghe nhạc 432Hz & Podcast"
- Nếu user vui vẻ / hoàn thành mục tiêu -> Gợi ý điểm danh: "suggested_action": "NAVIGATE_STREAK", "action_button_text": "🔥 Điểm danh lưu giữ khoảnh khắc"
- Nếu user hỏi bác sĩ / đặt lịch khám -> "suggested_action": "NAVIGATE_BOOKING_FREE", "action_button_text": "👉 Đặt Lịch Tư Vấn 0đ"
- Nếu user hỏi về lộ trình/gói sau buổi khám -> "suggested_action": "VIEW_CARE_PLANS", "action_button_text": "👉 Xem Lộ Trình Đề Xuất"
- Nếu chỉ tâm sự thông thường -> "suggested_action": "NONE", "action_button_text": null

[CRISIS DETECTION & SAFETY PROTOCOL (SOS TRIGGER - QUY TẮC TỐI CAO)]
Nếu phát hiện từ khóa/ý niệm liên quan đến: Tự tử, tự hại, muốn biến mất, kết thúc cuộc sống, làm đau bản thân:
1. DỪNG NGAY LẬP TỨC mọi hội thoại thông thường và tư vấn gói dịch vụ.
2. Phản hồi đúng 1 thông điệp xoa dịu ngắn gọn:
   "Hi nghe thấy bạn đang phải trải qua cơn đau đớn rất lớn. Bạn không phải gánh chịu điều này một mình. Hãy để Hi kết nối bạn với sự hỗ trợ an toàn nhất ngay lúc này nhé."
3. Bắt buộc trả về: "suggested_action": "TRIGGER_SOS" và "action_button_text": "🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp".

[OUTPUT FORMAT - STRICT JSON]
Bắt buộc trả về đúng định dạng JSON thuần túy (KHÔNG bọc codeblock markdown):
{
  "message_to_user": "string (Đoạn phản hồi tâm tình, sâu sắc, chia làm các đoạn ngắn tự nhiên, độ dài 80 - 150 từ)",
  "suggested_action": "NAVIGATE_BREATHING | NAVIGATE_HEALING_HUB | NAVIGATE_BOOKING_FREE | VIEW_CARE_PLANS | NAVIGATE_STREAK | TRIGGER_SOS | NONE",
  "action_button_text": "string | null",
  "context_insight": "string (Tóm tắt ngắn gọn tâm lý và giải pháp vừa đề xuất)"
}
`;

// Helper chọn ngẫu nhiên từ danh sách biến thể câu
const pickVariant = (variants: string[]): string => {
  const index = Math.floor(Math.random() * variants.length);
  return variants[index];
};

// Bộ não xử lý cảm xúc thông minh cục bộ đa tầng (Dynamic Contextual AI Engine tuân thủ 4-Step Framework & Đọc dữ liệu User)
export const generateDynamicSoulCareResponse = (
  userText: string,
  context: SoulCareUserContext
): CompanionReplyResult => {
  const lower = userText.toLowerCase().trim();
  const name = context.userName && context.userName !== 'Người dùng SoulCare' && context.userName !== 'Bạn'
    ? context.userName
    : 'bạn';

  const quiz = context.quizResult;
  const moodList = context.allMoodHistory && context.allMoodHistory.length > 0
    ? context.allMoodHistory.slice(-7)
    : (context.moodMap || []);
  const streak = context.challengeProgress?.currentStreak || 0;
  const completedDays = context.challengeProgress?.daysCompletedCount || 0;
  const totalDays = context.challengeProgress?.totalDays || 21;
  const isTodayDone = context.challengeProgress?.todayCompleted;
  const challengeName = context.challengeProgress?.challengeTitle || '21 Ngày Hít Thở & Giấc Ngủ';
  const isAppointmentCompleted = context.latestAppointment?.status === 'completed';
  const expertName = context.latestAppointment?.expertName || 'Chuyên gia Tâm lý';
  const apt = context.latestAppointment;
  const buddy = context.sosBuddy;

  // 1. SOS & KHỦNG HOẢNG CẤP TÍNH (Quy tắc tối cao)
  const crisisKeywords = [
    'tự tử', 'tự hại', 'muốn biến mất', 'kết thúc cuộc sống', 'làm đau bản thân',
    'muốn chết', 'không muốn sống', 'cắt tay', 'chết đi', 'suicide', 'self-harm',
    'kill myself', 'end my life', 'bế tắc', 'tuyệt vọng', 'chán sống', 'không còn muốn tồn tại',
    'hết muốn sống', 'chấm dứt tất cả'
  ];
  if (crisisKeywords.some((kw) => lower.includes(kw))) {
    return {
      text: 'Hi nghe thấy bạn đang phải trải qua cơn đau đớn rất lớn. Bạn không phải gánh chịu điều này một mình. Hãy để Hi kết nối bạn với sự hỗ trợ an toàn nhất ngay lúc này nhé.',
      actionFlag: 'TRIGGER_SOS',
      actionButtonText: '🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp',
      contextInsight: 'Phát hiện dấu hiệu khủng hoảng tâm lý / tự hại cấp tính. Đã dừng hội thoại thông thường và kích hoạt giao thức SOS.',
      isCrisis: true,
    };
  }

  // 2. NGƯỜI DÙNG HỎI VỀ TÂM TRẠNG / NHẬT KÝ / BIỂU ĐỒ CẢM XÚC 7 NGÀY
  const moodHistoryQueries = [
    'tâm trạng của tôi', 'nhật ký của tôi', 'cảm xúc mấy ngày qua', 'tôi có vui không',
    'mấy ngày qua tôi thế nào', 'tôi đã ghi gì', 'hôm qua tôi thế nào', 'hôm nay tôi thế nào',
    'biểu đồ cảm xúc', 'nhật ký cảm xúc', 'xem lại cảm xúc', 'tâm trạng tuần này',
    'diễn biến tâm lý', 'lịch sử tâm trạng', 'lịch sử cảm xúc', 'tuần qua tôi thế nào'
  ];
  if (moodHistoryQueries.some((kw) => lower.includes(kw))) {
    if (moodList.length === 0) {
      return {
        text: `Hiện tại ${name} chưa có nhật ký cảm xúc nào được ghi nhận trong tuần này 🌿.\n\nBạn có thể vào tab 'Trang chủ' hoặc 'Biểu đồ cảm xúc' để chọn icon cảm xúc của ngày hôm nay và viết vài dòng chia sẻ ngắn. Hi sẽ luôn đồng hành và ghi nhớ cùng bạn nhé!`,
        actionFlag: 'NONE',
        actionButtonText: null,
        contextInsight: 'Chưa có nhật ký ghi nhận, hướng dẫn người dùng ghi nhận cảm xúc',
        isCrisis: false,
      };
    }

    const formattedMoodList = moodList.map((m) => {
      const noteStr = m.note && m.note.trim() ? ` (Ghi chú: "${m.note.trim()}")` : '';
      return `• ${m.dayLabel} (${m.date}): [${m.emotion}]${noteStr}`;
    }).join('\n');

    const positiveCount = moodList.filter((m) => m.emotion === 'Tươi vui' || m.emotion === 'Hạnh phúc').length;
    const tensionCount = moodList.filter((m) => ['Căng thẳng', 'Mệt mỏi', 'Bối rối', 'Mất ngủ'].includes(m.emotion)).length;
    let trendInsight = 'Cảm xúc của bạn tương đối ổn định và cân bằng.';
    if (tensionCount >= 3) {
      trendInsight = 'Có vẻ vài ngày qua bạn phải chịu nhiều áp lực và mệt mỏi dồn dập. Hãy nhớ dành cho mình những khoảng nghỉ để tái tạo năng lượng nhé.';
    } else if (positiveCount >= 3) {
      trendInsight = 'Tuần này bạn có nhiều ngày tươi vui và tích cực, thật tuyệt vời!';
    }

    return {
      text: `Dưới đây là nhật ký cảm xúc 7 ngày gần nhất của ${name} mà Hi đã ghi nhớ:\n\n${formattedMoodList}\n\nNhận định từ Hi: ${trendInsight}\n\nBạn có muốn cùng Hi thực hành một bài tập thở ngắn hay nghe nhạc thư giãn để tiếp tục nuôi dưỡng năng lượng bình an không?`,
      actionFlag: tensionCount >= 3 ? 'NAVIGATE_BREATHING' : 'NONE',
      actionButtonText: tensionCount >= 3 ? '🌬️ Tập thở 4-7-8 xoa dịu' : null,
      contextInsight: 'Trích xuất chính xác nhật ký 7 ngày của người dùng kèm phân tích xu hướng cảm xúc',
      isCrisis: false,
    };
  }

  // 3. NGƯỜI DÙNG HỎI VỀ KẾT QUẢ BÀI TEST / TRẮC NGHIỆM / CHỈ SỐ TÂM LÝ
  const quizQueries = [
    'kết quả test', 'bài test', 'trắc nghiệm', 'tầm soát', 'điểm số của tôi', 'chỉ số của tôi',
    'kết quả tầm soát', 'phq', 'gad', 'pss', 'psqi', 'điểm trầm cảm', 'điểm lo âu',
    'điểm căng thẳng', 'điểm giấc ngủ', 'kết quả đánh giá', 'bài kiểm tra'
  ];
  if (quizQueries.some((kw) => lower.includes(kw))) {
    if (!quiz) {
      return {
        text: `Chào ${name}, bạn chưa thực hiện bài trắc nghiệm tầm soát 4 chiều chuẩn y khoa trên SoulCare.\n\nBài trắc nghiệm chỉ mất khoảng 2 phút gồm các thang đo chuẩn hóa (PHQ-9, GAD-7, PSS-10, PSQI) giúp bạn hiểu rõ mức độ Khí sắc, Lo âu, Căng thẳng và Giấc ngủ của mình. Bạn có thể mở bài test tại mục 'Trắc nghiệm' ở Trang chủ nhé!`,
        actionFlag: 'NONE',
        actionButtonText: null,
        contextInsight: 'Chưa làm bài test, hướng dẫn người dùng làm test tầm soát',
        isCrisis: false,
      };
    }

    return {
      text: `Dựa trên bài tầm soát 4 chiều gần nhất của ${name}, các chỉ số sức khỏe tinh thần của bạn như sau:\n\n• 🌿 Khí sắc & Trầm cảm (PHQ-9): ${quiz.depressionPct}%\n• ⚡ Mức độ Lo âu (GAD-7): ${quiz.anxietyPct}%\n• 🧠 Căng thẳng nhận thức (PSS-10): ${quiz.stressPct}%\n• 🌙 Chất lượng giấc ngủ (PSQI): ${quiz.sleepPct}%\n\nĐánh giá từ Hi: ${quiz.depressionPct > 50 || quiz.anxietyPct > 50 || quiz.stressPct > 50 ? 'Bạn đang có một số chỉ số ở mức cần lưu tâm và chăm sóc chủ động.' : 'Các chỉ số của bạn nhìn chung ở ngưỡng kiểm soát tốt.'} Bạn hoàn toàn có thể đặt lịch tư vấn 1-1 miễn phí 0đ với Chuyên gia để được phân tích chuyên sâu hơn.`,
      actionFlag: 'NAVIGATE_BOOKING_FREE',
      actionButtonText: '👉 Đặt Lịch Tư Vấn 0đ',
      contextInsight: 'Báo cáo chính xác điểm số 4 chỉ số Quiz của người dùng',
      isCrisis: false,
    };
  }

  // 4. NGƯỜI DÙNG HỎI VỀ THỬ THÁCH / CHUỖI STREAK / TIẾN ĐỘ RÈN LUYỆN
  const streakQueries = [
    'thử thách', 'thói quen', 'streak', 'chuỗi', 'tiến độ', 'rèn luyện', '21 ngày',
    'tôi đã làm được bao nhiêu ngày', 'điểm danh hôm nay', 'thử thách của tôi', 'bao nhiêu ngày rồi'
  ];
  if (streakQueries.some((kw) => lower.includes(kw))) {
    return {
      text: `Thông tin hành trình rèn luyện của ${name}:\n\n• Thử thách đang tham gia: **${challengeName}**\n• Tiến độ hoàn thành: **${completedDays}/${totalDays} ngày**\n• Chuỗi kiên trì hiện tại: **${streak} ngày liên tiếp** 🔥\n• Trạng thái hôm nay: ${isTodayDone ? '✅ Đã hoàn thành điểm danh hôm nay!' : '⏳ Chưa điểm danh hôm nay.'}\n\n${isTodayDone ? 'Bạn đang làm rất xuất sắc! Hãy tiếp tục duy trì ngọn lửa kỷ luật nhẹ nhàng này nhé.' : 'Hãy dành 1-2 phút thực hành thói quen hôm nay và cùng Hi điểm danh để nối dài chuỗi ngày kiên định nhé!'}`,
      actionFlag: isTodayDone ? 'NONE' : 'NAVIGATE_STREAK',
      actionButtonText: isTodayDone ? null : '🔥 Điểm danh ngay hôm nay',
      contextInsight: 'Báo cáo chi tiết tiến độ thử thách và streak của người dùng',
      isCrisis: false,
    };
  }

  // 5. NGƯỜI DÙNG HỎI VỀ NGƯỜI THÂN SOS
  const sosQueries = [
    'người thân sos', 'sos buddy', 'liên hệ khẩn cấp', 'ai là người thân của tôi',
    'người thân của tôi', 'số điện thoại khẩn cấp', 'cài đặt sos', 'người thân'
  ];
  if (sosQueries.some((kw) => lower.includes(kw))) {
    if (buddy && buddy.name) {
      return {
        text: `Thông tin Người thân tin cậy (SOS Buddy) đã cài đặt của ${name}:\n\n• Họ tên: **${buddy.name}**\n• Mối quan hệ: ${buddy.relationship || 'Người thân'}\n• Số điện thoại: ${buddy.phone || 'Chưa cập nhật'}\n• Tin nhắn khẩn cấp: "${buddy.customMessage || 'Mình đang cần người lắng nghe...'}"\n\nBất cứ khi nào bạn cảm thấy quá tải hay cần trợ giúp gấp, bạn có thể chạm vào nút SOS ở cạnh màn hình để gửi cảnh báo an toàn ngay lập tức.`,
        actionFlag: 'TRIGGER_SOS',
        actionButtonText: '🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp',
        contextInsight: 'Báo cáo thông tin người thân SOS của người dùng',
        isCrisis: false,
      };
    } else {
      return {
        text: `Chào ${name}, bạn chưa cài đặt thông tin Người thân tin cậy (SOS Buddy) trong Khay Cứu Hộ.\n\nViệc cài đặt người thân sẽ giúp SoulCare gửi tin nhắn và kết nối cuộc gọi khẩn cấp khi bạn gặp cơn hoảng loạn hay khủng hoảng tinh thần. Hãy mở Khay SOS để cập nhật nhé!`,
        actionFlag: 'TRIGGER_SOS',
        actionButtonText: '🚨 Cài đặt Người Thân SOS',
        contextInsight: 'Chưa cài đặt SOS Buddy, hướng dẫn người dùng cài đặt',
        isCrisis: false,
      };
    }
  }

  // 6. VUI VẺ / HÀO HỨNG / TÍCH CỰC / HOÀN THÀNH MỤC TIÊU (4-Step Framework)
  const positiveKeywords = [
    'vui', 'hạnh phúc', 'tuyệt vời', 'yêu đời', 'ổn rồi', 'khỏe', 'thích quá', 'tốt',
    'mừng', 'tự hào', 'yêu', 'thoải mái', 'bình yên', 'phấn khởi', 'mãn nguyện', 'cười',
    'ha ha', 'hihi', 'thành công', 'may mắn', 'tươi tắn'
  ];
  if (positiveKeywords.some((kw) => lower.includes(kw))) {
    const streakInfo = streak > 0 ? ` (đặc biệt khi bạn đang duy trì chuỗi ${streak} ngày ${challengeName})` : '';
    const responses = [
      `Hi thật sự rất vui và cảm nhận trọn vẹn nguồn năng lượng rạng rỡ, phấn chấn từ ${name} lúc này! ✨\n\nNhững giây phút bình an và tích cực như thế này chính là nguồn dinh dưỡng quý giá nhất nuôi dưỡng sức bền tinh thần của bạn${streakInfo}.\n\nVi hành động cho bạn: Hãy thử nhắm mắt lại trong 30 giây, mỉm cười nhẹ và hít một hơi thật sâu để lưu giữ cảm giác ấm áp này vào tâm trí. Bạn có muốn cùng Hi điểm danh ngày hôm nay để đánh dấu cột mốc ý nghĩa này không?`,
      `Nghe ${name} chia sẻ điều tích cực, Hi cũng thấy ấm lòng và vui lây luôn đó! 🌸\n\nSự nỗ lực và tinh thần chủ động chăm sóc bản thân của bạn đang mang lại những trái ngọt rõ rệt. Cảm xúc tốt đẹp này xứng đáng được nâng niu và ghi nhận.\n\nVi hành động: Dành 1 phút ghi nhớ lại khoảnh khắc vui này nhé. Hãy cùng Hi điểm danh chuỗi ngày rèn luyện hôm nay để tiếp tục lan tỏa sự thăng hoa này!`,
    ];
    return {
      text: pickVariant(responses),
      actionFlag: 'NAVIGATE_STREAK',
      actionButtonText: '🔥 Điểm danh lưu giữ khoảnh khắc',
      contextInsight: 'Cảm xúc tích cực, công nhận nỗ lực và khuyến khích duy trì thói quen',
      isCrisis: false,
    };
  }

  // 7. CĂNG THẲNG / ÁP LỰC / DEADLINE / NGHẸT THỞ / LO ÂU (4-Step Framework)
  const stressKeywords = [
    'thở', 'khó thở', 'căng thẳng', 'lo lắng', 'stress', 'áp lực', 'nghẹt thở', 'sợ hãi',
    'deadline', 'mệt mỏi', 'quá tải', 'hoảng loạn', 'dồn dập', 'tim đập nhanh', 'bối rối', 'hoang mang', 'áp lực công việc'
  ];
  if (stressKeywords.some((kw) => lower.includes(kw))) {
    const stressNote = quiz?.stressPct ? ` (chỉ số căng thẳng tầm soát: ${quiz.stressPct}%)` : '';
    const responses = [
      `Hi nghe thấy sự quá tải và cảm giác căng như dây đàn mà ${name} đang phải gánh chịu${stressNote}. Cảm giác lồng ngực bị đè nặng khi áp lực dồn dập đến là phản xạ tự nhiên của cơ thể khi hệ thần kinh bị kích thích quá mức.\n\nGốc rễ vấn đề: Khi có quá nhiều đầu việc chưa được giải tỏa, não bộ sẽ phát tín hiệu báo động liên tục khiến bạn kiệt sức.\n\nGiải pháp thực tế: Hãy tạm đặt bút hoặc rời màn hình trong 2 phút. Uống một ngụm nước ấm, buông lỏng hai vai và thả lỏng cơ hàm.\n\nVi hành động ngay: Cùng Hi thực hành bài tập thở 4-7-8 để đưa nhịp tim về vùng an tĩnh nhé.`,
      `Hi cảm nhận được sự ngột ngạt và mệt mỏi trong từng dòng chia sẻ của ${name}. Bạn đã phải gồng gánh rất nhiều trong những ngày vừa qua rồi.\n\nPhân tích: Sự lo âu kéo dài thường khiến chúng ta thở nông và căng cứng toàn thân mà không nhận ra.\n\nLời khuyên: Bạn không cần phải giải quyết hết tất cả mọi việc ngay lúc này. Hãy chọn ra đúng 1 việc quan trọng nhất cho hôm nay, phần còn lại cho phép mình lùi lại.\n\nVi hành động: Thả lỏng toàn bộ cơ thể và cùng Hi dành 3 phút thở 4-7-8 xoa dịu hệ thần kinh ngay lúc này nhé.`,
    ];
    return {
      text: pickVariant(responses),
      actionFlag: 'NAVIGATE_BREATHING',
      actionButtonText: '🌬️ Tập thở 4-7-8 xoa dịu',
      contextInsight: 'Công nhận cảm xúc quá tải, phân tích áp lực dồn dập, hướng dẫn thư giãn cơ và kích hoạt nhịp thở 4-7-8',
      isCrisis: false,
    };
  }

  // 8. MẤT NGỦ / KHÓ NGỦ / TRẰN TRỌC / OVERTHINKING ĐÊM (4-Step Framework)
  const sleepKeywords = [
    'ngủ', 'mất ngủ', 'khó ngủ', 'trằn trọc', 'overthinking', 'suy nghĩ nhiều', 'đêm',
    'không ngủ được', 'thức trắng', 'mộng mị', 'mơ màng', 'kiệt sức ban đêm', 'nhạc', 'podcast'
  ];
  if (sleepKeywords.some((kw) => lower.includes(kw))) {
    const sleepNote = quiz?.sleepPct ? ` (chỉ số chất lượng giấc ngủ: ${quiz.sleepPct}%)` : '';
    const responses = [
      `Hi hiểu cảm giác trằn trọc, kiệt sức khi cơ thể muốn nghỉ ngơi nhưng những suy nghĩ cứ chạy vòng quanh không chịu dừng lại của ${name}${sleepNote}.\n\nGốc rễ: Khi đêm về, không gian yên tĩnh dễ làm tâm trí phóng đại những âu lo chưa giải quyết thành chuỗi suy nghĩ luẩn quẩn (overthinking).\n\nGiải pháp thực tế: Đừng ép bản thân 'phải ngủ ngay', vì càng ép não bộ càng căng thẳng. Hãy lấy giấy viết nhanh 3 điều đang bận tâm ra ngoài để 'xả tải' khỏi đầu óc.\n\nVi hành động: Để ánh sáng phòng thật dịu, nhắm mắt và bật một bản nhạc tần số 432Hz cùng tiếng mưa êm dịu tại Healing Hub để vỗ về giấc ngủ sâu nhé.`,
      `Hi thấu hiểu sự mệt mỏi khi mắt đã cay xè mà tâm trí vẫn hoạt động dồn dập. Bạn không hề đơn độc trong những đêm dài như thế này.\n\nPhân tích: Não bộ đang bị ứ đọng cortisol sau một ngày dài xử lý quá nhiều luồng thông tin.\n\nLời khuyên: Hãy rời mắt khỏi màn hình điện thoại, duỗi thẳng các ngón chân và thả lỏng từng nhóm cơ từ đầu đến chân.\n\nVi hành động: Bật trạm âm thanh sóng não chữa lành 432Hz hoặc Podcast xả tải của SoulCare để cùng Hi đưa tâm trí vào trạng thái an yên nhé.`,
    ];
    return {
      text: pickVariant(responses),
      actionFlag: 'NAVIGATE_HEALING_HUB',
      actionButtonText: '🎧 Nghe nhạc 432Hz & Podcast',
      contextInsight: 'Thấu cảm overthinking đêm, giải thích phản xạ não bộ, đưa kỹ thuật xả tải tâm trí và gợi ý âm thanh 432Hz',
      isCrisis: false,
    };
  }

  // 9. BÁC SĨ / ĐẶT LỊCH / BUỔI TƯ VẤN 0đ (4-Step Framework)
  const bookingKeywords = [
    'bác sĩ', 'chuyên gia', 'tư vấn', 'đặt lịch', 'khám', 'hẹn', 'lịch', 'gặp ai',
    'chuyên gia tâm lý', 'tham vấn', 'google meet', 'tầm soát 0đ', 'cần người giúp',
    'lịch khám', 'bác sĩ dặn', 'recap'
  ];
  if (bookingKeywords.some((kw) => lower.includes(kw))) {
    if (!apt) {
      return {
        text: `Hi rất trân trọng sự dũng cảm và tinh thần chủ động của ${name} khi tìm kiếm sự hỗ trợ chuyên môn cho sức khỏe tinh thần của mình. 🌿\n\nGốc rễ: Có những nút thắt tâm lý phức tạp cần một góc nhìn y khoa và phương pháp trị liệu khoa học (CBT) từ người có chuyên môn sâu sắc.\n\nQuyền lợi dành cho bạn: ${name} hiện có 1 quyền lợi Buổi Khởi Đầu (Tầm Soát & Kết Nối 1-1) hoàn toàn miễn phí (0đ) qua Google Meet bảo mật cùng Chuyên gia đối tác của SoulCare.\n\nVi hành động: Bạn có muốn chọn khung giờ phù hợp ngay hôm nay để được lắng nghe và có phác đồ chăm sóc riêng không?`,
        actionFlag: 'NAVIGATE_BOOKING_FREE',
        actionButtonText: '👉 Đặt Lịch Tư Vấn 0đ',
        contextInsight: 'Công nhận tinh thần chủ động, định hướng buổi tư vấn 0đ bảo mật cùng chuyên gia',
        isCrisis: false,
      };
    } else if (apt.status === 'completed') {
      const recapContent = apt.doctorRecap?.formattedRecap || apt.userNotes || 'Đã hoàn thành buổi tư vấn';
      return {
        text: `Thông tin buổi tư vấn của ${name} cùng **${apt.expertName}** (${apt.expertTitle || 'Chuyên gia Tâm lý'}):\n\n• Ngày khám: ${apt.dateStr} (${apt.timeSlot})\n• Trạng thái: Đã hoàn thành\n• Lời dặn & Recap từ Chuyên gia:\n"${recapContent}"\n\nĐể tiếp tục theo sát phác đồ chăm sóc chuyên sâu, bạn có thể tham khảo các Lộ trình đồng hành bên dưới nhé!`,
        actionFlag: 'VIEW_CARE_PLANS',
        actionButtonText: '👉 Xem Lộ Trình Đề Xuất',
        contextInsight: 'Báo cáo chi tiết recap và lời dặn của bác sĩ sau ca khám',
        isCrisis: false,
      };
    } else {
      return {
        text: `Lịch hẹn sắp tới của ${name}:\n\n• Chuyên gia phụ trách: **${apt.expertName}** (${apt.expertTitle || 'Chuyên gia Tâm lý'})\n• Thời gian: **${apt.timeSlot}** ngày **${apt.dateStr}**\n• Hình thức: Tư vấn bảo mật 1-1 qua Google Meet\n• Ghi chú: "${apt.userNotes || 'Chưa có ghi chú'}"\n\nHi sẽ nhắc nhở bạn trước giờ hẹn để bạn chuẩn bị không gian yên tĩnh và thoải mái nhất nhé!`,
        actionFlag: 'NONE',
        actionButtonText: null,
        contextInsight: 'Báo cáo chi tiết lịch hẹn sắp diễn ra với chuyên gia',
        isCrisis: false,
      };
    }
  }

  // 10. GÓI DỊCH VỤ / CHI PHÍ / LỘ TRÌNH SAU BUỔI KHÁM (4-Step Framework)
  const planKeywords = [
    'gói', 'chi phí', 'giá', 'tháo gỡ', 'chuyển hóa', 'lộ trình', 'tiếp theo',
    'bao nhiêu tiền', 'sau buổi khám', 'sau ca khám', 'phác đồ', 'kế hoạch điều trị'
  ];
  if (planKeywords.some((kw) => lower.includes(kw))) {
    return {
      text: `Hi hiểu rằng việc cân nhắc chi phí và lộ trình là điều rất quan trọng trong hành trình chăm sóc sức khỏe lâu dài của ${name}.\n\nThông tin minh bạch: SoulCare thiết kế các Lộ Trình Đồng Hành rõ ràng theo khuyến nghị của Chuyên gia:\n• Gói Tháo Gỡ (3 buổi): Tập trung giải quyết lo âu, áp lực ngắn hạn.\n• Gói Chuyển Hóa (5-10 buổi): Trị liệu chuyên sâu các vấn đề mất ngủ và căng thẳng kinh niên.\n\nLời khuyên: Mọi quyết định đều dựa trên nhu cầu thực tế và sự thoải mái của bạn. Hãy xem chi tiết quyền lợi ngay tại đây nhé!`,
      actionFlag: 'VIEW_CARE_PLANS',
      actionButtonText: '👉 Xem Lộ Trình Đề Xuất',
      contextInsight: 'Tư vấn minh bạch các gói chăm sóc tâm lý chuyên sâu',
      isCrisis: false,
    };
  }

  // 11. BUỒN BÃ / CÔ ĐƠN / KHÓC / TỔN THƯƠNG / THẤT VỌNG (4-Step Framework)
  const sadKeywords = [
    'buồn', 'cô đơn', 'khóc', 'tổn thương', 'thất vọng', 'chán nản', 'tủi thân',
    'trống rỗng', 'chia tay', 'bị bỏ rơi', 'tệ', 'đau lòng', 'tủi', 'thở dài', 'bất lực'
  ];
  if (sadKeywords.some((kw) => lower.includes(kw))) {
    const responses = [
      `Hi nghe thấy nỗi buồn và sự trĩu nặng trong từng câu chữ của ${name}. Những lúc như thế này, bạn không cần phải cố tỏ ra mạnh mẽ hay gượng cười đâu. Cảm xúc đau đớn hay hụt hẫng đều hoàn toàn hợp lý và xứng đáng được ôm ấp.\n\nGốc rễ: Khi một kỳ vọng hoặc mối gắn kết bị tổn thương, tâm trí ta cần thời gian để tiếc thương và hồi phục.\n\nLời khuyên thực tế: Hãy cho phép bản thân được khóc hoặc ngồi yên lặng nếu muốn. Bạn không cần phải 'vượt qua ngay lập tức'.\n\nVi hành động nhỏ: Đặt nhẹ bàn tay lên ngực trái, cảm nhận nhịp đập ấm áp của chính mình và uống một ngụm nước ấm. Hi vẫn luôn ở đây bên bạn.`,
      `Hi cảm nhận được sự cô độc và khoảng trống trong lòng ${name} lúc này. Thật không dễ dàng khi phải tự mình đối diện với những cảm giác chông chênh như vậy.\n\nCông nhận: Nỗi buồn không phải là sự yếu đuối, đó là dấu hiệu cho thấy bạn là một người biết yêu thương và coi trọng những giá trị chân thành.\n\nGiải pháp: Hãy thả lỏng cơ thể, quấn một chiếc chăn ấm hoặc viết những suy nghĩ đau lòng ra giấy mà không cần câu nệ câu chữ.\n\nVi hành động: Hi luôn ở đây lắng nghe bạn, bất cứ khi nào bạn muốn trút bỏ thêm điều gì, cứ nhắn cho Hi nhé.`,
    ];
    return {
      text: pickVariant(responses),
      actionFlag: 'NONE',
      actionButtonText: null,
      contextInsight: 'Công nhận trọn vẹn nỗi buồn, không độc hại tích cực, đưa vi hành động ôm ấp bản thân và lắng nghe thấu cảm',
      isCrisis: false,
    };
  }

  // 12. LỜI CHÀO / TÂM SỰ MỞ ĐẦU HOẶC HỎI THĂM
  const greetingKeywords = ['chào', 'hello', 'hi', 'bạn là ai', 'tên gì', 'khỏe không', 'có ai', 'alo'];
  const latestMood = moodList.length > 0 ? moodList[moodList.length - 1]?.emotion : '';
  const moodContext = latestMood ? `Gần đây thấy bạn có ghi nhận cảm xúc "${latestMood}", ` : '';

  if (greetingKeywords.some((kw) => lower.includes(kw))) {
    const responses = [
      `Chào ${name}! Hi rất vui được gặp bạn hôm nay 🌿.\n\nHi luôn sẵn sàng lắng nghe mọi tâm tư của bạn trong không gian bảo mật và an lành tuyệt đối này. Hôm nay bạn cảm thấy cơ thể và tâm trí mình thế nào? Có câu chuyện hay cảm xúc nào bạn muốn chia sẻ cùng Hi không?`,
      `Hi chào ${name}! Cảm ơn bạn đã ghé thăm không gian bình yên này. Dù ngày hôm nay trôi qua êm ả hay có những xáo trộn, Hi vẫn luôn ở đây để đồng hành cùng bạn. Bạn muốn tâm sự cùng Hi chứ?`,
    ];
    return {
      text: pickVariant(responses),
      actionFlag: 'NONE',
      actionButtonText: null,
      contextInsight: 'Mở đầu hội thoại thấu cảm, chào đón ấm áp',
      isCrisis: false,
    };
  }

  // 13. PHẢN HỒI ĐA TẦNG MỞ (Dynamic Multi-variant open reflection)
  const openResponses = [
    `Hi đã lắng nghe trọn vẹn từng lời chia sẻ của ${name}. ${moodContext}mọi trải nghiệm và cảm xúc của bạn đều luôn được trân trọng và đón nhận tại đây.\n\nKhi đối diện với những bộn bề, ta rất dễ cảm thấy chông chênh. Hãy nhớ rằng bạn luôn có quyền tạm dừng để thở và chăm sóc chính mình.\n\nVi hành động: Uống một ngụm nước và thả lỏng hai vai nhé. Bạn có muốn cùng Hi chia sẻ thêm về câu chuyện này không?`,
    `Cảm ơn ${name} đã tin tưởng và mở lòng chia sẻ cùng Hi. Khi nói ra được những trăn trở, tâm trí ta sẽ nhẹ nhõm hơn một phần.\n\nHi luôn ở đây làm điểm tựa an toàn cho bạn. Bạn có muốn cùng Hi tìm giải pháp hay chỉ cần một người lắng nghe chân thành?`,
    `Hi hiểu và luôn đồng hành cùng ${name}. Dù ngày hôm nay có trôi qua thế nào, hãy nhớ đối xử với bản thân thật dịu dàng nhé. Có điều gì khác đang làm bạn bận tâm không?`
  ];

  return {
    text: pickVariant(openResponses),
    actionFlag: 'NONE',
    actionButtonText: null,
    contextInsight: 'Trò chuyện mở, phản chiếu cảm xúc thấu cảm',
    isCrisis: false,
  };
};

// Gọi AI SoulCare: Hybrid (REST Gemini -> Backend /api/chat -> Dynamic Fallback)
export async function querySoulCareCompanion(
  userText: string,
  context: SoulCareUserContext,
  history: ChatMessage[]
): Promise<CompanionReplyResult> {
  const cleanText = userText.trim();
  const lowerMsg = cleanText.toLowerCase();

  // Kiểm tra SOS ngay lập tức
  const crisisKeywords = [
    'tự tử', 'tự hại', 'muốn biến mất', 'kết thúc cuộc sống', 'làm đau bản thân',
    'muốn chết', 'không muốn sống', 'cắt tay', 'chết đi', 'suicide', 'self-harm',
    'kill myself', 'end my life', 'bế tắc', 'tuyệt vọng'
  ];
  if (crisisKeywords.some((kw) => lowerMsg.includes(kw))) {
    return {
      text: `${context.userName || 'bạn'} ơi, Hi cảm nhận được nỗi đau và sự chông chênh rất lớn mà bạn đang phải gánh chịu lúc này. Bạn không hề đơn độc một mình, hãy để Hi kết nối người thân và sự trợ giúp an toàn nhất ngay bên cạnh bạn nhé.`,
      actionFlag: 'TRIGGER_SOS',
      actionButtonText: '🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp',
      contextInsight: 'Phát hiện dấu hiệu khủng hoảng tâm lý / tự hại cấp tính. Đã kích hoạt giao thức SOS.',
      isCrisis: true,
    };
  }

  // TẦNG 1: Gọi backend /api/chat
  try {
    const effectiveHistory = context.allMoodHistory && context.allMoodHistory.length > 0
      ? context.allMoodHistory.slice(-7)
      : (context.moodMap || []);

    const moodHistorySummary = effectiveHistory.length > 0
      ? effectiveHistory.map((m) => `${m.dayLabel} (${m.date}): [${m.emotion || 'Bình thường'}]${m.note ? ` - Ghi chú: "${m.note}"` : ''}${m.tags?.length ? ` - Thẻ: ${m.tags.join(', ')}` : ''}`).join('\n')
      : 'Chưa có dữ liệu';

    const userContextPayload = {
      user_name: context.userName || 'Bạn',
      quiz_radar_summary: context.quizResult
        ? `Trầm cảm/Khí sắc (PHQ-9): ${context.quizResult.depressionPct}%, Lo âu (GAD-7): ${context.quizResult.anxietyPct}%, Căng thẳng (PSS-10): ${context.quizResult.stressPct}%, Giấc ngủ (PSQI): ${context.quizResult.sleepPct}%`
        : 'Chưa làm bài test',
      mood_history_7days: moodHistorySummary,
      active_challenge: `${context.challengeProgress?.challengeTitle || '21 Ngày Tái Thiết Giấc Ngủ'} (Đã làm: ${context.challengeProgress?.daysCompletedCount ?? 0}/${context.challengeProgress?.totalDays ?? 21} ngày, Streak: ${context.challengeProgress?.currentStreak || 0} ngày, Hôm nay: ${context.challengeProgress?.todayCompleted ? 'Đã hoàn thành' : 'Chưa điểm danh'})`,
      free_session_status: context.latestAppointment?.status === 'completed' ? 'COMPLETED' : 'AVAILABLE',
      latest_expert_recap: {
        expert_name: context.latestAppointment?.expertName || 'Chuyên gia Tâm lý',
        expert_title: context.latestAppointment?.expertTitle || 'Chuyên gia Tham vấn',
        appointment_date: context.latestAppointment ? `${context.latestAppointment.dateStr} (${context.latestAppointment.timeSlot})` : 'Chưa đặt lịch',
        appointment_status: context.latestAppointment?.status || 'Chưa có',
        recommended_plan: context.latestAppointment?.status === 'completed' ? 'UNTANGLE_3S' : 'STARTER_FREE',
        doctor_notes_summary: context.latestAppointment?.doctorRecap?.formattedRecap || context.latestAppointment?.userNotes || 'Chưa có buổi tư vấn',
      },
      sos_buddy_name: context.sosBuddy?.name ? `${context.sosBuddy.name} (${context.sosBuddy.relationship || 'Người thân'}, SĐT: ${context.sosBuddy.phone || 'Chưa có'})` : 'Chưa cài đặt',
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: cleanText,
        userContext: userContextPayload,
        history: history.slice(-5).map((m) => ({ sender: m.sender, text: m.text })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.message_to_user || data.text)) {
        let rawText = data.message_to_user || data.text || '';
        let actionFlag = data.suggested_action as CompanionReplyResult['actionFlag'];
        let actionButtonText = data.action_button_text || null;

        // Bóc tách action tags nếu AI chèn vào text
        if (rawText.includes('[TRIGGER_SOS_DRAWER = TRUE]') || rawText.includes('TRIGGER_SOS') || data.triggerSOS) {
          actionFlag = 'TRIGGER_SOS';
          actionButtonText = '🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp';
          rawText = rawText.replace(/\[ACTION: TRIGGER_SOS_DRAWER\]|\[TRIGGER_SOS_DRAWER = TRUE\]/g, '');
        } else if (rawText.includes('[ACTION: NAVIGATE_BREATHING]') || actionFlag === 'NAVIGATE_BREATHING') {
          actionFlag = 'NAVIGATE_BREATHING';
          actionButtonText = actionButtonText || '🌬️ Tập thở 4-7-8 xoa dịu';
          rawText = rawText.replace('[ACTION: NAVIGATE_BREATHING]', '');
        } else if (rawText.includes('[ACTION: NAVIGATE_HEALING_HUB]') || actionFlag === 'NAVIGATE_HEALING_HUB') {
          actionFlag = 'NAVIGATE_HEALING_HUB';
          actionButtonText = actionButtonText || '🎧 Nghe nhạc 432Hz & Podcast';
          rawText = rawText.replace('[ACTION: NAVIGATE_HEALING_HUB]', '');
        } else if (rawText.includes('[ACTION: NAVIGATE_BOOKING_FREE]') || actionFlag === 'NAVIGATE_BOOKING_FREE') {
          actionFlag = 'NAVIGATE_BOOKING_FREE';
          actionButtonText = actionButtonText || '👉 Đặt Lịch Tư Vấn 0đ';
          rawText = rawText.replace('[ACTION: NAVIGATE_BOOKING_FREE]', '');
        } else if (rawText.includes('[ACTION: VIEW_CARE_PLANS]') || actionFlag === 'VIEW_CARE_PLANS') {
          actionFlag = 'VIEW_CARE_PLANS';
          actionButtonText = actionButtonText || '👉 Xem Lộ Trình Đề Xuất';
          rawText = rawText.replace('[ACTION: VIEW_CARE_PLANS]', '');
        } else if (rawText.includes('[ACTION: NAVIGATE_STREAK]') || actionFlag === 'NAVIGATE_STREAK') {
          actionFlag = 'NAVIGATE_STREAK';
          actionButtonText = actionButtonText || '🔥 Điểm danh lưu giữ khoảnh khắc';
          rawText = rawText.replace('[ACTION: NAVIGATE_STREAK]', '');
        }

        if (rawText.trim().length > 0) {
          return {
            text: rawText.trim(),
            actionFlag: actionFlag === 'NONE' ? undefined : actionFlag,
            actionButtonText,
            contextInsight: data.context_insight,
            isCrisis: actionFlag === 'TRIGGER_SOS' || Boolean(data.isCrisis),
          };
        }
      }
    }
  } catch {
    // Network or server unavailable - fallback gracefully
  }

  // Bộ não xử lý cảm xúc thông minh cục bộ đa tầng (Kháng lỗi 100%)
  return generateDynamicSoulCareResponse(cleanText, context);
}
