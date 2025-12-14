'use client';

import { useState, useEffect } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step4ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject;
  onComplete: (data: any) => void;
}

export default function Step4Modal({ open, onClose, project, onComplete }: Step4ModalProps) {
  const [videoClips, setVideoClips] = useState<any[]>(project.videoClips || []);
  const [generating, setGenerating] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && project.videoScripts) {
      // 5개 영상 클립 초기화
      const clips = Array.from({ length: 5 }, (_, i) => ({
        videoIndex: i,
        url: '',
        thumbnailUrl: '',
        duration: 8,
        status: 'pending' as const,
      }));
      setVideoClips(clips);
    }
  }, [open]);

  // 프로젝트 상태 폴링
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/reels/${project.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success && data.data.videoClips) {
          setVideoClips(data.data.videoClips);
        }
      } catch (error) {
        console.error('상태 확인 오류:', error);
      }
    }, 10000); // 10초마다 확인

    return () => clearInterval(interval);
  }, [open, project.id]);

  const handleGenerateVideo = async (videoIndex: number) => {
    if (generating.has(videoIndex)) return;

    setGenerating((prev) => new Set(prev).add(videoIndex));
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          videoIndex,
          videoScript: project.videoScripts[videoIndex],
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || '영상 생성에 실패했습니다.');
        setGenerating((prev) => {
          const next = new Set(prev);
          next.delete(videoIndex);
          return next;
        });
      }
    } catch (error) {
      console.error('영상 생성 오류:', error);
      alert('영상 생성 중 오류가 발생했습니다.');
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(videoIndex);
        return next;
      });
    }
  };

  const handleGenerateAll = async () => {
    for (let i = 0; i < 5; i++) {
      await handleGenerateVideo(i);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 간격
    }
  };

  const handleNext = () => {
    const allCompleted = videoClips.every(
      (clip) => clip.status === 'completed'
    );
    if (!allCompleted) {
      alert('모든 영상이 완료될 때까지 기다려주세요.');
      return;
    }
    onComplete({
      videoClips,
      currentStep: 5,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 4: 영상 제작 (Veo3)</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              5개의 8초 영상을 생성합니다. 각 영상을 개별 생성하거나 모두 한 번에 생성할 수 있습니다.
            </p>
            <button
              onClick={handleGenerateAll}
              disabled={generating.size > 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              모두 생성하기
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            {videoClips.map((clip, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 text-center"
              >
                <div className="mb-2 font-semibold">Video {index + 1}</div>
                {clip.status === 'completed' && clip.url ? (
                  <video
                    src={clip.url}
                    controls
                    className="w-full rounded"
                  />
                ) : clip.status === 'processing' ? (
                  <div className="py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">생성 중...</p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateVideo(index)}
                    disabled={generating.has(index)}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 disabled:opacity-50"
                  >
                    {generating.has(index) ? '생성 중...' : '생성하기'}
                  </button>
                )}
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
              disabled={!videoClips.every((clip) => clip.status === 'completed')}
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


