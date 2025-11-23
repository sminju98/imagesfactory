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
  imageUrls?: string[];
  zipUrl?: string;
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
          const data = doc.data();
          // modelConfigs가 배열이 아니면 빈 배열로 초기화
          setGeneration({ 
            id: doc.id, 
            ...data,
            modelConfigs: Array.isArray(data.modelConfigs) ? data.modelConfigs : []
          } as GenerationData);
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
              
              <div className="flex justify-center space-x-4 flex-wrap gap-3">
                {generation.zipUrl && (
                  <a
                    href={generation.zipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold shadow-lg"
                  >
                    📦 ZIP 파일 다운로드
                  </a>
                )}
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

        {/* Generated Images - 완료 시에만 표시 */}
        {generation.status === 'completed' && generation.imageUrls && generation.imageUrls.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">🎨 생성된 이미지 ({generation.imageUrls.length}장)</h3>
            
            {/* 이미지 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {generation.imageUrls.map((url, index) => (
                <div key={index} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                  <img
                    src={url}
                    alt={`생성된 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-gray-100"
                    >
                      🔗 원본 보기
                    </a>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* 다운로드 링크 목록 */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-gray-900 mb-3">📥 다운로드 링크</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4">
                {generation.imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-indigo-300 transition-colors">
                    <span className="text-sm text-gray-600 truncate flex-1 mr-4">
                      🖼️ 이미지 {index + 1}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium whitespace-nowrap"
                    >
                      다운로드 →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="font-bold text-indigo-900 mb-2">💡 안내</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• 이 페이지를 닫아도 생성은 계속됩니다</li>
            <li>• 완료되면 {generation.email}으로 자동 전송됩니다</li>
            <li>• 마이페이지 {'>'} 히스토리에서 언제든지 확인 가능합니다</li>
            {generation.status === 'completed' && (
              <li>• 이미지 링크는 30일간 유효합니다</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}

