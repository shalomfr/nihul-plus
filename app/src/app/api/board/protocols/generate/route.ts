import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const OPENROUTER_API_KEY = "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";

type Message = { role: "user" | "assistant" | "system"; content: string };

async function callOpenRouter(messages: Message[]) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages,
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const SYSTEM_PROMPT = `אתה עוזר חכם ליצירת פרוטוקולים לישיבות ועד של עמותות בישראל.
אתה מנהל שאלון אינטראקטיבי — שואל שאלות אחת אחרי השנייה כדי לאסוף את כל המידע הדרוש.

כללי התנהלות:
- שאל שאלה אחת בכל פעם, בעברית טבעית ונעימה
- התחל בשאלה על נושא הישיבה/הדיון המרכזי
- המשך לשאול על: משתתפים, החלטות שהתקבלו, הצבעות (בעד/נגד/נמנע), נושאים נוספים, משימות להמשך
- כשיש מספיק מידע (בדרך כלל 4-7 שאלות), שאל "האם יש משהו נוסף?" — ואם לא, צור את הפרוטוקול

כשאתה שואל שאלה, החזר JSON:
{"type":"question","text":"השאלה שלך כאן","hint":"רמז קצר אופציונלי"}

כשאתה מוכן ליצור את הפרוטוקול, החזר JSON:
{"type":"protocol","content":"תוכן הפרוטוקול המלא כאן"}

פורמט הפרוטוקול:
- כותרת: "פרוטוקול ישיבת [סוג] מתאריך [תאריך]"
- משתתפים: רשימה
- סדר יום
- דיון בנושאים — תיאור קצר של כל דיון
- החלטות — ממוספרות, עם תוצאות הצבעה אם רלוונטי
- משימות להמשך — מי אחראי ועד מתי
- חתימות: "יו״ר הישיבה: _____ | מזכיר/ה: _____"

חשוב: החזר רק JSON תקין, ללא טקסט נוסף מחוץ ל-JSON.`;

// POST /api/board/protocols/generate
// body: { messages: Message[], meetingId?: string }
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = await req.json();
  const { messages, meetingId } = body as { messages: Message[]; meetingId?: string };

  if (!messages || !Array.isArray(messages)) {
    return apiError("messages נדרש", 400);
  }

  // Build conversation with system prompt
  const fullMessages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const aiResponse = await callOpenRouter(fullMessages);

  // Try to parse AI response as JSON
  let parsed;
  try {
    // Extract JSON from response (AI might wrap it in markdown code blocks)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { type: "question", text: aiResponse };
  } catch {
    parsed = { type: "question", text: aiResponse };
  }

  // If protocol is generated and meetingId provided, save it
  if (parsed.type === "protocol" && meetingId) {
    // Check if protocol already exists for this meeting
    const existing = await prisma.meetingProtocol.findUnique({
      where: { meetingId },
    });

    if (existing) {
      await prisma.meetingProtocol.update({
        where: { meetingId },
        data: { content: parsed.content },
      });
    } else {
      await prisma.meetingProtocol.create({
        data: {
          meetingId,
          content: parsed.content,
        },
      });
    }

    // Update meeting status to COMPLETED
    await prisma.boardMeeting.update({
      where: { id: meetingId },
      data: { status: "COMPLETED" },
    });
  }

  return apiResponse(parsed);
});
