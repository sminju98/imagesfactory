import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://imagefactory.co.kr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API 경로 차단
          '/admin/',         // 관리자 페이지 차단
          '/mypage/',        // 개인 페이지 (로그인 필요)
          '/generation/',    // 개인 생성 결과
          '/content/',       // 개인 콘텐츠 결과
          '/payment/',       // 결제 페이지
          '/verify-email/',  // 이메일 인증
          '/reset-password/', // 비밀번호 재설정
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/mypage/',
          '/generation/',
          '/content/',
          '/payment/',
          '/verify-email/',
          '/reset-password/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/mypage/',
          '/generation/',
          '/content/',
          '/payment/',
          '/verify-email/',
          '/reset-password/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

