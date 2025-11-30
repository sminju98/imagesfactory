'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/lib/i18n';
import { Loader2, CheckCircle, XCircle, Clock, Sparkles, Home, RefreshCw, AlertTriangle, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface GenerationData {
  id: string;
  prompt: string;
  email?: string;        // 이전 버전 호환
  userEmail?: string;    // 현재 버전
  totalImages: number;
  totalPoints: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  modelConfigs: Array<{
    modelId: string;
    count: number;
    completedCount: number;
    status: string;
  }>;
  imageUrls?: string[];
  zipUrl?: string;
  completedAt?: any;
  failedReason?: string;
}

interface FailedJob {
  modelId: string;
  pointsCost: number;
  errorMessage?: string;
}

const MODEL_NAMES: Record<string, string> = {
  'dall-e-3': 'DALL-E 3',
  'sdxl': 'SD 3.5 Large',
  'flux': 'Flux 1.1 Pro',
  'leonardo': 'Leonardo Phoenix',
  'pixart': 'PixArt-Σ',
  'realistic-vision': 'Realistic Vision',
  'aurora': 'Aurora',
  'ideogram': 'Ideogram V3',
  'grok': 'Grok-2',
  'gpt-image': 'GPT-Image',
  'firefly': 'Firefly',
  'midjourney': 'Midjourney',
  'recraft': 'Recraft V3',
  'playground': 'Playground',
  'kandinsky': 'Kandinsky',
  'gemini': 'Nano Banana',
  'seedream': 'Seedream 4',
  'hunyuan': 'Hunyuan 3',
};

// URL에서 모델명 추출 (예: ..._pixart.png -> pixart)
function extractModelFromUrl(url: string): string {
  try {
    const filename = url.split('/').pop() || '';
    const match = filename.match(/_([a-zA-Z0-9-]+)\.png$/);
    if (match) {
      return MODEL_NAMES[match[1]] || match[1];
    }
  } catch (e) {}
  return '';
}

export default function GenerationPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const generationId = params.id as string;
  const [generation, setGeneration] = useState<GenerationData | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [refundedPoints, setRefundedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [likingImage, setLikingImage] = useState<string | null>(null);
  
  // 실시간 완료된 이미지 (생성 중에 하나씩 표시)
  const [completedImages, setCompletedImages] = useState<Array<{
    url: string;
    modelId: string;
    completedAt: Date;
  }>>([]);

  // 좋아요 상태 불러오기
  useEffect(() => {
    if (!user?.uid || !generation?.imageUrls?.length) return;

    const fetchLikedStatus = async () => {
      try {
        const response = await fetch(
          `/api/gallery/like?userId=${user.uid}&imageUrls=${encodeURIComponent(JSON.stringify(generation.imageUrls))}`
        );
        const data = await response.json();
        
        if (data.success && data.data.likedStatus) {
          const liked = new Set<string>();
          Object.entries(data.data.likedStatus).forEach(([url, isLiked]) => {
            if (isLiked) liked.add(url);
          });
          setLikedImages(liked);
        }
      } catch (error) {
        console.error('좋아요 상태 조회 오류:', error);
      }
    };

    fetchLikedStatus();
  }, [user?.uid, generation?.imageUrls]);

  // 좋아요 토글
  const handleLike = async (imageUrl: string) => {
    if (!user?.uid) {
      alert(t('common.loginRequired'));
      return;
    }

    setLikingImage(imageUrl);

    try {
      const response = await fetch('/api/gallery/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          imageUrl,
          taskId: generationId,
          modelId: extractModelFromUrl(imageUrl),
          prompt: generation?.prompt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLikedImages(prev => {
          const newSet = new Set(prev);
          if (data.data.isLiked) {
            newSet.add(imageUrl);
          } else {
            newSet.delete(imageUrl);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
    } finally {
      setLikingImage(null);
    }
  };

  // 다시 생성하기 - 같은 프롬프트, 모델, 수량으로 메인페이지 이동
  const handleRegenerate = () => {
    if (!generation) return;
    
    // 모델별 수량 정보 저장
    const modelCounts: Record<string, number> = {};
    generation.modelConfigs.forEach((config) => {
      modelCounts[config.modelId] = config.count;
    });

    // 좋아요한 이미지 중 마지막 것을 레퍼런스 이미지로 설정
    let referenceImageUrl: string | null = null;
    if (likedImages.size > 0 && generation.imageUrls) {
      const likedInResults = generation.imageUrls.filter(url => likedImages.has(url));
      if (likedInResults.length > 0) {
        referenceImageUrl = likedInResults[likedInResults.length - 1];
      }
    }

    // localStorage에 재생성 데이터 저장
    const regenerateData = {
      prompt: generation.prompt,
      modelCounts,
      referenceImageUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem('regenerateData', JSON.stringify(regenerateData));
    
    // 메인페이지로 이동
    router.push('/');
  };

  useEffect(() => {
    if (!generationId) return;

    // Firestore 실시간 리스너 (tasks 컬렉션 사용)
    const unsubscribe = onSnapshot(
      doc(db, 'tasks', generationId),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          // modelConfigs가 배열이 아니면 빈 배열로 초기화
          setGeneration({ 
            id: docSnapshot.id, 
            ...data,
            modelConfigs: Array.isArray(data.modelConfigs) ? data.modelConfigs : []
          } as GenerationData);

          // 완료/실패 상태일 때 실패한 jobs 조회
          if (data.status === 'completed' || data.status === 'failed') {
            try {
              const jobsSnapshot = await getDocs(collection(db, 'tasks', generationId, 'jobs'));
              const failed: FailedJob[] = [];
              let totalRefund = 0;

              jobsSnapshot.forEach((jobDoc) => {
                const job = jobDoc.data();
                if (job.status === 'failed') {
                  failed.push({
                    modelId: job.modelId,
                    pointsCost: job.pointsCost || 0,
                    errorMessage: job.errorMessage,
                  });
                  totalRefund += job.pointsCost || 0;
                }
              });

              setFailedJobs(failed);
              setRefundedPoints(totalRefund);
            } catch (err) {
              console.error('Failed to fetch jobs:', err);
            }
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to generation:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [generationId]);

  // Jobs 컬렉션 실시간 구독 - 완료된 이미지 하나씩 표시
  useEffect(() => {
    if (!generationId || generation?.status === 'completed') return;

    const jobsRef = collection(db, 'tasks', generationId, 'jobs');
    
    const unsubscribeJobs = onSnapshot(
      jobsRef,
      (snapshot) => {
        const completed: Array<{
          url: string;
          modelId: string;
          completedAt: Date;
        }> = [];

        snapshot.forEach((jobDoc) => {
          const job = jobDoc.data();
          if (job.status === 'completed' && job.imageUrl) {
            completed.push({
              url: job.imageUrl,
              modelId: job.modelId || 'unknown',
              completedAt: job.completedAt?.toDate?.() || new Date(),
            });
          }
        });

        // 완료 시간 순으로 정렬
        completed.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
        setCompletedImages(completed);
      },
      (error) => {
        console.error('Error listening to jobs:', error);
      }
    );

    return () => unsubscribeJobs();
  }, [generationId, generation?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('generation.notFound')}</h2>
          <Link href="/" className="text-indigo-600 hover:underline">
            {t('common.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
                <p className="text-xs text-gray-500">{t('common.tagline')}</p>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>{t('common.home')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {generation.status === 'pending' && (
            <div className="text-center">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('generation.pending')}</h2>
              <p className="text-gray-600">{t('generation.pendingDesc')}</p>
            </div>
          )}

          {generation.status === 'processing' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎨 {t('generation.processing')}</h2>
              <p className="text-gray-600 mb-6">{t('generation.processingDesc')}</p>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 transition-all duration-500 ease-out"
                    style={{ width: `${generation.progress}%` }}
                  ></div>
                </div>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{generation.progress}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  {completedImages.length} / {generation.totalImages} {t('home.images')} {t('generation.completed')}
                </p>
              </div>

              {/* 실시간 완료된 이미지 미리보기 */}
              {completedImages.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    ✨ {t('generation.completedPreview')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {completedImages.map((img, idx) => (
                      <div
                        key={img.url}
                        className="relative aspect-square rounded-lg overflow-hidden shadow-md bg-gray-100 animate-fade-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <img
                          src={img.url}
                          alt={`Generated ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-white text-xs font-medium">
                            #{idx + 1} {MODEL_NAMES[img.modelId] || img.modelId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-6">
                {t('generation.estimatedTime')}: ~{Math.ceil((100 - generation.progress) / 100 * generation.totalImages * 30 / 60)} {t('generation.minutes')}
              </p>
            </div>
          )}

          {generation.status === 'completed' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 {t('generation.completed')}</h2>
              <p className="text-gray-600 mb-2">
                {t('generation.totalGenerated', { count: generation.imageUrls?.length || 0 })}
                {failedJobs.length > 0 && (
                  <span className="text-orange-600"> ({failedJobs.length} {t('generation.failed')})</span>
                )}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {t('generation.sentTo', { email: generation.userEmail || generation.email || '' })}
              </p>

              {/* 실패한 모델 및 환불 정보 */}
              {failedJobs.length > 0 && (() => {
                // 모델별로 그룹화
                const groupedFailures = failedJobs.reduce((acc, job) => {
                  if (!acc[job.modelId]) {
                    acc[job.modelId] = { count: 0, totalPoints: 0 };
                  }
                  acc[job.modelId].count += 1;
                  acc[job.modelId].totalPoints += job.pointsCost;
                  return acc;
                }, {} as Record<string, { count: number; totalPoints: number }>);
                
                const uniqueModels = Object.keys(groupedFailures);
                
                return (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-orange-800">
                        {t('generation.failedModels')} ({uniqueModels.length} {t('generation.models')}, {failedJobs.length} {t('home.images')})
                      </span>
                    </div>
                    <ul className="text-sm text-orange-700 space-y-1 mb-3">
                      {uniqueModels.map((modelId) => (
                        <li key={modelId} className="flex justify-between">
                          <span>• {MODEL_NAMES[modelId] || modelId} ({groupedFailures[modelId].count} {t('home.images')})</span>
                          <span className="text-orange-600">-{groupedFailures[modelId].totalPoints}P</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-orange-200 pt-2 flex justify-between items-center">
                      <span className="font-medium text-orange-800">💰 {t('generation.autoRefund')}</span>
                      <span className="font-bold text-green-600">+{refundedPoints} {t('common.points')}</span>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex justify-center space-x-4 flex-wrap gap-3">
                {generation.zipUrl && (
                  <a
                    href={generation.zipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold shadow-lg"
                  >
                    📦 {t('generation.downloadZip')}
                  </a>
                )}
                <button
                  onClick={handleRegenerate}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold shadow-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>{t('generation.regenerate')}</span>
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  {t('generation.newGeneration')}
                </Link>
              </div>
            </div>
          )}

          {generation.status === 'failed' && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('generation.failedTitle')}</h2>
              <p className="text-red-600 mb-4">
                {generation.failedReason || t('generation.unknownError')}
              </p>

              {/* 실패한 모델 및 환불 정보 */}
              {failedJobs.length > 0 && (() => {
                // 모델별로 그룹화
                const groupedFailures = failedJobs.reduce((acc, job) => {
                  if (!acc[job.modelId]) {
                    acc[job.modelId] = { count: 0, totalPoints: 0 };
                  }
                  acc[job.modelId].count += 1;
                  acc[job.modelId].totalPoints += job.pointsCost;
                  return acc;
                }, {} as Record<string, { count: number; totalPoints: number }>);
                
                const uniqueModels = Object.keys(groupedFailures);
                
                return (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-red-800">
                        {t('generation.failedModels')} ({uniqueModels.length} {t('generation.models')}, {failedJobs.length} {t('home.images')})
                      </span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1 mb-3">
                      {uniqueModels.map((modelId) => (
                        <li key={modelId} className="flex justify-between">
                          <span>• {MODEL_NAMES[modelId] || modelId} ({groupedFailures[modelId].count} {t('home.images')})</span>
                          <span className="text-red-600">-{groupedFailures[modelId].totalPoints}P</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-red-200 pt-2 flex justify-between items-center">
                      <span className="font-medium text-red-800">💰 {t('generation.autoRefund')}</span>
                      <span className="font-bold text-green-600">+{refundedPoints} {t('common.points')}</span>
                    </div>
                  </div>
                );
              })()}

              {refundedPoints === 0 && (
                <p className="text-sm text-gray-600 mb-6">
                  {t('generation.pointsRefunded')}
                </p>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleRegenerate}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold shadow-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>{t('generation.regenerate')}</span>
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  {t('generation.newGeneration')}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">📝 {t('generation.prompt')}</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{generation.prompt}</p>
        </div>

        {/* Generated Images - 진행 중이거나 완료 시 이미지가 있으면 표시 */}
        {(generation.status === 'completed' || generation.status === 'processing') && generation.imageUrls && generation.imageUrls.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">🎨 {t('generation.generatedImages')} ({generation.imageUrls.length} {t('home.images')})</h3>
            
            {/* 이미지 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {generation.imageUrls.map((url, index) => (
                <div key={index} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                  <img
                    src={url}
                    alt={`${t('generation.generatedImage')} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-gray-100"
                    >
                      🔗 {t('generation.viewOriginal')}
                    </a>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{index + 1} {extractModelFromUrl(url)}
                  </div>
                  {/* 좋아요 버튼 */}
                  <button
                    onClick={() => handleLike(url)}
                    disabled={likingImage === url}
                    className={`absolute bottom-2 right-2 p-2 rounded-full transition-all shadow-lg ${
                      likedImages.has(url)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                    } ${likingImage === url ? 'opacity-50' : ''}`}
                    title={likedImages.has(url) ? t('generation.unlike') : t('generation.like')}
                  >
                    <Heart
                      className={`w-5 h-5 ${likedImages.has(url) ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* 다운로드 링크 목록 */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-gray-900 mb-3">📥 {t('generation.downloadLinks')}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4">
                {generation.imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-indigo-300 transition-colors">
                    <span className="text-sm text-gray-600 truncate flex-1 mr-4">
                      🖼️ {t('generation.image')} {index + 1} - {extractModelFromUrl(url) || t('generation.unknown')}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium whitespace-nowrap"
                    >
                      {t('generation.download')} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="font-bold text-indigo-900 mb-2">💡 {t('generation.notice')}</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• {t('generation.noticeContinue')}</li>
            <li>• {t('generation.noticeEmail', { email: generation.userEmail || generation.email || '' })}</li>
            <li>• {t('generation.noticeHistory')}</li>
            {generation.status === 'completed' && (
              <li>• {t('generation.noticeValidity')}</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}

