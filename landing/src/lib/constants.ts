import {
  ShieldCheck, Users, Landmark, FileText,
  BarChart3, Calendar, Heart, BookOpen,
} from "lucide-react";

export const FEATURES = [
  {
    icon: ShieldCheck,
    title: "ניהול תקין",
    description: "מעקב אוטומטי אחרי כל דרישות הרגולציה וציון תקינות בזמן אמת",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    icon: Users,
    title: "ועד מנהל",
    description: "ניהול ישיבות, פרוטוקולים, החלטות וחברי ועד במקום אחד",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    icon: Landmark,
    title: "בנק והוצאות",
    description: "סנכרון אוטומטי עם חשבון הבנק, מעקב הוצאות ותזרים",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    icon: FileText,
    title: "מסמכים",
    description: "אחסון, ניהול וגישה מהירה לכל מסמכי העמותה",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    icon: BarChart3,
    title: "דוחות ותקציב",
    description: "דוחות כספיים, ניהול תקציב ומעקב ביצוע מול תכנון",
    color: "#d97706",
    bg: "#fffbeb",
  },
  {
    icon: Calendar,
    title: "לוח שנה",
    description: "תזכורות חכמות לדדליינים, ישיבות ודיווחים רגולטוריים",
    color: "#e11d48",
    bg: "#fff1f2",
  },
  {
    icon: Heart,
    title: "תורמים ומתנדבים",
    description: "ניהול קשרי תורמים, מעקב תרומות ושעות התנדבות",
    color: "#f59e0b",
    bg: "#fefce8",
  },
  {
    icon: BookOpen,
    title: "נהלים ותקנון",
    description: "נהלי התקשרויות, תמיכות, העסקה ותקנון העמותה",
    color: "#8b5cf6",
    bg: "#faf5ff",
  },
];

export const STATS = [
  { value: 100, suffix: "+", label: "עמותות פעילות" },
  { value: 98, suffix: "%", label: "ציון ניהול תקין ממוצע" },
  { value: 50000, suffix: "+", label: "מסמכים מנוהלים" },
  { value: 24, suffix: "/7", label: "ניטור אוטומטי" },
];

export const STEPS = [
  {
    number: "01",
    title: "הירשמו תוך 2 דקות",
    description: "הכניסו את פרטי העמותה ומספר הרישום — אנחנו נעשה את השאר",
  },
  {
    number: "02",
    title: "המערכת סורקת ומנתחת",
    description: "מעטפת סורקת את מצב העמותה, מזהה חוסרים ובונה תוכנית פעולה",
  },
  {
    number: "03",
    title: "קבלו שקט נפשי",
    description: "קבלו ציון ניהול תקין, תזכורות אוטומטיות ומלווה אישי שתמיד לצידכם",
  },
];

export const COMPLIANCE_ITEMS = [
  "מסמכי יסוד ותקנון",
  "דיווחים שנתיים לרשם העמותות",
  "אישורי מס הכנסה (סעיף 46)",
  "פרוטוקולים ואסיפות כלליות",
  "ביטוחים ונהלי העסקה",
];

export const NAV_LINKS = [
  { label: "תכונות", href: "#features" },
  { label: "איך זה עובד", href: "#how-it-works" },
  { label: "ניהול תקין", href: "#compliance" },
  { label: "צור קשר", href: "#contact" },
];

export const APP_URL = "https://matefet.onrender.com";
