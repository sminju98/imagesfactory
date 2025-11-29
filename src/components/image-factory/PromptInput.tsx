'use client';

import React, { useState } from 'react';
import { Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import PromptCorrectionModal from './PromptCorrectionModal';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onRecommendModel: () => Promise<void>;
  isGenerating: boolean;
  isRecommendingModel: boolean;
}

export default function PromptInput({
  prompt,
  onPromptChange,
  onRecommendModel,
  isGenerating,
  isRecommendingModel,
}: PromptInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastCorrectionInfo, setLastCorrectionInfo] = useState<{
    purpose: string;
    size: string;
  } | null>(null);

  const charCount = prompt.length;
  const minChars = 10;
  const maxChars = 1000;
  const isValid = charCount >= minChars && charCount <= maxChars;

  // 프롬프트 교정 완료 핸들러
  const handleCorrected = (correctedPrompt: string, purpose: string, size: string) => {
    onPromptChange(correctedPrompt);
    setLastCorrectionInfo({ purpose, size });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="생성하고 싶은 이미지를 설명해주세요. 예: 푸른 바다 위를 나는 갈매기, 석양이 지는 하늘"
          className={`
            w-full h-32 p-4 text-base
            border-2 rounded-xl resize-none
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            transition-colors duration-200
            ${isGenerating ? 'bg-gray-50' : 'bg-white'}
            ${!isValid && charCount > 0 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-200 focus:border-indigo-500'
            }
          `}
          disabled={isGenerating}
        />
        
        {/* 글자 수 카운터 */}
        <div className={`
          absolute bottom-3 right-3 text-xs
          ${charCount < minChars ? 'text-orange-500' : charCount > maxChars ? 'text-red-500' : 'text-gray-400'}
        `}>
          {charCount} / {maxChars}
        </div>
      </div>

      {/* GPT 버튼들 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isGenerating || !prompt.trim()}
          className={`
            flex items-center space-x-2 px-4 py-2
            text-sm font-medium rounded-lg
            transition-all duration-200
            bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Sparkles className="w-4 h-4" />
          <span>프롬프트 교정 (GPT-5.1)</span>
        </button>

        <button
          onClick={onRecommendModel}
          disabled={isGenerating || !prompt.trim() || isRecommendingModel}
          className={`
            flex items-center space-x-2 px-4 py-2
            text-sm font-medium rounded-lg
            transition-all duration-200
            ${isRecommendingModel 
              ? 'bg-amber-100 text-amber-600' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 hover:from-amber-100 hover:to-orange-100'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isRecommendingModel ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          <span>모델 추천 (GPT)</span>
        </button>
      </div>

      {/* 마지막 교정 정보 표시 */}
      {lastCorrectionInfo && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
            ✨ {lastCorrectionInfo.purpose} 용도로 교정됨
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
            {lastCorrectionInfo.size}
          </span>
        </div>
      )}

      {/* 입력 안내 */}
      {charCount > 0 && charCount < minChars && (
        <p className="text-xs text-orange-500">
          최소 {minChars}자 이상 입력해주세요 ({minChars - charCount}자 더 필요)
        </p>
      )}

      {/* 프롬프트 교정 모달 */}
      <PromptCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prompt={prompt}
        onCorrect={handleCorrected}
      />
    </div>
  );
}