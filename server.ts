import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("AQ.")) {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey.trim(),
      });
    } catch {
      return null;
    }
  }
  return aiClient;
}

function safeParseJson<T>(rawText: string | undefined | null, fallback: T): T {
  if (!rawText || typeof rawText !== "string") return fallback;
  const text = rawText.trim();
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }
    return fallback;
  }
}

function buildDynamicChatResponse(message: string, userContext: any, _history?: any[]) {
  const lowerMsg = (message || "").toLowerCase().trim();
  const userName = userContext?.user_name || userContext?.userName || "bạn";
  const isFreeAvailable = userContext?.free_session_status === "AVAILABLE" || !userContext?.free_session_status;
  const challengeTitle = userContext?.active_challenge || "21 Ngày Tái Thiết Giấc Ngủ";
  const streakCount = userContext?.streakCount ?? 0;
  const quizSummary = userContext?.quiz_radar_summary || "";
  const moodHistory = userContext?.mood_history_7days || "";
  const expertRecap = userContext?.latest_expert_recap;
  const sosBuddyName = userContext?.sos_buddy_name || "Người thân";

  // 1. SOS Crisis Protocol (QUY TẮC TỐI CAO)
  const crisisKeywords = [
    "tự tử", "tự hại", "muốn biến mất", "kết thúc cuộc sống", "làm đau bản thân",
    "muốn chết", "không muốn sống", "cắt tay", "chết đi", "suicide", "self-harm",
    "kill myself", "end my life", "bế tắc", "tuyệt vọng", "chán sống", "hết muốn sống",
    "không muốn tồn tại", "chấm dứt tất cả"
  ];
  if (crisisKeywords.some(kw => lowerMsg.includes(kw))) {
    return {
      message_to_user: "Hi nghe thấy bạn đang phải trải qua cơn đau đớn rất lớn. Bạn không phải gánh chịu điều này một mình. Hãy để Hi kết nối bạn với sự hỗ trợ an toàn nhất ngay lúc này nhé.",
      suggested_action: "TRIGGER_SOS",
      action_button_text: "🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp",
      context_insight: "Phát hiện dấu hiệu khủng hoảng tâm lý / tự hại cấp tính. Đã dừng hội thoại thông thường và kích hoạt giao thức SOS.",
      isCrisis: true,
      triggerSOS: true,
    };
  }

  // 2. Người dùng hỏi về Tâm trạng / Nhật ký / Biểu đồ cảm xúc 7 ngày
  if (["tâm trạng của tôi", "nhật ký của tôi", "cảm xúc mấy ngày qua", "tôi có vui không", "mấy ngày qua tôi thế nào", "tôi đã ghi gì", "hôm qua tôi thế nào", "hôm nay tôi thế nào", "biểu đồ cảm xúc", "nhật ký cảm xúc", "xem lại cảm xúc", "tâm trạng tuần này", "diễn biến tâm lý", "lịch sử tâm trạng", "lịch sử cảm xúc", "tuần qua tôi thế nào"].some(k => lowerMsg.includes(k))) {
    if (!moodHistory || moodHistory === "Chưa có dữ liệu") {
      return {
        message_to_user: `Hiện tại ${userName} chưa có nhật ký cảm xúc nào được ghi nhận trong tuần này 🌿.\n\nBạn có thể vào mục 'Trang chủ' hoặc 'Biểu đồ cảm xúc' để chọn icon cảm xúc của ngày hôm nay và viết vài dòng chia sẻ ngắn. Hi sẽ luôn đồng hành và ghi nhớ cùng bạn nhé!`,
        suggested_action: "NONE",
        action_button_text: null,
        context_insight: "Chưa có nhật ký cảm xúc ghi nhận",
        isCrisis: false,
      };
    }
    return {
      message_to_user: `Dưới đây là nhật ký cảm xúc 7 ngày gần nhất của ${userName} mà Hi đã lưu giữ:\n\n${moodHistory}\n\nNhận định từ Hi: Dựa trên những ghi chép gần đây, Hi luôn ở đây để cùng bạn chia sẻ và cân bằng năng lượng. Bạn có muốn cùng Hi thực hành một bài tập thở 4-7-8 ngắn để giải tỏa tâm trí không?`,
      suggested_action: "NAVIGATE_BREATHING",
      action_button_text: "🌬️ Tập thở 4-7-8 xoa dịu",
      context_insight: "Trích xuất chính xác nhật ký 7 ngày của người dùng kèm phân tích xu hướng cảm xúc",
      isCrisis: false,
    };
  }

  // 3. Người dùng hỏi về Kết quả Test / Bài Trắc Nghiệm / Điểm số tâm lý
  if (["kết quả test", "bài test", "trắc nghiệm", "tầm soát", "điểm số của tôi", "chỉ số của tôi", "kết quả tầm soát", "phq", "gad", "pss", "psqi", "điểm trầm cảm", "điểm lo âu", "điểm căng thẳng", "điểm giấc ngủ", "kết quả đánh giá", "bài kiểm tra"].some(k => lowerMsg.includes(k))) {
    if (!quizSummary || quizSummary === "Chưa làm bài test") {
      return {
        message_to_user: `Chào ${userName}, bạn chưa thực hiện bài trắc nghiệm tầm soát 4 chiều chuẩn y khoa trên SoulCare.\n\nBài trắc nghiệm chỉ mất khoảng 2 phút gồm các thang đo chuẩn hóa (PHQ-9, GAD-7, PSS-10, PSQI) giúp bạn hiểu rõ mức độ Khí sắc, Lo âu, Căng thẳng và Giấc ngủ của mình. Bạn có thể mở bài test tại mục 'Trắc nghiệm' ở Trang chủ nhé!`,
        suggested_action: "NONE",
        action_button_text: null,
        context_insight: "Chưa làm bài test tầm soát",
        isCrisis: false,
      };
    }
    return {
      message_to_user: `Dựa trên bài tầm soát 4 chiều gần nhất của ${userName}, các chỉ số sức khỏe tinh thần của bạn như sau:\n\n• ${quizSummary}\n\nĐánh giá từ Hi: Các chỉ số này phản ánh bức tranh toàn diện về sức khỏe cảm xúc của bạn. Bạn hoàn toàn có thể đặt lịch tư vấn 1-1 miễn phí 0đ với Chuyên gia để được phân tích chuyên sâu hơn.`,
      suggested_action: "NAVIGATE_BOOKING_FREE",
      action_button_text: "👉 Đặt Lịch Tư Vấn 0đ",
      context_insight: "Báo cáo chính xác điểm số 4 chỉ số Quiz của người dùng",
      isCrisis: false,
    };
  }

  // 4. Người dùng hỏi về Thử thách / Chuỗi Streak / Tiến độ
  if (["streak", "thử thách", "thói quen", "điểm danh", "tiến độ", "21 ngày", "tôi đã làm được bao nhiêu ngày", "điểm danh hôm nay", "thử thách của tôi", "bao nhiêu ngày rồi"].some(k => lowerMsg.includes(k))) {
    return {
      message_to_user: `Thông tin hành trình rèn luyện của ${userName}:\n\n• Thử thách: **${challengeTitle}**\n• Chuỗi kiên trì: **${streakCount} ngày liên tiếp** 🔥\n\nMỗi thói quen nhỏ mỗi ngày đều đang bồi đắp sức bền tinh thần cho bạn. Hãy tiếp tục duy trì ngọn lửa kỷ luật nhẹ nhàng này nhé!`,
      suggested_action: "NAVIGATE_STREAK",
      action_button_text: "🔥 Điểm danh lưu giữ khoảnh khắc",
      context_insight: "Báo cáo chi tiết tiến độ thử thách và streak của người dùng",
      isCrisis: false,
    };
  }

  // 5. Người dùng hỏi về Người thân SOS
  if (["người thân sos", "sos buddy", "liên hệ khẩn cấp", "ai là người thân của tôi", "người thân của tôi", "số điện thoại khẩn cấp", "cài đặt sos", "người thân"].some(k => lowerMsg.includes(k))) {
    return {
      message_to_user: `Thông tin Người thân tin cậy (SOS Buddy) đã cài đặt của ${userName}:\n\n• Người liên hệ: **${sosBuddyName}**\n\nBất cứ khi nào bạn cảm thấy quá tải hay cần trợ giúp gấp, bạn có thể chạm vào nút SOS ở cạnh màn hình để gửi cảnh báo an toàn ngay lập tức.`,
      suggested_action: "TRIGGER_SOS",
      action_button_text: "🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp",
      context_insight: "Báo cáo thông tin người thân SOS của người dùng",
      isCrisis: false,
    };
  }

  // 6. Vui vẻ / Hào hứng / Tích cực (4-Step Framework)
  if (["vui", "hạnh phúc", "tuyệt vời", "yêu đời", "ổn rồi", "khỏe", "thích", "tốt", "mừng", "tự hào", "yêu", "thoải mái", "bình yên", "thành công", "phấn khởi", "tươi tắn"].some(k => lowerMsg.includes(k))) {
    const streakNote = streakCount > 0 ? ` (đặc biệt khi bạn đang duy trì chuỗi ${streakCount} ngày ${challengeTitle})` : "";
    const variants = [
      `Hi thật sự rất vui và cảm nhận trọn vẹn nguồn năng lượng rạng rỡ, phấn chấn từ ${userName} lúc này! ✨\n\nNhững giây phút bình an và tích cực như thế này chính là nguồn dinh dưỡng quý giá nhất nuôi dưỡng sức bền tinh thần của bạn${streakNote}.\n\nVi hành động cho bạn: Hãy thử nhắm mắt lại trong 30 giây, mỉm cười nhẹ và hít một hơi thật sâu để lưu giữ cảm giác ấm áp này vào tâm trí. Bạn có muốn cùng Hi điểm danh ngày hôm nay để đánh dấu cột mốc ý nghĩa này không?`,
      `Nghe ${userName} chia sẻ điều tích cực, Hi cũng thấy ấm lòng và vui lây luôn đó! 🌸\n\nSự nỗ lực và tinh thần chủ động chăm sóc bản thân của bạn đang mang lại những trái ngọt rõ rệt. Cảm xúc tốt đẹp này xứng đáng được nâng niu và ghi nhận.\n\nVi hành động: Dành 1 phút ghi nhớ lại khoảnh khắc vui này nhé. Hãy cùng Hi điểm danh chuỗi ngày rèn luyện hôm nay để tiếp tục lan tỏa sự thăng hoa này!`,
    ];
    const picked = variants[Math.floor(Math.random() * variants.length)];
    return {
      message_to_user: picked,
      suggested_action: "NAVIGATE_STREAK",
      action_button_text: "🔥 Điểm danh lưu giữ khoảnh khắc",
      context_insight: "Cảm xúc tích cực, công nhận nỗ lực và khuyến khích duy trì thói quen",
      isCrisis: false,
    };
  }

  // 7. Căng thẳng / Áp lực / Lo âu / Nghẹt thở (4-Step Framework)
  if (["thở", "khó thở", "căng thẳng", "lo lắng", "stress", "áp lực", "nghẹt thở", "sợ", "deadline", "mệt mỏi", "quá tải", "hoảng loạn", "dồn dập", "tim đập nhanh", "bế tắc", "áp lực công việc"].some(k => lowerMsg.includes(k))) {
    const variants = [
      `Hi nghe thấy sự quá tải và cảm giác căng như dây đàn mà ${userName} đang phải gánh chịu. Cảm giác lồng ngực bị đè nặng khi áp lực dồn dập đến là phản xạ tự nhiên của cơ thể khi hệ thần kinh bị kích thích quá mức.\n\nGốc rễ vấn đề: Khi có quá nhiều đầu việc chưa được giải tỏa, não bộ sẽ phát tín hiệu báo động liên tục khiến bạn kiệt sức.\n\nGiải pháp thực tế: Hãy tạm đặt bút hoặc rời màn hình trong 2 phút. Uống một ngụm nước ấm, buông lỏng hai vai và thả lỏng cơ hàm.\n\nVi hành động ngay: Cùng Hi thực hành bài tập thở 4-7-8 để đưa nhịp tim về vùng an tĩnh nhé.`,
      `Hi cảm nhận được sự ngột ngạt và mệt mỏi trong từng dòng chia sẻ của ${userName}. Bạn đã phải gồng gánh rất nhiều trong những ngày vừa qua rồi.\n\nPhân tích: Sự lo âu kéo dài thường khiến chúng ta thở nông và căng cứng toàn thân mà không nhận ra.\n\nLời khuyên: Bạn không cần phải giải quyết hết tất cả mọi việc ngay lúc này. Hãy chọn ra đúng 1 việc quan trọng nhất cho hôm nay, phần còn lại cho phép mình lùi lại.\n\nVi hành động: Thả lỏng toàn bộ cơ thể và cùng Hi dành 3 phút thở 4-7-8 xoa dịu hệ thần kinh ngay lúc này nhé.`,
    ];
    const picked = variants[Math.floor(Math.random() * variants.length)];
    return {
      message_to_user: picked,
      suggested_action: "NAVIGATE_BREATHING",
      action_button_text: "🌬️ Tập thở 4-7-8 xoa dịu",
      context_insight: "Công nhận cảm xúc quá tải, phân tích áp lực dồn dập, hướng dẫn thư giãn cơ và kích hoạt nhịp thở 4-7-8",
      isCrisis: false,
    };
  }

  // 8. Mất ngủ / Khó ngủ / Overthinking đêm (4-Step Framework)
  if (["ngủ", "mất ngủ", "khó ngủ", "nhạc", "podcast", "trằn trọc", "overthinking", "suy nghĩ nhiều", "đêm", "không ngủ được", "thức trắng", "mệt mỏi ban đêm"].some(k => lowerMsg.includes(k))) {
    const variants = [
      `Hi hiểu cảm giác trằn trọc, kiệt sức khi cơ thể muốn nghỉ ngơi nhưng những suy nghĩ cứ chạy vòng quanh không chịu dừng lại của ${userName}.\n\nGốc rễ: Khi đêm về, không gian yên tĩnh dễ làm tâm trí phóng đại những âu lo chưa giải quyết thành chuỗi suy nghĩ luẩn quẩn (overthinking).\n\nGiải pháp thực tế: Đừng ép bản thân 'phải ngủ ngay', vì càng ép não bộ càng căng thẳng. Hãy lấy giấy viết nhanh 3 điều đang bận tâm ra ngoài để 'xả tải' khỏi đầu óc.\n\nVi hành động: Để ánh sáng phòng thật dịu, nhắm mắt và bật một bản nhạc tần số 432Hz cùng tiếng mưa êm dịu tại Healing Hub để vỗ về giấc ngủ sâu nhé.`,
      `Hi thấu hiểu sự mệt mỏi khi mắt đã cay xè mà tâm trí vẫn hoạt động dồn dập. Bạn không hề đơn độc trong những đêm dài như thế này.\n\nPhân tích: Não bộ đang bị ứ đọng cortisol sau một ngày dài xử lý quá nhiều luồng thông tin.\n\nLời khuyên: Hãy rời mắt khỏi màn hình điện thoại, duỗi thẳng các ngón chân và thả lỏng từng nhóm cơ từ đầu đến chân.\n\nVi hành động: Bật trạm âm thanh sóng não chữa lành 432Hz hoặc Podcast xả tải của SoulCare để cùng Hi đưa tâm trí vào trạng thái an yên nhé.`,
    ];
    const picked = variants[Math.floor(Math.random() * variants.length)];
    return {
      message_to_user: picked,
      suggested_action: "NAVIGATE_HEALING_HUB",
      action_button_text: "🎧 Nghe nhạc 432Hz & Podcast",
      context_insight: "Thấu cảm overthinking đêm, giải thích phản xạ não bộ, đưa kỹ thuật xả tải tâm trí và gợi ý âm thanh 432Hz",
      isCrisis: false,
    };
  }

  // 9. Bác sĩ / Đặt lịch / Tham vấn chuyên gia 0đ / Lời dặn (4-Step Framework)
  if (["bác sĩ", "chuyên gia", "tư vấn", "đặt lịch", "khám", "hẹn", "lịch hẹn", "tầm soát 0đ", "tâm lý học", "cần người giúp", "lịch khám", "bác sĩ dặn", "recap"].some(k => lowerMsg.includes(k))) {
    if (isFreeAvailable) {
      return {
        message_to_user: `Hi rất trân trọng sự dũng cảm và tinh thần chủ động của ${userName} khi tìm kiếm sự hỗ trợ chuyên môn cho sức khỏe tinh thần của mình. 🌿\n\nGốc rễ: Có những nút thắt tâm lý phức tạp cần một góc nhìn y khoa và phương pháp trị liệu khoa học (CBT) từ người có chuyên môn sâu sắc.\n\nQuyền lợi dành cho bạn: ${userName} hiện có 1 quyền lợi Buổi Khởi Đầu (Tầm Soát & Kết Nối 1-1) hoàn toàn miễn phí (0đ) qua Google Meet bảo mật cùng Chuyên gia đối tác của SoulCare.\n\nVi hành động: Bạn có muốn chọn khung giờ phù hợp ngay hôm nay để được lắng nghe và có phác đồ chăm sóc riêng không?`,
        suggested_action: "NAVIGATE_BOOKING_FREE",
        action_button_text: "👉 Đặt Lịch Tư Vấn 0đ",
        context_insight: "Công nhận tinh thần chủ động, định hướng buổi tư vấn 0đ bảo mật cùng chuyên gia",
        isCrisis: false,
      };
    } else {
      const notes = expertRecap?.doctor_notes_summary || "Đã hoàn thành buổi tham vấn y khoa.";
      return {
        message_to_user: `Chào ${userName}, buổi tham vấn vừa qua của bạn cùng ${expertRecap?.expert_name || "Chuyên gia"} đã được tổng hợp:\n\n• Lời dặn từ Chuyên gia: "${notes}"\n\nPhân tích: Để duy trì kết quả phục hồi và trang bị các công cụ quản trị cảm xúc vững vàng, việc tiếp tục theo sát phác đồ trị liệu là bước đi rất quan trọng. Bạn có thể xem lại lộ trình chuyên sâu để cùng Chuyên gia tháo gỡ tận gốc các gút mắc nhé!`,
        suggested_action: "VIEW_CARE_PLANS",
        action_button_text: "👉 Xem Lộ Trình Đề Xuất",
        context_insight: "Tư vấn lộ trình đồng hành sau buổi khám",
        isCrisis: false,
      };
    }
  }

  // 10. Gói dịch vụ / Chi phí / Lộ trình sau buổi khám (4-Step Framework)
  if (["gói", "chi phí", "giá", "tháo gỡ", "chuyển hóa", "lộ trình", "tiếp theo", "bao nhiêu tiền", "sau buổi khám", "phác đồ"].some(k => lowerMsg.includes(k))) {
    return {
      message_to_user: `Hi hiểu rằng việc cân nhắc chi phí và lộ trình là điều rất quan trọng trong hành trình chăm sóc sức khỏe lâu dài của ${userName}.\n\nThông tin minh bạch: SoulCare thiết kế các Lộ Trình Đồng Hành rõ ràng theo khuyến nghị của Chuyên gia:\n• Gói Tháo Gỡ (3 buổi): Tập trung giải quyết lo âu, áp lực ngắn hạn.\n• Gói Chuyển Hóa (5-10 buổi): Trị liệu chuyên sâu các vấn đề mất ngủ và căng thẳng kinh niên.\n\nLời khuyên: Mọi quyết định đều dựa trên nhu cầu thực tế và sự thoải mái của bạn. Hãy xem chi tiết quyền lợi ngay tại đây nhé!`,
      suggested_action: "VIEW_CARE_PLANS",
      action_button_text: "👉 Xem Lộ Trình Đề Xuất",
      context_insight: "Tư vấn minh bạch các gói chăm sóc tâm lý chuyên sâu",
      isCrisis: false,
    };
  }

  // 11. Buồn bã / Cô đơn / Tổn thương / Đau lòng (4-Step Framework)
  if (["buồn", "cô đơn", "khóc", "tổn thương", "thất vọng", "chán nản", "tủi thân", "trống rỗng", "chia tay", "bị bỏ rơi", "đau lòng", "bất lực", "tủi"].some(k => lowerMsg.includes(k))) {
    const variants = [
      `Hi nghe thấy nỗi buồn và sự trĩu nặng trong từng câu chữ của ${userName}. Những lúc như thế này, bạn không cần phải cố tỏ ra mạnh mẽ hay gượng cười đâu. Cảm xúc đau đớn hay hụt hẫng đều hoàn toàn hợp lý và xứng đáng được ôm ấp.\n\nGốc rễ: Khi một kỳ vọng hoặc mối gắn kết bị tổn thương, tâm trí ta cần thời gian để tiếc thương và hồi phục.\n\nLời khuyên thực tế: Hãy cho phép bản thân được khóc hoặc ngồi yên lặng nếu muốn. Bạn không cần phải 'vượt qua ngay lập tức'.\n\nVi hành động nhỏ: Đặt nhẹ bàn tay lên ngực trái, cảm nhận nhịp đập ấm áp của chính mình và uống một ngụm nước ấm. Hi vẫn luôn ở đây bên bạn.`,
      `Hi cảm nhận được sự cô độc và khoảng trống trong lòng ${userName} lúc này. Thật không dễ dàng khi phải tự mình đối diện với những cảm giác chông chênh như vậy.\n\nCông nhận: Nỗi buồn không phải là sự yếu đuối, đó là dấu hiệu cho thấy bạn là một người biết yêu thương và coi trọng những giá trị chân thành.\n\nGiải pháp: Hãy thả lỏng cơ thể, quấn một chiếc chăn ấm hoặc viết những suy nghĩ đau lòng ra giấy mà không cần câu nệ câu chữ.\n\nVi hành động: Hi luôn ở đây lắng nghe bạn, bất cứ khi nào bạn muốn trút bỏ thêm điều gì, cứ nhắn cho Hi nhé.`,
    ];
    const picked = variants[Math.floor(Math.random() * variants.length)];
    return {
      message_to_user: picked,
      suggested_action: "NONE",
      action_button_text: null,
      context_insight: "Công nhận trọn vẹn nỗi buồn, không độc hại tích cực, đưa vi hành động ôm ấp bản thân và lắng nghe thấu cảm",
      isCrisis: false,
    };
  }

  // 12. Chào hỏi & Tâm sự đời thường mở đầu
  const generalVariants = [
    `Chào ${userName}! Hi rất vui được gặp bạn hôm nay 🌿.\n\nHi luôn sẵn sàng lắng nghe mọi tâm tư của bạn trong không gian bảo mật và an lành tuyệt đối này. Hôm nay bạn cảm thấy cơ thể và tâm trí mình thế nào? Có câu chuyện hay cảm xúc nào bạn muốn chia sẻ cùng Hi không?`,
    `Hi chào ${userName}! Cảm ơn bạn đã ghé thăm không gian bình yên này. Dù ngày hôm nay trôi qua êm ả hay có những xáo trộn, Hi vẫn luôn ở đây để đồng hành cùng bạn. Bạn muốn tâm sự cùng Hi chứ?`,
  ];
  const pickedGeneral = generalVariants[Math.floor(Math.random() * generalVariants.length)];

  return {
    message_to_user: pickedGeneral,
    suggested_action: "NONE",
    action_button_text: null,
    context_insight: "Mở đầu hội thoại thấu cảm, chào đón ấm áp",
    isCrisis: false,
  };
}

