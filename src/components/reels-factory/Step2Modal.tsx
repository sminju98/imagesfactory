'use client';

import { useState, useEffect } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step2ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject;
  onComplete: (data: any) => void;
}

export default function Step2Modal({ open, onClose, project, onComplete }: Step2ModalProps) {
  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<any[]>(project.concepts || []);
  const [selectedConcept, setSelectedConcept] = useState<any>(project.chosenConcept || null);

  useEffect(() => {
    if (open && (!concepts || concepts.length === 0)) {
      handleGenerateConcepts();
    }
  }, [open]);

  const handleGenerateConcepts = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          refinedPrompt: project.refinedPrompt,
          selectedInsights: project.selectedInsights,
          options: project.options,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConcepts(data.data.concepts);
      } else {
        alert(data.error || '콘셉트 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('콘셉트 생성 오류:', error);
      alert('콘셉트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedConcept) {
      alert('콘셉트를 선택해주세요.');
      return;
    }
    onComplete({
      chosenConcept: selectedConcept,
      currentStep: 3,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 2: 콘셉트 기획 (GPT)</h2>
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
              <p className="mt-4 text-gray-600">콘셉트 생성 중...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  생성된 콘셉트 중 하나를 선택하세요.
                </p>
                <button
                  onClick={handleGenerateConcepts}
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  다시 생성하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {concepts.map((concept) => (
                  <div
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept)}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition ${
                      selectedConcept?.id === concept.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-bold text-lg mb-2">{concept.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{concept.summary}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Hook:</span> {concept.hook}
                      </div>
                      <div>
                        <span className="font-semibold">Flow:</span> {concept.flow}
                      </div>
                      <div>
                        <span className="font-semibold">CTA:</span> {concept.cta}
                      </div>
                    </div>
                  </div>
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
                  disabled={!selectedConcept}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 단계로
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

