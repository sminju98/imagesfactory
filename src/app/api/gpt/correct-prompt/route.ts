/**
 * GPT 프롬프트 교정 API (GPT-5.1 사용)
 * POST /api/gpt/correct-prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 용도별 최적화 가이드
const PURPOSE_GUIDES: Record<string, string> = {
  instagram: `인스타그램 피드용 이미지:
- 시선을 끄는 선명한 색상과 대비
- 중앙 집중형 구도
- 감성적이고 트렌디한 분위기
- 해시태그 친화적인 스타일`,

  instagram_story: `인스타그램 스토리/릴스용 이미지:
- 세로 비율에 최적화
- 다이나믹하고 역동적인 구도
- 텍스트 오버레이 공간 고려
- 몰입감 있는 연출`,

  youtube_thumbnail: `유튜브 썸네일용 이미지:
- 강렬하고 눈에 띄는 색상
- 텍스트가 들어갈 여백 고려
- 작은 화면에서도 식별 가능한 선명한 피사체
- 클릭을 유도하는 호기심 자극 요소`,

  youtube_shorts: `유튜브 쇼츠용 이미지:
- 세로 비율 최적화
- 빠르게 인지 가능한 명확한 주제
- 젊고 트렌디한 스타일
- 밝고 활기찬 색감`,

  card_news: `카드뉴스용 이미지:
- 정사각형 비율에 맞는 균형 잡힌 구도
- 깔끔하고 정보 전달에 용이한 배경
- 텍스트 가독성을 위한 단순한 배경
- 전문적이고 신뢰감 있는 스타일`,

  blog: `블로그 대표이미지:
- 가로형 와이드 비율
- 글의 주제를 함축적으로 표현
- 미적 감각과 정보성의 균형
- SEO 친화적인 주제 명확성`,

  presentation: `프레젠테이션용 이미지:
- 16:9 와이드 비율 최적화
- 깔끔하고 프로페셔널한 스타일
- 배경으로 사용 가능한 여백
- 비즈니스 친화적인 색상 톤`,

  custom: `사용자 지정 용도:
- 사용자가 지정한 비율에 최적화
- 범용적으로 활용 가능한 구도
- 고품질 출력에 적합한 디테일`,
};

// 그림체(스타일) 가이드
const STYLE_GUIDES: Record<string, string> = {
  realistic: '사진처럼 사실적인 이미지, photorealistic, highly detailed, professional photography',
  anime: '일본 애니메이션 스타일, anime style, vibrant colors, clean lines, expressive',
  cartoon: '만화/일러스트 스타일, cartoon style, bold outlines, flat colors, playful',
  digital_art: '현대적 디지털 일러스트, digital art, modern, vibrant, trending on artstation',
  oil_painting: '고전 유화 느낌, oil painting style, textured brushstrokes, classical art',
  watercolor: '부드러운 수채화 스타일, watercolor painting, soft edges, flowing colors',
  '3d_render': '3D 그래픽 스타일, 3D render, octane render, cinema 4D, volumetric lighting',
  pixel_art: '레트로 픽셀 스타일, pixel art, 8-bit, retro game style',
  cinematic: '영화같은 분위기, cinematic, dramatic lighting, film grain, movie still',
  minimalist: '심플하고 깔끔한, minimalist, clean, simple, negative space',
  fantasy: '환상적이고 신비로운, fantasy art, magical, ethereal, mystical',
  cyberpunk: '네온과 미래도시, cyberpunk, neon lights, futuristic, dystopian',
};

// 분위기(무드) 가이드
const MOOD_GUIDES: Record<string, string> = {
  bright: '밝고 환한 분위기, bright lighting, cheerful, optimistic, vibrant colors',
  calm: '차분하고 고요한 분위기, calm, peaceful, serene, soft lighting, muted colors',
  serious: '진지하고 무게감 있는 분위기, serious tone, dramatic, professional, dark tones',
  dreamy: '몽환적이고 신비로운 분위기, dreamy, ethereal, soft focus, pastel colors',
  energetic: '역동적이고 활기찬 분위기, energetic, dynamic, motion blur, bold colors',
  romantic: '로맨틱하고 사랑스러운 분위기, romantic, warm tones, soft lighting, intimate',
  dark: '어둡고 신비로운 분위기, dark atmosphere, moody, shadows, low key lighting',
  warm: '따뜻하고 포근한 분위기, warm colors, cozy, golden hour, inviting',
  cool: '차갑고 시원한 분위기, cool tones, blue hues, crisp, modern',
  playful: '유쾌하고 재미있는 분위기, playful, fun, colorful, whimsical',
  nostalgic: '레트로 감성, nostalgic, vintage, retro, film grain, faded colors',
  dramatic: '극적이고 강렬한 분위기, dramatic, high contrast, theatrical, powerful',
};

// 메인 색감 가이드
const COLOR_GUIDES: Record<string, string> = {
  vibrant: '선명하고 강렬한 색상, vibrant colors, saturated, bold, eye-catching',
  pastel: '부드럽고 연한 파스텔 색상, pastel colors, soft tones, gentle, light',
  monochrome: '흑백 또는 단색 계열, monochrome, black and white, grayscale, single color palette',
  earth: '자연스러운 어스톤, earth tones, brown, beige, terracotta, natural colors',
  neon: '형광빛 네온 색상, neon colors, fluorescent, glowing, electric',
  golden: '황금빛 따뜻한 색감, golden tones, gold, amber, warm yellows',
  blue_hour: '푸른 새벽/황혼 색감, blue hour, twilight colors, deep blue, purple hues',
  sunset: '노을빛 색감, sunset colors, orange, pink, golden hour, warm gradient',
  forest: '숲속 초록 자연색, forest green, natural greens, earthy, woodland colors',
  ocean: '바다빛 청량한 블루, ocean blue, aqua, turquoise, sea colors',
  vintage: '바랜 듯한 빈티지 색감, vintage colors, faded, sepia, muted tones',
  candy: '달콤한 캔디 색상, candy colors, pink, mint, sweet pastels, playful',
};

// 조명 스타일 가이드
const LIGHTING_GUIDES: Record<string, string> = {
  natural: '자연스러운 햇빛, natural lighting, daylight, outdoor light',
  golden_hour: '황금빛 일몰/일출, golden hour lighting, warm sunlight, magic hour',
  studio: '전문 스튜디오 조명, studio lighting, professional, controlled light, softbox',
  dramatic: '강한 명암 대비, dramatic lighting, chiaroscuro, high contrast, deep shadows',
  soft: '부드러운 확산광, soft lighting, diffused light, gentle shadows',
  backlight: '역광 효과, backlighting, silhouette, rim light, halo effect',
  neon_glow: '네온 불빛 효과, neon glow, colorful lights, cyberpunk lighting',
  candlelight: '촛불처럼 따뜻한 조명, candlelight, warm glow, intimate lighting',
  moonlight: '달빛 분위기, moonlight, night scene, cool blue light, ethereal',
  volumetric: '빛 줄기가 보이는 조명, volumetric lighting, god rays, light beams, atmospheric',
  rim: '윤곽 강조 조명, rim lighting, edge light, outline glow',
  low_key: '로우키 조명, low key lighting, dark background, dramatic shadows, spotlight',
};

// 카메라 앵글 가이드
const ANGLE_GUIDES: Record<string, string> = {
  eye_level: '눈높이 정면 샷, eye level shot, straight on, neutral perspective',
  low_angle: '로우앵글 샷, low angle shot, looking up, powerful, heroic',
  high_angle: '하이앵글 샷, high angle shot, looking down, diminutive',
  birds_eye: '버즈아이 뷰, bird\'s eye view, top-down, aerial view, overhead',
  dutch: '더치앵글, dutch angle, tilted camera, dynamic, disorienting',
  close_up: '클로즈업, close-up shot, detailed, intimate, facial features',
  wide: '와이드샷, wide shot, establishing shot, full scene, environmental',
  portrait: '인물샷, portrait shot, head and shoulders, focused on subject',
  macro: '매크로 접사, macro shot, extreme close-up, tiny details',
  over_shoulder: '오버숄더 샷, over the shoulder shot, POV, conversational',
  symmetrical: '대칭 구도, symmetrical composition, balanced, centered',
  rule_of_thirds: '삼등분 구도, rule of thirds, off-center, dynamic composition',
};

interface PromptOptions {
  purpose: string;
  ratio: string;
  size: string;
  style?: string;
  styleLabel?: string;
  mood?: string;
  moodLabel?: string;
  color?: string;
  colorLabel?: string;
  lighting?: string;
  lightingLabel?: string;
  angle?: string;
  angleLabel?: string;
}

const getSystemPrompt = (opts: PromptOptions) => `당신은 AI 이미지 생성 프롬프트 전문가입니다.
사용자가 입력한 프롬프트를 분석하여 더 나은 이미지를 생성할 수 있도록 개선해주세요.

## 이미지 용도 및 사양
- 용도: ${opts.purpose}
- 비율: ${opts.ratio}
- 크기: ${opts.size}
${opts.style ? `- 그림체: ${opts.styleLabel || opts.style}` : ''}
${opts.mood ? `- 분위기: ${opts.moodLabel || opts.mood}` : ''}
${opts.color ? `- 메인 색감: ${opts.colorLabel || opts.color}` : ''}
${opts.lighting ? `- 조명: ${opts.lightingLabel || opts.lighting}` : ''}
${opts.angle ? `- 카메라 앵글: ${opts.angleLabel || opts.angle}` : ''}

## 용도별 최적화 가이드
${PURPOSE_GUIDES[opts.purpose] || PURPOSE_GUIDES.custom}

${opts.style ? `## 그림체 스타일 가이드
${STYLE_GUIDES[opts.style] || ''}` : ''}

${opts.mood ? `## 분위기(무드) 가이드
${MOOD_GUIDES[opts.mood] || ''}` : ''}

${opts.color ? `## 메인 색감 가이드
${COLOR_GUIDES[opts.color] || ''}` : ''}

${opts.lighting ? `## 조명 스타일 가이드
${LIGHTING_GUIDES[opts.lighting] || ''}` : ''}

${opts.angle ? `## 카메라 앵글 가이드
${ANGLE_GUIDES[opts.angle] || ''}` : ''}

## 개선 시 고려사항
1. **구체적인 시각적 설명**: 색상, 질감, 조명, 분위기 등 상세히 기술
2. **스타일 키워드**: 선택된 그림체에 맞는 키워드 반영
3. **분위기 키워드**: 선택된 분위기에 맞는 키워드 반영
4. **색감 키워드**: 선택된 색감에 맞는 color palette 키워드 반영
5. **조명 키워드**: 선택된 조명 스타일 키워드 반영
6. **앵글 키워드**: 선택된 카메라 앵글/구도 키워드 반영
7. **품질 향상 키워드**: 8k, ultra detailed, high quality, professional 등
8. **구도 최적화**: 지정된 비율(${opts.ratio})에 최적화된 구도 제안
9. **용도 맞춤**: ${opts.purpose} 플랫폼/용도에 최적화된 표현

## 중요: 글자 수 제한
- correctedPrompt는 반드시 **1000자 이하**로 작성해야 합니다.
- 핵심 키워드 위주로 간결하게 작성하세요.
- 불필요한 반복이나 장황한 설명은 제외하세요.

## 응답 형식 (반드시 JSON)
{
  "correctedPrompt": "개선된 영문 프롬프트 (1000자 이하, 핵심 키워드 위주)",
  "correctedPromptKo": "개선된 한국어 프롬프트 (사용자 참고용, 간결하게)",
  "improvements": ["개선점 1", "개선점 2", ...],
  "suggestions": ["추가 제안 1", "추가 제안 2", ...],
  "appliedKeywords": {
    "style": ["적용된 스타일 키워드들"],
    "mood": ["적용된 분위기 키워드들"],
    "color": ["적용된 색감 키워드들"],
    "lighting": ["적용된 조명 키워드들"],
    "angle": ["적용된 앵글 키워드들"]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (선택적 - 비로그인 사용자도 일부 허용 가능)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        await auth.verifyIdToken(idToken);
      } catch {
        // 인증 실패해도 계속 진행 (비로그인 사용 허용 시)
        console.log('인증 토큰 검증 실패, 비로그인 모드로 진행');
      }
    }

    const body = await request.json();
    const { 
      prompt, 
      purpose = 'custom', 
      ratio = '1:1', 
      size = '1024x1024',
      style,
      styleLabel,
      styleDesc,
      mood,
      moodLabel,
      moodDesc,
      color,
      colorLabel,
      colorDesc,
      lighting,
      lightingLabel,
      lightingDesc,
      angle,
      angleLabel,
      angleDesc,
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.length < 3) {
      return NextResponse.json(
        { success: false, error: '프롬프트를 입력해주세요.' },
        { status: 400 }
      );
    }

    const promptOptions: PromptOptions = {
      purpose,
      ratio,
      size,
      style,
      styleLabel,
      mood,
      moodLabel,
      color,
      colorLabel,
      lighting,
      lightingLabel,
      angle,
      angleLabel,
    };

    // GPT-5.1로 프롬프트 교정
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1', // GPT-5.1 최신 모델
      messages: [
        { role: 'system', content: getSystemPrompt(promptOptions) },
        { 
          role: 'user', 
          content: `다음 프롬프트를 개선해주세요.
          
원본 프롬프트: "${prompt}"

용도: ${purpose}
비율: ${ratio}
크기: ${size}px
${style ? `그림체: ${styleLabel} (${styleDesc})` : ''}
${mood ? `분위기: ${moodLabel} (${moodDesc})` : ''}
${color ? `메인 색감: ${colorLabel} (${colorDesc})` : ''}
${lighting ? `조명 스타일: ${lightingLabel} (${lightingDesc})` : ''}
${angle ? `카메라 앵글: ${angleLabel} (${angleDesc})` : ''}` 
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_completion_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답이 없습니다.');
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      success: true,
      correctedPrompt: result.correctedPrompt,
      correctedPromptKo: result.correctedPromptKo,
      improvements: result.improvements || [],
      suggestions: result.suggestions || [],
      appliedKeywords: result.appliedKeywords || {},
      metadata: {
        purpose,
        ratio,
        size,
        style,
        styleLabel,
        mood,
        moodLabel,
        color,
        colorLabel,
        lighting,
        lightingLabel,
        angle,
        angleLabel,
        model: 'gpt-5.1',
      },
    });

  } catch (error) {
    console.error('프롬프트 교정 에러:', error);
    return NextResponse.json(
      { success: false, error: '프롬프트 교정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}