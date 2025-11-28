'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Search, Edit3 } from 'lucide-react';
import { ConceptData } from '@/types/content.types';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedConcept, setEditedConcept] = useState<ConceptData | null>(null);

  // 콘셉트 생성 API 호출
  const generateConcept = async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요');
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
        setError(data.error || '콘셉트 생성에 실패했습니다');
      }
    } catch (err) {
      setError('콘셉트 생성 중 오류가 발생했습니다');
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
          💡 제품/서비스 정보 입력
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예시: 피부과 전문 병원의 여드름 치료 프로그램을 홍보하고 싶어요. 타겟은 20-30대 여성이고, 트렌디하고 신뢰감 있는 이미지로 SNS 마케팅을 하려고 합니다."
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
              Perplexity + GPT로 분석 중...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              콘셉트 분석하기
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
              콘셉트 분석 결과
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={generateConcept}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                재생성
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <ConceptField label="📦 제품명" value={concept.productName} />
            <ConceptField label="✨ USP (장점)" value={concept.usp} />
            <ConceptField label="🎯 타겟" value={concept.target} />
            <ConceptField label="🎨 톤앤매너" value={concept.toneAndManner} />
            <ConceptField label="📊 전략 방향" value={concept.strategy} />
            {concept.marketTrend && (
              <ConceptField label="📈 시장 트렌드" value={concept.marketTrend} />
            )}
            {concept.keywords && concept.keywords.length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <span className="text-sm font-medium text-gray-600">🏷️ 키워드</span>
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
            <h3 className="text-lg font-bold text-gray-900">✏️ 콘셉트 수정</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedConcept(concept);
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
            <EditField
              label="제품명"
              value={editedConcept.productName}
              onChange={(v) => setEditedConcept({ ...editedConcept, productName: v })}
            />
            <EditField
              label="USP (장점)"
              value={editedConcept.usp}
              onChange={(v) => setEditedConcept({ ...editedConcept, usp: v })}
              multiline
            />
            <EditField
              label="타겟"
              value={editedConcept.target}
              onChange={(v) => setEditedConcept({ ...editedConcept, target: v })}
            />
            <EditField
              label="톤앤매너"
              value={editedConcept.toneAndManner}
              onChange={(v) => setEditedConcept({ ...editedConcept, toneAndManner: v })}
            />
            <EditField
              label="전략 방향"
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


