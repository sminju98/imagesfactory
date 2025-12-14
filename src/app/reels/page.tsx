'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ReelsProject } from '@/types/reels.types';
import Link from 'next/link';
import { Plus, Clock, CheckCircle2, XCircle, Loader2, Film, Play } from 'lucide-react';

const STEP_NAMES = ['입력', '리서치', '콘셉트', '대본', '영상', '음성', '완성'];

export default function ReelsProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ReelsProject[]>([]);
  const [loading, setLoading] = useState(true);

  // 실시간 프로젝트 구독
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // 복합 인덱스 없이 userId만으로 쿼리 (클라이언트 측 정렬)
    const projectsRef = collection(db, 'reelsProjects');
    const q = query(
      projectsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let projectsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ReelsProject[];

      // 클라이언트 측에서 updatedAt 기준 정렬 (최신 순)
      projectsList.sort((a, b) => {
        const aTime = (a.updatedAt as any)?.toMillis?.() || (a.updatedAt as any)?.getTime?.() || 0;
        const bTime = (b.updatedAt as any)?.toMillis?.() || (b.updatedAt as any)?.getTime?.() || 0;
        return bTime - aTime;
      });

      // 최대 20개만
      projectsList = projectsList.slice(0, 20);

      setProjects(projectsList);
      setLoading(false);
    }, (error) => {
      console.error('프로젝트 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
            <XCircle className="w-3 h-3" />
            실패
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            처리중
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            진행중
          </span>
        );
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">내 프로젝트</h1>
          <p className="mt-1 text-purple-200">
            AI로 30초 릴스를 자동 제작하세요
          </p>
        </div>
        <Link
          href="/reels/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
        >
          <Plus className="w-5 h-5" />
          새 릴스 만들기
        </Link>
      </div>

      {/* 로딩 */}
      {(loading || authLoading) && (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
            <p className="mt-4 text-purple-200">프로젝트를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !authLoading && projects.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Film className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            아직 프로젝트가 없어요
          </h3>
          <p className="text-purple-200 mb-6">
            첫 번째 릴스를 만들어보세요!
          </p>
          <Link
            href="/reels/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl"
          >
            <Plus className="w-5 h-5" />
            새 릴스 만들기
          </Link>
        </div>
      )}

      {/* 프로젝트 그리드 */}
      {!loading && !authLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300"
            >
              {/* 썸네일 영역 */}
              <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 relative">
                {project.finalReelUrl ? (
                  <video
                    src={project.finalReelUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* 재생 버튼 오버레이 */}
                {project.finalReelUrl && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                )}
                
                {/* 상태 배지 */}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(project.status)}
                </div>
              </div>

              {/* 컨텐츠 */}
              <div className="p-5">
                <h3 className="text-white font-medium line-clamp-2 mb-2">
                  {project.inputPrompt || project.refinedPrompt || '제목 없음'}
                </h3>
                
                {/* 진행 상태 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                    <span>진행률</span>
                    <span>{STEP_NAMES[project.currentStep] || '입력'} ({project.currentStep + 1}/7)</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        project.status === 'completed'
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : project.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${((project.currentStep + 1) / 7) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center justify-between text-xs text-purple-300 mb-4">
                  <span>{formatDate(project.createdAt)}</span>
                  <span>{project.pointsUsed || 0} pt 사용</span>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <Link
                    href={`/reels/${project.id}`}
                    className="flex-1 text-center py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    {project.status === 'completed' ? '결과 보기' : '이어서 작업'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
