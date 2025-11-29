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
 * DALL·E 3 (OpenAI)
 * 문서: https://platform.openai.com/docs/api-reference/images
 * 특징: GPT-4 프롬프트 이해, 텍스트 렌더링 최상, 안전 필터 적용
 * 지원 사이즈: 1024x1024, 1792x1024, 1024x1792
 */
export async function generateWithDALLE3(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  let finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🤖 [DALL·E 3] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // 참고 이미지가 있으면 프롬프트에 스타일 참고 안내 추가
  if (referenceImageUrl) {
    finalPrompt = `${finalPrompt}, in a similar style and composition to the reference image, maintaining consistent aesthetic`;
    console.log('🖼️ [DALL·E 3] 참고 이미지 스타일 반영');
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: finalPrompt,
    n: 1,
    size: width === height ? '1024x1024' : width > height ? '1792x1024' : '1024x1792',
    quality: 'hd', // 'standard' 또는 'hd'
    style: 'vivid', // 'vivid' 또는 'natural'
  });

  if (!response.data || !response.data[0]?.url) {
    throw new Error('DALL·E 3 API 응답 오류');
  }

  console.log('✅ [DALL·E 3] 생성 완료');

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
 * Stable Diffusion XL 1.0 (via Replicate)
 * 문서: https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/stable_diffusion_xl
 * 특징: 3.5B 파라미터, 1024px 네이티브, img2img 지원, 범용 최강
 * 스케줄러: K_EULER, DPM++, PNDM 등
 */
export async function generateWithSDXL(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🎯 [SDXL 1.0] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const input: any = {
    prompt: finalPrompt,
    negative_prompt: 'low quality, blurry, distorted, deformed',
    width: Math.min(width, 1024),
    height: Math.min(height, 1024),
    num_outputs: 1,
    scheduler: "K_EULER",
    num_inference_steps: 30,
    guidance_scale: 7.5,
    refine: "expert_ensemble_refiner", // 리파이너 사용
    high_noise_frac: 0.8,
  };

  // 참고 이미지가 있으면 img2img 모드
  if (referenceImageUrl) {
    input.image = referenceImageUrl;
    input.prompt_strength = 0.8;
    console.log('🖼️ [SDXL] 참고 이미지 사용');
  }

  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    { input }
  ) as any;

  console.log('✅ [SDXL 1.0] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'sdxl',
  };
}

/**
 * PixArt-Σ (via Replicate) - Transformer 기반 고속 모델
 * 문서: https://replicate.com/cjwbw/pixart-sigma/api
 * 특징: 1-2초 생성, 1024px, 텍스트 렌더링 우수
 */
export async function generateWithPixArt(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🎨 [PixArt-Σ] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // PixArt-Sigma 실제 모델 사용
  const output = await replicate.run(
    "cjwbw/pixart-sigma:5a914e0f9f43663be4bb98df1e7fa54c7fb64e17aac2fb2a7eef7e8d3c9f514c",
    {
      input: {
        prompt: finalPrompt,
        width,
        height,
        num_inference_steps: 20,
        guidance_scale: 4.5,
      },
    }
  ) as any;

  console.log('✅ [PixArt-Σ] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'pixart',
  };
}

/**
 * Realistic Vision v6 (via Replicate)
 * 문서: https://replicate.com/adirik/realistic-vision-v6.0
 * 특징: 인물/피부 질감 최적화, 포토리얼리즘 최고, SD1.5 기반
 */
