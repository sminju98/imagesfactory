'use client';

import { useState, useEffect } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step5ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject;
  onComplete: (data: any) => void;
}

export default function Step5Modal({ open, onClose, project, onComplete }: Step5ModalProps) {
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [finalClips, setFinalClips] = useState<any[]>(project.finalClips || []);

  useEffect(() => {
    if (open && project.videoScripts) {
      // 5개 영상 초기화
      const clips = Array.from({ length: 5 }, (_, i) => ({
        videoIndex: i,
        audioUrl: '',
        subtitleUrl: '',
        duration: 8,
      }));
      setFinalClips(clips);
    }
  }, [open, project.videoScripts]);

  const handleGenerateTTS = async (videoIndex: number) => {
    if (processing.has(videoIndex)) return;

    setProcessing((prev) => new Set(prev).add(videoIndex));
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          videoIndex,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const updated = [...finalClips];
        
        // subtitle 객체를 안전하게 처리
        let subtitleUrl = '';
        if (data.data.subtitle) {
          if (typeof data.data.subtitle === 'string') {
            subtitleUrl = data.data.subtitle;
          } else if (data.data.subtitle.srt) {
            subtitleUrl = data.data.subtitle.srt;
          } else if (data.data.subtitle.vtt) {
            subtitleUrl = data.data.subtitle.vtt;
          } else {
            // subtitle이 {ratio, timeline} 같은 다른 구조일 수 있음
            console.warn('예상치 못한 subtitle 구조:', data.data.subtitle);
            subtitleUrl = '';
          }
        }
        
        updated[videoIndex] = {
          ...updated[videoIndex],
          audioUrl: data.data.audioUrl,
          subtitleUrl: subtitleUrl,
        };
        setFinalClips(updated);
        setCompleted((prev) => new Set(prev).add(videoIndex));
      } else {
        alert(data.error || 'TTS 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('TTS 생성 오류:', error);
      alert('TTS 생성 중 오류가 발생했습니다.');
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(videoIndex);
        return next;
      });
    }
  };

  const handleGenerateAll = async () => {
    for (let i = 0; i < 5; i++) {
      await handleGenerateTTS(i);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 간격
    }
  };

  const handleNext = () => {
    const allCompleted = finalClips.every((clip) => clip.audioUrl);
    if (!allCompleted) {
      alert('모든 영상의 TTS가 완료될 때까지 기다려주세요.');
      return;
    }
    onComplete({
      finalClips,
      currentStep: 6,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 5: Pixazo TTS + 자막 생성</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              5개 영상에 음성 내레이션과 자막을 추가합니다.
            </p>
            <button
              onClick={handleGenerateAll}
              disabled={processing.size > 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              모두 생성하기
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            {finalClips.map((clip, index) => {
              const script = project.videoScripts?.[index];
              const isProcessing = processing.has(index);
              const isCompleted = completed.has(index);

              return (
                <div key={index} className="border rounded-lg p-4 text-center">
                  <div className="mb-2 font-semibold">Video {index + 1}</div>
                  {script && (
                    <div className="text-sm text-gray-600 mb-2">
                      "{script.narration}"
                    </div>
                  )}
                  {isCompleted ? (
                    <div className="py-4">
                      <div className="text-green-600 text-2xl mb-2">✓</div>
                      <p className="text-sm text-gray-600">완료</p>
                      {clip.audioUrl && (
                        <audio controls className="w-full mt-2">
                          <source src={clip.audioUrl} type="audio/mpeg" />
                        </audio>
                      )}
                    </div>
                  ) : isProcessing ? (
                    <div className="py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">생성 중...</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateTTS(index)}
                      className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500"
                    >
                      TTS 생성
                    </button>
                  )}
                </div>
              );
            })}
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
              disabled={!finalClips.every((clip) => clip.audioUrl)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 단계로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

