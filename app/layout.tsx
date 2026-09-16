import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세포 크기 측정 실험실",
  description: "현미경 눈금 보정부터 세포 크기 측정까지 연습하는 가상 실험 앱",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
