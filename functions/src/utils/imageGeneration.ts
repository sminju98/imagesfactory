/**
 * AI 모델별 이미지 생성 유틸리티
 */

import axios from 'axios';
import { withRetry } from './retry';
import { GenerateImageParams, GeneratedImage } from '../types';

/**
 * 한글 포함 여부 확인
 */
function isKorean(text: string): boolean {
  return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
}

/**
 * 민감한 키워드 우회 처리
 */
function sanitizePrompt(prompt: string): string {
  const replacements: [RegExp, string][] = [
    // 의료/성형 관련
    [/plastic surgery/gi, 'aesthetic enhancement'],
    [/cosmetic surgery/gi, 'beauty treatment'],
    [/surgery clinic/gi, 'wellness center'],
    [/성형/gi, '뷰티'],
    [/수술/gi, '시술'],
    [/병원/gi, '센터'],
    [/클리닉/gi, '스튜디오'],
    // 신체 부위 민감 표현
    [/breast/gi, 'figure'],
    [/liposuction/gi, 'body contouring'],
    [/facelift/gi, 'facial rejuvenation'],
    [/nose job/gi, 'facial harmony'],
    [/rhinoplasty/gi, 'facial harmony'],
    // 기타 민감 표현
    [/before and after/gi, 'transformation'],
    [/medical procedure/gi, 'wellness service'],
  ];

  let sanitized = prompt;
  for (const [pattern, replacement] of replacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  
  if (sanitized !== prompt) {
    console.log(`🛡️ [Sanitize] 프롬프트 우회 처리됨`);
  }
  
  return sanitized;
}

/**
 * GPT를 사용한 프롬프트 교정 및 영어 번역
 * - 모든 언어를 영어로 번역
 * - 이미지 생성에 최적화된 프롬프트로 교정
 */
async function enhanceAndTranslatePrompt(prompt: string): Promise<string> {
  // OpenAI API 키가 없으면 원본 반환
  if (!process.env.OPENAI_API_KEY) {
    console.log(`🌐 [Enhance] OpenAI API 키 없음, 원본 사용`);
    return prompt;
  }

  try {
    console.log(`🤖 [GPT] 프롬프트 교정 시작`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer for AI image generation.
Your task:
1. If the input is NOT in English, translate it to natural English first
2. Enhance the prompt for better AI image generation results
3. Add relevant artistic details (lighting, composition, style, quality)
4. Keep it concise but descriptive (max 150 words)
5. Output ONLY the enhanced English prompt, no explanations or prefixes`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_completion_tokens: 250,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const enhancedPrompt = response.data?.choices?.[0]?.message?.content?.trim();
    
    if (enhancedPrompt) {
      console.log(`✅ [GPT] 프롬프트 교정 완료: "${enhancedPrompt.substring(0, 80)}..."`);
      return enhancedPrompt;
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error('❌ [GPT] 프롬프트 교정 실패:', err.response?.data || err.message);
  }
  
  // 교정 실패 시 원본 반환
  console.log(`🌐 [GPT] 교정 실패, 원본 사용`);
  return prompt;
}

/**
 * 프롬프트 영문 번역 (GPT 사용, 폴백으로 Google Translation)
 */
async function translatePromptToEnglish(prompt: string): Promise<string> {
  // GPT로 교정 + 번역 시도
  const enhanced = await enhanceAndTranslatePrompt(prompt);
  if (enhanced !== prompt) {
    return enhanced;
  }
  
  // Google Cloud Translation API 폴백 (자동 언어 감지)
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          q: prompt,
          target: 'en',
          format: 'text',
        }
      );
      
      if (response.data?.data?.translations?.[0]?.translatedText) {
        const translated = response.data.data.translations[0].translatedText;
        console.log(`🌐 [Translate] "${prompt}" → "${translated}"`);
        return translated;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  }
  
  // 모두 실패 시 원본 반환
  console.log(`🌐 [Translate] Using original prompt (no translation)`);
  return prompt;
}

/**
 * DALL-E 3로 이미지 생성
 */
async function generateWithDALLE3(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 먼저 원본 프롬프트로 번역만 수행
  let finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;

  if (referenceImageUrl) {
    finalPrompt = `${finalPrompt}, in a similar style and composition to the reference image, maintaining consistent aesthetic`;
    console.log('🖼️ [DALL-E 3] 참고 이미지 스타일 반영');
  }

  const size = width === height ? '1024x1024' : width > height ? '1792x1024' : '1024x1792';

  // API 호출 함수
  const callAPI = async (promptToUse: string) => {
    return axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: promptToUse,
        n: 1,
        size,
        quality: 'standard',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  };

  let response;
  try {
    // 1차 시도: 원본 프롬프트로 시도
    response = await callAPI(finalPrompt);
  } catch (error: any) {
    // 정책 위반 오류(400, 403)인 경우 민감단어 우회 후 재시도
    if (error.response?.status === 400 || error.response?.status === 403) {
      console.log('⚠️ [DALL-E 3] 정책 위반 감지, 민감단어 우회 후 재시도...');
      const sanitizedPrompt = sanitizePrompt(finalPrompt);
      response = await callAPI(sanitizedPrompt);
    } else {
      throw error;
    }
  }

  if (!response.data?.data?.[0]?.url) {
    throw new Error('DALL-E 3 API 응답 오류');
  }

  return {
    url: response.data.data[0].url,
    modelId: 'dall-e-3',
  };
}

/**
 * xAI Grok-2 이미지 생성
 */
async function generateWithGrok(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt } = params;

  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🌟 [Grok-2] 이미지 생성 시작`);

  // Grok-2 Image API는 size 파라미터를 지원하지 않음
  const response = await axios.post(
    'https://api.x.ai/v1/images/generations',
    {
      model: 'grok-2-image-1212',
      prompt: finalPrompt,
      n: 1,
      response_format: 'url',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
    }
  );

  if (!response.data?.data?.[0]?.url) {
    console.error('❌ [Grok] API 응답:', JSON.stringify(response.data));
    throw new Error('Grok API 응답 오류');
  }

  console.log('✅ [Grok-2] 이미지 생성 완료');

  return {
    url: response.data.data[0].url,
    modelId: 'grok',
  };
}

/**
 * Replicate API를 통한 이미지 생성 (SDXL, Flux, PixArt 등)
 * model: 모델 ID (예: 'owner/model-name') 또는 버전 해시
 * 새로운 API 엔드포인트: /v1/models/{owner}/{name}/predictions 사용
 */
async function generateWithReplicate(
  params: GenerateImageParams,
  model: string,
  inputOverrides: Record<string, unknown> = {}
): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl, modelId } = params;

  const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;

  const input: Record<string, unknown> = {
    prompt: finalPrompt,
    width,
    height,
    num_outputs: 1,
    ...inputOverrides,
  };

  if (referenceImageUrl) {
    input.image = referenceImageUrl;
    input.prompt_strength = 0.8;
  }

  // 버전 해시인지 모델 ID (owner/name)인지 판별
  const isVersionHash = model.length === 64 && /^[a-f0-9]+$/.test(model);
  
  let response;
  if (isVersionHash) {
    // 버전 해시인 경우 기존 /v1/predictions 엔드포인트 사용
    response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      { version: model, input },
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } else {
    // owner/name 형태인 경우 새로운 /v1/models/{owner}/{name}/predictions 엔드포인트 사용
    response = await axios.post(
      `https://api.replicate.com/v1/models/${model}/predictions`,
      { input },
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const predictionId = response.data.id;
  let prediction = response.data;

  // 결과 폴링 (최대 5분)
  const maxWaitTime = 5 * 60 * 1000;
  const startTime = Date.now();

  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Replicate prediction timeout');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const pollResponse = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
      }
    );
    prediction = pollResponse.data;
  }

  if (prediction.status === 'failed') {
    throw new Error(`Replicate prediction failed: ${prediction.error}`);
  }

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

  return {
    url: outputUrl,
    modelId,
  };
}

