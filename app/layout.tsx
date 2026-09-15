import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "企業分析AI | 就活のための企業分析システム",
  description:
    "企業の公式サイトURLを貼るだけで、就活向けの企業分析レポートをAIが自動生成します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
