'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { X, Loader2, ImageIcon, Check, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  modelId: string;
  createdAt: string;
}

interface GalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

const IMAGES_PER_PAGE = 12;

export default function GalleryPickerModal({ isOpen, onClose, onSelect }: GalleryPickerModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(allImages.length / IMAGES_PER_PAGE);
  
  // 현재 페이지의 이미지들
  const currentImages = allImages.slice(
    (currentPage - 1) * IMAGES_PER_PAGE,
    currentPage * IMAGES_PER_PAGE
  );

  useEffect(() => {
    if (isOpen && user?.uid) {
      setCurrentPage(1);
      setSelectedImage(null);
      fetchGalleryImages();
    }
  }, [isOpen, user?.uid]);

  const fetchGalleryImages = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // 전체 이미지를 가져옴 (최대 200개)
      const response = await fetch(`/api/gallery/favorites?userId=${user.uid}&limit=200`);
      const data = await response.json();

      if (data.success) {
        setAllImages(data.data.favorites);
      }
    } catch (error) {
      console.error('갤러리 이미지 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
      setSelectedImage(null);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 페이지 번호 배열 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pages: number[] = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <h2 className="text-lg font-bold">{t('gallery.selectFromGallery') || '갤러리에서 선택'}</h2>
            {allImages.length > 0 && (
              <span className="text-sm opacity-80">({allImages.length}개)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : allImages.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t('gallery.empty') || '갤러리가 비어있습니다'}
              </h3>
              <p className="text-gray-500">
                {t('gallery.emptyDesc') || '이미지를 좋아요하면 여기에 표시됩니다'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentImages.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image.imageUrl)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                    selectedImage === image.imageUrl
                      ? 'border-pink-500 ring-2 ring-pink-200 scale-[1.02]'
                      : 'border-transparent hover:border-pink-300 hover:shadow-lg'
                  }`}
                >
                  <img
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.prompt || 'Gallery image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* 선택 체크마크 */}
                  {selectedImage === image.imageUrl && (
                    <div className="absolute inset-0 bg-pink-500/30 flex items-center justify-center">
                      <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}

                  {/* 호버 오버레이 */}
                  {selectedImage !== image.imageUrl && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-t bg-gray-50">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-9 h-9 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-pink-500 text-white'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedImage 
              ? t('gallery.imageSelected') || '1개 선택됨' 
              : `${t('gallery.selectImage') || '이미지를 선택하세요'} (${currentPage}/${totalPages || 1} 페이지)`
            }
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel') || '취소'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedImage}
              className="px-6 py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('common.confirm') || '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
