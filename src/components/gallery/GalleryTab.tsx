'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { 
  Heart, 
  Trash2, 
  Download, 
  ExternalLink, 
  Loader2, 
  ImageIcon,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

interface FavoriteImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  modelId: string;
  taskId: string;
  tags: string[];
  note: string;
  createdAt: string;
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
  'midjourney': 'Midjourney',
  'recraft': 'Recraft V3',
  'kandinsky': 'Kandinsky',
  'gemini': 'Nano Banana',
  'seedream': 'Seedream 4',
  'hunyuan': 'Hunyuan 3',
};

export default function GalleryTab() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedImage, setSelectedImage] = useState<FavoriteImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 즐겨찾기 목록 불러오기
  const fetchFavorites = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gallery/favorites?userId=${user.uid}&limit=100`);
      const data = await response.json();

      if (data.success) {
        setFavorites(data.data.favorites);
        setTotal(data.data.total);
      } else {
        setError(data.error || '갤러리를 불러오는데 실패했습니다');
      }
    } catch (err) {
      console.error('갤러리 조회 오류:', err);
      setError('갤러리를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user?.uid]);

  // 단일 삭제
  const handleDelete = async (favoriteId: string) => {
    if (!user?.uid) return;
    if (!confirm(t('gallery.confirmDelete'))) return;

    setDeletingId(favoriteId);

    try {
      const response = await fetch(
        `/api/gallery/favorites?favoriteId=${favoriteId}&userId=${user.uid}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        setFavorites(prev => prev.filter(f => f.id !== favoriteId));
        setTotal(prev => prev - 1);
        if (selectedImage?.id === favoriteId) {
          setSelectedImage(null);
        }
      } else {
        alert(data.error || '삭제에 실패했습니다');
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다');
    } finally {
      setDeletingId(null);
    }
  };

  // 선택 삭제
  const handleBulkDelete = async () => {
    if (!user?.uid || selectedIds.size === 0) return;
    if (!confirm(t('gallery.confirmBulkDelete', { count: selectedIds.size }))) return;

    const idsToDelete = Array.from(selectedIds);
    
    try {
      // 순차적으로 삭제
      for (const id of idsToDelete) {
        await fetch(
          `/api/gallery/favorites?favoriteId=${id}&userId=${user.uid}`,
          { method: 'DELETE' }
        );
      }

      setFavorites(prev => prev.filter(f => !selectedIds.has(f.id)));
      setTotal(prev => prev - selectedIds.size);
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error('일괄 삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  // 선택 토글
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === favorites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(favorites.map(f => f.id)));
    }
  };

  // 다운로드
  const handleDownload = async (imageUrl: string, filename?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('다운로드 오류:', err);
      // 직접 링크로 열기
      window.open(imageUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchFavorites}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{t('gallery.title')}</h2>
              <p className="text-pink-100">{t('gallery.totalImages', { count: total })}</p>
            </div>
          </div>
          
          {favorites.length > 0 && (
            <div className="flex items-center space-x-2">
              {selectMode ? (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm"
                  >
                    {selectedIds.size === favorites.length ? t('gallery.deselectAll') : t('gallery.selectAll')}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-2 bg-red-500 rounded-lg hover:bg-red-600 text-sm flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('gallery.deleteSelected', { count: selectedIds.size })}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm"
                >
                  {t('gallery.selectMode')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 갤러리 그리드 */}
      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('gallery.empty')}</h3>
          <p className="text-gray-500">{t('gallery.emptyDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className={`group relative bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectMode && selectedIds.has(favorite.id)
                  ? 'border-pink-500 ring-2 ring-pink-200'
                  : 'border-gray-200 hover:border-pink-300 hover:shadow-lg'
              }`}
              onClick={() => {
                if (selectMode) {
                  toggleSelect(favorite.id);
                } else {
                  setSelectedImage(favorite);
                }
              }}
            >
              {/* 선택 체크박스 */}
              {selectMode && (
                <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedIds.has(favorite.id) ? 'bg-pink-500 text-white' : 'bg-white/80 border border-gray-300'
                }`}>
                  {selectedIds.has(favorite.id) && <Check className="w-4 h-4" />}
                </div>
              )}

              {/* 이미지 */}
              <div className="aspect-square">
                <img
                  src={favorite.thumbnailUrl || favorite.imageUrl}
                  alt={favorite.prompt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* 호버 오버레이 */}
              {!selectMode && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(favorite.imageUrl);
                      }}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                      title={t('gallery.download')}
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(favorite.id);
                      }}
                      disabled={deletingId === favorite.id}
                      className="p-2 bg-red-500/80 rounded-lg hover:bg-red-600"
                      title={t('gallery.delete')}
                    >
                      {deletingId === favorite.id ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  <div>
                    <p className="text-white text-xs line-clamp-2">{favorite.prompt}</p>
                    {favorite.modelId && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-xs text-white">
                        {MODEL_NAMES[favorite.modelId] || favorite.modelId}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 이미지 상세 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">{t('gallery.imageDetail')}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="flex flex-col md:flex-row">
              {/* 이미지 */}
              <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              {/* 정보 */}
              <div className="w-full md:w-80 p-4 space-y-4 overflow-y-auto max-h-[40vh] md:max-h-[60vh]">
                {/* 프롬프트 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">{t('gallery.prompt')}</h4>
                  <p className="text-gray-900 text-sm">{selectedImage.prompt || '-'}</p>
                </div>

                {/* 모델 */}
                {selectedImage.modelId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('gallery.model')}</h4>
                    <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                      {MODEL_NAMES[selectedImage.modelId] || selectedImage.modelId}
                    </span>
                  </div>
                )}

                {/* 생성일 */}
                {selectedImage.createdAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('gallery.createdAt')}</h4>
                    <p className="text-gray-900 text-sm">
                      {new Date(selectedImage.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex space-x-2 pt-4 border-t">
                  <button
                    onClick={() => handleDownload(selectedImage.imageUrl)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('gallery.download')}</span>
                  </button>
                  <a
                    href={selectedImage.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => {
                      handleDelete(selectedImage.id);
                    }}
                    disabled={deletingId === selectedImage.id}
                    className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    {deletingId === selectedImage.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






