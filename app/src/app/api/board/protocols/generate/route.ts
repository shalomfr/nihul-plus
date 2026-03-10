import { requireManager, apiResponse, apiError, withErrorHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

async function callOpenRouter(prompt: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[OpenRouter] API error:", res.status, errText);
    throw new Error(`OpenRouter error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[OpenRouter] Empty response:", JSON.stringify(data));
    throw new Error("Empty response from AI");
  }
  return content as string;
}

type GenerateBody = {
  meetingId?: string;
  meetingTitle?: string;
  meetingDate?: string;
  meetingLocation?: string;
  subject: string;
  discussion: string;
  decisions: string;
  participants: { name: string; role: string }[];
  guests?: { name: string; role?: string }[];
};

// POST /api/board/protocols/generate
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireManager();
  const body = (await req.json()) as GenerateBody;

  if (!body.subject?.trim()) {
    return apiError("נושא הישיבה נדרש", 400);
  }
  if (!body.participants?.length) {
    return apiError("יש לבחור לפחות משתתף אחד", 400);
  }

  // Fetch organization data
  const org = user.organizationId
    ? await prisma.organization.findUnique({ where: { id: user.organizationId } })
    : null;

  // If meetingId provided, fetch meeting details
  let meeting = null;
  if (body.meetingId) {
    meeting = await prisma.boardMeeting.findUnique({ where: { id: body.meetingId } });
  }

  const meetingTitle = meeting?.title ?? body.meetingTitle ?? "ישיבת ועד";
  const meetingDate = meeting?.date
    ? new Date(meeting.date).toLocaleDateString("he-IL")
    : body.meetingDate ?? new Date().toLocaleDateString("he-IL");
  const meetingLocation = meeting?.location ?? body.meetingLocation ?? "";

  // Build participants list
  const allParticipants = [
    ...body.participants.map(p => `${p.name} - ${p.role}`),
    ...(body.guests ?? []).map(g => `${g.name}${g.role ? ` - ${g.role}` : " - אורח/ת"}`),
  ];

  const prompt = `אתה כותב פרוטוקולים רשמיים לישיבות ועד של עמותות בישראל.
צור פרוטוקול פורמלי ומפורט על בסיס הנתונים שלהלן.

הנחיות:
- כתוב בעברית רשמית ופורמלית
- הרחב את תיאור הדיון לפסקאות שלמות — תאר מה הוצג בפני חברי הוועד, מה נדון, ואיך הגיעו להחלטות
- אם יש החלטות, תאר הצבעה (פה אחד / רוב קולות) והוסף ניסוח משפטי מדויק
- אל תמציא שמות או נתונים שלא סופקו — השתמש רק במידע שניתן
- החזר טקסט פשוט בלבד, ללא markdown, ללא JSON

פורמט הפרוטוקול:

בס"ד
פרוטוקול ${meetingTitle}${org ? ` - ${org.name}` : ""}
${org?.number ? `ע"ר ${org.number}` : ""}
שנערכה ביום ${meetingDate}${meetingLocation ? ` ב${meetingLocation}` : ""}

משתתפים:
${allParticipants.join("\n")}

על סדר היום: ${body.subject}

[כאן כתוב דיון מפורט בכמה פסקאות, על בסיס התיאור והחלטות שלהלן]

[החלטות ממוספרות]

_________________\t_________________
[שם חותם 1]\t[שם חותם 2]
[תפקיד]\t[תפקיד]

--- נתונים לעיבוד ---
תיאור הדיון: ${body.discussion || "לא סופק - הרחב על בסיס הנושא וההחלטות"}
החלטות שהתקבלו: ${body.decisions || "לא סופקו החלטות ספציפיות"}
החותמים: קח את שני המשתתפים הראשונים ברשימה`;

  let protocolText: string;
  try {
    protocolText = await callOpenRouter(prompt);
  } catch (err) {
    console.error("[Protocol Generate] OpenRouter call failed:", err);
    return apiError("שגיאה בחיבור ל-AI. נסה שוב.", 502);
  }

  // Clean up markdown code blocks if AI wraps them
  protocolText = protocolText.replace(/^```[\w]*\n?/gm, "").replace(/```$/gm, "").trim();

  // Save to DB if meetingId provided
  if (body.meetingId) {
    const existing = await prisma.meetingProtocol.findUnique({
      where: { meetingId: body.meetingId },
    });

    if (existing) {
      await prisma.meetingProtocol.update({
        where: { meetingId: body.meetingId },
        data: { content: protocolText },
      });
    } else {
      await prisma.meetingProtocol.create({
        data: {
          meetingId: body.meetingId,
          content: protocolText,
        },
      });
    }

    await prisma.boardMeeting.update({
      where: { id: body.meetingId },
      data: { status: "COMPLETED" },
    });
  }

  return apiResponse({ content: protocolText });
});
