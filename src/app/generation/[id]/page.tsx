'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, CheckCircle, XCircle, Clock, Sparkles, Home } from 'lucide-react';

interface GenerationData {
  id: string;
  prompt: string;
  email: string;
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
  completedAt?: any;
  failedReason?: string;
}

const MODEL_NAMES: Record<string, string> = {
  'dall-e-3': 'DALL-E 3',
  'sdxl': 'Stable Diffusion XL',
  'flux': 'Flux Schnell',
  'leonardo': 'Leonardo.ai',
};

export default function GenerationPage() {
  const params = useParams();
  const generationId = params.id as string;
  const [generation, setGeneration] = useState<GenerationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!generationId) return;

    // Firestore 실시간 리스너
    const unsubscribe = onSnapshot(
      doc(db, 'imageGenerations', generationId),
      (doc) => {
        if (doc.exists()) {
          setGeneration({ id: doc.id, ...doc.data() } as GenerationData);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">생성 작업을 찾을 수 없습니다</h2>
          <Link href="/" className="text-indigo-600 hover:underline">
            홈으로 돌아가기
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
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">imagesfactory</h1>
                <p className="text-xs text-gray-500">by 엠제이스튜디오</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>홈으로</span>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">대기 중...</h2>
              <p className="text-gray-600">곧 이미지 생성을 시작합니다</p>
            </div>
          )}

          {generation.status === 'processing' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎨 AI가 열심히 그리고 있어요!</h2>
              <p className="text-gray-600 mb-6">생성이 완료되면 이메일로 전송됩니다</p>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 transition-all duration-500 ease-out"
                    style={{ width: `${generation.progress}%` }}
                  ></div>
                </div>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{generation.progress}%</p>
              </div>

              <p className="text-sm text-gray-500">
                예상 남은 시간: 약 {Math.ceil((100 - generation.progress) / 100 * generation.totalImages * 30 / 60)}분
              </p>
            </div>
          )}

          {generation.status === 'completed' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 이미지 생성 완료!</h2>
              <p className="text-gray-600 mb-2">
                총 {generation.totalImages}장의 이미지가 생성되었습니다
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {generation.email}으로 전송되었습니다
              </p>
              
              <div className="flex justify-center space-x-4">
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                  이메일 확인하기
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  새로운 이미지 생성
                </Link>
              </div>
            </div>
          )}

          {generation.status === 'failed' && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">생성 실패</h2>
              <p className="text-red-600 mb-6">
                {generation.failedReason || '알 수 없는 오류가 발생했습니다'}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                사용하신 포인트는 자동으로 환불되었습니다
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                다시 시도하기
              </Link>
            </div>
          )}
        </div>

        {/* Prompt Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">📝 프롬프트</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{generation.prompt}</p>
        </div>

        {/* Model Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">🤖 모델별 진행 상황</h3>
          <div className="space-y-4">
            {generation.modelConfigs.map((config, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {config.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : config.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {MODEL_NAMES[config.modelId] || config.modelId}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {config.completedCount}/{config.count}장
                  </span>
                </div>
                
                {config.status === 'processing' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${(config.completedCount / config.count) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="font-bold text-indigo-900 mb-2">💡 안내</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• 이 페이지를 닫아도 생성은 계속됩니다</li>
            <li>• 완료되면 {generation.email}으로 자동 전송됩니다</li>
            <li>• 마이페이지 {'>'} 히스토리에서 언제든지 확인 가능합니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

