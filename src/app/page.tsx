'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import Header from '@/components/Header';
import Link from 'next/link';
import { Sparkles, Mail, Image as ImageIcon, Zap, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';
import PromptCorrectionModal from '@/components/image-factory/PromptCorrectionModal';
import ContentFactoryMain from '@/components/content-factory/ContentFactoryMain';

// AI 모델 타입 정의
interface AIModel {
  id: string;
  name: string;
  description: string;
  pointsPerImage: number;
  badge?: string;
  color: string;
  company: string;
  logo?: string;
  maxCount?: number; // 모델별 최대 생성 수량
  step?: number; // 수량 증감 단위 (예: 4장 단위)
}

// AI 모델 데이터 (병렬 처리 기준 최대치 설정)
// 각 모델별 특징 및 최신 API 버전 반영
// 🔗 API 버전 정보: name에 공식 모델명, description에 별명/버전 표기
// 글로벌 가격: 1 포인트 = $0.01 (1센트)
const AI_MODELS: AIModel[] = [
  // ===== 🎨 1. Midjourney v6.1 (BEST) =====
  {
    id: 'midjourney',
    name: 'Midjourney v6.1',
    description: 'Best for creative artwork · 4 images per request · API: Maginary',
    pointsPerImage: 60, // 1 request = 4 images = $0.60
    badge: 'BEST',
    color: 'bg-indigo-100 border-indigo-300',
    company: 'Midjourney',
    logo: '🎨',
    maxCount: 10,
  },
  // ===== 👑 2. GPT-Image (OpenAI 최신) =====
  {
    id: 'gpt-image',
    name: 'GPT-Image-1 (DALL·E 4)',
    description: 'OpenAI latest · Multimodal native · API: gpt-image-1',
    pointsPerImage: 10,
    badge: 'NEW',
    color: 'bg-violet-50 border-violet-200',
    company: 'OpenAI',
    logo: '🧠',
    maxCount: 12,
  },
  // ===== 🍌 3. Nano Banana Pro (Google Gemini) =====
  {
    id: 'gemini',
    name: '🍌 Nano Banana Pro',
    description: 'Gemini 3 Pro Image · HD 1K/2K/4K · API: gemini-3-pro-image-preview',
    pointsPerImage: 8,
    badge: 'Google',
    color: 'bg-yellow-50 border-yellow-300',
    company: 'Google DeepMind',
    logo: '',
    maxCount: 15,
  },
  // ===== 🌟 4. Grok-2 (xAI) =====
  {
    id: 'grok',
    name: 'Grok-2 Image',
    description: 'xAI image generation · Meme/humor style · API: grok-2-image',
    pointsPerImage: 6,
    badge: 'xAI',
    color: 'bg-pink-50 border-pink-200',
    company: 'xAI (Elon Musk)',
    logo: '🌟',
    maxCount: 15,
  },
  // ===== 🎮 5. Leonardo Phoenix =====
  {
    id: 'leonardo',
    name: 'Leonardo Phoenix',
    description: 'Game/Character art · Alchemy engine · API: 6b645e3a-d64f-4341',
    pointsPerImage: 5,
    badge: 'Game Art',
    color: 'bg-orange-50 border-orange-200',
    company: 'Leonardo.ai',
    logo: '🎮',
    maxCount: 20,
  },
  // ===== 🎯 6. SD 3.5 Large =====
  {
    id: 'sdxl',
    name: 'SD 3.5 Large',
    description: 'MMDiT latest architecture · Enhanced typography · API: stable-diffusion-3.5-large',
    pointsPerImage: 4,
    badge: 'Latest',
    color: 'bg-blue-50 border-blue-200',
    company: 'Stability AI',
    logo: '🎯',
    maxCount: 20,
  },
  // ===== 🐉 7. Hunyuan Image 3.0 =====
  {
    id: 'hunyuan',
    name: 'Hunyuan Image 3.0',
    description: 'Tencent AI · Asian portrait specialist · API: tencent/hunyuan-image-3',
    pointsPerImage: 3,
    badge: 'Tencent',
    color: 'bg-blue-100 border-blue-300',
    company: 'Tencent',
    logo: '🐉',
    maxCount: 24,
  },
  // ===== More Models =====
  {
    id: 'flux',
    name: 'Flux 1.1 Pro',
    description: 'Black Forest Labs · Best quality/prompt · API: flux-1.1-pro',
    pointsPerImage: 3,
    badge: 'Official',
    color: 'bg-green-50 border-green-200',
    company: 'Black Forest Labs',
    logo: '⚡',
    maxCount: 20,
  },
  {
    id: 'ideogram',
    name: 'Ideogram V3 Turbo',
    description: 'Best text rendering · Poster/Logo · API: V_3_TURBO',
    pointsPerImage: 6,
    badge: 'Text',
    color: 'bg-rose-50 border-rose-200',
    company: 'Ideogram AI',
    logo: '✍️',
    maxCount: 12,
  },
  {
    id: 'recraft',
    name: 'Recraft V3',
    description: 'Vector/Illustration · Style consistency · API: recraft-ai/recraft-v3',
    pointsPerImage: 4,
    badge: 'Design',
    color: 'bg-amber-50 border-amber-200',
    company: 'Recraft AI',
    logo: '🖌️',
    maxCount: 20,
  },
  {
    id: 'seedream',
    name: 'Seedream 4.0',
    description: '4K high resolution · Poster/Banner · API: segmind/seedream-4',
    pointsPerImage: 5,
    badge: '4K',
    color: 'bg-green-100 border-green-300',
    company: 'Segmind',
    logo: '🌱',
    maxCount: 20,
  },
  {
    id: 'pixart',
    name: 'PixArt-Σ (Sigma)',
    description: '1-2sec generation · Transformer · API: cjwbw/pixart-sigma',
    pointsPerImage: 1,
    badge: 'Cheapest',
    color: 'bg-emerald-50 border-emerald-200',
    company: 'Huawei Noah\'s Ark Lab',
    logo: '🎨',
    maxCount: 48,
  },
  {
    id: 'realistic-vision',
    name: 'Realistic Vision v6.0',
    description: 'Best skin texture · SD1.5 based · API: adirik/realistic-vision-v6.0',
    pointsPerImage: 2,
    badge: 'Portrait',
    color: 'bg-cyan-50 border-cyan-200',
    company: 'SG_161222 (Civitai)',
    logo: '📸',
    maxCount: 24,
  },
  // ===== 비활성화된 모델들 =====
  // Playground v2.5 비활성화 (Replicate API 버전 해시 필요)
  // Kandinsky 3.0 비활성화 (Replicate API 버전 해시 필요)
  // Adobe Firefly - 권한 미획득으로 비활성화
];

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  // 모든 활성화된 모델 기본 선택 (각 1장씩, Midjourney는 4장 단위)
  const [selectedModels, setSelectedModels] = useState<Record<string, number>>({
    'pixart': 1,
    'realistic-vision': 1,
    'flux': 1,
    'sdxl': 1,
    'ideogram': 1,
    'leonardo': 1,
    'grok': 1,
    'gpt-image': 1,
    'gemini': 1,
    'recraft': 1,
    'hunyuan': 1,
    'seedream': 1,
    'midjourney': 1, // 1회 요청 = 4장 생성
  });
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // 새로운 기능: GPT 교정/추천 상태
  const [activeTab, setActiveTab] = useState<'image' | 'content'>('image');
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isRecommendingModel, setIsRecommendingModel] = useState(false);
  const [gptRecommendation, setGptRecommendation] = useState<string | null>(null);
  const [correctionInfo, setCorrectionInfo] = useState<{ purpose: string; size: string } | null>(null);

  // 사용자 이메일 동기화
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // 다시 생성하기 데이터 복원 (localStorage에서)
  useEffect(() => {
    const regenerateDataStr = localStorage.getItem('regenerateData');
    if (regenerateDataStr) {
      try {
        const regenerateData = JSON.parse(regenerateDataStr);
        
        // 5분 이내의 데이터만 사용 (너무 오래된 데이터 방지)
        if (Date.now() - regenerateData.timestamp < 5 * 60 * 1000) {
          // 프롬프트 설정
          if (regenerateData.prompt) {
            setPrompt(regenerateData.prompt);
          }
          
          // 모델 및 수량 설정 (현재 활성화된 모델만)
          if (regenerateData.modelCounts) {
            const validModelCounts: Record<string, number> = {};
            Object.entries(regenerateData.modelCounts).forEach(([modelId, count]) => {
              // AI_MODELS에 존재하는 모델만 선택
              if (AI_MODELS.find(m => m.id === modelId)) {
                validModelCounts[modelId] = count as number;
              }
            });
            
            if (Object.keys(validModelCounts).length > 0) {
              setSelectedModels(validModelCounts);
            }
          }
        }
        
        // 사용 후 삭제
        localStorage.removeItem('regenerateData');
      } catch (e) {
        console.error('Failed to parse regenerateData:', e);
        localStorage.removeItem('regenerateData');
      }
    }
  }, []);

  // GPT 프롬프트 교정 - 모달에서 콜백으로 처리
  const handlePromptCorrected = (correctedPrompt: string, purpose: string, size: string) => {
    setPrompt(correctedPrompt);
    setCorrectionInfo({ purpose, size });
  };

  // GPT 모델 추천
  const handleRecommendModel = async () => {
    if (!prompt.trim()) return;
    
    setIsRecommendingModel(true);
    try {
      const response = await fetch('/api/gpt/recommend-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      if (data.success && data.data?.recommendations) {
        // 추천 모델로 자동 선택
        const newSelectedModels: Record<string, number> = {};
        data.data.recommendations.forEach((rec: { modelId: string; count: number }) => {
          if (AI_MODELS.find(m => m.id === rec.modelId)) {
            newSelectedModels[rec.modelId] = rec.count;
          }
        });
        
        if (Object.keys(newSelectedModels).length > 0) {
          setSelectedModels(newSelectedModels);
          setGptRecommendation(data.data.explanation || t('home.recommendApplied'));
          alert(`💡 ${data.data.explanation || t('home.aiRecommendedModels')}`);
        } else {
          alert(t('home.noAvailableModels'));
        }
      } else {
        alert(t('home.modelRecommendFailed') + ': ' + (data.error || t('errors.generic')));
      }
    } catch (error) {
      console.error('GPT 추천 오류:', error);
      alert(t('home.modelRecommendError'));
    } finally {
      setIsRecommendingModel(false);
    }
  };

  // 참고 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('home.imageSizeLimit'));
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert(t('home.imageFileOnly'));
        return;
      }

      setReferenceImage(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 참고 이미지 제거
  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview('');
  };

  // 모델 선택/해제
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      const newModels = { ...prev };
      if (newModels[modelId]) {
        delete newModels[modelId];
      } else {
        newModels[modelId] = 1; // 기본 1장
      }
      return newModels;
    });
  };

  // 수량 변경 (범위 초과 시 자동 조정, step 단위 반영)
  const updateModelCount = (modelId: string, count: number) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    const maxCount = model?.maxCount || 100;
    const step = model?.step || 1;
    const minCount = step; // 최소값은 step 값
    
    // 범위를 벗어나면 자동으로 최소/최대로 조정
    let adjustedCount = count;
    if (count < minCount) {
      adjustedCount = minCount;
    } else if (count > maxCount) {
      adjustedCount = maxCount;
    }
    
    // step 단위로 반올림 (예: step=4면 4, 8, 12, 16...)
    if (step > 1) {
      adjustedCount = Math.round(adjustedCount / step) * step;
      if (adjustedCount < minCount) adjustedCount = minCount;
      if (adjustedCount > maxCount) adjustedCount = Math.floor(maxCount / step) * step;
    }
    
    setSelectedModels(prev => ({
      ...prev,
      [modelId]: adjustedCount,
    }));
  };

  // 총 비용 계산
  const calculateTotal = () => {
    let totalImages = 0;
    let totalPoints = 0;

    Object.entries(selectedModels).forEach(([modelId, count]) => {
      const model = AI_MODELS.find(m => m.id === modelId);
      if (model && count > 0) {
        totalImages += count;
        totalPoints += model.pointsPerImage * count;
      }
    });

    return { totalImages, totalPoints };
  };

  const { totalImages, totalPoints } = calculateTotal();
  const currentPoints = user?.points || 0;
  const isInsufficient = totalPoints > currentPoints;

  // 이미지 생성 요청
  const handleGenerate = async () => {
    if (!user) {
      alert(t('home.loginRequired'));
      window.location.href = '/login';
      return;
    }

    if (totalImages === 0) {
      alert(t('home.selectAtLeastOneModel'));
      return;
    }

    if (prompt.length < 10) {
      alert(t('home.minPromptLength'));
      return;
    }

    if (isInsufficient) {
      alert(t('home.insufficientPoints'));
      return;
    }

    const confirmed = confirm(
      t('home.confirmGeneration', { images: totalImages, points: totalPoints.toLocaleString() })
    );

    if (!confirmed) return;

    try {
      let referenceImageUrl = '';

      // 참고 이미지가 있으면 먼저 Storage에 업로드
      if (referenceImage) {
        setUploadingImage(true);
        try {
          const { ref: storageRef, uploadBytes: uploadBytesFunc, getDownloadURL: getDownloadURLFunc } = await import('firebase/storage');
          const { storage } = await import('@/lib/firebase');
          
          const timestamp = Date.now();
          const filename = `reference-images/${user.uid}/${timestamp}_${referenceImage.name}`;
          const imageRef = storageRef(storage, filename);
          
          await uploadBytesFunc(imageRef, referenceImage);
          referenceImageUrl = await getDownloadURLFunc(imageRef);
          
          console.log('✅ 참고 이미지 업로드 완료:', referenceImageUrl);
        } catch (uploadError) {
          console.error('❌ 참고 이미지 업로드 실패:', uploadError);
          alert(t('home.uploadFailed'));
          if (!confirm(t('home.continueWithoutImage'))) {
            setUploadingImage(false);
            return;
          }
        } finally {
          setUploadingImage(false);
        }
      }

      // Firebase ID Token 가져오기
      console.log('🔵 ID Token 가져오기 시작...');
      const { auth: firebaseAuth } = await import('@/lib/firebase');
      console.log('🔵 Firebase Auth:', firebaseAuth.currentUser?.email);
      
      const idToken = await firebaseAuth.currentUser?.getIdToken();
      console.log('🔵 ID Token:', idToken ? '✅ 가져옴' : '❌ 없음');

      if (!idToken) {
        alert(t('home.authTokenError'));
        return;
      }

      console.log('🔵 API 호출 시작...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt,
          email,
          selectedModels,
          referenceImageUrl: referenceImageUrl || undefined,
        }),
      });
      console.log('🔵 API 응답:', response.status);

      const data = await response.json();

      if (data.success) {
        alert(t('home.generationStarted'));
        // 생성 진행 화면으로 이동
        window.location.href = `/generation/${data.data.generationId}`;
      } else {
        alert(t('home.generationFailed') + ': ' + data.error);
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert(t('home.generationError'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-md">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'image'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎨 ImageFactory
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'content'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 ContentFactory
            </button>
          </div>
        </div>

        {/* ContentFactory 탭 */}
        {activeTab === 'content' && (
          <ContentFactoryMain />
        )}

        {/* ImageFactory 탭 */}
        {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('home.promptInput')}</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('home.promptPlaceholder')}
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {prompt.length} / 1,000
                </p>
                {prompt.length >= 10 && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('home.goodPrompt')}
                  </p>
                )}
              </div>

              {/* GPT 버튼들 */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  disabled={!prompt.trim()}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('home.promptCorrection')} (GPT-5.1)</span>
                </button>

                <button
                  onClick={handleRecommendModel}
                  disabled={!prompt.trim() || isRecommendingModel}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isRecommendingModel
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 hover:from-amber-100 hover:to-orange-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecommendingModel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                  <span>{t('home.modelRecommendation')} (GPT-5.1)</span>
                </button>
              </div>

              {/* 프롬프트 교정 정보 표시 */}
              {correctionInfo && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                    ✨ {correctionInfo.purpose} {t('home.correctedFor')}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {correctionInfo.size}
                  </span>
                </div>
              )}

              {/* GPT 추천 결과 */}
              {gptRecommendation && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    💡 <span className="font-medium">{t('home.aiRecommendation')}:</span> {gptRecommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Reference Image Upload */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('home.referenceImageOptional')}</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {t('home.referenceImageDesc')}
              </p>

              {referenceImagePreview ? (
                <div className="relative">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-indigo-200">
                    <img
                      src={referenceImagePreview}
                      alt={t('home.referenceImage')}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={removeReferenceImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    📎 {referenceImage?.name} ({(referenceImage!.size / 1024).toFixed(0)} KB)
                  </p>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-1">
                      {t('home.clickToUpload')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('home.imageFormats')}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Email Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('home.resultEmail')}</h2>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || "your@email.com"}
                  disabled={!user}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                💡 {t('home.emailTip')}
              </p>
            </div>

            {/* AI Models Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">{t('home.modelSelectionTitle')}</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                {t('home.modelSelectionDesc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {AI_MODELS.map((model) => {
                  const isSelected = selectedModels[model.id] !== undefined;
                  const count = selectedModels[model.id] || 0;

                  return (
                    <div
                      key={model.id}
                      className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? `${model.color} border-current shadow-md`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => !isSelected && toggleModel(model.id)}
                    >
                      {/* Badge */}
                      {model.badge && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                            {model.badge}
                          </span>
                        </div>
                      )}

                      {/* Checkbox */}
                      <div className="flex items-start space-x-3 mb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModel(model.id)}
                          className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xl">{model.logo}</span>
                            <h3 className="font-bold text-gray-900">{model.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">by {model.company}</p>
                          <p className="text-sm text-gray-600">{model.description}</p>
                          <p className="text-sm font-semibold text-indigo-600 mt-1">
                            {model.pointsPerImage}pt / {t('home.perImage')}
                          </p>
                        </div>
                      </div>

                      {/* Count Selector */}
                      {isSelected && (
                        <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                          <label className="text-sm font-medium text-gray-700">{t('home.quantity')}:</label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateModelCount(model.id, count - (model.step || 1));
                              }}
                              className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={count}
                              onChange={(e) => updateModelCount(model.id, parseInt(e.target.value) || (model.step || 1))}
                              onClick={(e) => e.stopPropagation()}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold"
                              min={model.step || 1}
                              max={model.maxCount || 100}
                              step={model.step || 1}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateModelCount(model.id, count + (model.step || 1));
                              }}
                              className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold"
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-600">{t('home.images')}</span>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-sm text-gray-600">{t('home.subtotal')}</p>
                            <p className="font-bold text-indigo-600">
                              {(model.pointsPerImage * count).toLocaleString()}pt
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Cost Summary */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="w-5 h-5" />
                  <h2 className="text-xl font-bold">{t('home.estimatedCost')}</h2>
                </div>

                <div className="space-y-3 mb-6">
                  {Object.entries(selectedModels).map(([modelId, count]) => {
                    const model = AI_MODELS.find(m => m.id === modelId);
                    if (!model || count === 0) return null;

                    return (
                      <div key={modelId} className="flex justify-between text-sm">
                        <span>{model.name}: {count} {t('home.images')}</span>
                        <span className="font-semibold">
                          {(model.pointsPerImage * count).toLocaleString()}pt
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/30 pt-4 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>{t('home.totalImages')}</span>
                    <span className="font-bold">{totalImages} {t('home.images')}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold">
                    <span>{t('home.totalCost')}</span>
                    <span>{totalPoints.toLocaleString()}pt</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('home.currentPoints')}</span>
                    <span className="font-semibold">{currentPoints.toLocaleString()}pt</span>
                  </div>
                  {isInsufficient ? (
                    <div className="bg-red-500 rounded-lg p-3 text-center">
                      <p className="font-bold">{t('home.insufficientPoints')}</p>
                      <p className="text-sm">{(totalPoints - currentPoints).toLocaleString()}pt {t('home.pointsShort')}</p>
                    </div>
                  ) : (
                    <div className="bg-white/20 rounded-lg p-3 text-center">
                      <p className="font-semibold">{t('home.remainingPoints')}</p>
                      <p className="text-lg font-bold">{(currentPoints - totalPoints).toLocaleString()}pt</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              {isInsufficient ? (
                <button 
                  onClick={() => window.location.href = '/points'}
                  className="w-full py-4 bg-yellow-500 text-white rounded-xl font-bold text-lg hover:bg-yellow-600 transition-all shadow-lg"
                >
                  {t('home.chargePoints')}
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={totalImages === 0 || prompt.length < 10 || !user || uploadingImage}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                    totalImages === 0 || prompt.length < 10 || !user || uploadingImage
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {uploadingImage
                    ? t('home.uploadingImage')
                    : !user
                    ? t('home.loginRequired')
                    : totalImages === 0
                    ? t('home.selectModel')
                    : prompt.length < 10
                    ? t('home.enterPrompt')
                    : `${t('home.generateButton')} (${totalPoints.toLocaleString()}pt)`}
                </button>
              )}

              {/* Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">💡 {t('home.tipTitle')}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('home.tip1')}</li>
                  <li>• <span className="text-indigo-600 font-medium">{t('home.promptCorrection')}</span> {t('home.tipCorrection')}</li>
                  <li>• <span className="text-amber-600 font-medium">{t('home.modelRecommendation')}</span> {t('home.tipRecommend')}</li>
                  <li>• {t('home.tip4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{t('common.appName')}</h3>
              <p className="text-gray-400 text-sm">{t('footer.description')}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('common.email')}: <a href="mailto:webmaster@geniuscat.co.kr" className="hover:text-white transition-colors">webmaster@geniuscat.co.kr</a></li>
                <li>{t('footer.phone')}: <a href="tel:010-8440-9820" className="hover:text-white transition-colors">010-8440-9820</a></li>
                <li>{t('footer.hours')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('footer.companyInfo')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('footer.companyName')}: MJ Studio</li>
                <li>{t('footer.representative')}: Song Minju</li>
                <li>{t('footer.businessNumber')}: 829-04-03406</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('footer.policies')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">{t('common.terms')}</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t('common.privacy')}</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">{t('common.refundPolicy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 MJ Studio. {t('footer.allRightsReserved')}
          </div>
        </div>
      </footer>

      {/* 프롬프트 교정 모달 */}
      <PromptCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        prompt={prompt}
        onCorrect={handlePromptCorrected}
      />
    </div>
  );
}

