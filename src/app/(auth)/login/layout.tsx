import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
  description: 'ImageFactory에 로그인하여 AI 이미지 생성 서비스를 이용하세요. 이메일 또는 구글 계정으로 로그인 가능합니다.',
  keywords: ['AI 이미지 생성 로그인', '로그인', 'ImageFactory 로그인'],
  openGraph: {
    title: '로그인 | ImageFactory',
    description: 'ImageFactory에 로그인하세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