export async function generateWithRealisticVision(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 768, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('📸 [Realistic Vision v6] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const input: any = {
    prompt: `${finalPrompt}, realistic, detailed skin texture, photorealistic, high quality, sharp focus`,
    negative_prompt: 'cartoon, anime, illustration, drawing, painting, bad anatomy, bad hands, blurry',
    width: Math.min(width, 1024),
    height: Math.min(height, 1024),
    num_outputs: 1,
    num_inference_steps: 30,
    guidance_scale: 7,
  };

  // 참고 이미지가 있으면 img2img 모드
  if (referenceImageUrl) {
    input.image = referenceImageUrl;
    input.prompt_strength = 0.8;
    console.log('🖼️ [Realistic Vision] 참고 이미지 사용');
  }

  const output = await replicate.run(
    "adirik/realistic-vision-v6.0:deb62f7be8b59fec1a51f05c56c65e4b09c36e28a3e3d4e59d79bb4d9a10ae66",
    { input }
  ) as any;

  console.log('✅ [Realistic Vision v6] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'realistic-vision',
  };
}

/**
 * FLUX.1 [schnell] (via Replicate - Black Forest Labs)
 * 문서: https://replicate.com/black-forest-labs/flux-schnell
 * 특징: 1-4step 초고속 생성, 12B 파라미터, 상업용 무료, Flow Matching 기술
 * 대안 API: Together AI (무료), Fireworks AI
 */
export async function generateWithFlux(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('⚡ [FLUX.1 schnell] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const input: any = {
    prompt: finalPrompt,
    num_outputs: 1,
    aspect_ratio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
    output_format: "webp",
    output_quality: 90,
  };

  // 참고 이미지가 있으면 추가
  if (referenceImageUrl) {
    input.image = referenceImageUrl;
    input.prompt_strength = 0.8;
    console.log('🖼️ [FLUX.1] 참고 이미지 사용');
  }

  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    { input }
  ) as any;

  console.log('✅ [FLUX.1 schnell] 생성 완료');

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
 * Ideogram V2 Turbo (텍스트 렌더링 특화)
 * 문서: https://developer.ideogram.ai/api-reference/api-reference/generate
 * 특징: 텍스트 렌더링 최강, 포스터/로고/광고 특화, Magic Prompt 자동 최적화
 */
