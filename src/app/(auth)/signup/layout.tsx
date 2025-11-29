import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입',
  description: 'ImageFactory에 가입하고 100 포인트 무료 보너스를 받으세요. 13개 AI 모델로 이미지를 생성해보세요.',
  keywords: ['AI 이미지 생성 가입', '회원가입', 'ImageFactory 가입'],
  openGraph: {
    title: '회원가입 | ImageFactory',
    description: '가입 즉시 100 포인트 무료! AI 이미지 생성을 시작하세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

