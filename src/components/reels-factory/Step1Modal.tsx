'use client';

import { useState, useEffect } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step1ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject | null;
  onComplete: (data: any) => void;
}

export default function Step1Modal({ open, onClose, project, onComplete }: Step1ModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>(project?.researchResults || []);
  const [selectedInsights, setSelectedInsights] = useState<string[]>(
    project?.selectedInsights || []
  );

  useEffect(() => {
    if (open && (!results || results.length === 0)) {
      handleResearch();
    }
  }, [open]);

  const handleResearch = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project?.id,
          refinedPrompt: project?.refinedPrompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results);
      } else {
        alert(data.error || '리서치에 실패했습니다.');
      }
    } catch (error) {
      console.error('리서치 오류:', error);
      alert('리서치 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInsight = (id: string) => {
    setSelectedInsights((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    onComplete({
      selectedInsights,
      currentStep: 2,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 1: 리서치 (Perplexity)</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">리서치 중...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  리서치 결과에서 릴스 제작에 활용할 인사이트를 선택하세요.
                </p>
                <button
                  onClick={handleResearch}
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  다시 검색하기
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {results.map((result) => (
                  <label
                    key={result.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedInsights.includes(result.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInsights.includes(result.id)}
                      onChange={() => toggleInsight(result.id)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {result.category}
                        </span>
                      </div>
                      <p className="text-gray-800">{result.content}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedInsights.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 단계로 ({selectedInsights.length}개 선택)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