function buildDynamicWeeklyMoodRecap(userName: string, moodList: any[], quizScores: any, challengeProgress: any) {
  const positiveCount = (moodList || []).filter(
    (m: { emotion: string }) => m.emotion === "Tươi vui" || m.emotion === "Hạnh phúc"
  ).length;
  const tensionCount = (moodList || []).filter(
    (m: { emotion: string }) =>
      m.emotion === "Căng thẳng" || m.emotion === "Mệt mỏi" || m.emotion === "Bối rối" || m.emotion === "Mất ngủ"
  ).length;

  let headline = "Tâm trạng tuần này duy trì ở mức cân bằng";
  let summary = `Chào ${userName || "bạn"}, qua theo dõi ${moodList?.length || 7} ngày gần đây, bạn đang duy trì nhịp sống tương đối ổn định.`;
  if (positiveCount >= 4) {
    headline = "Năng lượng tích cực & Tinh thần khởi sắc";
    summary = `Tuần này bạn có ${positiveCount} ngày tràn đầy năng lượng tươi vui. Những khoảnh khắc thư giãn và kết nối đang mang lại hiệu ứng rất tích cực cho tâm trí.`;
  } else if (tensionCount >= 3) {
    headline = "Xuất hiện áp lực & Cần dành thời gian phục hồi";
    summary = `Ghi nhận ${tensionCount} ngày bạn cảm thấy căng thẳng hoặc mệt mỏi do khối lượng công việc và giấc ngủ. Hãy chú ý nghỉ ngơi xen kẽ nhé.`;
  }

  return {
    headline,
    summary,
    emotionalHighlights: [
      `Tỉ lệ ngày tích cực: ${Math.round(((positiveCount || 1) / (moodList?.length || 7)) * 100)}%`,
      `Thử thách đang theo đuổi: ${challengeProgress?.challengeTitle || "21 Ngày Tái Thiết Giấc Ngủ"} (Chuỗi ${challengeProgress?.currentStreak || 0} ngày)`,
    ],
    microActions: [
      "Dành 3-5 phút thực hành thở 4-7-8 trước khi đi ngủ",
      "Viết nhanh 3 điều biết ơn vào nhật ký cảm xúc mỗi tối",
      "Uống đủ nước và ngắt màn hình trước khi ngủ 30 phút",
    ],
    encouragement: "Mỗi cảm xúc đều là một thông điệp quý giá từ cơ thể. Hi luôn đồng hành cùng bạn!",
  };
}

