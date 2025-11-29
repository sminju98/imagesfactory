'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Image as ImageIcon, Loader2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function HistoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadLimit, setLoadLimit] = useState(20);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchGenerations();
    }
  }, [user, loadLimit]);

  const fetchGenerations = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      const generationsRef = collection(db, 'tasks');
      const q = query(
        generationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        firestoreLimit(loadLimit)
      );
      
      const snapshot = await getDocs(q);
      const gens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setGenerations(gens);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    pending: t('history.statusPending'),
    processing: t('history.statusProcessing'),
    completed: t('history.statusCompleted'),
    failed: t('history.statusFailed'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('history.title')}</h1>
          <p className="text-gray-600">
            {t('history.totalTasks', { count: generations.length })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('history.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{generations.length}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">{t('history.completed')}</p>
                <p className="text-2xl font-bold text-green-900">
                  {generations.filter(g => g.status === 'completed').length}
                </p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">{t('history.inProgress')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {generations.filter(g => g.status === 'processing').length}
                </p>
              </div>
              <span className="text-3xl">🔄</span>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-6 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">{t('history.failed')}</p>
                <p className="text-2xl font-bold text-red-900">
                  {generations.filter(g => g.status === 'failed').length}
                </p>
              </div>
              <span className="text-3xl">❌</span>
            </div>
          </div>
        </div>

        {/* List */}
        {loadingData ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        ) : generations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">생성 히스토리가 없습니다</h2>
            <p className="text-gray-600 mb-8">첫 AI 이미지를 생성해보세요!</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
            >
              이미지 생성하기
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {generations.map((gen) => {
                const createdAt = gen.createdAt?.toDate ? new Date(gen.createdAt.toDate()) : new Date();
                const completedAt = gen.completedAt?.toDate ? new Date(gen.completedAt.toDate()) : null;

                return (
                  <Link
                    key={gen.id}
                    href={`/generation/${gen.id}`}
                    className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start gap-6">
                      {/* Thumbnail */}
                      {gen.status === 'completed' && gen.imageUrls && gen.imageUrls[0] ? (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={gen.imageUrls[0]}
                            alt="썸네일"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[gen.status as keyof typeof statusColors]}`}>
                            {statusLabels[gen.status as keyof typeof statusLabels]}
                          </span>
                          {gen.status === 'processing' && (
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all"
                                  style={{ width: `${gen.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{gen.progress || 0}%</span>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-900 font-medium mb-3 line-clamp-2">
                          {gen.prompt}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <span>📅 {createdAt.toLocaleDateString('ko-KR')} {createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>🖼️ {gen.totalImages || 0}장</span>
                          <span>💰 {(gen.totalPoints || 0).toLocaleString()}pt</span>
                          {gen.email && <span>📧 {gen.email}</span>}
                        </div>

                        {/* 모델 배지 */}
                        {gen.modelConfigs && Array.isArray(gen.modelConfigs) && gen.modelConfigs.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {gen.modelConfigs.map((config: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-200 font-medium"
                              >
                                {config.modelId} × {config.count}
                              </span>
                            ))}
                          </div>
                        )}

                        {gen.status === 'failed' && gen.failedReason && (
                          <p className="mt-3 text-sm text-red-600">
                            ⚠️ {gen.failedReason}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load More */}
            {generations.length >= loadLimit && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setLoadLimit(prev => prev + 20)}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}


