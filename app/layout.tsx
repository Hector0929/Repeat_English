import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";

/* 標題字體 */
const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* 內文字體 */
const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Repeat English — 英文學習平台",
  description: "透過反覆閱讀與練習，輕鬆掌握英文文章",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${nunito.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-[#F8F9FA] text-[#1A1A2E]">
        {children}
      </body>
    </html>
  );
}
