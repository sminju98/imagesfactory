'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ContentType, 
  CONTENT_TYPE_LABELS, 
  CONTENT_TYPE_ICONS,
  ContentProjectStatus 
} from '@/types/content';

// 상태 라벨
const STATUS_CONFIG: Record<ContentProjectStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  processing: { label: '생성 중', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: '⏳' },
  completed: { label: '완료', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: '✅' },
  failed: { label: '실패', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: '❌' },
  partial: { label: '부분 완료', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: '⚠️' },
};

interface ContentResultPageProps {
  params: Promise<{ id: string }>;
}

export default function ContentResultPage({ params }: ContentResultPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [tasksByType, setTasksByType] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState<ContentType | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

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

  // 프로젝트 데이터 로드
  useEffect(() => {
    if (user && projectId) {
      fetchProject();
      
      // 진행 중이면 폴링
      const interval = setInterval(() => {
        if (project?.status === 'processing') {
          fetchProject();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, projectId, project?.status]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/content/project/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data.project);
        setTasksByType(data.data.tasksByType);
      }
    } catch (error) {
      console.error('프로젝트 로드 오류:', error);
    }
  };

  // 저장소에 저장
  const saveToStorage = async () => {
    if (selectedItems.size === 0) {
      alert('저장할 콘텐츠를 선택해주세요');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/content/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          projectId,
          taskIds: Array.from(selectedItems),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`${data.data.savedCount}개 콘텐츠가 저장소에 저장되었습니다!`);
        setSelectedItems(new Set());
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 전체 저장
  const saveAll = async () => {
    setSaving(true);
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
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 선택 토글
  const toggleSelection = (taskId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // 다운로드
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 오류:', error);
    }
  };

  // 전체 다운로드
  const downloadAll = async () => {
    const allTasks = Object.values(tasksByType).flat().filter(t => t.imageUrl);
    for (const task of allTasks) {
      await downloadImage(task.imageUrl, `${task.type}_${task.order}.png`);
      await new Promise(resolve => setTimeout(resolve, 500)); // 딜레이
    }
  };

  // 현재 탭의 태스크들
  const currentTasks = activeTab === 'all'
    ? Object.values(tasksByType).flat()
    : tasksByType[activeTab] || [];

  // 완료된 태스크 수
  const completedCount = Object.values(tasksByType).flat().filter(t => t.status === 'completed').length;
  const totalCount = Object.values(tasksByType).flat().length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl text-white mb-2">프로젝트를 찾을 수 없습니다</h2>
          <Link href="/content-history" className="text-purple-400 hover:text-purple-300">
            히스토리로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status as ContentProjectStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 헤더 */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/content-history')}
                className="text-white/70 hover:text-white transition-colors"
              >
                ← 히스토리
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {project.concept?.productName || '콘텐츠 결과'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-lg text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                  <span className="text-white/50 text-sm">
                    {completedCount}/{totalCount} 완료
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedItems.size > 0 && (
                <button
                  onClick={saveToStorage}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {saving ? '저장 중...' : `📦 선택 저장 (${selectedItems.size})`}
                </button>
              )}
              <button
                onClick={saveAll}
                disabled={saving}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                📦 전체 저장
              </button>
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                ⬇️ 전체 다운로드
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 진행률 (생성 중일 때) */}
        {project.status === 'processing' && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-400"></div>
              <span className="text-blue-400 font-medium">콘텐츠 생성 중...</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <p className="text-white/60 text-sm mt-2">
              {completedCount}/{totalCount} 완료 • 완료되면 이메일로 알려드립니다
            </p>
          </div>
        )}

        {/* 콘셉트 정보 */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">📋 프로젝트 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-white/50">제품명</span>
              <p className="text-white font-medium">{project.concept?.productName || '-'}</p>
            </div>
            <div>
              <span className="text-white/50">USP</span>
              <p className="text-white font-medium">{project.concept?.usp || '-'}</p>
            </div>
            <div>
              <span className="text-white/50">타겟</span>
              <p className="text-white font-medium">{project.concept?.target || '-'}</p>
            </div>
            <div>
              <span className="text-white/50">톤앤매너</span>
              <p className="text-white font-medium">{project.concept?.toneAndManner || '-'}</p>
            </div>
          </div>
        </div>

        {/* 콘텐츠 타입 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            📁 전체 ({totalCount})
          </button>
          {Object.entries(tasksByType).map(([type, tasks]) => {
            if (!tasks || tasks.length === 0) return null;
            const completed = tasks.filter(t => t.status === 'completed').length;
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type as ContentType)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === type
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {CONTENT_TYPE_ICONS[type as ContentType]} {CONTENT_TYPE_LABELS[type as ContentType]} ({completed}/{tasks.length})
              </button>
            );
          })}
        </div>

        {/* 콘텐츠 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {currentTasks.map((task: any) => (
            <div
              key={task.id}
              className={`group relative bg-white/5 rounded-xl overflow-hidden border transition-all ${
                selectedItems.has(task.id)
                  ? 'border-purple-500 ring-2 ring-purple-500/50'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* 이미지 영역 */}
              <div className="aspect-square relative bg-white/10">
                {task.imageUrl ? (
                  <>
                    <img
                      src={task.imageUrl}
                      alt={`${task.type} ${task.order}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleSelection(task.id)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                      >
                        {selectedItems.has(task.id) ? '✓' : '○'}
                      </button>
                      <button
                        onClick={() => downloadImage(task.imageUrl, `${task.type}_${task.order}.png`)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => window.open(task.imageUrl, '_blank')}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                      >
                        🔍
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {task.status === 'processing' ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                        <span className="text-white/50 text-sm">생성 중...</span>
                      </>
                    ) : task.status === 'failed' ? (
                      <>
                        <span className="text-red-400 text-3xl mb-2">❌</span>
                        <span className="text-red-400 text-sm">실패</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white/30 text-3xl mb-2">⏳</span>
                        <span className="text-white/30 text-sm">대기 중</span>
                      </>
                    )}
                  </div>
                )}

                {/* 타입 배지 */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-xs text-white">
                  {CONTENT_TYPE_ICONS[task.type as ContentType]} #{task.order}
                </div>

                {/* 선택 표시 */}
                {selectedItems.has(task.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="p-3">
                <div className="text-white font-medium text-sm mb-1">
                  {CONTENT_TYPE_LABELS[task.type as ContentType]} #{task.order}
                </div>
                {task.text && (
                  <div className="text-white/50 text-xs truncate">
                    {task.text}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {currentTasks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl text-white mb-2">콘텐츠가 없습니다</h3>
            <p className="text-white/60">이 타입의 콘텐츠가 아직 생성되지 않았습니다</p>
          </div>
        )}
      </div>

      {/* 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-white">
            <span className="font-bold">{completedCount}</span>
            <span className="text-white/60">/{totalCount} 완료</span>
            {selectedItems.size > 0 && (
              <span className="ml-4 text-purple-400">
                {selectedItems.size}개 선택됨
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/content-storage"
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              📦 저장소 보기
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              ✨ 새 콘텐츠 만들기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

