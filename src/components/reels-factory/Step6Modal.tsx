'use client';

import { useState } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step6ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject;
  onComplete: (data: any) => void;
}

export default function Step6Modal({ open, onClose, project, onComplete }: Step6ModalProps) {
  const [merging, setMerging] = useState(false);
  const [finalReelUrl, setFinalReelUrl] = useState(project.finalReelUrl || '');

  const handleMerge = async () => {
    setMerging(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFinalReelUrl(data.data.finalReelUrl);
        onComplete({
          finalReelUrl: data.data.finalReelUrl,
          status: 'completed',
          currentStep: 6,
        });
      } else {
        alert(data.error || '영상 결합에 실패했습니다.');
      }
    } catch (error) {
      console.error('영상 결합 오류:', error);
      alert('영상 결합 중 오류가 발생했습니다.');
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (finalReelUrl) {
      window.open(finalReelUrl, '_blank');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 6: 최종 릴스 결합</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {finalReelUrl ? (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">🎉 릴스 제작 완료!</h3>
              
              <div className="mb-6">
                <video
                  src={finalReelUrl}
                  controls
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">최종 릴스 URL:</p>
                  <p className="text-sm font-mono break-all">{finalReelUrl}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">40초</p>
                    <p className="text-sm text-gray-600">길이</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">1080x1920</p>
                    <p className="text-sm text-gray-600">해상도</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">MP4</p>
                    <p className="text-sm text-gray-600">형식</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  다운로드
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                5개 영상을 결합하여 최종 40초 릴스를 생성합니다.
              </p>

              {merging ? (
                <div className="py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">영상 결합 중...</p>
                  <p className="text-sm text-gray-500 mt-2">약 1-2분 소요됩니다</p>
                </div>
              ) : (
                <div>
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">결합할 영상:</p>
                    <ul className="text-left space-y-1">
                      {project.finalClips?.map((clip, i) => (
                        <li key={i} className="text-sm">
                          Video {i + 1}: {clip.audioUrl ? '✓ 음성 포함' : '✗ 음성 없음'}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleMerge}
                    disabled={!project.finalClips || project.finalClips.length !== 5}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                  >
                    최종 릴스 생성하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

