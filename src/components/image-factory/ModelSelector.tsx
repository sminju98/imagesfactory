'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Upload, X, Info } from 'lucide-react';
import { AI_MODELS, AIModel } from '@/types/task.types';

interface ModelSelectorProps {
  selectedModels: Record<string, number>;
  onModelChange: (modelId: string, count: number) => void;
  referenceImageUrl: string | null;
  onReferenceImageUpload: (file: File) => void;
  onRemoveReferenceImage: () => void;
  isGenerating: boolean;
  totalPoints: number;
  userPoints: number;
}

const categoryLabels: Record<string, string> = {
  fast: '⚡ 빠른 생성',
  quality: '🎨 고품질',
  premium: '👑 프리미엄',
};

const categoryColors: Record<string, string> = {
  fast: 'bg-green-50 border-green-200',
  quality: 'bg-blue-50 border-blue-200',
  premium: 'bg-purple-50 border-purple-200',
};

export default function ModelSelector({
  selectedModels,
  onModelChange,
  referenceImageUrl,
  onReferenceImageUpload,
  onRemoveReferenceImage,
  isGenerating,
  totalPoints,
  userPoints,
}: ModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReferenceImageUpload(file);
    }
  };

  const groupedModels = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  const selectedCount = Object.values(selectedModels).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* 고급 설정 토글 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        disabled={isGenerating}
      >
        <span className="font-medium text-gray-700">
          고급 설정 
          {selectedCount > 0 && (
            <span className="ml-2 text-sm text-indigo-600">
              ({selectedCount}개 모델 선택됨)
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="space-y-6 p-4 bg-gray-50 rounded-xl">
          {/* 모델 선택 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">모델 선택</h3>
            
            {Object.entries(groupedModels).map(([category, models]) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-medium text-gray-500">
                  {categoryLabels[category]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {models.map((model) => {
                    const count = selectedModels[model.id] || 0;
                    const isSelected = count > 0;

                    return (
                      <div
                        key={model.id}
                        className={`
                          relative p-3 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : `${categoryColors[model.category]} hover:border-gray-300`
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  onModelChange(model.id, e.target.checked ? 1 : 0);
                                }}
                                disabled={isGenerating}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="font-medium text-sm text-gray-800">
                                {model.name}
                              </span>
                              <button
                                onMouseEnter={() => setShowTooltip(model.id)}
                                onMouseLeave={() => setShowTooltip(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 pl-6">
                              {model.description}
                            </p>
                            <p className="mt-1 text-xs font-medium text-indigo-600 pl-6">
                              {model.pointsPerImage}pt / 장
                            </p>
                          </div>

                          {isSelected && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => onModelChange(model.id, Math.max(1, count - 1))}
                                disabled={isGenerating || count <= 1}
                                className="w-6 h-6 flex items-center justify-center rounded bg-white border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {count}
                              </span>
                              <button
                                onClick={() => onModelChange(model.id, Math.min(model.maxImages, count + 1))}
                                disabled={isGenerating || count >= model.maxImages}
                                className="w-6 h-6 flex items-center justify-center rounded bg-white border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 툴팁 */}
                        {showTooltip === model.id && (
                          <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg w-48">
                            <p>최대 {model.maxImages}장까지 생성 가능</p>
                            {model.supportsReference && (
                              <p className="mt-1 text-green-300">✓ 레퍼런스 이미지 지원</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 레퍼런스 이미지 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">레퍼런스 이미지 (선택)</h3>
            <p className="text-xs text-gray-500">
              참고 이미지를 업로드하면 비슷한 스타일로 생성됩니다.
            </p>

            {referenceImageUrl ? (
              <div className="relative inline-block">
                <img
                  src={referenceImageUrl}
                  alt="Reference"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={onRemoveReferenceImage}
                  disabled={isGenerating}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`
                flex flex-col items-center justify-center w-full h-24 
                border-2 border-dashed border-gray-300 rounded-lg
                cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50
                transition-colors
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
              `}>
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isGenerating}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 포인트 요약 */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <span className="text-sm text-gray-600">예상 사용 포인트</span>
            <span className={`text-lg font-bold ${totalPoints > userPoints ? 'text-red-500' : 'text-indigo-600'}`}>
              {totalPoints.toLocaleString()}pt
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

