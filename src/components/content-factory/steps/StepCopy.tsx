'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Type, Edit3, Check } from 'lucide-react';
import { ConceptData, MessageData, ScriptData, CopyData } from '@/types/content.types';
import { useTranslation } from '@/lib/i18n';

interface StepCopyProps {
  concept: ConceptData;
  message: MessageData;
  script: ScriptData;
  copy: CopyData | null;
  setCopy: (copy: CopyData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function StepCopy({
  concept,
  message,
  script,
  copy,
  setCopy,
  isLoading,
  setIsLoading,
  setError,
}: StepCopyProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCopy, setEditedCopy] = useState<CopyData | null>(null);

  // 자동 생성
  useEffect(() => {
    if (!copy && concept && message && script) {
      generateCopy();
    }
  }, [concept, message, script]);

  const generateCopy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, message, script }),
      });

      const data = await response.json();

      if (data.success) {
        setCopy(data.data);
        setEditedCopy(data.data);
      } else {
        setError(data.error || t('contentFactory.stepCopy.generateFailed'));
      }
    } catch (err) {
      setError(t('contentFactory.stepCopy.generateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = () => {
    if (editedCopy) {
      setCopy(editedCopy);
      setIsEditing(false);
    }
  };

  if (isLoading && !copy) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">{t('contentFactory.stepCopy.loading')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('contentFactory.stepCopy.loadingDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Type className="w-5 h-5 text-green-600" />
            {t('contentFactory.stepCopy.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('contentFactory.stepCopy.subtitle')}
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
                {t('contentFactory.stepCopy.edit')}
              </button>
              <button
                onClick={generateCopy}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('contentFactory.stepCopy.regenerate')}
              </button>
            </>
          )}
        </div>
      </div>

      {copy && !isEditing && (
        <div className="space-y-4">
          {/* 릴스 자막 */}
          <CopySection
            title={t('contentFactory.stepCopy.reelsCaptions')}
            items={copy.reelsCaptions}
            itemLabel={t('contentFactory.stepCopy.cut')}
          />

          {/* 카드뉴스 */}
          <CopySection
            title={t('contentFactory.stepCopy.cardnewsCopies')}
            items={copy.cardNewsCopies}
            itemLabel={t('contentFactory.stepCopy.page')}
          />

          {/* 단일 카피들 */}
          <div className="grid grid-cols-2 gap-4">
            <SingleCopyCard title={t('contentFactory.stepCopy.bannerCopy')} content={copy.bannerCopy} />
            <SingleCopyCard title={t('contentFactory.stepCopy.storyCopy')} content={copy.storyCopy} />
            <SingleCopyCard title={t('contentFactory.stepCopy.thumbnailTitle')} content={copy.thumbnailTitle} />
            <SingleCopyCard title={t('contentFactory.stepCopy.detailPageHeadline')} content={copy.detailPageHeadline} />
          </div>
        </div>
      )}

      {/* 편집 모드 */}
      {copy && isEditing && editedCopy && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
            <h3 className="text-lg font-bold text-gray-900">{t('contentFactory.stepCopy.editTitle')}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedCopy(copy);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('contentFactory.stepCopy.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t('contentFactory.stepCopy.save')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* 릴스 자막 편집 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('contentFactory.stepCopy.reelsCaptionsLabel')}</label>
              {editedCopy.reelsCaptions.map((caption, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 w-8">{index + 1}{t('contentFactory.stepCopy.cut')}</span>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => {
                      const newCaptions = [...editedCopy.reelsCaptions];
                      newCaptions[index] = e.target.value;
                      setEditedCopy({ ...editedCopy, reelsCaptions: newCaptions });
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* 카드뉴스 편집 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('contentFactory.stepCopy.cardnewsCopiesLabel')}</label>
              {editedCopy.cardNewsCopies.map((copyText, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 w-8">{index + 1}{t('contentFactory.stepCopy.page')}</span>
                  <input
                    type="text"
                    value={copyText}
                    onChange={(e) => {
                      const newCopies = [...editedCopy.cardNewsCopies];
                      newCopies[index] = e.target.value;
                      setEditedCopy({ ...editedCopy, cardNewsCopies: newCopies });
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* 단일 카피들 */}
            <div className="grid grid-cols-2 gap-4">
              <EditField
                label={t('contentFactory.stepCopy.bannerCopyLabel')}
                value={editedCopy.bannerCopy}
                onChange={(v) => setEditedCopy({ ...editedCopy, bannerCopy: v })}
              />
              <EditField
                label={t('contentFactory.stepCopy.storyCopyLabel')}
                value={editedCopy.storyCopy}
                onChange={(v) => setEditedCopy({ ...editedCopy, storyCopy: v })}
              />
              <EditField
                label={t('contentFactory.stepCopy.thumbnailTitleLabel')}
                value={editedCopy.thumbnailTitle}
                onChange={(v) => setEditedCopy({ ...editedCopy, thumbnailTitle: v })}
              />
              <EditField
                label={t('contentFactory.stepCopy.detailPageHeadlineLabel')}
                value={editedCopy.detailPageHeadline}
                onChange={(v) => setEditedCopy({ ...editedCopy, detailPageHeadline: v })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 카피 섹션 (배열)
function CopySection({
  title,
  items,
  itemLabel,
}: {
  title: string;
  items: string[];
  itemLabel: string;
}) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-green-100">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {index + 1}
            </span>
            <p className="text-gray-900 text-sm">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 단일 카피 카드
function SingleCopyCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <p className="text-gray-900">{content}</p>
    </div>
  );
}

// 편집 필드
function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}