/**
 * SDXL 이미지 생성
 */
/**
 * Stable Diffusion 3.5 Large 이미지 생성 (Stability AI via Replicate)
 * SDXL보다 최신, MMDiT 아키텍처, 타이포그래피/프롬프트 이해 향상
 */
async function generateWithSDXL(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🎯 [SD 3.5 Large] 이미지 생성 시작`);

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'sdxl' },
    'stability-ai/stable-diffusion-3.5-large',
    {
      width: width,
      height: height,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      output_format: 'webp',
      output_quality: 80,
    }
  );
}

/**
 * Flux 1.1 Pro 이미지 생성 (Black Forest Labs via Replicate)
 * 원조 개발사의 공식 최신 모델 - 고품질, 프롬프트 준수 최고
 */
async function generateWithFlux(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  const aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🎨 [Flux 1.1 Pro] 이미지 생성 시작`);

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'flux' },
    'black-forest-labs/flux-1.1-pro',
    { 
      aspect_ratio: aspectRatio,
      output_format: 'webp',
      output_quality: 80,
      safety_tolerance: 2,
      prompt_upsampling: true,
    }
  );
}

/**
 * Hunyuan Image 3 이미지 생성 (Tencent via Replicate)
 */
async function generateWithHunyuan(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  const aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🎨 [Hunyuan] Image 3 이미지 생성 시작`);

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'hunyuan' },
    'tencent/hunyuan-image-3',
    { 
      aspect_ratio: aspectRatio,
      num_outputs: 1,
    }
  );
}

/**
 * Seedream 4.0 이미지 생성 (Segmind API)
 * 4K 고해상도 text-to-image 모델
 */
async function generateWithSeedream(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🎨 [Seedream 4] 이미지 생성 시작`);

  const response = await axios.post(
    'https://api.segmind.com/v1/seedream-4',
    {
      prompt: finalPrompt,
      negative_prompt: 'blurry, low quality, distorted, deformed',
      samples: 1,
      width: width,
      height: height,
      guidance_scale: 7.5,
      num_inference_steps: 30,
    },
    {
      headers: {
        'x-api-key': process.env.SEGMIND_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );

  // Segmind는 이미지를 직접 바이너리로 반환
  const base64Image = Buffer.from(response.data).toString('base64');

  console.log(`✅ [Seedream 4] 이미지 생성 완료`);

  return {
    url: base64Image,  // base64 데이터만 반환 (data:image 접두사 없음)
    modelId: 'seedream',
    isBase64: true,
  };
}

/**
 * Recraft V3 이미지 생성 (Replicate)
 * SOTA 벤치마크 1위, 긴 텍스트 렌더링, 다양한 스타일 지원
 */
async function generateWithRecraft(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🖌️ [Recraft V3] 이미지 생성 시작 (SOTA)`);

  // 크기를 Recraft 지원 형식으로 변환
  const size = `${width}x${height}`;

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'recraft' },
    'recraft-ai/recraft-v3',
    { 
      size: size,
      style: 'realistic_image',
    }
  );
}

/**
 * Playground v2.5 이미지 생성 (Replicate)
 * 미적 점수 SDXL 2배, Aesthetic 특화 (53K+ runs)
 */
async function generateWithPlayground(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🎨 [Playground v2.5] 이미지 생성 시작`);

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'playground' },
    'jyoung105/playground-v2.5',
    { 
      width: width,
      height: height,
      guidance_scale: 3,
    }
  );
}

