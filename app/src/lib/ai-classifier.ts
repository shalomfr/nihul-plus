/**
 * AI Transaction Classifier — uses Claude Haiku to categorize bank transactions.
 * Called by classify-transactions cron job.
 */
import Anthropic from "@anthropic-ai/sdk";

export type TransactionCategory =
  | "SALARIES"
  | "RENT"
  | "ACTIVITIES"
  | "MARKETING"
  | "ADMINISTRATION"
  | "TRANSPORTATION"
  | "SUPPLIES"
  | "PROFESSIONAL_SERVICES"
  | "INSURANCE"
  | "MAINTENANCE"
  | "DONATIONS_INCOME"
  | "GRANTS_INCOME"
  | "OTHER";

const CATEGORY_DESCRIPTIONS: Record<TransactionCategory, string> = {
  SALARIES: "משכורות, שכר עבודה, הפרשות לפנסיה/קרן השתלמות",
  RENT: "שכירות, ארנונה, ועד בית",
  ACTIVITIES: "פעילויות, אירועים, פרויקטים, קורסים",
  MARKETING: "פרסום, שיווק, עיצוב, דפוס",
  ADMINISTRATION: "הנהלה, כלליות, ציוד משרדי, טלפון, אינטרנט",
  TRANSPORTATION: "תחבורה, נסיעות, רכב, דלק",
  SUPPLIES: "ציוד, חומרים, מוצרים",
  PROFESSIONAL_SERVICES: "שירותים מקצועיים, יעוץ, עו\"ד, רואה חשבון",
  INSURANCE: "ביטוח",
  MAINTENANCE: "תחזוקה, תיקונים, שיפוץ",
  DONATIONS_INCOME: "תרומות שהתקבלו, תרומות ציבור",
  GRANTS_INCOME: "מענקים, תמיכות, כספי ממשלה",
  OTHER: "אחר, לא ברור",
};

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function classifyTransaction(
  description: string,
  amount: number,
  direction: "CREDIT" | "DEBIT"
): Promise<{ category: TransactionCategory; confidence: number; reasoning: string }> {
  const ai = getClient();

  // Fallback: simple rule-based classification
  if (!ai) {
    return ruleBasedClassify(description, direction);
  }

  const categoriesText = Object.entries(CATEGORY_DESCRIPTIONS)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  try {
    const msg = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `אתה מסווג עסקאות בנק לעמותה ישראלית.

עסקה:
- תיאור: "${description}"
- סכום: ₪${amount}
- כיוון: ${direction === "CREDIT" ? "זיכוי (הכנסה)" : "חיוב (הוצאה)"}

קטגוריות אפשריות:
${categoriesText}

ענה בפורמט JSON בלבד:
{"category": "CATEGORY_NAME", "confidence": 0-100, "reasoning": "הסבר קצר"}`,
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.category && CATEGORY_DESCRIPTIONS[parsed.category as TransactionCategory]) {
        return {
          category: parsed.category as TransactionCategory,
          confidence: Number(parsed.confidence) || 70,
          reasoning: parsed.reasoning ?? "",
        };
      }
    }
  } catch (err) {
    console.error("[ai-classifier] Error:", err);
  }

  // Fallback to rules
  return ruleBasedClassify(description, direction);
}

function ruleBasedClassify(
  description: string,
  direction: "CREDIT" | "DEBIT"
): { category: TransactionCategory; confidence: number; reasoning: string } {
  const lower = description.toLowerCase();

  if (direction === "CREDIT") {
    if (/תרומ/.test(lower)) return { category: "DONATIONS_INCOME", confidence: 85, reasoning: "זיכוי עם מילת תרומה" };
    if (/מענק|תמיכ|ממשלה|עיריה|עירייה/.test(lower)) return { category: "GRANTS_INCOME", confidence: 80, reasoning: "מענק ממשלתי" };
  }

  if (/משכורת|שכר|שכ"ע|פנסי|קה"ש|קרן השתלמות/.test(lower)) return { category: "SALARIES", confidence: 90, reasoning: "ביטוי שכר" };
  if (/שכירות|שכיר|ארנונה|ועד בית/.test(lower)) return { category: "RENT", confidence: 88, reasoning: "שכירות/ארנונה" };
  if (/דלק|רכב|נסיע|תחבורה|רכבת|אוטובוס/.test(lower)) return { category: "TRANSPORTATION", confidence: 85, reasoning: "תחבורה" };
  if (/פרסום|שיווק|דפוס|עיצוב/.test(lower)) return { category: "MARKETING", confidence: 82, reasoning: "פרסום/שיווק" };
  if (/ביטוח/.test(lower)) return { category: "INSURANCE", confidence: 90, reasoning: "ביטוח" };
  if (/עורך דין|עו\"ד|רואה חשבון|יעוץ|ייעוץ/.test(lower)) return { category: "PROFESSIONAL_SERVICES", confidence: 85, reasoning: "שירות מקצועי" };
  if (/תיקון|שיפוץ|תחזוקה|ניקיון/.test(lower)) return { category: "MAINTENANCE", confidence: 80, reasoning: "תחזוקה" };
  if (/ציוד|מחשב|סמארטפון|מדפסת/.test(lower)) return { category: "SUPPLIES", confidence: 78, reasoning: "ציוד" };
  if (/פעילות|אירוע|קורס|סדנה|הרצאה/.test(lower)) return { category: "ACTIVITIES", confidence: 82, reasoning: "פעילות" };
  if (/טלפון|אינטרנט|חשמל|מים|גז/.test(lower)) return { category: "ADMINISTRATION", confidence: 80, reasoning: "הוצאות כלליות" };

  return { category: "OTHER", confidence: 50, reasoning: "לא ניתן לסווג" };
}
