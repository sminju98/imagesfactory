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
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ImageFactory" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-58MNB4FJ');`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-58MNB4FJ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}

