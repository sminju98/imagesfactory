'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ContentType, 
  CONTENT_TYPE_LABELS, 
  CONTENT_TYPE_ICONS,
  ContentProjectStatus 
} from '@/types/content';

// 상태 라벨
const STATUS_LABELS: Record<ContentProjectStatus, { label: string; color: string; icon: string }> = {
  processing: { label: '생성 중', color: 'text-blue-400 bg-blue-500/20', icon: '⏳' },
  completed: { label: '완료', color: 'text-green-400 bg-green-500/20', icon: '✅' },
  failed: { label: '실패', color: 'text-red-400 bg-red-500/20', icon: '❌' },
  partial: { label: '부분 완료', color: 'text-yellow-400 bg-yellow-500/20', icon: '⚠️' },
};

interface ProjectWithSummary {
  id: string;
  userId: string;
  status: ContentProjectStatus;
  inputPrompt: string;
  concept: {
    productName: string;
    usp: string;
    target: string;
  };
  totalTasks: number;
  completedTasks: number;
  totalPointsUsed: number;
  createdAt: any;
  tasksSummary: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
    byType: Record<string, { total: number; completed: number }>;
  };
}

export default function ContentHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectWithSummary[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0, failed: 0 });
  const [statusFilter, setStatusFilter] = useState<ContentProjectStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 프로젝트 목록 로드
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, statusFilter]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams({
        userId: user.uid,
        limit: '50',
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/content/history?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data.projects);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('프로젝트 로드 오류:', error);
    }
  };

  // 프로젝트 상세 로드
  const loadProjectDetail = async (projectId: string) => {
    setSelectedProject(projectId);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/content/project/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProjectDetail(data.data);
      }
    } catch (error) {
      console.error('프로젝트 상세 로드 오류:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 프로젝트 삭제
  const deleteProject = async (projectId: string) => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까? 관련된 모든 콘텐츠가 삭제됩니다.')) return;

    try {
      const response = await fetch(`/api/content/project/${projectId}?userId=${user.uid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (selectedProject === projectId) {
          setSelectedProject(null);
          setProjectDetail(null);
        }
      }
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
    }
  };

  // 저장소로 저장
  const saveToStorage = async (projectId: string) => {
    try {
      const response = await fetch('/api/content/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          projectId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`${data.data.savedCount}개 콘텐츠가 저장소에 저장되었습니다!`);
      }
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 날짜 포맷
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 헤더 */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white/70 hover:text-white transition-colors"
              >
                ← 뒤로
              </button>
              <h1 className="text-2xl font-bold text-white">📜 콘텐츠 히스토리</h1>
            </div>
            
            <button
              onClick={() => router.push('/content-storage')}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              📦 저장소 보기
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-purple-500/30 border-2 border-purple-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-3xl mb-1">📁</div>
            <div className="text-white font-medium">전체</div>
            <div className="text-purple-400 font-bold text-xl">{stats.total}</div>
          </div>
          <div
            onClick={() => setStatusFilter('completed')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'completed'
                ? 'bg-green-500/30 border-2 border-green-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-3xl mb-1">✅</div>
            <div className="text-white font-medium">완료</div>
            <div className="text-green-400 font-bold text-xl">{stats.completed}</div>
          </div>
          <div
            onClick={() => setStatusFilter('processing')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'processing'
                ? 'bg-blue-500/30 border-2 border-blue-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-3xl mb-1">⏳</div>
            <div className="text-white font-medium">진행 중</div>
            <div className="text-blue-400 font-bold text-xl">{stats.processing}</div>
          </div>
          <div
            onClick={() => setStatusFilter('failed')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'failed'
                ? 'bg-red-500/30 border-2 border-red-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-3xl mb-1">❌</div>
            <div className="text-white font-medium">실패</div>
            <div className="text-red-400 font-bold text-xl">{stats.failed}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로젝트 목록 */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">프로젝트 목록</h2>
            
            {projects.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-white/60">프로젝트가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => loadProjectDetail(project.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedProject === project.id
                        ? 'bg-purple-500/30 border-2 border-purple-500'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {project.concept?.productName || project.inputPrompt || '프로젝트'}
                        </h3>
                        <p className="text-white/50 text-sm">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs ${STATUS_LABELS[project.status].color}`}>
                        {STATUS_LABELS[project.status].icon} {STATUS_LABELS[project.status].label}
                      </span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(project.tasksSummary.completed / project.tasksSummary.total) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-white/50">
                      <span>{project.tasksSummary.completed}/{project.tasksSummary.total} 완료</span>
                      <span>{project.totalPointsUsed || 0}P 사용</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 프로젝트 상세 */}
          <div className="lg:col-span-2">
            {selectedProject && projectDetail ? (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* 상세 헤더 */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        {projectDetail.project.concept?.productName || '프로젝트'}
                      </h2>
                      <p className="text-white/60 text-sm">
                        {formatDate(projectDetail.project.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveToStorage(selectedProject)}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        📦 저장소에 저장
                      </button>
                      <button
                        onClick={() => deleteProject(selectedProject)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>

                  {/* 콘셉트 정보 */}
                  {projectDetail.project.concept && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">USP:</span>
                        <span className="text-white ml-2">{projectDetail.project.concept.usp}</span>
                      </div>
                      <div>
                        <span className="text-white/50">타겟:</span>
                        <span className="text-white ml-2">{projectDetail.project.concept.target}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 콘텐츠 타입별 탭 */}
                <div className="p-6">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(projectDetail.tasksByType).map(([type, tasks]: [string, any]) => {
                        if (!tasks || tasks.length === 0) return null;
                        
                        return (
                          <div key={type}>
                            <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                              <span>{CONTENT_TYPE_ICONS[type as ContentType]}</span>
                              <span>{CONTENT_TYPE_LABELS[type as ContentType]}</span>
                              <span className="text-white/50 text-sm">({tasks.length})</span>
                            </h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {tasks.map((task: any) => (
                                <div
                                  key={task.id}
                                  className="relative aspect-square rounded-lg overflow-hidden bg-white/10 group"
                                >
                                  {task.imageUrl ? (
                                    <>
                                      <img
                                        src={task.imageUrl}
                                        alt={`${type} ${task.order}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          onClick={() => window.open(task.imageUrl, '_blank')}
                                          className="p-2 bg-white/20 rounded-lg"
                                        >
                                          🔍
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {task.status === 'processing' ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                                      ) : task.status === 'failed' ? (
                                        <span className="text-red-400">❌</span>
                                      ) : (
                                        <span className="text-white/30">⏳</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* 순서 표시 */}
                                  <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                                    #{task.order}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl border border-white/10 flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-5xl mb-4">👈</div>
                  <p className="text-white/60">프로젝트를 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

