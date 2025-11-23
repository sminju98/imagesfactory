import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "imagesfactory - AI 이미지 대량 생성 서비스",
  description: "여러 AI 모델로 한 번에 수십 장의 이미지를 생성하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

