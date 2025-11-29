import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '요금 안내 - AI 이미지 생성 가격',
  description: 'ImageFactory 포인트 요금 및 AI 모델별 이미지 생성 비용을 확인하세요. $1 = 100P, 포인트 유효기간 5년. Midjourney, DALL-E 4, Stable Diffusion 등 13개 AI 모델 지원.',
  keywords: ['AI 이미지 생성 가격', '이미지 생성 요금', 'Midjourney 가격', 'DALL-E 가격', 'AI 이미지 비용'],
  openGraph: {
    title: '요금 안내 | ImageFactory',
    description: 'AI 이미지 생성 요금을 확인하세요. $1 = 100P, 포인트 유효기간 5년.',
  },
}

// FAQ 구조화 데이터
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "포인트 유효기간은 얼마나 되나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "포인트 유효기간은 충전일로부터 5년입니다. 충분한 시간 동안 사용하실 수 있습니다."
      }
    },
    {
      "@type": "Question",
      "name": "환불은 가능한가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "미사용 포인트에 대해서는 환불이 가능합니다. 단, 이미 사용한 포인트는 환불이 불가능합니다."
      }
    },
    {
      "@type": "Question",
      "name": "어떤 결제 수단을 지원하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "신용카드, 체크카드, 무통장입금(계좌이체)을 지원합니다. 토스페이먼츠를 통해 안전하게 결제됩니다."
      }
    },
    {
      "@type": "Question",
      "name": "생성된 이미지의 저작권은 누구에게 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "생성된 이미지의 저작권은 사용자에게 있으며, 상업적 용도로도 자유롭게 사용하실 수 있습니다."
      }
    }
  ]
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}

