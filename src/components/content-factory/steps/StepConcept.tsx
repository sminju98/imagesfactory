'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Search, Edit3 } from 'lucide-react';
import { ConceptData } from '@/types/content.types';
import { useTranslation } from '@/lib/i18n';

interface StepConceptProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  concept: ConceptData | null;
  setConcept: (concept: ConceptData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  referenceImageIds?: string[];
}

export default function StepConcept({
  prompt,
  setPrompt,
  concept,
  setConcept,
  isLoading,
  setIsLoading,
  setError,
  referenceImageIds = [],
}: StepConceptProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedConcept, setEditedConcept] = useState<ConceptData | null>(null);

  // 콘셉트 생성 API 호출
  const generateConcept = async () => {
    if (!prompt.trim()) {
      setError(t('contentFactory.stepConcept.enterPrompt'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/generate-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          referenceImageIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConcept(data.data);
        setEditedConcept(data.data);
      } else {
        setError(data.error || t('contentFactory.stepConcept.generateFailed'));
      }
    } catch (err) {
      setError(t('contentFactory.stepConcept.generateError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 수정 저장
  const handleSaveEdit = () => {
    if (editedConcept) {
      setConcept(editedConcept);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 프롬프트 입력 */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {t('contentFactory.stepConcept.inputLabel')}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('contentFactory.stepConcept.placeholder')}
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          onClick={generateConcept}
          disabled={isLoading || !prompt.trim()}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            isLoading || !prompt.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('contentFactory.stepConcept.analyzing')}
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              {t('contentFactory.stepConcept.analyze')}
            </>
          )}
        </button>
      </div>

      {/* 생성된 콘셉트 */}
      {concept && !isEditing && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              {t('contentFactory.stepConcept.result')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {t('contentFactory.stepConcept.edit')}
              </button>
              <button
                onClick={generateConcept}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('contentFactory.stepConcept.regenerate')}
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <ConceptField label={t('contentFactory.stepConcept.productName')} value={concept.productName} />
            <ConceptField label={t('contentFactory.stepConcept.usp')} value={concept.usp} />
            <ConceptField label={t('contentFactory.stepConcept.target')} value={concept.target} />
            <ConceptField label={t('contentFactory.stepConcept.toneAndManner')} value={concept.toneAndManner} />
            <ConceptField label={t('contentFactory.stepConcept.strategy')} value={concept.strategy} />
            {concept.marketTrend && (
              <ConceptField label={t('contentFactory.stepConcept.marketTrend')} value={concept.marketTrend} />
            )}
            {concept.keywords && concept.keywords.length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <span className="text-sm font-medium text-gray-600">{t('contentFactory.stepConcept.keywords')}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {concept.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 편집 모드 */}
      {concept && isEditing && editedConcept && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{t('contentFactory.stepConcept.editTitle')}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedConcept(concept);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('contentFactory.stepConcept.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t('contentFactory.stepConcept.save')}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <EditField
              label={t('contentFactory.stepConcept.productName').replace(/^[^\s]+\s*/, '')}
              value={editedConcept.productName}
              onChange={(v) => setEditedConcept({ ...editedConcept, productName: v })}
            />
            <EditField
              label={t('contentFactory.stepConcept.usp').replace(/^[^\s]+\s*/, '')}
              value={editedConcept.usp}
              onChange={(v) => setEditedConcept({ ...editedConcept, usp: v })}
              multiline
            />
            <EditField
              label={t('contentFactory.stepConcept.target').replace(/^[^\s]+\s*/, '')}
              value={editedConcept.target}
              onChange={(v) => setEditedConcept({ ...editedConcept, target: v })}
            />
            <EditField
              label={t('contentFactory.stepConcept.toneAndManner').replace(/^[^\s]+\s*/, '')}
              value={editedConcept.toneAndManner}
              onChange={(v) => setEditedConcept({ ...editedConcept, toneAndManner: v })}
            />
            <EditField
              label={t('contentFactory.stepConcept.strategy').replace(/^[^\s]+\s*/, '')}
              value={editedConcept.strategy}
              onChange={(v) => setEditedConcept({ ...editedConcept, strategy: v })}
              multiline
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 콘셉트 필드 표시 컴포넌트
function ConceptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <p className="mt-1 text-gray-900">{value}</p>
    </div>
  );
}

// 편집 필드 컴포넌트
function EditField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      )}
    </div>
  );
}

