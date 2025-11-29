'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ContentType, 
  CONTENT_TYPE_LABELS, 
  CONTENT_TYPE_ICONS,
  SavedContentItem 
} from '@/types/content';

// 콘텐츠 타입 탭 목록
const CONTENT_TABS: { type: ContentType | 'all'; label: string; icon: string }[] = [
  { type: 'all', label: '전체', icon: '📁' },
  { type: 'reels', label: '릴스', icon: '🎬' },
  { type: 'comic', label: '4컷 만화', icon: '📖' },
  { type: 'cardnews', label: '카드뉴스', icon: '📰' },
  { type: 'banner', label: '배너', icon: '🖼️' },
  { type: 'story', label: '스토리', icon: '📱' },
  { type: 'thumbnail', label: '썸네일', icon: '🎯' },
  { type: 'detail_header', label: '상세페이지', icon: '📄' },
];

export default function ContentStoragePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType | 'all'>('all');
  const [contents, setContents] = useState<SavedContentItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

  // 콘텐츠 로드
  useEffect(() => {
    if (user) {
      fetchContents();
    }
  }, [user, activeTab, sortBy, showFavoritesOnly]);

  const fetchContents = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams({
        userId: user.uid,
        sortBy,
        limit: '50',
      });

      if (activeTab !== 'all') {
        params.set('type', activeTab);
      }

      if (showFavoritesOnly) {
        params.set('isFavorite', 'true');
      }

      const response = await fetch(`/api/content/storage?${params}`);
      const data = await response.json();

      if (data.success) {
        setContents(data.data.contents);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('콘텐츠 로드 오류:', error);
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = async (contentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/content/storage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          updates: { isFavorite: !currentStatus },
        }),
      });

      if (response.ok) {
        setContents(prev => 
          prev.map(item => 
            item.id === contentId 
              ? { ...item, isFavorite: !currentStatus }
              : item
          )
        );
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
    }
  };

  // 선택 토글
  const toggleSelection = (contentId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });
  };

  // 전체 선택
  const selectAll = () => {
    if (selectedItems.size === contents.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(contents.map(c => c.id)));
    }
  };

  // 선택 항목 삭제
  const deleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`선택한 ${selectedItems.size}개 항목을 삭제하시겠습니까?`)) return;

    try {
      const itemsArray = Array.from(selectedItems);
      for (const contentId of itemsArray) {
        await fetch(`/api/content/storage?contentId=${contentId}&userId=${user.uid}`, {
          method: 'DELETE',
        });
      }
      
      setSelectedItems(new Set());
      fetchContents();
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  // 다운로드
  const downloadContent = async (content: SavedContentItem) => {
    try {
      const response = await fetch(content.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${content.type}_${content.order || 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 오류:', error);
    }
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
              <h1 className="text-2xl font-bold text-white">📦 콘텐츠 저장소</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 즐겨찾기 필터 */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                ⭐ 즐겨찾기
              </button>

              {/* 정렬 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="type">타입별</option>
              </select>

              {/* 뷰 모드 */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-white/70'}`}
                >
                  ▦
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-white/70'}`}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {CONTENT_TABS.map(tab => (
            <div
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                activeTab === tab.type
                  ? 'bg-purple-500/30 border-2 border-purple-500'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">{tab.icon}</div>
              <div className="text-white font-medium text-sm">{tab.label}</div>
              <div className="text-purple-400 font-bold">
                {tab.type === 'all' ? stats.total || 0 : stats[tab.type] || 0}
              </div>
            </div>
          ))}
        </div>

        {/* 선택 도구바 */}
        {selectedItems.size > 0 && (
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="text-white">
              <span className="font-bold">{selectedItems.size}</span>개 선택됨
            </div>
            <div className="flex gap-3">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
              >
                {selectedItems.size === contents.length ? '선택 해제' : '전체 선택'}
              </button>
              <button
                onClick={deleteSelected}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                🗑️ 삭제
              </button>
            </div>
          </div>
        )}

        {/* 콘텐츠 그리드 */}
        {contents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl text-white mb-2">저장된 콘텐츠가 없습니다</h3>
            <p className="text-white/60 mb-6">콘텐츠팩토리에서 생성한 콘텐츠를 저장해보세요!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              콘텐츠 만들기
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {contents.map(content => (
              <div
                key={content.id}
                className={`group relative bg-white/5 rounded-xl overflow-hidden border transition-all ${
                  selectedItems.has(content.id)
                    ? 'border-purple-500 ring-2 ring-purple-500/50'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* 이미지 */}
                <div className="aspect-square relative">
                  <img
                    src={content.thumbnailUrl || content.imageUrl}
                    alt={content.type}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 오버레이 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleSelection(content.id)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      {selectedItems.has(content.id) ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => toggleFavorite(content.id, content.isFavorite)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      {content.isFavorite ? '⭐' : '☆'}
                    </button>
                    <button
                      onClick={() => downloadContent(content)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => window.open(content.imageUrl, '_blank')}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      🔍
                    </button>
                  </div>

                  {/* 타입 배지 */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-xs text-white">
                    {CONTENT_TYPE_ICONS[content.type as ContentType]} {CONTENT_TYPE_LABELS[content.type as ContentType]}
                  </div>

                  {/* 즐겨찾기 표시 */}
                  {content.isFavorite && (
                    <div className="absolute top-2 right-2">
                      <span className="text-yellow-400">⭐</span>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <div className="text-white/60 text-xs truncate">
                    {content.text || content.prompt?.slice(0, 50) || '콘텐츠'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 리스트 뷰
          <div className="space-y-3">
            {contents.map(content => (
              <div
                key={content.id}
                className={`flex items-center gap-4 p-4 bg-white/5 rounded-xl border transition-all ${
                  selectedItems.has(content.id)
                    ? 'border-purple-500'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* 체크박스 */}
                <button
                  onClick={() => toggleSelection(content.id)}
                  className="w-6 h-6 rounded border border-white/30 flex items-center justify-center"
                >
                  {selectedItems.has(content.id) && <span className="text-purple-400">✓</span>}
                </button>

                {/* 썸네일 */}
                <img
                  src={content.thumbnailUrl || content.imageUrl}
                  alt={content.type}
                  className="w-16 h-16 rounded-lg object-cover"
                />

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CONTENT_TYPE_ICONS[content.type as ContentType]}</span>
                    <span className="text-white font-medium">
                      {CONTENT_TYPE_LABELS[content.type as ContentType]}
                    </span>
                    {content.order && (
                      <span className="text-white/50 text-sm">#{content.order}</span>
                    )}
                    {content.isFavorite && <span className="text-yellow-400">⭐</span>}
                  </div>
                  <div className="text-white/60 text-sm truncate">
                    {content.text || content.prompt?.slice(0, 100) || '콘텐츠'}
                  </div>
                </div>

                {/* 크기 */}
                <div className="text-white/50 text-sm">
                  {content.width}×{content.height}
                </div>

                {/* 액션 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(content.id, content.isFavorite)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    {content.isFavorite ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={() => downloadContent(content)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => window.open(content.imageUrl, '_blank')}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    🔍
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

