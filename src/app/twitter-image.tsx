import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ImageFactory - AI 이미지 생성 플랫폼'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* 로고 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'white',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: 48 }}>✨</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: 'white',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              ImageFactory
            </span>
            <span
              style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.8)',
                marginTop: 4,
              }}
            >
              by MJ Studio
            </span>
          </div>
        </div>

        {/* 메인 타이틀 */}
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            marginBottom: 20,
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          13개 AI 모델로 이미지 생성
        </h1>

        {/* 서브 타이틀 */}
        <p
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Midjourney · DALL-E 4 · Stable Diffusion · Flux · Gemini
        </p>

        {/* 하단 배지 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 50,
            gap: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '12px 24px',
              borderRadius: 50,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 20, color: 'white', fontWeight: 600 }}>
              🎁 가입 시 100P 무료
            </span>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '12px 24px',
              borderRadius: 50,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 20, color: 'white', fontWeight: 600 }}>
              🌍 7개국 언어 지원
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

