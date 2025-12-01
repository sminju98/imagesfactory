/**
 * Grok (xAI) 대본 생성 유틸리티
 * Reels Factory Step3: 장면별 대본 작성
 */

interface GrokScriptParams {
  concept: {
    title: string;
    hook: string;
    flow: string;
    cta: string;
  };
  uploadedImages: Array<{ id: string; url: string }>;
  refinedPrompt: string;
}

interface VideoScript {
  videoIndex: number;
  duration: number;
  shots: Array<{
    index: number;
    duration: number;
    description: string;
    visualPrompt: string;
    useUploadedImage?: string;
  }>;
  narration: string;
  approved: boolean;
}

/**
 * Grok2로 릴스 대본 생성
 * 5개의 8초 영상으로 구성된 40초 릴스 대본 생성
 */
export async function generateScriptsWithGrok(
  params: GrokScriptParams
): Promise<VideoScript[]> {
  const apiKey = process.env.XAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('XAI_API_KEY가 설정되지 않았습니다.');
  }

  const systemPrompt = `당신은 릴스 영상 대본 작가입니다.
주어진 콘셉트로 40초 릴스를 위한 5개 영상(각 8초)의 상세 대본을 작성하세요.

각 영상은 3-5개의 샷으로 구성되며, 각 샷에는:
- duration: 초 단위 길이
- description: 장면 설명 (한국어)
- visualPrompt: Veo3 영상 생성용 영어 프롬프트 (구체적이고 시각적)

JSON 형식:
{
  "videoScripts": [
    {
      "videoIndex": 0,
      "duration": 8,
      "shots": [
        { "index": 0, "duration": 2, "description": "장면 설명", "visualPrompt": "영어 프롬프트" },
        ...
      ],
      "narration": "내레이션 텍스트"
    },
    ... (총 5개)
  ]
}

영상 구조:
- Video 1 (0-8초): Hook - 시선 끌기, 강렬한 시작
- Video 2 (8-16초): Problem - 문제 제기, 공감대 형성
- Video 3 (16-24초): Solution - 해결책 제시, 핵심 메시지
- Video 4 (24-32초): Proof - 증거/후기, 신뢰 구축
- Video 5 (32-40초): CTA - 행동 유도, 명확한 호출

업로드된 이미지 ${params.uploadedImages.length}개가 있습니다.
적절한 장면에 이미지를 활용해주세요. useUploadedImage 필드에 이미지 ID를 지정하세요.`;

  const userPrompt = `
콘셉트: ${params.concept.title}
Hook: ${params.concept.hook}
Flow: ${params.concept.flow}
CTA: ${params.concept.cta}

원본 프롬프트: ${params.refinedPrompt}

업로드된 이미지:
${params.uploadedImages.map((img, i) => `${i + 1}. ID: ${img.id}, URL: ${img.url}`).join('\n')}
`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212', // 최신 Grok 모델 (공식 모델명)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Grok 응답이 비어있습니다.');
    }

    // JSON 파싱
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // JSON 블록 추출 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON 파싱 실패');
      }
    }

    const videoScripts: VideoScript[] = result.videoScripts || [];
    
    // 기본값 설정
    return videoScripts.map((script: any, index: number) => ({
      videoIndex: script.videoIndex ?? index,
      duration: script.duration ?? 8,
      shots: script.shots || [],
      narration: script.narration || '',
      approved: false,
    }));
  } catch (error: any) {
    console.error('Grok 대본 생성 오류:', error);
    throw error;
  }
}