/**
 * Kandinsky 3.0 이미지 생성 (Replicate)
 * 러시아 Sber AI, 가성비 고품질 (111K+ runs)
 */
async function generateWithKandinsky(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;
  
  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log(`🪆 [Kandinsky 3.0] 이미지 생성 시작`);

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'kandinsky' },
    'asiryan/kandinsky-3.0',
    { 
      width: width,
      height: height,
      num_inference_steps: 25,
    }
  );
}

/**
 * PixArt-Σ 이미지 생성
 */
async function generateWithPixArt(params: GenerateImageParams): Promise<GeneratedImage> {
  return generateWithReplicate(
    { ...params, modelId: 'pixart' },
    '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637' // bytedance/sdxl-lightning-4step
  );
}

/**
 * Realistic Vision 이미지 생성
 */
async function generateWithRealisticVision(params: GenerateImageParams): Promise<GeneratedImage> {
  return generateWithReplicate(
    { ...params, modelId: 'realistic-vision' },
    '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    {
      prompt: params.prompt + ', photorealistic, detailed, high quality',
    }
  );
}

/**
 * Leonardo.ai 이미지 생성 (Phoenix 1.0)
 */
async function generateWithLeonardo(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);

  console.log('🎨 [Leonardo] Phoenix 1.0 이미지 생성 시작');

  // Generation 요청
  const response = await axios.post(
    'https://cloud.leonardo.ai/api/rest/v1/generations',
    {
      prompt: finalPrompt,
      modelId: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Phoenix 1.0
      width,
      height,
      num_images: 1,
    },
    {
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
        'content-type': 'application/json',
      },
    }
  );

  if (!response.data?.sdGenerationJob?.generationId) {
    throw new Error('Leonardo API 응답 오류');
  }

  const generationId = response.data.sdGenerationJob.generationId;
  let generation = response.data.sdGenerationJob;

  // 결과 폴링
  const maxWaitTime = 5 * 60 * 1000;
  const startTime = Date.now();

  while (generation.status !== 'COMPLETE' && generation.status !== 'FAILED') {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Leonardo generation timeout');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pollResponse = await axios.get(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
        },
      }
    );
    generation = pollResponse.data.generations_by_pk;
  }

  if (generation.status === 'FAILED' || !generation.generated_images?.length) {
    throw new Error(`Leonardo generation failed`);
  }

  return {
    url: generation.generated_images[0].url,
    modelId: 'leonardo',
  };
}

