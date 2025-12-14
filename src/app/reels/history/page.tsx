'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Film,
  ArrowRight,
  Calendar,
  Coins
} from 'lucide-react';

interface ReelsProject {
  id: string;
  title: string;
  inputPrompt: string;
  refinedPrompt?: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  currentStep: number;
  pointsUsed: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

const STEP_NAMES = [
  '프롬프트 입력',
  '리서치',
  '콘셉트',
  '대본',
  '영상 생성',
  'TTS & 자막',
  '최종 결합',
];

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string; animate?: boolean }> = {
  draft: { icon: Clock, label: '진행 중', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  processing: { icon: Loader2, label: '처리 중', color: 'text-blue-400', bg: 'bg-blue-500/20', animate: true },
  completed: { icon: CheckCircle, label: '완료', color: 'text-green-400', bg: 'bg-green-500/20' },
  failed: { icon: AlertCircle, label: '실패', color: 'text-red-400', bg: 'bg-red-500/20' },
};

export default function ReelsHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ReelsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  // 실시간 프로젝트 목록 구독
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 복합 인덱스 없이 userId만으로 쿼리 (클라이언트 측 정렬)
    const q = query(
      collection(db, 'reelsProjects'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ReelsProject[];
      
      // 클라이언트 측에서 updatedAt 기준 정렬
      projectsData.sort((a, b) => {
        const aTime = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 
                      a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
        const bTime = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 
                      b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
        return bTime - aTime; // 최신 순
      });
      
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error('히스토리 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 날짜 포맷
  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return '-';
    
    // Timestamp를 Date로 변환
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 필터링된 프로젝트
  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    if (filter === 'processing') return project.status === 'draft' || project.status === 'processing';
    return project.status === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="mt-4 text-purple-200">히스토리 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">로그인이 필요합니다.</p>
          <Link href="/login" className="px-6 py-3 bg-purple-600 text-white rounded-lg">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Film className="w-7 h-7 text-purple-400" />
            콘텐츠 히스토리
          </h1>
          <p className="text-purple-200 mt-1">
            생성한 릴스 프로젝트 목록입니다
          </p>
        </div>

        <Link
          href="/reels/new"
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-lg transition-all"
        >
          + 새 릴스 만들기
        </Link>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: '전체' },
          { key: 'completed', label: '완료' },
          { key: 'processing', label: '진행 중' },
          { key: 'failed', label: '실패' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 프로젝트 목록 */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-2">
            {filter === 'all' 
              ? '아직 생성한 릴스가 없습니다.' 
              : `${filter === 'completed' ? '완료된' : filter === 'processing' ? '진행 중인' : '실패한'} 릴스가 없습니다.`}
          </p>
          <Link
            href="/reels/new"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
          >
            첫 번째 릴스 만들기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={project.id}
                href={`/reels/${project.id}`}
                className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 제목 & 상태 */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white truncate">
                        {project.title || project.inputPrompt?.substring(0, 50) || '제목 없음'}
                      </h3>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* 프롬프트 미리보기 */}
                    <p className="text-white/50 text-sm truncate mb-3">
                      {project.refinedPrompt || project.inputPrompt || '프롬프트 없음'}
                    </p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                      <span>
                        Step {project.currentStep} / 6 ({STEP_NAMES[project.currentStep]})
                      </span>
                      {project.pointsUsed > 0 && (
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {project.pointsUsed}P 사용
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 화살표 */}
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors ml-4" />
                </div>

                {/* 진행 바 */}
                <div className="mt-4">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        project.status === 'completed' 
                          ? 'bg-green-500' 
                          : project.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${Math.max((project.currentStep / 6) * 100, 10)}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 통계 */}
      {projects.length > 0 && (
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{projects.length}</p>
            <p className="text-white/50 text-sm">전체 프로젝트</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {projects.filter(p => p.status === 'completed').length}
            </p>
            <p className="text-white/50 text-sm">완료</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {projects.filter(p => p.status === 'draft' || p.status === 'processing').length}
            </p>
            <p className="text-white/50 text-sm">진행 중</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {projects.reduce((sum, p) => sum + (p.pointsUsed || 0), 0)}P
            </p>
            <p className="text-white/50 text-sm">총 사용 포인트</p>
          </div>
        </div>
      )}
    </div>
  );
}

