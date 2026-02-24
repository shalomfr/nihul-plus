import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מעטפת — ניהול תקין לעמותות",
  description:
    "מערכת הניהול התקין החכמה לעמותות בישראל. מעקב רגולציה, ועד מנהל, בנק, מסמכים ודוחות — הכל במקום אחד.",
  openGraph: {
    title: "מעטפת — ניהול תקין לעמותות",
    description: "מערכת הניהול התקין החכמה לעמותות בישראל",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Secular+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