/**
 * GPT-Image-1 이미지 생성 (OpenAI 최신 이미지 모델)
 * 참고: https://platform.openai.com/docs/api-reference/images/create
 * 실패 시 민감단어 우회 처리 후 재시도
 */
async function generateWithGPTImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;

  // 먼저 원본 프롬프트로 번역만 수행
  let finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;

  if (referenceImageUrl) {
    finalPrompt = `${finalPrompt}, in a similar style and composition to the reference image, maintaining consistent aesthetic`;
    console.log('🖼️ [GPT-Image-1] 참고 이미지 스타일 반영');
  }

  // gpt-image-1 지원 사이즈: 1024x1024, 1536x1024, 1024x1536
  const size = width === height ? '1024x1024' : width > height ? '1536x1024' : '1024x1536';

  console.log(`🎨 [GPT-Image-1] 이미지 생성 시작 (size: ${size})`);

  // API 호출 함수
  const callAPI = async (promptToUse: string) => {
    return axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'gpt-image-1',
        prompt: promptToUse,
        n: 1,
        size,
        quality: 'high',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  };

  let response;
  try {
    // 1차 시도: 원본 프롬프트로 시도
    response = await callAPI(finalPrompt);
  } catch (error: any) {
    // 정책 위반 오류(400, 403)인 경우 민감단어 우회 후 재시도
    if (error.response?.status === 400 || error.response?.status === 403) {
      console.log('⚠️ [GPT-Image-1] 정책 위반 감지, 민감단어 우회 후 재시도...');
      const sanitizedPrompt = sanitizePrompt(finalPrompt);
      response = await callAPI(sanitizedPrompt);
    } else {
      throw error;
    }
  }

  // gpt-image-1은 b64_json 또는 url 반환
  const imageData = response.data?.data?.[0];
  if (!imageData) {
    console.error('❌ [GPT-Image-1] API 응답:', JSON.stringify(response.data));
    throw new Error('GPT-Image-1 API 응답 오류');
  }

  let imageUrl = imageData.url;

  // b64_json인 경우 Storage에 업로드
  if (!imageUrl && imageData.b64_json) {
    console.log('📦 [GPT-Image-1] base64 이미지를 Storage에 업로드 중...');
    const { storage } = await import('./firestore');
    
    const bucket = storage.bucket();
    const filename = `gpt-image-temp/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const file = bucket.file(filename);
    
    const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
    
    await file.save(imageBuffer, {
      contentType: 'image/png',
      metadata: {
        cacheControl: 'public, max-age=2592000',
      },
    });
    
    await file.makePublic();
    imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }

  console.log('✅ [GPT-Image-1] 이미지 생성 완료');

  return {
    url: imageUrl,
    modelId: 'gpt-image',
  };
}

/**
 * Google Gemini 이미지 생성 (Imagen 4.0)
 * 참고: https://ai.google.dev/gemini-api/docs/imagen
 */
async function generateWithGemini(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 먼저 원본 프롬프트로 번역만 수행
  let finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;

  // 가로세로 비율 계산
  const aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';

  console.log(`💎 [Gemini Imagen 4.0] 이미지 생성 시작 (aspectRatio: ${aspectRatio})`);

  // API 호출 함수
  const callAPI = async (promptToUse: string) => {
    return axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict',
      {
        instances: [
          {
            prompt: promptToUse,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          personGeneration: 'allow_adult',
        },
      },
      {
        headers: {
          'x-goog-api-key': process.env.GOOGLE_AI_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
  };

  let response;
  try {
    // 1차 시도: 원본 프롬프트로 시도
    response = await callAPI(finalPrompt);
  } catch (error: any) {
    // 정책 위반 오류(400, 403)인 경우 민감단어 우회 후 재시도
    if (error.response?.status === 400 || error.response?.status === 403) {
      console.log('⚠️ [Gemini] 정책 위반 감지, 민감단어 우회 후 재시도...');
      const sanitizedPrompt = sanitizePrompt(finalPrompt);
      response = await callAPI(sanitizedPrompt);
    } else {
      throw error;
    }
  }

  if (!response.data?.predictions?.[0]?.bytesBase64Encoded) {
    console.error('❌ [Gemini] API 응답:', JSON.stringify(response.data));
    throw new Error('Gemini Imagen API 응답 오류');
  }

  console.log('✅ [Gemini] 이미지 생성 완료, base64 데이터 수신');

  // Base64 이미지를 Firebase Storage에 업로드
  const base64Image = response.data.predictions[0].bytesBase64Encoded;
  const { storage } = await import('./firestore');
  
  const bucket = storage.bucket();
  const filename = `gemini-temp/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
  const file = bucket.file(filename);
  
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  await file.save(imageBuffer, {
    contentType: 'image/png',
    metadata: {
      cacheControl: 'public, max-age=2592000',
    },
  });
  
  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  console.log(`☁️ [Gemini] Storage 업로드 완료: ${imageUrl}`);

  return {
    url: imageUrl,
    modelId: 'gemini',
  };
}

