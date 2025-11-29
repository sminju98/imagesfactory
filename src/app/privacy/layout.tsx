import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'ImageFactory 개인정보처리방침입니다. 개인정보 수집, 이용, 보호에 관한 사항을 안내합니다.',
  openGraph: {
    title: '개인정보처리방침 | ImageFactory',
    description: 'ImageFactory 개인정보처리방침',
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
