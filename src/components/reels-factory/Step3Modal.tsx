'use client';

import { useState, useEffect } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step3ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject;
  onComplete: (data: any) => void;
}

export default function Step3Modal({ open, onClose, project, onComplete }: Step3ModalProps) {
  const [loading, setLoading] = useState(false);
  const [videoScripts, setVideoScripts] = useState<any[]>(project.videoScripts || []);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && (!videoScripts || videoScripts.length === 0)) {
      // chosenConcept가 없으면 에러 표시
      if (!project.chosenConcept) {
        setError('콘셉트가 선택되지 않았습니다. Step 2에서 콘셉트를 선택해주세요.');
        return;
      }
      handleGenerateScripts();
    }
  }, [open, project.chosenConcept]);

  const handleGenerateScripts = async () => {
    if (!project.chosenConcept) {
      setError('콘셉트가 선택되지 않았습니다. Step 2에서 콘셉트를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          chosenConcept: project.chosenConcept,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVideoScripts(data.data.videoScripts);
      } else {
        const errorMsg = data.error || '대본 생성에 실패했습니다.';
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || '대본 생성 중 오류가 발생했습니다.';
      console.error('대본 생성 오류:', error);
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = () => {
    const approvedScripts = videoScripts.map((script) => ({
      ...script,
      approved: true,
    }));
    setVideoScripts(approvedScripts);
  };

  const handleNext = () => {
    const allApproved = videoScripts.every((script) => script.approved);
    if (!allApproved) {
      alert('모든 대본을 승인해주세요.');
      return;
    }
    onComplete({
      videoScripts,
      currentStep: 4,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 3: 대본 작성 (Grok)</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <p className="font-semibold text-lg">⚠️ 오류 발생</p>
                <p className="mt-2">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  if (project.chosenConcept) {
                    handleGenerateScripts();
                  }
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                다시 시도
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">대본 생성 중...</p>
            </div>
          ) : (
            <>
              {/* 탭 */}
              <div className="flex gap-2 mb-6 border-b">
                {videoScripts.map((script, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 font-semibold border-b-2 ${
                      activeTab === index
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    Video {index + 1} {script.approved ? '✓' : ''}
                  </button>
                ))}
              </div>

              {/* 대본 표시 */}
              {videoScripts[activeTab] && (
                <div className="mb-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">
                      Video {activeTab + 1} ({videoScripts[activeTab].duration}초)
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {videoScripts[activeTab].narration}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {videoScripts[activeTab].shots && Array.isArray(videoScripts[activeTab].shots) && videoScripts[activeTab].shots.map((shot: any, shotIndex: number) => {
                      // shot이 객체인지 확인하고 안전하게 렌더링
                      if (!shot || typeof shot !== 'object') {
                        return null;
                      }
                      
                      // shot 객체의 속성들을 안전하게 추출
                      const duration = shot.duration || shot.time || 0;
                      const description = shot.description || shot.scene || '';
                      const visualPrompt = shot.visualPrompt || shot.onscreen_text || '';
                      
                      return (
                        <div key={shotIndex} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold">
                              샷 {shotIndex + 1} ({duration}초)
                            </span>
                          </div>
                          {description && (
                            <p className="text-gray-800 mb-2">{String(description)}</p>
                          )}
                          {visualPrompt && (
                            <p className="text-sm text-gray-600 italic">
                              {String(visualPrompt)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={videoScripts[activeTab].approved}
                        onChange={(e) => {
                          const updated = [...videoScripts];
                          updated[activeTab].approved = e.target.checked;
                          setVideoScripts(updated);
                        }}
                        className="mr-2"
                      />
                      <span>이 영상 승인</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleApproveAll}
                  className="px-4 py-2 text-indigo-600 hover:text-indigo-700"
                >
                  모두 승인
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    다음 단계로
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