/**
 * Ideogram 이미지 생성
 */
/**
 * Ideogram V3 Turbo 이미지 생성 (Replicate)
 * 텍스트 렌더링 최강, 4.6M runs
 */
async function generateWithIdeogram(params: GenerateImageParams): Promise<GeneratedImage> {
  const { width = 1024, height = 1024 } = params;

  // 민감한 키워드 우회 처리
  const sanitizedPrompt = sanitizePrompt(params.prompt);
  let finalPrompt = isKorean(sanitizedPrompt) ? await translatePromptToEnglish(sanitizedPrompt) : sanitizedPrompt;
  finalPrompt = sanitizePrompt(finalPrompt);
  
  const aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';

  console.log(`✍️ [Ideogram V3 Turbo] 이미지 생성 시작 (Replicate)`);

  return generateWithReplicate(
    { ...params, prompt: finalPrompt, modelId: 'ideogram' },
    'ideogram-ai/ideogram-v3-turbo',
    {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio,
    }
  );
}

/**
 * Midjourney 이미지 생성 (Maginary.ai API)
 * 참고: https://app.maginary.ai
 */
async function generateWithMidjourney(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한국어면 영어로 번역만 수행 (미드저니는 sanitize 불필요)
  const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;

  // 가로세로 비율 추가
  const aspectRatio = width === height ? '' : width > height ? ' --ar 16:9' : ' --ar 9:16';
  const promptWithAspect = finalPrompt + aspectRatio;

  console.log(`🎨 [Midjourney] 이미지 생성 시작`);
  console.log(`📝 [Midjourney] 프롬프트: ${promptWithAspect.substring(0, 100)}...`);

  // 1) Generation 생성 (네이티브 fetch 사용 - 417 에러 방지)
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
      console.log(`📋 [Midjourney] 전체 응답:`, JSON.stringify(genDetails, null, 2));
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
    console.log(`🖼️ [Midjourney] slots에서 ${imageUrls.length}장 URL 추출`);
  }
  
  // 2) images 배열에서 찾기
  if (imageUrls.length === 0 && genDetails?.images?.length > 0) {
    imageUrls = genDetails.images.filter((img: any) => typeof img === 'string' || img?.url)
      .map((img: any) => typeof img === 'string' ? img : img.url);
    console.log(`🖼️ [Midjourney] images에서 ${imageUrls.length}장 URL 추출`);
  }
  
  // 3) result.images에서 찾기
  if (imageUrls.length === 0 && genDetails?.result?.images?.length > 0) {
    imageUrls = genDetails.result.images;
    console.log(`🖼️ [Midjourney] result.images에서 ${imageUrls.length}장 URL 추출`);
  }
  
  // 4) processing_result.images에서 찾기
  if (imageUrls.length === 0 && genDetails?.processing_result?.images?.length > 0) {
    imageUrls = genDetails.processing_result.images;
    console.log(`🖼️ [Midjourney] processing_result.images에서 ${imageUrls.length}장 URL 추출`);
  }
  
  // 5) output_url 또는 image_url 필드
  if (imageUrls.length === 0 && (genDetails?.output_url || genDetails?.image_url)) {
    imageUrls = [genDetails.output_url || genDetails.image_url];
    console.log(`🖼️ [Midjourney] output_url에서 1장 URL 추출`);
  }
  
  if (imageUrls.length === 0) {
    console.error('❌ [Midjourney] URL을 찾을 수 없음. 전체 응답:', JSON.stringify(genDetails));
    throw new Error('Midjourney 이미지 URL을 찾을 수 없습니다');
  }

  console.log(`🖼️ [Midjourney] 최종 ${imageUrls.length}장 생성 완료`);

  return {
    url: imageUrls[0], // 대표 이미지
    urls: imageUrls,   // 모든 이미지 (4장)
    modelId: 'midjourney',
  };
}

