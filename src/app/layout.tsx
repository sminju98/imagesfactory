import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImageFactory - AI 이미지 생성 플랫폼",
  description: "8개 AI 모델로 한 번에 수백 장의 이미지를 생성하세요. DALL-E 3, Stable Diffusion XL, Flux 등 다양한 AI 모델 지원. 가입 보너스 1,000 포인트!",
  keywords: ["AI 이미지 생성", "DALL-E", "Stable Diffusion", "이미지 생성", "AI", "인공지능"],
  authors: [{ name: "엠제이스튜디오" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://imagefactory.co.kr",
    title: "ImageFactory - AI 이미지 생성 플랫폼",
    description: "8개 AI 모델로 한 번에 수백 장의 이미지를 생성하세요",
    siteName: "ImageFactory",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImageFactory - AI 이미지 생성 플랫폼",
    description: "8개 AI 모델로 한 번에 수백 장의 이미지를 생성하세요",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#6366F1" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

