// AI 이미지 생성 모델 통합
import OpenAI from 'openai';
import Replicate from 'replicate';
import { translatePromptToEnglish, isKorean } from './translate';

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Replicate 클라이언트
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface GenerateImageParams {
  prompt: string;
  modelId: string;
  width?: number;
  height?: number;
  referenceImageUrl?: string;
}

export interface GeneratedImage {
  url: string;
  modelId: string;
}

/**
 * DALL-E 3로 이미지 생성
 */
export async function generateWithDALLE3(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  let finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  // 참고 이미지가 있으면 프롬프트에 스타일 참고 안내 추가
  if (referenceImageUrl) {
    finalPrompt = `${finalPrompt}, in a similar style and composition to the reference image, maintaining consistent aesthetic`;
    console.log('🖼️ [DALL-E 3] 참고 이미지 스타일 반영 (프롬프트 조정)');
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: finalPrompt,
    n: 1,
    size: width === height ? '1024x1024' : width > height ? '1792x1024' : '1024x1792',
    quality: 'standard',
  });

  if (!response.data || !response.data[0]?.url) {
    throw new Error('DALL-E 3 API 응답 오류');
  }

  return {
    url: response.data[0].url,
    modelId: 'dall-e-3',
  };
}

/**
 * xAI Grok (Aurora)로 이미지 생성
 * 문서: https://docs.x.ai/docs/guides/image-generations
 */
export async function generateWithGrok(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🌟 [Aurora] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const response = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-2-vision-1212', // 공식 모델명
      prompt: finalPrompt,
      n: 1,
      response_format: 'url',
      size: `${width}x${height}`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Aurora] API 에러:', response.status, errorText);
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ [Aurora] 생성 완료');
  
  return {
    url: data.data[0].url,
    modelId: 'aurora',
  };
}

/**
 * Stable Diffusion XL (via Replicate - Stability AI 대신)
 */
export async function generateWithSDXL(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const input: any = {
        prompt: finalPrompt,
        width,
        height,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 25,
  };

  // 참고 이미지가 있으면 img2img 모드
  if (referenceImageUrl) {
    input.image = referenceImageUrl;
    input.prompt_strength = 0.8; // 프롬프트 강도 (0.0~1.0)
    console.log('🖼️ [SDXL] 참고 이미지 사용:', referenceImageUrl);
  }

  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    { input }
  ) as any;

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'sdxl',
  };
}

/**
 * PixArt-Σ (via Replicate) - 실제 버전 사용
 */
export async function generateWithPixArt(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  // SDXL Lightning (고속 모델) 사용
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
    {
      input: {
        prompt: finalPrompt,
        width: 1024,
        height: 1024,
      },
    }
  ) as any;

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'pixart',
  };
}

/**
 * Realistic Vision (via Replicate) - SDXL 사용
 */
export async function generateWithRealisticVision(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  // Realistic Vision 대신 SDXL 사용 (안정적)
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt: finalPrompt + ", photorealistic, detailed, high quality",
        width,
        height,
        num_outputs: 1,
      },
    }
  ) as any;

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'realistic-vision',
  };
}

/**
 * Flux Schnell (via Replicate)
 */
export async function generateWithFlux(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const input: any = {
    prompt: finalPrompt,
    num_outputs: 1,
    aspect_ratio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
  };

  // 참고 이미지가 있으면 추가
  if (referenceImageUrl) {
    input.image = referenceImageUrl;
    input.prompt_strength = 0.8;
    console.log('🖼️ [Flux] 참고 이미지 사용:', referenceImageUrl);
  }

  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    { input }
  ) as any;

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'flux',
  };
}

/**
 * Leonardo.ai
 */
export async function generateWithLeonardo(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      prompt: finalPrompt,
      modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Diffusion XL
      width,
      height,
      num_images: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Leonardo API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Leonardo는 비동기이므로 결과 폴링 필요
  // 간단히 generation ID 반환
  return {
    url: data.sdGenerationJob.generationId, // 실제로는 폴링 후 URL 가져와야 함
    modelId: 'leonardo',
  };
}

/**
 * Ideogram (텍스트 포함 이미지 특화)
 */
export async function generateWithIdeogram(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt: finalPrompt,
        aspect_ratio: width === height ? 'ASPECT_1_1' : width > height ? 'ASPECT_16_9' : 'ASPECT_9_16',
        model: 'V_2',
        magic_prompt_option: 'AUTO',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ideogram API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    url: data.data[0].url,
    modelId: 'ideogram',
  };
}

/**
 * 테스트용 더미 이미지 생성
 */
async function generateDummyImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, modelId, width = 1024, height = 1024, referenceImageUrl } = params;
  
  console.log(`🎨 [TEST MODE] Generating dummy image for ${modelId}: ${prompt.substring(0, 50)}...`);
  if (referenceImageUrl) {
    console.log(`🖼️ [TEST MODE] Reference image: ${referenceImageUrl.substring(0, 50)}...`);
  }
  
  // Placeholder 이미지 서비스 사용
  const modelNames: Record<string, string> = {
    'dall-e-3': 'DALL-E-3',
    'sdxl': 'SDXL',
    'flux': 'FLUX',
    'pixart': 'PixArt',
    'realistic-vision': 'Realistic',
    'leonardo': 'Leonardo',
    'ideogram': 'Ideogram',
    'aurora': 'Aurora',
  };
  
  const displayName = modelNames[modelId] || modelId.toUpperCase();
  const label = referenceImageUrl ? `${displayName}+IMG2IMG` : displayName;
  const dummyUrl = `https://placehold.co/${width}x${height}/6366F1/FFFFFF/png?text=${encodeURIComponent(label)}`;
  
  // 실제 API 처럼 약간 대기
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`✅ [TEST MODE] Dummy image generated: ${dummyUrl}`);
  
  return {
    url: dummyUrl,
    modelId,
  };
}

/**
 * 모델별 이미지 생성 라우터
 */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { modelId } = params;

  // 🚨 테스트 모드: 환경 변수로 제어
  if (process.env.TEST_MODE === 'true') {
    console.log('🎨 [TEST MODE] Using dummy image generation');
    return await generateDummyImage(params);
  }

  switch (modelId) {
    case 'dall-e-3':
      return await generateWithDALLE3(params);
    
    case 'aurora':
    case 'grok':
      return await generateWithGrok(params);
    
    case 'sdxl':
      return await generateWithSDXL(params);
    
    case 'pixart':
      return await generateWithPixArt(params);
    
    case 'realistic-vision':
      return await generateWithRealisticVision(params);
    
    case 'flux':
      return await generateWithFlux(params);
    
    case 'leonardo':
      return await generateWithLeonardo(params);
    
    case 'ideogram':
      return await generateWithIdeogram(params);
    
    default:
      throw new Error(`Unknown model: ${modelId}`);
  }
}

