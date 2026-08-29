import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
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
        // Fallback response if no API key
        const isFreeAvailable = userContext?.free_session_status === "AVAILABLE" || !userContext?.free_session_status;
        let msg = `Chào ${userContext?.user_name || "bạn"}, Hi luôn ở đây để lắng nghe và đồng hành cùng bạn. `;
        let action: string = "NONE";
        let btnText: string | null = null;

        if (lowerMsg.includes("thở") || lowerMsg.includes("căng thẳng") || lowerMsg.includes("stress")) {
          msg += `Khi cảm thấy quá tải, bạn có muốn thử dành 3 phút hít thở sâu cùng Hi không?`;
          action = "NAVIGATE_BREATHING";
          btnText = "👉 Thử bài tập hít thở ngay";
        } else if (lowerMsg.includes("ngủ") || lowerMsg.includes("mất ngủ") || lowerMsg.includes("mệt")) {
          msg += `Hi có góc âm thanh tần số sóng não Delta và tiếng mưa rất êm dịu, bạn thử nghe một chút nhé?`;
          action = "NAVIGATE_HEALING_HUB";
          btnText = "👉 Mở Góc Âm Thanh & Podcast";
        } else if (lowerMsg.includes("gói") || lowerMsg.includes("lộ trình") || lowerMsg.includes("chi phí") || lowerMsg.includes("điều trị")) {
          if (isFreeAvailable) {
            msg += `Bạn có thể bắt đầu với Buổi Khởi Đầu (Tầm Soát & Kết Nối 1-1) hoàn toàn miễn phí (0đ) để làm quen cùng Chuyên gia nhé!`;
            action = "NAVIGATE_BOOKING_FREE";
            btnText = "👉 Đặt Lịch Tư Vấn 0đ";
          } else {
            msg += `Dựa trên ghi chú từ Chuyên gia, Hi có các Gói Tháo Gỡ (3 buổi) và Gói Chuyển Hóa (5-10 buổi) với chi phí tiết kiệm để đồng hành lâu dài cùng bạn.`;
            action = "VIEW_CARE_PLANS";
            btnText = "👉 Xem Lộ Trình Đề Xuất";
          }
        } else if (isFreeAvailable && (lowerMsg.includes("bác sĩ") || lowerMsg.includes("khám") || lowerMsg.includes("chuyên gia") || lowerMsg.includes("tư vấn"))) {
          msg += `Hiện bạn đang có quyền lợi Buổi Khởi Đầu (Tầm Soát & Kết Nối 1-1) hoàn toàn miễn phí (0đ). Bạn có muốn đặt lịch làm quen cùng Chuyên gia không?`;
          action = "NAVIGATE_BOOKING_FREE";
          btnText = "👉 Đặt Lịch Tư Vấn 0đ";
        } else {
          msg += `Bạn có muốn chia sẻ thêm với Hi về những cảm xúc hay trải nghiệm bạn đang trải qua hôm nay không?`;
        }

        return res.json({
          message_to_user: msg,
          suggested_action: action,
          action_button_text: btnText,
          context_insight: "Fallback offline heuristic logic",
          isCrisis: false,
        });
      }

      const systemInstruction = `[ROLE & CONTEXT]
Bạn là "Hi" - Trợ Lý Tri Kỷ AI & Điều Phối Viên Chăm Sóc Sức Khỏe Tinh Thần trên nền tảng SoulCare.
Mục tiêu: Đồng hành, lắng nghe không phán xét, giải đáp thắc mắc về ghi chú Recap của Chuyên gia, và đề xuất các Gói Đồng Hành Điều Trị phù hợp với ngân sách của người dùng sau buổi tư vấn miễn phí đầu tiên.

[ETHICAL & MEDICAL GUARDRAILS - BẮT BUỘC]
1. KHÔNG tự xưng là Bác sĩ hay Chuyên gia y tế; KHÔNG đưa ra kết luận chẩn đoán lâm sàng hay kê đơn thuốc.
2. Mọi đề xuất chi phí/gói điều trị phải xuất phát từ sự thấu cảm và nhu cầu thực tế, TUYỆT ĐỐI KHÔNG ép buộc mua hàng (No Hard-selling).
3. Đảm bảo bảo mật y khoa: Chỉ trao đổi dựa trên các dữ liệu tóm tắt được người dùng cho phép.

[INPUT CONTEXT SCHEMA]
- user_name: "${userContext?.user_name || userContext?.userName || "Bạn"}"
- quiz_radar_summary: "${userContext?.quiz_radar_summary || `Trầm cảm: ${userContext?.quizDepression ?? 35}%, Lo âu: ${userContext?.quizAnxiety ?? 45}%, Căng thẳng: ${userContext?.quizStress ?? 55}%, Giấc ngủ: ${userContext?.quizSleep ?? 60}%`}"
- mood_history_7days: "${userContext?.mood_history_7days || userContext?.moodHistory || "Chưa có dữ liệu"}"
- active_challenge: "${userContext?.active_challenge || userContext?.activeChallenge || "Chưa chọn"} (Streak: ${userContext?.streakCount ?? 0} ngày)"
- free_session_status: "${userContext?.free_session_status || "AVAILABLE"}"
- latest_expert_recap: ${JSON.stringify(userContext?.latest_expert_recap || {
  expert_name: "Chuyên gia Tâm lý",
  recommended_plan: "STARTER_FREE",
  doctor_notes_summary: userContext?.latestDoctorRecap || "Chưa có buổi khám",
})}
- sos_buddy_name: "${userContext?.sos_buddy_name || userContext?.sosBuddyName || "Người thân"}"

[MONETIZATION & CARE PLAN LOGIC]
1. Khi free_session_status == "AVAILABLE":
- Nhắc nhở người dùng về quyền lợi: "Buổi Khởi Đầu (Tầm Soát & Kết Nối 1-1) hoàn toàn miễn phí (0đ)".
- Gợi ý đặt lịch làm quen với Chuyên gia mà không tạo áp lực tài chính: suggested_action = "NAVIGATE_BOOKING_FREE", action_button_text = "👉 Đặt Lịch Tư Vấn 0đ".

2. Khi free_session_status == "COMPLETED" (Sau khi nhận Recap từ Chuyên gia):
- Dựa vào latest_expert_recap.recommended_plan để tư vấn lộ trình đồng hành tiếp theo:
  * Gói Tháo Gỡ (3 buổi - Can thiệp ngắn hạn/Lo âu cấp tính): ~890.000đ.
  * Gói Chuyển Hóa (5 - 10 buổi - Trị liệu chuyên sâu/Mất ngủ kinh niên): 1.500.000đ - 2.800.000đ (Tiết kiệm 20%).
- Ngôn từ đề xuất: Nhẹ nhàng, giải thích rõ giá trị của việc theo sát lộ trình để duy trì kết quả, đính kèm nút hành động: suggested_action = "VIEW_CARE_PLANS", action_button_text = "👉 Xem Lộ Trình Đề Xuất".

[CRISIS DETECTION & SAFETY PROTOCOL (SOS TRIGGER)]
Nếu người dùng xuất hiện các từ khóa/ý niệm liên quan đến: Tự tử, tự hại, muốn biến mất, kết thúc cuộc sống, làm đau bản thân:
1. DỪNG NGAY LẬP TỨC mọi hội thoại thông thường và tư vấn gói dịch vụ.
2. Trả về đúng 1 thông điệp xoa dịu ngắn gọn:
   "Hi nghe thấy bạn đang phải trải qua cơn đau đớn rất lớn. Bạn không phải gánh chịu điều này một mình. Hãy để Hi kết nối bạn với sự hỗ trợ an toàn nhất ngay lúc này nhé."
3. suggested_action = "TRIGGER_SOS", action_button_text = "🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp".

[OUTPUT FORMAT - STRUCTURED JSON]
Bắt buộc trả về đúng định dạng JSON thuần túy (không bọc trong markdown codeblock nếu có thể, hoặc chuẩn JSON) với cấu trúc:
{
  "message_to_user": "string (Nội dung phản hồi ấm áp, thấu cảm, dưới 100 từ)",
  "suggested_action": "NAVIGATE_BREATHING | NAVIGATE_HEALING_HUB | NAVIGATE_BOOKING_FREE | VIEW_CARE_PLANS | TRIGGER_SOS | NONE",
  "action_button_text": "string (VD: 👉 Xem Lộ Trình Đề Xuất / 👉 Đặt Lịch Tư Vấn 0đ / null)",
  "context_insight": "string (Ghi chú nội bộ về diễn biến tâm trạng người dùng)"
}`;

      const historyFormatted = (history || [])
        .slice(-4)
        .map((h: { sender: string; text: string }) => `${h.sender === "user" ? "User" : "Hi"}: ${h.text}`)
        .join("\n");

      const prompt = `Lịch sử hội thoại:\n${historyFormatted || "(Chưa có)"}\n\nTin nhắn người dùng: "${message}"\n\nHãy phản hồi theo đúng cấu trúc JSON yêu cầu:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
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
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        message_to_user: "Hi đang lắng nghe bạn. Khi cảm thấy căng thẳng, bạn có muốn thử hít thở thật sâu cùng Hi một chút không?",
        suggested_action: "NAVIGATE_BREATHING",
        action_button_text: "👉 Thử bài tập hít thở ngay",
        context_insight: "Lỗi kết nối máy chủ, fallback xoa dịu",
        isCrisis: false,
      });
    }
  });

  // 2. AI Weekly Mood & Emotional Recap Generator (Real-time dynamic analysis)
  app.post("/api/weekly-mood-recap", async (req, res) => {
    try {
      const { userName, moodList, quizScores, challengeProgress } = req.body;
      const ai = getGenAI();

      const moodEntriesStr = (moodList || [])
        .map(
          (m: { dayLabel: string; date: string; emotion: string; note?: string; tags?: string[] }) =>
            `- ${m.dayLabel} (${m.date}): Cảm xúc [${m.emotion}] ${m.note ? `| Ghi chú: "${m.note}"` : ""} ${m.tags?.length ? `| Thẻ: ${m.tags.join(", ")}` : ""}`
        )
        .join("\n");

      if (!ai) {
        // Dynamic fallback based on actual counts
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

        return res.json({
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
        });
      }

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

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      });

      const parsed = safeParseJson(response.text, {
        headline: "Tâm trạng tuần này duy trì ở mức cân bằng",
        summary: `Chào ${userName || "bạn"}, bạn đang duy trì nhịp sống tương đối ổn định. Hãy chú ý lắng nghe cơ thể và dành thời gian nghỉ ngơi thư giãn nhé.`,
        emotionalHighlights: ["Nhịp sinh hoạt được duy trì đều đặn", "Cần chú ý thư giãn trước giờ ngủ"],
        microActions: [
          "Dành 3-5 phút thực hành thở 4-7-8 trước khi đi ngủ",
          "Viết nhanh 3 điều biết ơn vào nhật ký cảm xúc mỗi tối",
        ],
        encouragement: "Mỗi cảm xúc đều là một thông điệp quý giá từ cơ thể. Hi luôn đồng hành cùng bạn!",
      });
      return res.json(parsed);
    } catch (error) {
      console.error("Weekly mood recap error:", error);
      res.status(500).json({ error: "Không thể phân tích tâm trạng tuần lúc này" });
    }
  });

  // 3. AI Assessment Recap Generator (Real-time Quiz Assessment Multidimensional Summary)
  app.post("/api/assessment-recap", async (req, res) => {
    try {
      const { userName, quizScores, moodSummary } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          overallSummary: `Dựa trên kết quả tầm soát 4 chiều, mức độ lo âu (${quizScores?.anxietyPct || 45}%) và căng thẳng (${quizScores?.stressPct || 55}%) của ${userName || "bạn"} đang ở ngưỡng vừa phải. Giấc ngủ (${quizScores?.sleepPct || 60}%) cần được chú ý cải thiện bằng các thói quen thư giãn trước khi ngủ.`,
          keyRecommendations: [
            "Tập thở 4-7-8 hoặc nghe âm thanh sóng não Delta mỗi tối",
            "Đặt lịch tham vấn 0đ cùng Bác sĩ CBT để được định hướng cá nhân hóa",
            "Duy trì thói quen viết nhật ký cảm xúc để giải tỏa tâm trí",
          ],
        });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const parsed = safeParseJson(response.text, {
        overallSummary: `Dựa trên kết quả tầm soát 4 chiều, mức độ lo âu (${quizScores?.anxietyPct || 45}%) và căng thẳng (${quizScores?.stressPct || 55}%) của ${userName || "bạn"} đang ở ngưỡng vừa phải. Giấc ngủ (${quizScores?.sleepPct || 60}%) cần được chú ý cải thiện bằng các thói quen thư giãn trước khi ngủ.`,
        keyRecommendations: [
          "Tập thở 4-7-8 hoặc nghe âm thanh sóng não Delta mỗi tối",
          "Đặt lịch tham vấn 0đ cùng Bác sĩ CBT để được định hướng cá nhân hóa",
          "Duy trì thói quen viết nhật ký cảm xúc để giải tỏa tâm trí",
        ],
      });
      return res.json(parsed);
    } catch (error) {
      console.error("Assessment recap error:", error);
      res.status(500).json({ error: "Không thể tạo tóm tắt tầm soát" });
    }
  });

  // 4. AI Medical Secretary (Recap Generator for Expert)
  app.post("/api/expert-recap", async (req, res) => {
    try {
      const { rawDoctorNotes, userName, expertName, patientContext } = req.body;
      const ai = getGenAI();

      if (!ai) {
        // Fallback structured template
        return res.json({
          recap: `Chào ${userName || "Bạn"}, cảm ơn bạn đã dành thời gian chia sẻ cùng Chuyên gia ${expertName || "Tâm lý"} trong buổi tư vấn hôm nay. Dưới đây là tóm tắt mấu chốt để bạn dễ dàng theo dõi hành trình của mình:\n\n1. 🌟 Đánh giá & Lắng nghe:\n- ${rawDoctorNotes || "Bạn đang trải qua giai đoạn căng thẳng do áp lực công việc và chất lượng giấc ngủ cần được chăm sóc thêm."}\n\n2. 🛠️ Lời khuyên & Bài tập nhỏ tuần này:\n- Thực hành bài tập hít thở 4-7-8 mỗi tối trước khi đi ngủ (3-5 phút).\n- Ghi lại 3 điều nhỏ khiến bạn mỉm cười trong Emotional Diary.\n- Cho phép bản thân nghỉ ngơi 15 phút giữa giờ làm việc.\n\n3. 📅 Lời nhắn từ Chuyên gia:\n- Bạn đã rất dũng cảm khi bước đầu đối diện với cảm xúc của mình. Hãy thả lỏng và tiến từng bước nhỏ nhé! Hẹn gặp bạn ở buổi tiếp theo.`,
        });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
        },
      });

      return res.json({ recap: response.text || "Bản recap đã được khởi tạo." });
    } catch (error) {
      console.error("Recap error:", error);
      res.status(500).json({ error: "Không thể tạo recap tự động" });
    }
  });

  // 5. AI Patient Briefing Generator (Pre-session Briefing for Doctor in real-time)
  app.post("/api/patient-briefing", async (req, res) => {
    try {
      const { quizScores, moodHistory, userNotes, userName, recentJournalNotes } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          briefing: `📌 BRIEFING NHANH CHO CHUYÊN GIA (Bệnh nhân: ${userName || "Khách hàng"}):\n• Chỉ số trọng tâm: Căng thẳng PSS-10: ${quizScores?.stress || quizScores?.stressPct || 65}% | Khí sắc PHQ-9: ${quizScores?.depression || quizScores?.depressionPct || 60}% | Giấc ngủ: ${quizScores?.sleep || quizScores?.sleepPct || 70}%\n• Diễn biến tâm trạng gần đây: ${moodHistory || "User ghi nhận tâm trạng mệt mỏi và lo âu trong các ngày gần nhất."}\n• Lời nhắn tiền tư vấn: "${userNotes || "Bệnh nhân khó ngủ và tim đập nhanh khi áp lực công việc."}"\n• Gợi ý mở lời: Hỏi thăm nhẹ nhàng về chất lượng giấc ngủ tuần qua và không gian làm việc.`,
        });
      }

      const systemPrompt = `[ROLE] Bạn là AI Trợ lý Y khoa của SoulCare. Hãy đọc dữ liệu % Quiz, nhật ký cảm xúc gần nhất và lời nhắn của bệnh nhân để tạo bản Tóm tắt nhanh (Patient Briefing) trong 4 gạch đầu dòng ngắn gọn, súc tích giúp Chuyên gia đọc trong 30 giây trước khi bấm vào phòng Google Meet.`;
      const prompt = `Bệnh nhân: ${userName || "Bệnh nhân"}
