'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/lib/i18n';
import { Heart, Upload, Dna, Image as ImageIcon, Filter, Search, Loader2, ExternalLink, MoreHorizontal, Download, Trash2 } from 'lucide-react';

interface GalleryTabProps {
  userId: string;
}

type FilterType = 'all' | 'liked' | 'uploaded' | 'evolution';

interface GalleryImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt?: string;
  modelId?: string;
  generation?: number;
  isLiked?: boolean;
  createdAt?: any;
  type: 'generated' | 'uploaded';
}

interface GalleryStats {
  totalImages: number;
  likedImages: number;
  uploadedImages: number;
  evolutionImages: number;
}

export default function GalleryTab({ userId }: GalleryTabProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GalleryStats>({
    totalImages: 0,
    likedImages: 0,
    uploadedImages: 0,
    evolutionImages: 0,
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 24;

  // 갤러리 통계 로드
  useEffect(() => {
    fetchStats();
  }, [userId]);

  // 이미지 로드
  useEffect(() => {
    setImages([]);
    setLastDoc(null);
    setHasMore(true);
    fetchImages(true);
  }, [userId, filter]);

  const fetchStats = async () => {
    try {
      // 생성된 이미지 수
      const imagesQuery = query(
        collection(db, 'images'),
        where('userId', '==', userId)
      );
      const imagesSnapshot = await getDocs(imagesQuery);
      const totalImages = imagesSnapshot.size;

      // 좋아요 이미지 수
      const likedQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
      );
      const likedSnapshot = await getDocs(likedQuery);
      const likedImages = likedSnapshot.size;

      // 업로드 이미지 수
      const uploadedQuery = query(
        collection(db, 'uploadedImages'),
        where('userId', '==', userId)
      );
      const uploadedSnapshot = await getDocs(uploadedQuery);
      const uploadedImages = uploadedSnapshot.size;

      // 진화 이미지 수 (generation >= 2)
      let evolutionImages = 0;
      imagesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.generation && data.generation >= 2) {
          evolutionImages++;
        }
      });

      setStats({
        totalImages,
        likedImages,
        uploadedImages,
        evolutionImages,
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const fetchImages = async (reset = false) => {
    if (!reset && !hasMore) return;
    
    setLoading(true);
    try {
      let allImages: GalleryImage[] = [];

      if (filter === 'all' || filter === 'liked') {
        // 좋아요한 이미지 (favorites 컬렉션)
        if (filter === 'liked' || filter === 'all') {
          let favQuery = query(
            collection(db, 'favorites'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            firestoreLimit(pageSize)
          );

          if (!reset && lastDoc) {
            favQuery = query(favQuery, startAfter(lastDoc));
          }

          const favSnapshot = await getDocs(favQuery);
          const favImages = favSnapshot.docs.map(doc => ({
            id: doc.id,
            imageUrl: doc.data().imageUrl,
            thumbnailUrl: doc.data().thumbnailUrl || doc.data().imageUrl,
            prompt: doc.data().prompt,
            modelId: doc.data().modelId,
            generation: doc.data().generation || 1,
            isLiked: true,
            createdAt: doc.data().createdAt,
            type: 'generated' as const,
          }));
          allImages = [...allImages, ...favImages];

          if (favSnapshot.docs.length > 0) {
            setLastDoc(favSnapshot.docs[favSnapshot.docs.length - 1]);
          }
          setHasMore(favSnapshot.docs.length === pageSize);
        }
      }

      if (filter === 'all' || filter === 'uploaded') {
        // 업로드된 이미지
        let uploadQuery = query(
          collection(db, 'uploadedImages'),
          where('userId', '==', userId),
          orderBy('uploadedAt', 'desc'),
          firestoreLimit(pageSize)
        );

        const uploadSnapshot = await getDocs(uploadQuery);
        const uploadedImages = uploadSnapshot.docs.map(doc => ({
          id: doc.id,
          imageUrl: doc.data().imageUrl,
          thumbnailUrl: doc.data().thumbnailUrl || doc.data().imageUrl,
          prompt: doc.data().originalFileName,
          modelId: 'uploaded',
          generation: 0,
          isLiked: false,
          createdAt: doc.data().uploadedAt,
          type: 'uploaded' as const,
        }));
        allImages = [...allImages, ...uploadedImages];
      }

      if (filter === 'evolution') {
        // 진화 이미지 (generation >= 2)
        let evoQuery = query(
          collection(db, 'images'),
          where('userId', '==', userId),
          where('generation', '>=', 2),
          orderBy('generation', 'desc'),
          orderBy('createdAt', 'desc'),
          firestoreLimit(pageSize)
        );

        const evoSnapshot = await getDocs(evoQuery);
        const evoImages = evoSnapshot.docs.map(doc => ({
          id: doc.id,
          imageUrl: doc.data().imageUrl,
          thumbnailUrl: doc.data().thumbnailUrl || doc.data().imageUrl,
          prompt: doc.data().prompt,
          modelId: doc.data().modelId,
          generation: doc.data().generation,
          isLiked: doc.data().isLiked || false,
          createdAt: doc.data().createdAt,
          type: 'generated' as const,
        }));
        allImages = evoImages;
      }

      // 중복 제거 및 정렬
      const uniqueImages = Array.from(
        new Map(allImages.map(img => [img.id, img])).values()
      ).sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });

      if (reset) {
        setImages(uniqueImages);
      } else {
        setImages(prev => [...prev, ...uniqueImages]);
      }
    } catch (error) {
      console.error('Images fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectImage = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  const getFilterIcon = (type: FilterType) => {
    switch (type) {
      case 'all': return <ImageIcon className="w-4 h-4" />;
      case 'liked': return <Heart className="w-4 h-4" />;
      case 'uploaded': return <Upload className="w-4 h-4" />;
      case 'evolution': return <Dna className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (type: FilterType) => {
    switch (type) {
      case 'all': return t('gallery.all') || '전체';
      case 'liked': return t('gallery.liked') || '좋아요';
      case 'uploaded': return t('gallery.uploaded') || '업로드';
      case 'evolution': return t('gallery.evolution') || '진화';
    }
  };

  const getBadge = (image: GalleryImage) => {
    if (image.type === 'uploaded') {
      return (
        <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Upload className="w-3 h-3" />
        </span>
      );
    }
    if (image.generation && image.generation >= 2) {
      return (
        <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Dna className="w-3 h-3" />
          {image.generation}세대
        </span>
      );
    }
    if (image.isLiked) {
      return (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Heart className="w-3 h-3 fill-current" />
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {t('gallery.title') || '📸 내 갤러리'}
        </h2>
      </div>

      {/* 필터 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'liked', 'uploaded', 'evolution'] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filter === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getFilterIcon(type)}
            <span>{getFilterLabel(type)}</span>
          </button>
        ))}
      </div>

      {/* 통계 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-600">
            📊 총 <strong className="text-gray-900">{stats.totalImages}</strong>장
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            ❤️ 좋아요 <strong className="text-gray-900">{stats.likedImages}</strong>장
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            📤 업로드 <strong className="text-gray-900">{stats.uploadedImages}</strong>장
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            🧬 진화 <strong className="text-gray-900">{stats.evolutionImages}</strong>장
          </span>
        </div>
      </div>

      {/* 이미지 그리드 */}
      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('gallery.noImages') || '아직 이미지가 없습니다'}</p>
          <p className="text-sm text-gray-400 mt-2">
            {t('gallery.noImagesDesc') || '이미지를 생성하거나 좋아요를 눌러보세요!'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer transition-all ${
                  selectedImages.includes(image.id) ? 'ring-4 ring-indigo-500' : ''
                }`}
                onClick={() => toggleSelectImage(image.id)}
              >
                <img
                  src={image.thumbnailUrl || image.imageUrl}
                  alt={image.prompt || 'Gallery image'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* 배지 */}
                {getBadge(image)}
                
                {/* 선택 체크박스 */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedImages.includes(image.id)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white/80 border-gray-300'
                }`}>
                  {selectedImages.includes(image.id) && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-white text-xs truncate w-full">
                    {image.modelId && image.modelId !== 'uploaded' && (
                      <span className="bg-white/20 px-2 py-1 rounded">{image.modelId}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 더 보기 버튼 */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => fetchImages(false)}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                ) : null}
                {t('common.loadMore') || '더 보기'}
              </button>
            </div>
          )}
        </>
      )}

      {/* 선택된 이미지 액션 바 */}
      {selectedImages.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4 z-50">
          <span className="text-sm text-gray-600">
            {t('gallery.selected') || '선택됨'}: <strong className="text-indigo-600">{selectedImages.length}</strong>개
          </span>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={() => {
              // TODO: ContentFactory로 보내기
              alert('콘텐츠팩토리로 보내기 기능은 준비 중입니다');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            {t('gallery.sendToContentFactory') || '콘텐츠팩토리로 보내기'}
          </button>
          <button
            onClick={() => {
              // TODO: 진화 시작
              alert('진화 시작 기능은 준비 중입니다');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
          >
            <Dna className="w-4 h-4" />
            {t('gallery.startEvolution') || '진화 시작'}
          </button>
          <button
            onClick={() => setSelectedImages([])}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            {t('common.cancel') || '취소'}
          </button>
        </div>
      )}
    </div>
  );
}


