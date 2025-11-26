"use strict";
/**
 * AI 모델별 이미지 생성 유틸리티
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
const axios_1 = __importDefault(require("axios"));
const retry_1 = require("./retry");
/**
 * 한글 포함 여부 확인
 */
function isKorean(text) {
    return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
}
/**
 * 프롬프트 영문 번역 (Google Cloud Translation API)
 * TODO: 실제 번역 API 연동 필요
 */
async function translatePromptToEnglish(prompt) {
    // Google Cloud Translation API 키가 있으면 실제 번역
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        try {
            const response = await axios_1.default.post(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
                q: prompt,
                source: 'ko',
                target: 'en',
                format: 'text',
            });
            if (response.data?.data?.translations?.[0]?.translatedText) {
                const translated = response.data.data.translations[0].translatedText;
                console.log(`🌐 [Translate] "${prompt}" → "${translated}"`);
                return translated;
            }
        }
        catch (error) {
            console.error('Translation error:', error);
        }
    }
    // 번역 실패 시 원본 반환
    console.log(`🌐 [Translate] Using original prompt (no translation)`);
    return prompt;
}
/**
 * DALL-E 3로 이미지 생성
 */
async function generateWithDALLE3(params) {
    const { prompt, width = 1024, height = 1024, referenceImageUrl } = params;
    let finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;
    if (referenceImageUrl) {
        finalPrompt = `${finalPrompt}, in a similar style and composition to the reference image, maintaining consistent aesthetic`;
        console.log('🖼️ [DALL-E 3] 참고 이미지 스타일 반영');
    }
    const size = width === height ? '1024x1024' : width > height ? '1792x1024' : '1024x1792';
    const response = await axios_1.default.post('https://api.openai.com/v1/images/generations', {
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size,
        quality: 'standard',
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.data?.data?.[0]?.url) {
        throw new Error('DALL-E 3 API 응답 오류');
    }
    return {
        url: response.data.data[0].url,
        modelId: 'dall-e-3',
    };
}
/**
 * xAI Grok (Aurora)로 이미지 생성
 */
async function generateWithGrok(params) {
    const { prompt, width = 1024, height = 1024 } = params;
    const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;
    console.log('🌟 [Aurora] 이미지 생성 시작');
    const response = await axios_1.default.post('https://api.x.ai/v1/images/generations', {
        model: 'grok-2-vision-1212',
        prompt: finalPrompt,
        n: 1,
        response_format: 'url',
        size: `${width}x${height}`,
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        },
    });
    if (!response.data?.data?.[0]?.url) {
        throw new Error('Grok API 응답 오류');
    }
    return {
        url: response.data.data[0].url,
        modelId: 'aurora',
    };
}
/**
 * Replicate API를 통한 이미지 생성 (SDXL, Flux, PixArt 등)
 */
async function generateWithReplicate(params, version, inputOverrides = {}) {
    const { prompt, width = 1024, height = 1024, referenceImageUrl, modelId } = params;
    const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;
    const input = {
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
    // Prediction 생성
    const response = await axios_1.default.post('https://api.replicate.com/v1/predictions', { version, input }, {
        headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
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
        const pollResponse = await axios_1.default.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
        });
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
async function generateWithSDXL(params) {
    return generateWithReplicate(params, '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // stability-ai/sdxl
    {
        scheduler: 'K_EULER',
        num_inference_steps: 25,
    });
}
/**
 * Flux Schnell 이미지 생성
 */
async function generateWithFlux(params) {
    const { width = 1024, height = 1024 } = params;
    const aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
    return generateWithReplicate({ ...params, modelId: 'flux' }, 'black-forest-labs/flux-schnell', { aspect_ratio: aspectRatio });
}
/**
 * PixArt-Σ 이미지 생성
 */
async function generateWithPixArt(params) {
    return generateWithReplicate({ ...params, modelId: 'pixart' }, '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637' // bytedance/sdxl-lightning-4step
    );
}
/**
 * Realistic Vision 이미지 생성
 */
async function generateWithRealisticVision(params) {
    return generateWithReplicate({ ...params, modelId: 'realistic-vision' }, '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', {
        prompt: params.prompt + ', photorealistic, detailed, high quality',
    });
}
/**
 * Leonardo.ai 이미지 생성
 */
async function generateWithLeonardo(params) {
    const { prompt, width = 1024, height = 1024 } = params;
    const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;
    // Generation 요청
    const response = await axios_1.default.post('https://cloud.leonardo.ai/api/rest/v1/generations', {
        prompt: finalPrompt,
        modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Diffusion XL
        width,
        height,
        num_images: 1,
    }, {
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
            'content-type': 'application/json',
        },
    });
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
        const pollResponse = await axios_1.default.get(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
            headers: {
                'accept': 'application/json',
                'authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
            },
        });
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
 * Ideogram 이미지 생성
 */
async function generateWithIdeogram(params) {
    const { prompt, width = 1024, height = 1024 } = params;
    const finalPrompt = isKorean(prompt) ? await translatePromptToEnglish(prompt) : prompt;
    const aspectRatio = width === height ? 'ASPECT_1_1' : width > height ? 'ASPECT_16_9' : 'ASPECT_9_16';
    const response = await axios_1.default.post('https://api.ideogram.ai/generate', {
        image_request: {
            prompt: finalPrompt,
            aspect_ratio: aspectRatio,
            model: 'V_2',
            magic_prompt_option: 'AUTO',
        },
    }, {
        headers: {
            'Api-Key': process.env.IDEOGRAM_API_KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!response.data?.data?.[0]?.url) {
        throw new Error('Ideogram API 응답 오류');
    }
    return {
        url: response.data.data[0].url,
        modelId: 'ideogram',
    };
}
/**
 * 테스트용 더미 이미지 생성
 */
async function generateDummyImage(params) {
    const { modelId, width = 1024, height = 1024, referenceImageUrl } = params;
    console.log(`🎨 [TEST MODE] Generating dummy image for ${modelId}`);
    const modelNames = {
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
async function generateImage(params) {
    const { modelId } = params;
    // 테스트 모드
    if (process.env.TEST_MODE === 'true') {
        console.log('🎨 [TEST MODE] Using dummy image generation');
        return generateDummyImage(params);
    }
    // 재시도 로직과 함께 실행
    return (0, retry_1.withRetry)(async () => {
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
            default:
                console.warn(`Unknown model: ${modelId}, using SDXL as fallback`);
                return generateWithSDXL({ ...params, modelId: 'sdxl' });
        }
    });
}
//# sourceMappingURL=imageGeneration.js.map