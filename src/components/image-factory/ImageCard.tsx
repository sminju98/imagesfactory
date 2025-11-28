'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Link2, ImagePlus, Download, MoreHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ImageCardProps {
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  modelId: string;
  prompt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt?: string;
  onLike: (imageId: string) => void;
  onComment: (imageId: string) => void;
  onUseAsReference: (imageUrl: string) => void;
  onSelect?: (imageId: string, selected: boolean) => void;
  isSelected?: boolean;
  showSelect?: boolean;
}

const modelLabels: Record<string, string> = {
  'pixart': 'PixArt',
  'flux': 'Flux',
  'sdxl': 'SDXL',
  'realistic-vision': 'Realistic',
  'leonardo': 'Leonardo',
  'aurora': 'Aurora',
  'ideogram': 'Ideogram',
  'dall-e-3': 'DALL-E 3',
};

export default function ImageCard({
  imageId,
  imageUrl,
  thumbnailUrl,
  modelId,
  prompt,
  likesCount,
  commentsCount,
  isLiked,
  createdAt,
  onLike,
  onComment,
  onUseAsReference,
  onSelect,
  isSelected = false,
  showSelect = false,
}: ImageCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast.success('이미지 URL이 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('URL 복사에 실패했습니다');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagefactory_${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('이미지 다운로드 시작');
    } catch {
      toast.error('다운로드에 실패했습니다');
    }
  };

  return (
    <div className={`
      group relative bg-white rounded-xl overflow-hidden shadow-sm
      border-2 transition-all duration-200
      ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent hover:shadow-md'}
    `}>
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-gray-100">
        {/* 로딩 스켈레톤 */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        )}
        
        <img
          src={thumbnailUrl || imageUrl}
          alt={prompt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* 선택 체크박스 */}
        {showSelect && (
          <button
            onClick={() => onSelect?.(imageId, !isSelected)}
            className={`
              absolute top-2 left-2 w-6 h-6 rounded-full
              flex items-center justify-center
              transition-all duration-200
              ${isSelected 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white/80 text-gray-400 hover:bg-white hover:text-indigo-500'
              }
            `}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
        )}

        {/* 모델 배지 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
          {modelLabels[modelId] || modelId}
        </div>

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
              title="다운로드"
            >
              <Download className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => onUseAsReference(imageUrl)}
              className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
              title="레퍼런스로 사용"
            >
              <ImagePlus className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 액션 바 */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 좋아요 */}
            <button
              onClick={() => onLike(imageId)}
              className="flex items-center space-x-1 group/like"
            >
              <Heart 
                className={`w-5 h-5 transition-colors ${
                  isLiked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400 group-hover/like:text-red-400'
                }`} 
              />
              <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                {likesCount}
              </span>
            </button>

            {/* 코멘트 */}
            <button
              onClick={() => onComment(imageId)}
              className="flex items-center space-x-1 group/comment"
            >
              <MessageCircle className="w-5 h-5 text-gray-400 group-hover/comment:text-indigo-400 transition-colors" />
              <span className="text-sm text-gray-500">{commentsCount}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* URL 복사 */}
            <button
              onClick={handleCopyUrl}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="URL 복사"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Link2 className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* 더보기 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-lg border py-1 z-20">
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={() => {
                        onUseAsReference(imageUrl);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      레퍼런스로 사용
                    </button>
                    <button
                      onClick={() => {
                        handleCopyUrl();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      URL 복사
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 프롬프트 미리보기 */}
        <p className="mt-2 text-xs text-gray-500 line-clamp-2" title={prompt}>
          {prompt}
        </p>
      </div>
    </div>
  );
}



