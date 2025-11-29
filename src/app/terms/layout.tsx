import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관',
  description: 'ImageFactory 서비스 이용약관입니다. 서비스 이용 전 반드시 확인해주세요.',
  openGraph: {
    title: '이용약관 | ImageFactory',
    description: 'ImageFactory 서비스 이용약관',
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