export async function generateWithIdeogram(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('✍️ [Ideogram V2] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // 비율 계산
  let aspectRatio = 'ASPECT_1_1';
  if (width !== height) {
    const ratio = width / height;
    if (ratio >= 1.7) aspectRatio = 'ASPECT_16_9';
    else if (ratio >= 1.3) aspectRatio = 'ASPECT_4_3';
    else if (ratio >= 1.1) aspectRatio = 'ASPECT_3_2';
    else if (ratio <= 0.6) aspectRatio = 'ASPECT_9_16';
    else if (ratio <= 0.75) aspectRatio = 'ASPECT_3_4';
    else if (ratio <= 0.9) aspectRatio = 'ASPECT_2_3';
  }

  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt: finalPrompt,
        aspect_ratio: aspectRatio,
        model: 'V_2_TURBO', // 최신 Turbo 모델
        magic_prompt_option: 'AUTO', // 자동 프롬프트 최적화
        style_type: 'AUTO', // 자동 스타일 감지
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Ideogram] API 에러:', response.status, errorText);
    throw new Error(`Ideogram API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ [Ideogram V2] 생성 완료');
  
  return {
    url: data.data[0].url,
    modelId: 'ideogram',
  };
}

/**
 * Midjourney 이미지 생성 (Maginary.ai API)
 * 참고: https://app.maginary.ai
 */
export async function generateWithMidjourney(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한국어면 영어로 번역
  const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;

  // 가로세로 비율 추가
  const aspectRatio = width === height ? '' : width > height ? ' --ar 16:9' : ' --ar 9:16';
  const promptWithAspect = finalPrompt + aspectRatio;

  console.log('🎨 [Midjourney] 이미지 생성 시작:', promptWithAspect.substring(0, 50));

  // 1) Generation 생성
  const createResponse = await fetch('https://app.maginary.ai/api/gens/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MAGINARY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: promptWithAspect }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error(`❌ [Midjourney] API 오류 (${createResponse.status}):`, errorText);
    throw new Error(`Midjourney API 오류: ${createResponse.status}`);
  }

  const createData = await createResponse.json();

  if (!createData?.uuid) {
    console.error('❌ [Midjourney] 생성 요청 실패:', JSON.stringify(createData));
    throw new Error('Midjourney API 생성 요청 실패');
  }

  const uuid = createData.uuid;
  console.log(`📝 [Midjourney] Generation UUID: ${uuid}`);

  // 2) 폴링으로 완료 대기 (최대 5분)
  const maxWaitTime = 5 * 60 * 1000;
  const startTime = Date.now();
  let genDetails: any;

  while (Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초마다 체크

    const getResponse = await fetch(`https://app.maginary.ai/api/gens/${uuid}/`, {
      headers: {
        'Authorization': `Bearer ${process.env.MAGINARY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getResponse.ok) {
      console.error(`❌ [Midjourney] 상태 조회 오류 (${getResponse.status})`);
      continue; // 재시도
    }

    genDetails = await getResponse.json();

    // 상태 확인 (Maginary API는 processing_state 사용, 완료시 'done')
    const processingState = genDetails.processing_state || genDetails.status;
    
    // processing_result.slots에 성공한 이미지가 있는지 확인
    const hasSuccessfulSlot = genDetails.processing_result?.slots?.some(
      (slot: any) => slot.status === 'success' && slot.url
    );
    
    if (processingState === 'done' || hasSuccessfulSlot) {
      console.log('✅ [Midjourney] 이미지 생성 완료');
      break;
    }

    if (processingState === 'failed' || processingState === 'error') {
      const errorMsg = genDetails.processing_result?.error_message || genDetails.error || genDetails.message || 'Unknown error';
      throw new Error(`Midjourney 생성 실패: ${errorMsg}`);
    }

    console.log(`⏳ [Midjourney] 생성 중... (state: ${processingState})`);
  }

  // 다양한 응답 구조에서 이미지 URL 추출
  let imageUrls: string[] = [];
  
  // 1) processing_result.slots에서 찾기
  const slots = genDetails?.processing_result?.slots || [];
  const successfulSlots = slots.filter((slot: any) => slot.status === 'success' && slot.url);
  if (successfulSlots.length > 0) {
    imageUrls = successfulSlots.map((slot: any) => slot.url);
  }
  
  // 2) images 배열에서 찾기
  if (imageUrls.length === 0 && genDetails?.images?.length > 0) {
    imageUrls = genDetails.images.filter((img: any) => typeof img === 'string' || img?.url)
      .map((img: any) => typeof img === 'string' ? img : img.url);
  }
  
  // 3) result.images에서 찾기
  if (imageUrls.length === 0 && genDetails?.result?.images?.length > 0) {
    imageUrls = genDetails.result.images;
  }
  
  // 4) processing_result.images에서 찾기
  if (imageUrls.length === 0 && genDetails?.processing_result?.images?.length > 0) {
    imageUrls = genDetails.processing_result.images;
  }
  
  // 5) output_url 또는 image_url 필드
  if (imageUrls.length === 0 && (genDetails?.output_url || genDetails?.image_url)) {
    imageUrls = [genDetails.output_url || genDetails.image_url];
  }
  
  if (imageUrls.length === 0) {
    console.error('❌ [Midjourney] URL을 찾을 수 없음');
    throw new Error('Midjourney 이미지 URL을 찾을 수 없습니다');
  }

  console.log(`🖼️ [Midjourney] ${imageUrls.length}장 생성 완료`);

  return {
    url: imageUrls[0],
    modelId: 'midjourney',
  };
}

/**
 * OpenAI GPT-Image-1 (DALL-E 4 / 최신 모델)
 * gpt-image-1은 네이티브 이미지 생성 모델
 */
export async function generateWithGPTImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🖼️ [GPT-Image] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: finalPrompt,
    n: 1,
    size: width === height ? '1024x1024' : width > height ? '1536x1024' : '1024x1536',
    quality: 'high',
  });

  if (!response.data || !response.data[0]?.url) {
    throw new Error('GPT-Image API 응답 오류');
  }

  console.log('✅ [GPT-Image] 생성 완료');

  return {
    url: response.data[0].url,
    modelId: 'gpt-image',
  };
}

/**
 * Recraft V3 (via Replicate) - 디자인/일러스트 특화
 */
export async function generateWithRecraft(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🎨 [Recraft] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const output = await replicate.run(
    "recraft-ai/recraft-v3",
    {
      input: {
        prompt: finalPrompt,
        size: `${width}x${height}`,
        style: 'realistic_image',
      },
    }
  ) as any;

  console.log('✅ [Recraft] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'recraft',
  };
}

/**
 * Playground v3 (via Replicate) - 고품질 범용
 */
export async function generateWithPlayground(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🎮 [Playground] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const output = await replicate.run(
    "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
    {
      input: {
        prompt: finalPrompt,
        width,
        height,
        num_outputs: 1,
        guidance_scale: 3,
      },
    }
  ) as any;

  console.log('✅ [Playground] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'playground',
  };
}

/**
 * Kandinsky 3.0 (via Replicate) - 러시아 Sber AI
 */
export async function generateWithKandinsky(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🎭 [Kandinsky 3.0] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  const output = await replicate.run(
    "asiryan/kandinsky-3.0",
    {
      input: {
        prompt: finalPrompt,
        width,
        height,
        num_inference_steps: 25,
      },
    }
  ) as any;

  console.log('✅ [Kandinsky] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'kandinsky',
  };
}

/**
 * Gemini 3 Pro Image (Nano Banana Pro)
 * 문서: https://ai.google.dev/gemini-api/docs/image-generation
 * 특징: Google 최신, 고해상도(1K/2K/4K), 멀티모달 입출력, 텍스트 렌더링 개선
 * 지원 비율: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 */
export async function generateWithGemini(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🍌 [Gemini 3 Pro Image / Nano Banana Pro] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // 비율 계산 - Gemini 3 Pro Image 지원 비율
  let aspectRatio = '1:1';
  if (width !== height) {
    const ratio = width / height;
    if (ratio >= 2.2) aspectRatio = '21:9';      // 울트라와이드
    else if (ratio >= 1.7) aspectRatio = '16:9'; // 와이드스크린
    else if (ratio >= 1.3) aspectRatio = '4:3';  // 클래식
    else if (ratio >= 1.1) aspectRatio = '5:4';  // 정방향 약간 넓음
    else if (ratio <= 0.5) aspectRatio = '9:16'; // 세로 와이드
    else if (ratio <= 0.7) aspectRatio = '2:3';  // 세로
    else if (ratio <= 0.85) aspectRatio = '3:4'; // 세로 클래식
    else if (ratio <= 0.95) aspectRatio = '4:5'; // 인스타그램 세로
  }

  // 해상도 설정 (1K, 2K, 4K)
  let outputOptions: any = {};
  if (width >= 3840 || height >= 3840) {
    outputOptions.outputMimeType = 'image/png';
    // 4K 해상도 요청
  } else if (width >= 2048 || height >= 2048) {
    outputOptions.outputMimeType = 'image/png';
    // 2K 해상도
  }

  // Gemini 3 Pro Image API 호출 (generateContent 방식)
  const requestBody: any = {
    contents: [
      {
        parts: [
          { text: finalPrompt }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      ...outputOptions,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH'
      }
    ]
  };

  // 참고 이미지가 있으면 멀티모달 입력
  if (referenceImageUrl) {
    // base64 또는 URL에서 이미지 데이터 추출
    if (referenceImageUrl.startsWith('data:')) {
      const base64Data = referenceImageUrl.split(',')[1];
      requestBody.contents[0].parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
      requestBody.contents[0].parts[1].text = `Based on this reference image, ${finalPrompt}`;
    } else {
      requestBody.contents[0].parts[0].text = `Using this image as reference: ${referenceImageUrl}\n\n${finalPrompt}`;
    }
    console.log('🖼️ [Gemini 3 Pro] 참고 이미지 사용');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Gemini 3 Pro Image] API 에러:', response.status, errorText);
    
    // Fallback: Imagen 3 모델 시도
    console.log('🔄 [Gemini] Fallback to Imagen 3...');
    return await generateWithImagen3Fallback(params);
  }

  const data = await response.json();
  
  // 응답에서 이미지 추출
  let imageUrl = '';
  const candidates = data.candidates || [];
  
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    if (imageUrl) break;
  }

  if (!imageUrl) {
    console.error('❌ [Gemini 3 Pro Image] 이미지 데이터 없음, Fallback 시도');
    return await generateWithImagen3Fallback(params);
  }

  console.log('✅ [Gemini 3 Pro Image / Nano Banana Pro] 생성 완료');

  return {
    url: imageUrl,
    modelId: 'gemini',
  };
}

/**
 * Imagen 3 Fallback (구버전 호환)
 */
async function generateWithImagen3Fallback(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('💎 [Imagen 3 Fallback] 이미지 생성 시작');

  let aspectRatio = '1:1';
  if (width !== height) {
    const ratio = width / height;
    if (ratio >= 1.7) aspectRatio = '16:9';
    else if (ratio >= 1.3) aspectRatio = '4:3';
    else if (ratio <= 0.6) aspectRatio = '9:16';
    else if (ratio <= 0.75) aspectRatio = '3:4';
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          personGeneration: 'allow_adult',
          safetyFilterLevel: 'block_few',
          addWatermark: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagen 3 API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const base64Image = data.predictions[0].bytesBase64Encoded;
  const imageUrl = `data:image/png;base64,${base64Image}`;

  console.log('✅ [Imagen 3 Fallback] 생성 완료');

  return {
    url: imageUrl,
    modelId: 'gemini',
  };
}

/**
 * xAI Grok-2 Image
 * 문서: https://docs.x.ai/docs/guides/image-generations
 * 특징: xAI 최신, 실시간 트렌드 반영, 밈/유머 생성 강점, 검열 최소화
 */
export async function generateWithGrokV2(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🌟 [Grok-2 Image] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // 지원 사이즈: 1024x1024, 1536x1024, 1024x1536
  let size = '1024x1024';
  if (width !== height) {
    size = width > height ? '1536x1024' : '1024x1536';
  }

  const response = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-2-image', // Grok-2 최신 이미지 모델
      prompt: finalPrompt,
      n: 1,
      size: size,
      response_format: 'url', // 'url' 또는 'b64_json'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Grok-2] API 에러:', response.status, errorText);
    throw new Error(`Grok-2 API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ [Grok-2 Image] 생성 완료');
  
  // URL 또는 base64 반환
  const imageData = data.data[0];
  const imageUrl = imageData.url || `data:image/png;base64,${imageData.b64_json}`;

  return {
    url: imageUrl,
    modelId: 'grok',
  };
}

/**
 * Leonardo Phoenix (via Leonardo.ai API)
 * 문서: https://docs.leonardo.ai/reference/creategeneration
 * 특징: 게임/캐릭터/컨셉아트 특화, Alchemy 엔진, 스타일 프리셋 다양
 */
export async function generateWithLeonardoV2(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🎮 [Leonardo Phoenix] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // Leonardo Phoenix 모델 ID (최신)
  const PHOENIX_MODEL_ID = '6b645e3a-d64f-4341-a6d8-7a3690fbf042'; // Leonardo Phoenix
  const DIFFUSION_XL_ID = 'b24e16ff-06e3-43eb-8d33-4416c2d75876'; // Fallback: Leonardo Diffusion XL

  const requestBody: any = {
    prompt: finalPrompt,
    modelId: PHOENIX_MODEL_ID,
    width: Math.min(width, 1024),
    height: Math.min(height, 1024),
    num_images: 1,
    alchemy: true, // Alchemy 엔진 활성화
    photoReal: false,
    presetStyle: 'DYNAMIC',
    promptMagic: true, // 프롬프트 자동 최적화
  };

  // 참고 이미지가 있으면 Image2Image 모드
  if (referenceImageUrl) {
    requestBody.init_image_id = referenceImageUrl;
    requestBody.init_strength = 0.3;
    console.log('🖼️ [Leonardo] 참고 이미지 사용');
  }

  // 1. 생성 요청
  const createResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('❌ [Leonardo] 생성 요청 에러:', createResponse.status, errorText);
    
    // Phoenix 모델 실패 시 Diffusion XL로 재시도
    if (createResponse.status === 400) {
      console.log('🔄 [Leonardo] Phoenix 실패, Diffusion XL로 재시도...');
      requestBody.modelId = DIFFUSION_XL_ID;
      const retryResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!retryResponse.ok) {
        throw new Error(`Leonardo API error: ${retryResponse.status}`);
      }
      
      const retryData = await retryResponse.json();
      const generationId = retryData.sdGenerationJob.generationId;
      return await pollLeonardoResult(generationId);
    }
    
    throw new Error(`Leonardo API error: ${createResponse.status}`);
  }

  const createData = await createResponse.json();
  const generationId = createData.sdGenerationJob.generationId;

  return await pollLeonardoResult(generationId);
}