/**
 * 테스트용 더미 이미지 생성
 */
async function generateDummyImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { modelId, width = 1024, height = 1024, referenceImageUrl } = params;

  console.log(`🎨 [TEST MODE] Generating dummy image for ${modelId}`);

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
  const label = referenceImageUrl ? `${displayName}+REF` : displayName;
  const colors = ['6366F1', 'EC4899', '10B981', 'F59E0B', '3B82F6', '8B5CF6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const dummyUrl = `https://placehold.co/${width}x${height}/${color}/FFFFFF/png?text=${encodeURIComponent(label)}`;

  // 실제 생성 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

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

  // 테스트 모드
  if (process.env.TEST_MODE === 'true') {
    console.log('🎨 [TEST MODE] Using dummy image generation');
    return generateDummyImage(params);
  }

  // 재시도 로직과 함께 실행
  return withRetry(async () => {
    switch (modelId) {
      case 'dall-e-3':
        return generateWithDALLE3(params);

      case 'aurora':
      case 'grok':
        return generateWithGrok(params);

      case 'sdxl':
        return generateWithSDXL(params);

      case 'pixart':
        return generateWithPixArt(params);

      case 'realistic-vision':
        return generateWithRealisticVision(params);

      case 'flux':
        return generateWithFlux(params);

      case 'leonardo':
        return generateWithLeonardo(params);

      case 'ideogram':
        return generateWithIdeogram(params);

      case 'gpt-image':
        return generateWithGPTImage(params);

      case 'gemini':
        return generateWithGemini(params);

      case 'midjourney':
        return generateWithMidjourney(params);

      case 'hunyuan':
        return generateWithHunyuan(params);

      case 'seedream':
        return generateWithSeedream(params);

      case 'recraft':
        return generateWithRecraft(params);

      case 'playground':
        return generateWithPlayground(params);

      case 'kandinsky':
        return generateWithKandinsky(params);

      default:
        console.warn(`Unknown model: ${modelId}, using SDXL as fallback`);
        return generateWithSDXL({ ...params, modelId: 'sdxl' });
    }
  });
}

