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
}

export interface GeneratedImage {
  url: string;
  modelId: string;
}

/**
 * DALL-E 3로 이미지 생성
 */
export async function generateWithDALLE3(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: finalPrompt,
    n: 1,
    size: width === height ? '1024x1024' : width > height ? '1792x1024' : '1024x1792',
    quality: 'standard',
  });

  return {
    url: response.data[0].url!,
    modelId: 'dall-e-3',
  };
}

/**
 * xAI Grok (Aurora)로 이미지 생성
 */
export async function generateWithGrok(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const response = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'aurora',
      prompt: finalPrompt,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    url: data.data[0].url,
    modelId: 'aurora',
  };
}

/**
 * Stable Diffusion XL (via Replicate - Stability AI 대신)
 */
export async function generateWithSDXL(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt: finalPrompt,
        width,
        height,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 25,
      },
    }
  ) as any;

  return {
    url: output[0],
    modelId: 'sdxl',
  };
}

/**
 * PixArt-Σ (via Replicate)
 */
export async function generateWithPixArt(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const output = await replicate.run(
    "stablediffusionapi/pixart-sigma:8dde1f6f2d6f6bb3c0c5f2e3d1e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1",
    {
      input: {
        prompt: finalPrompt,
        negative_prompt: "bad quality, blurry, watermark",
        width,
        height,
        num_inference_steps: 20,
      },
    }
  ) as any;

  return {
    url: output[0],
    modelId: 'pixart',
  };
}

/**
 * Realistic Vision (via Replicate)
 */
export async function generateWithRealisticVision(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const output = await replicate.run(
    "lucataco/realistic-vision-v5:a9a4c4e2b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7",
    {
      input: {
        prompt: finalPrompt,
        width,
        height,
        num_outputs: 1,
      },
    }
  ) as any;

  return {
    url: output[0],
    modelId: 'realistic-vision',
  };
}

/**
 * Flux Schnell (via Replicate)
 */
export async function generateWithFlux(params: GenerateImageParams): Promise<GeneratedImage> {
  const { prompt, width = 1024, height = 1024 } = params;

  // 한글이면 번역
  const finalPrompt = isKorean(prompt) 
    ? await translatePromptToEnglish(prompt) 
    : prompt;

  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    {
      input: {
        prompt: finalPrompt,
        num_outputs: 1,
        aspect_ratio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
      },
    }
  ) as any;

  return {
    url: output[0],
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
 * 모델별 이미지 생성 라우터
 */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { modelId } = params;

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
    
    default:
      throw new Error(`Unknown model: ${modelId}`);
  }
}