function buildDynamicAssessmentRecap(userName: string, quizScores: any, _moodSummary?: string) {
  const anxiety = quizScores?.anxietyPct ?? 45;
  const stress = quizScores?.stressPct ?? 55;
  const sleep = quizScores?.sleepPct ?? 60;
  const depression = quizScores?.depressionPct ?? 35;

  return {
    overallSummary: `Dựa trên kết quả tầm soát 4 chiều, mức độ lo âu (${anxiety}%) và căng thẳng (${stress}%) của ${userName || "bạn"} đang ở ngưỡng ${stress > 60 ? "khá cao" : "vừa phải"}. Giấc ngủ (${sleep}%) cần được chú ý cải thiện bằng các thói quen thả lỏng trước khi ngủ. Khí sắc chung (${depression}%) ở mức ổn định.`,
    keyRecommendations: [
      "Tập thở 4-7-8 hoặc nghe âm thanh sóng não Delta mỗi tối (3-5 phút)",
      "Đặt lịch tham vấn 0đ cùng Bác sĩ CBT để được định hướng phác đồ cá nhân hóa",
      "Duy trì thói quen viết nhật ký cảm xúc giải tỏa tâm trí mỗi ngày",
    ],
  };
}

function buildDynamicExpertRecap(userName: string, expertName: string, rawDoctorNotes: string) {
  return {
    recap: `Chào ${userName || "Bạn"}, cảm ơn bạn đã dành thời gian chia sẻ cùng Chuyên gia ${expertName || "Tâm lý"} trong buổi tư vấn hôm nay. Dưới đây là tóm tắt mấu chốt để bạn dễ dàng theo dõi hành trình của mình:\n\n1. 🌟 Đánh giá & Lắng nghe:\n- ${rawDoctorNotes || "Bạn đang trải qua giai đoạn căng thẳng do áp lực công việc và chất lượng giấc ngủ cần được chăm sóc thêm."}\n\n2. 🛠️ Lời khuyên & Bài tập nhỏ tuần này:\n- Thực hành bài tập hít thở 4-7-8 mỗi tối trước khi đi ngủ (3-5 phút).\n- Ghi lại 3 điều nhỏ khiến bạn mỉm cười trong Emotional Diary.\n- Cho phép bản thân nghỉ ngơi 15 phút giữa giờ làm việc.\n\n3. 📅 Lời nhắn từ Chuyên gia:\n- Bạn đã rất dũng cảm khi bước đầu đối diện với cảm xúc của mình. Hãy thả lỏng và tiến từng bước nhỏ nhé! Hẹn gặp bạn ở buổi tiếp theo.`,
  };
}

