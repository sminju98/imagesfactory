'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, MessageSquare, Edit3, Check } from 'lucide-react';
import { ConceptData, MessageData } from '@/types/content.types';

interface StepMessageProps {
  concept: ConceptData;
  message: MessageData | null;
  setMessage: (message: MessageData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function StepMessage({
  concept,
  message,
  setMessage,
  isLoading,
  setIsLoading,
  setError,
}: StepMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState<MessageData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{
    mainCopy: number;
    subCopy: number;
    ctaText: number;
  }>({ mainCopy: 0, subCopy: 0, ctaText: 0 });

  // 자동 생성 (처음 로드 시)
  useEffect(() => {
    if (!message && concept) {
      generateMessage();
    }
  }, [concept]);

  // 메시지 생성 API 호출
  const generateMessage = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.data);
        setEditedMessage(data.data);
        setSelectedOptions({ mainCopy: 0, subCopy: 0, ctaText: 0 });
      } else {
        setError(data.error || '메시지 생성에 실패했습니다');
      }
    } catch (err) {
      setError('메시지 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 옵션 선택 시 메시지 업데이트
  const handleOptionSelect = (type: 'mainCopy' | 'subCopy' | 'ctaText', index: number) => {
    if (!message?.alternativeOptions) return;
    
    setSelectedOptions(prev => ({ ...prev, [type]: index }));
    
    const newMessage = { ...message };
    if (index === 0) {
      // 원본 선택 시
      newMessage[type] = message[type];
    } else {
      // 대안 선택 시
      newMessage[type] = message.alternativeOptions![type][index - 1];
    }
    setMessage(newMessage);
  };

  // 수정 저장
  const handleSaveEdit = () => {
    if (editedMessage) {
      setMessage(editedMessage);
      setIsEditing(false);
    }
  };

  if (isLoading && !message) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">GPT가 메시지를 작성하고 있어요...</p>
        <p className="text-sm text-gray-400 mt-1">콘셉트를 바탕으로 최적의 카피를 생성 중</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            메시지 방향 설정
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            마케팅 메시지의 핵심 카피를 선택하거나 수정하세요
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4" />
                직접 수정
              </button>
              <button
                onClick={generateMessage}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                재생성
              </button>
            </>
          )}
        </div>
      </div>

      {message && !isEditing && (
        <div className="space-y-6">
          {/* 메인 카피 */}
          <MessageSection
            title="💥 메인 카피"
            description="가장 눈에 띄는 핵심 메시지"
            current={message.mainCopy}
            alternatives={message.alternativeOptions?.mainCopy || []}
            selectedIndex={selectedOptions.mainCopy}
            onSelect={(index) => handleOptionSelect('mainCopy', index)}
          />

          {/* 서브 카피 */}
          <MessageSection
            title="📝 서브 카피"
            description="메인 카피를 보조하는 설명"
            current={message.subCopy}
            alternatives={message.alternativeOptions?.subCopy || []}
            selectedIndex={selectedOptions.subCopy}
            onSelect={(index) => handleOptionSelect('subCopy', index)}
          />

          {/* CTA */}
          <MessageSection
            title="👆 CTA (Call to Action)"
            description="행동을 유도하는 버튼/문구"
            current={message.ctaText}
            alternatives={message.alternativeOptions?.ctaText || []}
            selectedIndex={selectedOptions.ctaText}
            onSelect={(index) => handleOptionSelect('ctaText', index)}
          />
        </div>
      )}

      {/* 편집 모드 */}
      {message && isEditing && editedMessage && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">✏️ 메시지 직접 수정</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedMessage(message);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                저장
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메인 카피</label>
              <input
                type="text"
                value={editedMessage.mainCopy}
                onChange={(e) => setEditedMessage({ ...editedMessage, mainCopy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">서브 카피</label>
              <textarea
                value={editedMessage.subCopy}
                onChange={(e) => setEditedMessage({ ...editedMessage, subCopy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA 문구</label>
              <input
                type="text"
                value={editedMessage.ctaText}
                onChange={(e) => setEditedMessage({ ...editedMessage, ctaText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 메시지 섹션 컴포넌트
function MessageSection({
  title,
  description,
  current,
  alternatives,
  selectedIndex,
  onSelect,
}: {
  title: string;
  description: string;
  current: string;
  alternatives: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const allOptions = [current, ...alternatives];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <div className="space-y-2">
        {allOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedIndex === index
                ? 'border-purple-500 bg-white shadow-md'
                : 'border-transparent bg-white/60 hover:bg-white hover:border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedIndex === index
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedIndex === index && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{option}</p>
                {index === 0 && (
                  <span className="text-xs text-purple-600 mt-1 inline-block">추천</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

