'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, MessageSquare, Edit3, Check } from 'lucide-react';
import { ConceptData, MessageData } from '@/types/content.types';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
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
        setError(data.error || t('contentFactory.stepMessage.generateFailed'));
      }
    } catch (err) {
      setError(t('contentFactory.stepMessage.generateError'));
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
        <p className="text-gray-600 font-medium">{t('contentFactory.stepMessage.loading')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('contentFactory.stepMessage.loadingDesc')}</p>
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
            {t('contentFactory.stepMessage.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('contentFactory.stepMessage.subtitle')}
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
                {t('contentFactory.stepMessage.directEdit')}
              </button>
              <button
                onClick={generateMessage}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('contentFactory.stepMessage.regenerate')}
              </button>
            </>
          )}
        </div>
      </div>

      {message && !isEditing && (
        <div className="space-y-6">
          {/* 메인 카피 */}
          <MessageSection
            title={t('contentFactory.stepMessage.mainCopy')}
            description={t('contentFactory.stepMessage.mainCopyDesc')}
            current={message.mainCopy}
            alternatives={message.alternativeOptions?.mainCopy || []}
            selectedIndex={selectedOptions.mainCopy}
            onSelect={(index) => handleOptionSelect('mainCopy', index)}
            recommendedLabel={t('contentFactory.stepMessage.recommended')}
          />

          {/* 서브 카피 */}
          <MessageSection
            title={t('contentFactory.stepMessage.subCopy')}
            description={t('contentFactory.stepMessage.subCopyDesc')}
            current={message.subCopy}
            alternatives={message.alternativeOptions?.subCopy || []}
            selectedIndex={selectedOptions.subCopy}
            onSelect={(index) => handleOptionSelect('subCopy', index)}
            recommendedLabel={t('contentFactory.stepMessage.recommended')}
          />

          {/* CTA */}
          <MessageSection
            title={t('contentFactory.stepMessage.cta')}
            description={t('contentFactory.stepMessage.ctaDesc')}
            current={message.ctaText}
            alternatives={message.alternativeOptions?.ctaText || []}
            selectedIndex={selectedOptions.ctaText}
            onSelect={(index) => handleOptionSelect('ctaText', index)}
            recommendedLabel={t('contentFactory.stepMessage.recommended')}
          />
        </div>
      )}

      {/* 편집 모드 */}
      {message && isEditing && editedMessage && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{t('contentFactory.stepMessage.editTitle')}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedMessage(message);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('contentFactory.stepMessage.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t('contentFactory.stepMessage.save')}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contentFactory.stepMessage.mainCopyLabel')}</label>
              <input
                type="text"
                value={editedMessage.mainCopy}
                onChange={(e) => setEditedMessage({ ...editedMessage, mainCopy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contentFactory.stepMessage.subCopyLabel')}</label>
              <textarea
                value={editedMessage.subCopy}
                onChange={(e) => setEditedMessage({ ...editedMessage, subCopy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contentFactory.stepMessage.ctaLabel')}</label>
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
  recommendedLabel,
}: {
  title: string;
  description: string;
  current: string;
  alternatives: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  recommendedLabel: string;
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
                  <span className="text-xs text-purple-600 mt-1 inline-block">{recommendedLabel}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