- Điểm Quiz: Trầm cảm/Khí sắc ${quizScores?.depression ?? quizScores?.depressionPct ?? 35}%, Lo âu ${quizScores?.anxiety ?? quizScores?.anxietyPct ?? 45}%, Stress ${quizScores?.stress ?? quizScores?.stressPct ?? 55}%, Giấc ngủ ${quizScores?.sleep ?? quizScores?.sleepPct ?? 60}%
- Lịch sử cảm xúc: ${moodHistory || "Chưa có"}
- Ghi chú nhật ký bệnh nhân tự viết: ${recentJournalNotes || "Không có"}
- Lời nhắn của bệnh nhân khi đặt lịch: ${userNotes || "Không có"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { systemInstruction: systemPrompt, temperature: 0.3 },
      });

      return res.json({ briefing: response.text });
    } catch (error) {
      console.error("Briefing error:", error);
      res.status(500).json({ error: "Không thể tạo briefing" });
    }
  });

  // 4. AI Review Summarizer for Expert Profile
  app.post("/api/summarize-reviews", async (req, res) => {
    try {
      const { expertName, reviews } = req.body;
      const ai = getGenAI();

      if (!ai || !reviews || reviews.length === 0) {
        return res.json({
          summary: `✨ Tóm tắt từ AI: Chuyên gia ${expertName || "Tư vấn"} được đánh giá cao nhờ sự lắng nghe kiên nhẫn, phương pháp trị liệu nhận thức hành vi (CBT) rõ ràng và khả năng thấu cảm sâu sắc. Phù hợp nhất cho người đi làm gặp áp lực công sở, sinh viên khủng hoảng định hướng và người cần cải thiện giấc ngủ.`,
        });
      }

      const prompt = `[ROLE] Bạn là một AI Data Analyst phân tích phản hồi bệnh nhân.
Đọc danh sách reviews của Chuyên gia ${expertName}:
${reviews.map((r: { rating: number; text: string; tags: string[] }) => `[${r.rating} sao - tags: ${r.tags?.join(", ")}]: ${r.text}`).join("\n")}

Tổng hợp thành 1 đoạn tóm tắt ngắn gọn 3-4 câu:
1. Nêu 2-3 thế mạnh nổi bật nhất được khen ngợi nhiều nhất.
2. Nêu đối tượng người dùng phù hợp nhất.
3. Văn phong: Khách quan, ấm áp, tin cậy, không dùng từ chẩn đoán y khoa.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { temperature: 0.3 },
      });

      return res.json({ summary: response.text });
    } catch (error) {
      console.error("Review summary error:", error);
      res.status(500).json({ error: "Không thể tóm tắt review" });
    }
  });

  // 5. AI Medical Coordinator (Gợi ý cơ sở y tế theo vị trí & triệu chứng)
  app.post("/api/clinics/recommend", async (req, res) => {
    try {
      const { userLocation, userCity, userSymptoms, userQuizRadar } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          recommended_clinics: [
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
          ],
        });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const fallbackClinics = [
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
      ];

      const parsed = safeParseJson(response.text, { recommended_clinics: fallbackClinics });
      return res.json(parsed);
    } catch (error) {
      console.error("Clinic recommendation error:", error);
      res.status(500).json({ error: "Không thể gợi ý cơ sở y tế lúc này" });
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
