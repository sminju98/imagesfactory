import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const baseUrl = "https://imagefactory.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "ImageFactory - AI 이미지 생성 플랫폼 | 13개 AI 모델 동시 생성",
    template: "%s | ImageFactory",
  },
  description: "Midjourney, DALL-E 4, Stable Diffusion 3.5, Flux, Gemini 등 13개 AI 모델로 한 번에 수백 장의 이미지를 생성하세요. GPT-5.1 프롬프트 교정 지원. 가입 즉시 100 포인트 무료!",
  keywords: [
    "AI 이미지 생성",
    "AI image generator",
    "Midjourney",
    "DALL-E",
    "DALL-E 4",
    "GPT-Image",
    "Stable Diffusion",
    "Flux",
    "Gemini",
    "Leonardo AI",
    "이미지 생성 AI",
    "인공지능 이미지",
    "AI 그림",
    "텍스트 투 이미지",
    "text to image",
    "AI art generator",
    "프롬프트",
    "이미지팩토리",
    "ImageFactory",
  ],
  authors: [
    { name: "MJ Studio", url: baseUrl },
    { name: "엠제이스튜디오(MJ)" },
  ],
  creator: "MJ Studio",
  publisher: "MJ Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      "ko-KR": `${baseUrl}/ko`,
      "en-US": `${baseUrl}/en`,
      "ja-JP": `${baseUrl}/ja`,
      "zh-CN": `${baseUrl}/zh`,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US", "ja_JP", "zh_CN", "es_ES", "fr_FR", "de_DE"],
    url: baseUrl,
    title: "ImageFactory - AI 이미지 생성 플랫폼",
    description: "Midjourney, DALL-E 4, Stable Diffusion 등 13개 AI 모델로 한 번에 수백 장의 이미지를 생성하세요. GPT-5.1 프롬프트 교정 지원!",
    siteName: "ImageFactory",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ImageFactory - AI 이미지 생성 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ImageFactory - AI 이미지 생성 플랫폼",
    description: "13개 AI 모델로 한 번에 수백 장의 이미지를 생성하세요",
    images: [`${baseUrl}/og-image.png`],
    creator: "@mjstudio",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icon-192x192.png", sizes: "192x192" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#6366F1" },
    ],
  },
  verification: {
    google: "your-google-verification-code", // 나중에 실제 코드로 교체
    // yandex: "yandex-verification-code",
    // yahoo: "yahoo-verification-code",
  },
  category: "technology",
};

// JSON-LD 구조화 데이터
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ImageFactory",
  description: "13개 AI 모델로 한 번에 수백 장의 이미지를 생성하는 AI 이미지 생성 플랫폼",
  url: baseUrl,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
    description: "가입 즉시 100 포인트 무료 제공",
  },
  creator: {
    "@type": "Organization",
    name: "MJ Studio",
    url: baseUrl,
  },
  featureList: [
    "Midjourney v6.1 이미지 생성",
    "GPT-Image-1 (DALL·E 4) 지원",
    "Stable Diffusion 3.5 Large",
    "Flux 1.1 Pro",
    "Google Gemini 이미지 생성",
    "GPT-5.1 프롬프트 교정",
    "AI 모델 추천",
    "다국어 지원 (한국어, 영어, 일본어, 중국어)",
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MJ Studio",
  alternateName: "엠제이스튜디오(MJ)",
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+82-10-8440-9820",
    contactType: "customer service",
    email: "webmaster@geniuscat.co.kr",
    availableLanguage: ["Korean", "English"],
  },
  sameAs: [],
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
        
        {/* 추가 SEO 메타 태그 */}
        <meta name="application-name" content="ImageFactory" />
        <meta name="msapplication-TileColor" content="#6366F1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        
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
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