/**
 * Leonardo 결과 폴링 헬퍼
 */
async function pollLeonardoResult(generationId: string): Promise<GeneratedImage> {
  let result = null;
  let attempts = 0;
  const maxAttempts = 24;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
    
    const statusResponse = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    
    if (statusData.generations_by_pk?.status === 'COMPLETE') {
      result = statusData.generations_by_pk;
      break;
    } else if (statusData.generations_by_pk?.status === 'FAILED') {
      throw new Error('Leonardo 이미지 생성 실패');
    }
    
    attempts++;
    console.log(`⏳ [Leonardo] 생성 중... (${attempts}/${maxAttempts})`);
  }

  if (!result || !result.generated_images?.length) {
    throw new Error('Leonardo 타임아웃');
  }

  console.log('✅ [Leonardo Phoenix] 생성 완료');

  return {
    url: result.generated_images[0].url,
    modelId: 'leonardo',
  };
}

/**
 * Adobe Firefly (상업 라이선스 안전)
 * 문서: https://developer.adobe.com/firefly-services/
 * 특징: 상업적 사용 100% 안전, Adobe Stock 학습, 저작권 걱정 없음
 */
export async function generateWithFirefly(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🔥 [Adobe Firefly] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // Adobe Firefly API - OAuth 인증 필요
  // 1. 먼저 액세스 토큰 발급
  const tokenResponse = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ADOBE_CLIENT_ID!,
      client_secret: process.env.ADOBE_CLIENT_SECRET!,
      scope: 'openid,AdobeID,firefly_enterprise,firefly_api,ff_apis',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Adobe Auth error: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2. Firefly 이미지 생성
  const response = await fetch('https://firefly-api.adobe.io/v3/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-api-key': process.env.ADOBE_CLIENT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: finalPrompt,
      n: 1,
      size: {
        width: Math.min(width, 2048),
        height: Math.min(height, 2048),
      },
      contentClass: 'photo', // 'photo', 'art', 'graphic'
      visualIntensity: 6, // 1-10
      styles: {
        presets: [], // 스타일 프리셋
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Adobe Firefly] API 에러:', response.status, errorText);
    throw new Error(`Firefly API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ [Adobe Firefly] 생성 완료');

  return {
    url: data.outputs[0].image.url,
    modelId: 'firefly',
  };
}

/**
 * Seedream 4.0 (4K 포스터/배너 특화)
 * 문서: https://www.segmind.com/models/seedream-4/api
 * 특징: 4K 고해상도, 포스터/배너 특화, 빠른 생성
 */
export async function generateWithSeedream(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🌱 [Seedream 4.0] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // Segmind API 호출
  const response = await fetch('https://api.segmind.com/v1/seedream-4', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.SEGMIND_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: finalPrompt,
      negative_prompt: 'low quality, blurry, distorted',
      width: Math.min(width, 4096), // 4K 지원
      height: Math.min(height, 4096),
      num_inference_steps: 30,
      guidance_scale: 7.5,
      seed: Math.floor(Math.random() * 1000000),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Seedream 4.0] API 에러:', response.status, errorText);
    throw new Error(`Seedream API error: ${response.status}`);
  }

  // Segmind는 이미지를 직접 바이너리로 반환
  const imageBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const imageUrl = `data:image/png;base64,${base64Image}`;

  console.log('✅ [Seedream 4.0] 생성 완료');

  return {
    url: imageUrl,
    modelId: 'seedream',
  };
}

/**
 * Hunyuan Image 3.0 (Tencent)
 * 문서: https://replicate.com/tencent/hunyuan-image-3
 * 특징: 중국 Tencent AI, 고품질 포토리얼, 아시아 인물 특화
 */
export async function generateWithHunyuan(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  console.log('🐉 [Hunyuan 3.0] 이미지 생성 시작:', finalPrompt.substring(0, 50));

  // Replicate API 사용
  const output = await replicate.run(
    "tencent/hunyuan-image-3:latest",
    {
      input: {
        prompt: finalPrompt,
        negative_prompt: 'low quality, blurry, distorted, deformed',
        width: Math.min(width, 1536),
        height: Math.min(height, 1536),
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    }
  ) as any;

  console.log('✅ [Hunyuan 3.0] 생성 완료');

  return {
    url: Array.isArray(output) ? output[0] : output,
    modelId: 'hunyuan',
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
  
  // Placeholder 이미지 서비스 사용 - 모델별 표시명
  const modelNames: Record<string, string> = {
    'dall-e-3': 'DALL·E 3',
    'gpt-image': 'GPT-Image-1',
    'sdxl': 'SDXL 1.0',
    'flux': 'FLUX.1',
    'pixart': 'PixArt-Σ',
    'realistic-vision': 'RealVis v6',
    'leonardo': 'Leonardo',
    'ideogram': 'Ideogram V2',
    'aurora': 'Aurora',
    'grok': 'Grok-2',
    'midjourney': 'MJ v6.1',
    'recraft': 'Recraft V3',
    'gemini': 'NanaBanana',
    'seedream': 'Seedream4',
    'hunyuan': 'Hunyuan3',
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
    
    case 'gpt-image':
      return await generateWithGPTImage(params);
    
    case 'aurora':
      return await generateWithGrok(params);
    
    case 'grok':
      return await generateWithGrokV2(params);
    
    case 'sdxl':
      return await generateWithSDXL(params);
    
    case 'pixart':
      return await generateWithPixArt(params);
    
    case 'realistic-vision':
      return await generateWithRealisticVision(params);
    
    case 'flux':
      return await generateWithFlux(params);
    
    case 'leonardo':
      return await generateWithLeonardoV2(params);
    
    case 'ideogram':
      return await generateWithIdeogram(params);
    
    case 'midjourney':
      return await generateWithMidjourney(params);
    
    case 'recraft':
      return await generateWithRecraft(params);
    
    case 'gemini':
      return await generateWithGemini(params);
    
    case 'seedream':
      return await generateWithSeedream(params);
    
    case 'hunyuan':
      return await generateWithHunyuan(params);
    
    default:
      throw new Error(`지원하지 않는 모델입니다: ${modelId}`);
  }
}