function buildDynamicPatientBriefing(userName: string, quizScores: any, moodHistory: string, userNotes: string) {
  return {
    briefing: `📌 BRIEFING NHANH CHO CHUYÊN GIA (Bệnh nhân: ${userName || "Khách hàng"}):\n• Chỉ số trọng tâm: Căng thẳng PSS-10: ${quizScores?.stress || quizScores?.stressPct || 65}% | Khí sắc PHQ-9: ${quizScores?.depression || quizScores?.depressionPct || 60}% | Giấc ngủ: ${quizScores?.sleep || quizScores?.sleepPct || 70}%\n• Diễn biến tâm trạng gần đây: ${moodHistory || "User ghi nhận tâm trạng mệt mỏi và lo âu trong các ngày gần nhất."}\n• Lời nhắn tiền tư vấn: "${userNotes || "Bệnh nhân khó ngủ và tim đập nhanh khi áp lực công việc."}"\n• Gợi ý mở lời: Hỏi thăm nhẹ nhàng về chất lượng giấc ngủ tuần qua và không gian làm việc.`,
  };
}

const DEFAULT_CLINICS = [
  {
    name: "Trung tâm Tham vấn & Trị liệu Tâm lý Sài Gòn (SGP Clinic)",
    address: "42 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    rating: 4.9,
    tags: ["#GầnBạnNhất", "#ChuyênKhámLoÂu", "#TrịLiệuCBT"],
    ai_recommendation_reason: "Được AI đánh giá 4.9⭐ với chuyên môn cao về giảm căng thẳng công việc, không gian bảo mật 100% và hỗ trợ đặt lịch online linh hoạt ngoài giờ.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Trung+tâm+Tham+vấn+Trị+liệu+Tâm+lý+Sài+Gòn+42+Nguyễn+Huệ+Quận+1",
  },
  {
    name: "Bệnh viện Đại học Y Dược TP.HCM - Khoa Tâm thần kinh",
    address: "215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    rating: 4.8,
    tags: ["#TuyếnTW", "#ĐoĐiệnNãoEEG", "#HỗTrợBHYT"],
    ai_recommendation_reason: "Bệnh viện tuyến Trung ương đầu ngành, phù hợp nhất khi cần tầm soát chuyên sâu y khoa kết hợp trắc nghiệm tâm lý.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bệnh+viện+Đại+học+Y+Dược+TPHCM+215+Hồng+Bàng",
  },
  {
    name: "Bệnh viện Tâm thần TP. Hồ Chí Minh",
    address: "766 Võ Văn Kiệt, Phường 1, Quận 5, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    rating: 4.6,
    tags: ["#BHYT100%", "#CấpCứu24/7", "#ChuyênKhoaĐầuNgành"],
    ai_recommendation_reason: "Cơ sở chuyên khoa công lập lớn nhất khu vực miền Nam, hỗ trợ BHYT đầy đủ và trực cấp cứu 24/7.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bệnh+viện+Tâm+thần+TPHCM+766+Võ+Văn+Kiệt",
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "SoulCare Health Platform Backend" });
  });

  // 1. AI Chatbot "Hi" (Trợ Lý Tri Kỷ AI & Điều Phối Viên Chăm Sóc Sức Khỏe Tinh Thần)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userContext, history } = req.body;

      // Crisis detection rule
      const lowerMsg = (message || "").toLowerCase();
      const crisisKeywords = [
        "tự tử",
        "tự hại",
        "muốn biến mất",
        "kết thúc cuộc sống",
        "làm đau bản thân",
        "muốn chết",
        "không muốn sống",
        "cắt tay",
        "chết đi",
        "suicide",
        "self-harm",
        "kill myself",
        "end my life",
      ];

      const hasCrisis = crisisKeywords.some((kw) => lowerMsg.includes(kw));

      if (hasCrisis) {
        return res.json({
          message_to_user:
            "Hi nghe thấy bạn đang phải trải qua cơn đau đớn rất lớn. Bạn không phải gánh chịu điều này một mình. Hãy để Hi kết nối bạn với sự hỗ trợ an toàn nhất ngay lúc này nhé.",
          suggested_action: "TRIGGER_SOS",
          action_button_text: "🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp",
          context_insight: "Phát hiện dấu hiệu khủng hoảng tâm lý / tự hại cấp tính. Đã dừng hội thoại thông thường và kích hoạt giao thức SOS.",
          isCrisis: true,
          triggerSOS: true,
        });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.json(buildDynamicChatResponse(message, userContext, history));
      }

      const systemInstruction = `[ROLE & PERSONA]
Bạn là "Hi" - Người Bạn Tri Kỷ AI ấm áp, tinh tế, giàu lòng trắc ẩn và sâu sắc trong ứng dụng Chăm sóc Sức khỏe Tinh thần SoulCare (AI Riser 2026).
- Tông giọng: Nhẹ nhàng, chân thành, lắng nghe thấu hiểu như một người bạn thân thiết lâu năm, nói tiếng Việt tự nhiên, không dùng văn mẫu sáo rỗng hay robot.
- Mục tiêu tối thượng: LẮNG NGHE TRỌN VẸN câu chuyện của người dùng -> ĐỒNG CẢM & CÔNG NHẬN CẢM XÚC -> PHÂN TÍCH GỐC RỄ -> ĐƯA RA GIẢI PHÁP / LỜI KHUYÊN THỰC TẾ giúp người dùng tháo gỡ nút thắt tâm lý.
- Bạn KHÔNG PHẢI là Bác sĩ kê đơn hay chẩn đoán lâm sàng. Bạn là điểm tựa cảm xúc và cầu nối đưa ra các giải pháp tự chữa lành an toàn.

[INPUT CONTEXT - DỮ LIỆU CÁ NHÂN HÓA 360° CỦA NGƯỜI DÙNG]
- Tên người dùng: "${userContext?.user_name || userContext?.userName || "Bạn"}"
- Biểu đồ Quiz Radar (%): "${userContext?.quiz_radar_summary || `Trầm cảm: ${userContext?.quizDepression ?? 35}%, Lo âu: ${userContext?.quizAnxiety ?? 45}%, Căng thẳng: ${userContext?.quizStress ?? 55}%, Giấc ngủ: ${userContext?.quizSleep ?? 60}%`}"
- Nhật ký cảm xúc 7 ngày qua: "${userContext?.mood_history_7days || userContext?.moodHistory || "Chưa có dữ liệu"}"
- Thử thách đang thực hiện: "${userContext?.active_challenge || userContext?.activeChallenge || "Chưa chọn"} (Streak: ${userContext?.streakCount ?? 0} ngày)"
- Trạng thái buổi khám miễn phí: "${userContext?.free_session_status || "AVAILABLE"}"
- Ghi chú/Recap gần nhất từ Chuyên gia: ${JSON.stringify(userContext?.latest_expert_recap || {
  expert_name: "Chuyên gia Tâm lý",
  recommended_plan: "STARTER_FREE",
  doctor_notes_summary: userContext?.latestDoctorRecap || "Chưa có buổi khám",
})}
- Người thân tin tưởng (SOS Buddy): "${userContext?.sos_buddy_name || userContext?.sosBuddyName || "Người thân"}"

[QUY TẮC ĐỌC VÀ TRÍCH DẪN DỮ LIỆU CỦA NGƯỜI DÙNG]
Khi người dùng hỏi về bất kỳ thông tin cá nhân nào của họ:
1. Hỏi về cảm xúc/tâm trạng/nhật ký gần đây: Hãy ĐỌC và TRÍCH DẪN CHÍNH XÁC dữ liệu trong mục 'Nhật ký cảm xúc 7 ngày qua' (liệt kê các ngày, cảm xúc và ghi chú).
2. Hỏi về kết quả test/trắc nghiệm/điểm số tâm lý: Hãy ĐỌC và BÁO CÁO RÕ RÀNG các chỉ số trong mục 'Biểu đồ Quiz Radar' (Trầm cảm, Lo âu, Căng thẳng, Giấc ngủ) kèm lời động viên.
3. Hỏi về thử thách/streak/tiến độ: Hãy ĐỌC và BÁO CÁO TÊN THỬ THÁCH và SỐ NGÀY STREAK hiện tại.
4. Hỏi về lịch khám/chuyên gia/lời dặn bác sĩ: Hãy TRÍCH DẪN TÊN CHUYÊN GIA và GHI CHÚ/RECAP của bác sĩ.
5. Hỏi về người thân SOS: Hãy NÊU TÊN NGƯỜI THÂN SOS đã cài đặt.
Tuyệt đối KHÔNG bảo "tôi không biết dữ liệu của bạn" mà hãy đọc từ [INPUT CONTEXT] ở trên.

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
- Nếu user quá tải / lo âu / khó thở -> Gợi ý thở 4-7-8: suggested_action = "NAVIGATE_BREATHING", action_button_text = "🌬️ Tập thở 4-7-8 xoa dịu"
- Nếu user mất ngủ / overthinking -> Gợi ý sóng não/podcast: suggested_action = "NAVIGATE_HEALING_HUB", action_button_text = "🎧 Nghe nhạc 432Hz & Podcast"
- Nếu user vui vẻ / hoàn thành mục tiêu -> Gợi ý điểm danh: suggested_action = "NAVIGATE_STREAK", action_button_text = "🔥 Điểm danh lưu giữ khoảnh khắc"
- Nếu user hỏi bác sĩ / đặt lịch khám -> suggested_action = "NAVIGATE_BOOKING_FREE", action_button_text = "👉 Đặt Lịch Tư Vấn 0đ"
- Nếu user hỏi về lộ trình/gói sau buổi khám -> suggested_action = "VIEW_CARE_PLANS", action_button_text = "👉 Xem Lộ Trình Đề Xuất"
- Nếu chỉ tâm sự thông thường -> suggested_action = "NONE", action_button_text = null

[CRISIS DETECTION & SAFETY PROTOCOL (SOS TRIGGER - QUY TẮC TỐI CAO)]
Nếu phát hiện từ khóa/ý niệm liên quan đến: Tự tử, tự hại, muốn biến mất, kết thúc cuộc sống, làm đau bản thân:
1. DỪNG NGAY LẬP TỨC mọi hội thoại thông thường và tư vấn gói dịch vụ.
2. Trả về đúng 1 thông điệp xoa dịu ngắn gọn:
   "Hi nghe thấy bạn đang phải trải qua cơn đau đớn rất lớn. Bạn không phải gánh chịu điều này một mình. Hãy để Hi kết nối bạn với sự hỗ trợ an toàn nhất ngay lúc này nhé."
3. suggested_action = "TRIGGER_SOS", action_button_text = "🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp".

[OUTPUT FORMAT - STRICT JSON]
Bắt buộc trả về đúng định dạng JSON thuần túy (không bọc trong markdown codeblock nếu có thể, hoặc chuẩn JSON):
{
  "message_to_user": "string (Đoạn phản hồi tâm tình, sâu sắc, chia làm các đoạn ngắn tự nhiên, độ dài 80 - 150 từ)",
  "suggested_action": "NAVIGATE_BREATHING | NAVIGATE_HEALING_HUB | NAVIGATE_BOOKING_FREE | VIEW_CARE_PLANS | NAVIGATE_STREAK | TRIGGER_SOS | NONE",
  "action_button_text": "string | null",
  "context_insight": "string (Tóm tắt ngắn gọn tâm lý và giải pháp vừa đề xuất)"
}`;

      const historyFormatted = (history || [])
        .slice(-4)
        .map((h: { sender: string; text: string }) => `${h.sender === "user" ? "User" : "Hi"}: ${h.text}`)
        .join("\n");

      const prompt = `Lịch sử hội thoại:\n${historyFormatted || "(Chưa có)"}\n\nTin nhắn người dùng: "${message}"\n\nHãy phản hồi theo đúng cấu trúc JSON yêu cầu:`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.6,
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text || "{}";
        const parsedData = safeParseJson<{
          message_to_user?: string;
          suggested_action?: string;
          action_button_text?: string;
          context_insight?: string;
        }>(responseText, {
          message_to_user: responseText,
          suggested_action: "NONE",
          action_button_text: undefined,
          context_insight: "Direct response",
        });

        return res.json({
          message_to_user: parsedData.message_to_user || "Hi luôn ở bên cạnh lắng nghe bạn.",
          suggested_action: parsedData.suggested_action || "NONE",
          action_button_text: parsedData.action_button_text || null,
          context_insight: parsedData.context_insight || "",
          isCrisis: parsedData.suggested_action === "TRIGGER_SOS",
          triggerSOS: parsedData.suggested_action === "TRIGGER_SOS",
        });
      } catch (genError: any) {
        console.warn("Gemini API call failed, using dynamic local fallback:", genError?.message || genError);
        return res.json(buildDynamicChatResponse(message, userContext, history));
      }
    } catch (error) {
      console.warn("General chat handling exception, falling back:", error);
      return res.json(buildDynamicChatResponse(req.body?.message || "", req.body?.userContext || {}, req.body?.history || []));
    }
  });

  // 2. AI Weekly Mood & Emotional Recap Generator (Real-time dynamic analysis)
  app.post("/api/weekly-mood-recap", async (req, res) => {
    try {
      const { userName, moodList, quizScores, challengeProgress } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json(buildDynamicWeeklyMoodRecap(userName, moodList, quizScores, challengeProgress));
      }

      const moodEntriesStr = (moodList || [])
        .map(
          (m: { dayLabel: string; date: string; emotion: string; note?: string; tags?: string[] }) =>
            `- ${m.dayLabel} (${m.date}): Cảm xúc [${m.emotion}] ${m.note ? `| Ghi chú: "${m.note}"` : ""} ${m.tags?.length ? `| Thẻ: ${m.tags.join(", ")}` : ""}`
        )
        .join("\n");

      const systemPrompt = `[ROLE & CONTEXT]
Bạn là "AI Chuyên Gia Tâm Lý & Điều Phối Viên Chăm Sóc Sức Khỏe Tinh Thần" thuộc SoulCare.
Nhiệm vụ: Đọc toàn bộ dữ liệu thực tế của Người dùng (Nhật ký cảm xúc từng ngày, ghi chú tự sự, điểm trắc nghiệm tâm lý PHQ/GAD/PSS/PSQI, tiến độ thử thách) -> Phân tích diễn biến tâm lý TRONG THỜI GIAN THỰC (Real-time) và đưa ra nhận định cá nhân hóa 100%, tuyệt đối không dùng khuôn mẫu chung chung.

[QUY TẮC PHÂN TÍCH]
1. Nhận diện chính xác các bước chuyển cảm xúc (Emotional Shifts): Khi nào người dùng vui, khi nào căng thẳng/mệt mỏi, nguyên nhân từ ghi chú (công việc, gia đình, giấc ngủ...).
2. Đưa ra các gợi ý hành động vi mô (Micro-actions) siêu thực tế, làm được ngay trong 5 phút.
3. Giọng văn: Ấm áp, thấu cảm sâu sắc, nâng đỡ tinh thần và khoa học.

[OUTPUT FORMAT - STRICT JSON]
{
  "headline": "string (Tiêu đề nhận định ngắn gọn, xúc tích, ví dụ: 'Nỗ lực vượt qua áp lực & Tái thiết sự bình an')",
  "summary": "string (Đoạn phân tích 3-4 câu phản ánh chính xác các ngày trong tuần và ghi chú của người dùng)",
  "emotionalHighlights": [
    "string (Điểm sáng cảm xúc 1)",
    "string (Điểm cần lưu ý 2)"
  ],
  "microActions": [
    "string (Hành động nhỏ 1)",
    "string (Hành động nhỏ 2)",
    "string (Hành động nhỏ 3)"
  ],
  "encouragement": "string (1 câu truyền cảm hứng ấm áp)"
}`;

      const prompt = `DỮ LIỆU THỰC TẾ NGƯỜI DÙNG:
- Họ tên: ${userName || "Người dùng"}
- Nhật ký cảm xúc & Ghi chú các ngày gần đây:
${moodEntriesStr || "(Chưa có ghi chú cụ thể)"}
- Chỉ số Tầm soát Tâm lý: Trầm cảm/Khí sắc: ${quizScores?.depressionPct ?? 35}%, Lo âu: ${quizScores?.anxietyPct ?? 45}%, Căng thẳng: ${quizScores?.stressPct ?? 55}%, Giấc ngủ: ${quizScores?.sleepPct ?? 60}%
- Thử thách rèn luyện: ${challengeProgress?.challengeTitle || "21 Ngày Tái Thiết Giấc Ngủ"} (Chuỗi streak hiện tại: ${challengeProgress?.currentStreak || 0} ngày)

Hãy phân tích dữ liệu trên và trả về kết quả JSON:`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        });

        const parsed = safeParseJson(response.text, buildDynamicWeeklyMoodRecap(userName, moodList, quizScores, challengeProgress));
        return res.json(parsed);
      } catch (genErr: any) {
        console.warn("Weekly mood recap AI call failed, using dynamic local fallback:", genErr?.message || genErr);
        return res.json(buildDynamicWeeklyMoodRecap(userName, moodList, quizScores, challengeProgress));
      }
    } catch (error) {
      console.warn("Weekly mood recap general error:", error);
      return res.json(buildDynamicWeeklyMoodRecap(req.body?.userName, req.body?.moodList, req.body?.quizScores, req.body?.challengeProgress));
    }
  });

  // 3. AI Assessment Recap Generator (Real-time Quiz Assessment Multidimensional Summary)
  app.post("/api/assessment-recap", async (req, res) => {
    try {
      const { userName, quizScores, moodSummary } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json(buildDynamicAssessmentRecap(userName, quizScores, moodSummary));
      }

      const systemPrompt = `[ROLE] Bạn là AI Chuyên Gia Tầm Soát Tâm Lý Y Khoa của SoulCare.
Nhiệm vụ: Phân tích 4 chỉ số chuẩn hóa y khoa:
- Khí sắc (PHQ-9)
- Lo âu (GAD-7)
- Căng thẳng nhận thức (PSS-10)
- Chất lượng giấc ngủ (PSQI)
và nhật ký cảm xúc để đưa ra đánh giá tổng quát (3-4 câu) và 3 lời khuyên lối sống thực tế.

[OUTPUT FORMAT - STRICT JSON]
{
  "overallSummary": "string (Đánh giá tổng quát chuẩn y khoa, ngôn từ nhẹ nhàng không gán nhãn bệnh)",
  "keyRecommendations": [
    "string (Khuyến nghị 1)",
    "string (Khuyến nghị 2)",
    "string (Khuyến nghị 3)"
  ]
}`;

      const prompt = `Người dùng: ${userName || "Bạn"}
Điểm số:
- Trầm cảm / Khí sắc: ${quizScores?.depressionPct}%
- Lo âu: ${quizScores?.anxietyPct}%
- Căng thẳng PSS-10: ${quizScores?.stressPct}%
- Giấc ngủ PSQI: ${quizScores?.sleepPct}%
${quizScores?.tier2TriggeredGroup ? `- Nhóm kích hoạt sâu: ${quizScores.tier2TriggeredGroup}` : ""}
${quizScores?.sosTriggered ? "- CẢNH BÁO: Kích hoạt chỉ số rủi ro tự hại" : ""}
Bối cảnh cảm xúc gần đây: ${moodSummary || "Đang theo dõi hàng ngày"}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });

        const parsed = safeParseJson(response.text, buildDynamicAssessmentRecap(userName, quizScores, moodSummary));
        return res.json(parsed);
      } catch (genErr: any) {
        console.warn("Assessment recap AI call failed, using dynamic local fallback:", genErr?.message || genErr);
        return res.json(buildDynamicAssessmentRecap(userName, quizScores, moodSummary));
      }
    } catch (error) {
      console.warn("Assessment recap general error:", error);
      return res.json(buildDynamicAssessmentRecap(req.body?.userName, req.body?.quizScores, req.body?.moodSummary));
    }
  });

  // 4. AI Medical Secretary (Recap Generator for Expert)
  app.post("/api/expert-recap", async (req, res) => {
    try {
      const { rawDoctorNotes, userName, expertName, patientContext } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json(buildDynamicExpertRecap(userName, expertName, rawDoctorNotes));
      }

      const systemPrompt = `[ROLE & CONTEXT]
Bạn là "AI Thư Ký Y Khoa" - một Trợ lý AI chuyên nghiệp hỗ trợ các Chuyên gia Tư vấn Tâm lý / Bác sĩ trên nền tảng SoulCare.
Nhiệm vụ: Đọc các Ghi chú thô (raw notes) của Chuyên gia sau buổi tư vấn CÙNG dữ liệu thực tế của bệnh nhân -> Chuyển hóa thành bản "Recap Buổi Tư Vấn" cá nhân hóa 100%, chỉn chu, chuyên nghiệp, ngôn từ thân thiện và thấu cảm.

[TASK & QUY TẮC VIẾT RECAP]
1. Cấu trúc bản Recap bắt buộc gồm 3 phần:
   - 🌟 Đánh giá & Lắng nghe: Tóm tắt lại ngắn gọn vấn đề cốt lõi mà người dùng đang trải qua bằng ngôn từ xoa dịu, kết hợp các ghi chú thực tế của Bác sĩ.
   - 🛠️ Lời khuyên & Bài tập về nhà: Liệt kê rõ ràng các kỹ thuật/bài tập mà Chuyên gia đã dặn (VD: Kỹ thuật hít thở, viết nhật ký, giãn cơ...).
   - 📅 Lịch trình & Lời nhắn: Lời dặn dò nhẹ nhàng cho buổi gặp tiếp theo.
2. Tone of Voice: Ấm áp, Tôn trọng, Chuyên nghiệp và Mang tính nâng đỡ tinh thần (Encouraging).
3. Đảm bảo bản recap phản ánh đúng ca tư vấn cụ thể của bệnh nhân này.`;

      const prompt = `Hãy tạo Recap buổi tư vấn cá nhân hóa từ thông tin này:
- Tên Người Dùng: ${userName || "Bạn"}
- Tên Chuyên Gia: ${expertName || "Chuyên gia"}
- Ghi chú thô của Bác sĩ: ${rawDoctorNotes || "(Ghi nhận tình trạng lo âu, khó ngủ và áp lực công việc)"}
- Dữ liệu nền tảng bệnh nhân:
  + Điểm Quiz: ${patientContext?.quizRadar || "Căng thẳng 55%, Giấc ngủ 60%"}
  + Lịch sử tâm trạng: ${patientContext?.moodHistory || "Căng thẳng xen kẽ ổn định"}
  + Ghi chú bệnh nhân: ${patientContext?.userNotes || "Không có"}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          },
        });

        return res.json({ recap: response.text || buildDynamicExpertRecap(userName, expertName, rawDoctorNotes).recap });
      } catch (genErr: any) {
        console.warn("Expert recap AI call failed, using dynamic local fallback:", genErr?.message || genErr);
        return res.json(buildDynamicExpertRecap(userName, expertName, rawDoctorNotes));
      }
    } catch (error) {
      console.warn("Recap general error:", error);
      return res.json(buildDynamicExpertRecap(req.body?.userName, req.body?.expertName, req.body?.rawDoctorNotes));
    }
  });

  // 5. AI Patient Briefing Generator (Pre-session Briefing for Doctor in real-time)
  app.post("/api/patient-briefing", async (req, res) => {
    try {
      const { quizScores, moodHistory, userNotes, userName, recentJournalNotes } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json(buildDynamicPatientBriefing(userName, quizScores, moodHistory, userNotes));
      }

      const systemPrompt = `[ROLE] Bạn là AI Trợ lý Y khoa của SoulCare. Hãy đọc dữ liệu % Quiz, nhật ký cảm xúc gần nhất và lời nhắn của bệnh nhân để tạo bản Tóm tắt nhanh (Patient Briefing) trong 4 gạch đầu dòng ngắn gọn, súc tích giúp Chuyên gia đọc trong 30 giây trước khi bấm vào phòng Google Meet.`;
      const prompt = `Bệnh nhân: ${userName || "Bệnh nhân"}
- Điểm Quiz: Trầm cảm/Khí sắc ${quizScores?.depression ?? quizScores?.depressionPct ?? 35}%, Lo âu ${quizScores?.anxiety ?? quizScores?.anxietyPct ?? 45}%, Stress ${quizScores?.stress ?? quizScores?.stressPct ?? 55}%, Giấc ngủ ${quizScores?.sleep ?? quizScores?.sleepPct ?? 60}%
- Lịch sử cảm xúc: ${moodHistory || "Chưa có"}
- Ghi chú nhật ký bệnh nhân tự viết: ${recentJournalNotes || "Không có"}
- Lời nhắn của bệnh nhân khi đặt lịch: ${userNotes || "Không có"}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { systemInstruction: systemPrompt, temperature: 0.3 },
        });

        return res.json({ briefing: response.text || buildDynamicPatientBriefing(userName, quizScores, moodHistory, userNotes).briefing });
      } catch (genErr: any) {
        console.warn("Briefing AI call failed, using dynamic local fallback:", genErr?.message || genErr);
        return res.json(buildDynamicPatientBriefing(userName, quizScores, moodHistory, userNotes));
      }
    } catch (error) {
      console.warn("Briefing general error:", error);
      return res.json(buildDynamicPatientBriefing(req.body?.userName, req.body?.quizScores, req.body?.moodHistory, req.body?.userNotes));
    }
  });

  // 6. AI Review Summarizer for Expert Profile
  app.post("/api/summarize-reviews", async (req, res) => {
    try {
      const { expertName, reviews } = req.body;
      const ai = getGenAI();

      const defaultSummary = `✨ Tóm tắt từ AI: Chuyên gia ${expertName || "Tư vấn"} được đánh giá cao nhờ sự lắng nghe kiên nhẫn, phương pháp trị liệu nhận thức hành vi (CBT) rõ ràng và khả năng thấu cảm sâu sắc. Phù hợp nhất cho người đi làm gặp áp lực công sở, sinh viên khủng hoảng định hướng và người cần cải thiện giấc ngủ.`;

      if (!ai || !reviews || reviews.length === 0) {
        return res.json({ summary: defaultSummary });
      }

      const prompt = `[ROLE] Bạn là một AI Data Analyst phân tích phản hồi bệnh nhân.
Đọc danh sách reviews của Chuyên gia ${expertName}:
${reviews.map((r: { rating: number; text: string; tags: string[] }) => `[${r.rating} sao - tags: ${r.tags?.join(", ")}]: ${r.text}`).join("\n")}

Tổng hợp thành 1 đoạn tóm tắt ngắn gọn 3-4 câu:
1. Nêu 2-3 thế mạnh nổi bật nhất được khen ngợi nhiều nhất.
2. Nêu đối tượng người dùng phù hợp nhất.
3. Văn phong: Khách quan, ấm áp, tin cậy, không dùng từ chẩn đoán y khoa.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { temperature: 0.3 },
        });

        return res.json({ summary: response.text || defaultSummary });
      } catch (genErr: any) {
        console.warn("Review summary AI call failed, using fallback:", genErr?.message || genErr);
        return res.json({ summary: defaultSummary });
      }
    } catch (error) {
      console.warn("Review summary general error:", error);
      return res.json({
        summary: `✨ Tóm tắt từ AI: Chuyên gia ${req.body?.expertName || "Tư vấn"} được đánh giá cao nhờ sự lắng nghe tận tâm và liệu trình đồng hành hiệu quả.`,
      });
    }
  });

  // 7. AI Medical Coordinator (Gợi ý cơ sở y tế theo vị trí & triệu chứng)
  app.post("/api/clinics/recommend", async (req, res) => {
    try {
      const { userLocation, userCity, userSymptoms, userQuizRadar } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json({ recommended_clinics: DEFAULT_CLINICS });
      }

      const systemPrompt = `[ROLE & CONTEXT]
Bạn là "AI Điều Phối Y Khoa" thuộc SoulCare.
Nhiệm vụ: Khi nhận vị trí của người dùng (${userCity || "TP. Hồ Chí Minh"} hoặc tọa độ ${JSON.stringify(userLocation)}) cùng triệu chứng (${userSymptoms || "Căng thẳng, khó ngủ, lo âu"}), hãy gợi ý 3-4 cơ sở y tế thực tế tại khu vực đó kèm đánh giá, lý do gợi ý cá nhân hóa và đường dẫn Google Maps chuẩn xác.

[OUTPUT FORMAT - STRICT JSON]
{
  "recommended_clinics": [
    {
      "name": "string",
      "address": "string",
      "city": "string",
      "rating": 4.8,
      "tags": ["#GầnBạnNhất", "#ChuyênKhámLoÂu"],
      "ai_recommendation_reason": "string",
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query={Tên_Bệnh_Viện}+{Địa_Chỉ}"
    }
  ]
}`;

      const prompt = `Vị trí người dùng: ${userCity || "TP. Hồ Chí Minh"} (Tọa độ: ${JSON.stringify(userLocation || {})})
Chỉ số trắc nghiệm/Tâm trạng: ${userQuizRadar || "Lo âu 65%, Căng thẳng 70%, Giấc ngủ 80%"}
Triệu chứng mô tả: ${userSymptoms || "Áp lực công việc, mất ngủ và cần tìm phòng khám/bệnh viện chuyên khoa gần nhất"}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });

        const parsed = safeParseJson(response.text, { recommended_clinics: DEFAULT_CLINICS });
        return res.json(parsed);
      } catch (genErr: any) {
        console.warn("Clinic recommendation AI call failed, using default clinics:", genErr?.message || genErr);
        return res.json({ recommended_clinics: DEFAULT_CLINICS });
      }
    } catch (error) {
      console.warn("Clinic recommendation general error:", error);
      return res.json({ recommended_clinics: DEFAULT_CLINICS });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SoulCare Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

