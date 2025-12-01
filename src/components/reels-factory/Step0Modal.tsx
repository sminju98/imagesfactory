'use client';

import { useState } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { auth } from '@/lib/firebase';

interface Step0ModalProps {
  open: boolean;
  onClose: () => void;
  project: ReelsProject | null;
  onComplete: (data: any) => void;
}

export default function Step0Modal({ open, onClose, project, onComplete }: Step0ModalProps) {
  const [prompt, setPrompt] = useState(project?.inputPrompt || '');
  const [images, setImages] = useState<any[]>(project?.uploadedImages || []);
  const [options, setOptions] = useState({
    target: project?.options?.target || '',
    tone: project?.options?.tone || '',
    purpose: project?.options?.purpose || '',
  });
  const [loading, setLoading] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState(project?.refinedPrompt || '');

  if (!open) return null;

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) {
      alert('프롬프트를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/reels/refine-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project?.id,
          prompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRefinedPrompt(data.data.refinedPrompt);
      } else {
        alert(data.error || '프롬프트 교정에 실패했습니다.');
      }
    } catch (error) {
      console.error('프롬프트 교정 오류:', error);
      alert('프롬프트 교정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!refinedPrompt) {
      alert('프롬프트를 교정해주세요.');
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      
      // 프로젝트 생성 또는 업데이트
      if (!project || !project.id) {
        const response = await fetch('/api/reels/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt,
            images,
            options,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // 프로젝트 생성 후 프롬프트 교정
          const refineResponse = await fetch('/api/reels/refine-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectId: data.data.projectId,
              prompt,
            }),
          });

          const refineData = await refineResponse.json();
          if (refineData.success) {
            onComplete({
              id: data.data.projectId,
              inputPrompt: prompt,
              refinedPrompt: refineData.data.refinedPrompt,
              uploadedImages: images,
              options,
              currentStep: 1,
            });
            onClose();
          }
        }
      } else {
        // 기존 프로젝트 업데이트
        const refineResponse = await fetch('/api/reels/refine-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: project.id,
            prompt,
          }),
        });

        const refineData = await refineResponse.json();
        if (refineData.success) {
          onComplete({
            refinedPrompt: refineData.data.refinedPrompt,
            currentStep: 1,
          });
          onClose();
        }
      }
    } catch (error) {
      console.error('오류:', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Step 0: 입력 & 프롬프트 교정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 프롬프트 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프롬프트
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 건강한 다이어트 제품을 소개하는 릴스"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {/* 옵션 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타겟
              </label>
              <input
                type="text"
                value={options.target}
                onChange={(e) => setOptions({ ...options, target: e.target.value })}
                placeholder="예: 20-30대 여성"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                톤앤매너
              </label>
              <input
                type="text"
                value={options.tone}
                onChange={(e) => setOptions({ ...options, tone: e.target.value })}
                placeholder="예: 친근하고 유머러스"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                목적
              </label>
              <input
                type="text"
                value={options.purpose}
                onChange={(e) => setOptions({ ...options, purpose: e.target.value })}
                placeholder="예: 제품 판매"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* 프롬프트 교정 */}
          <div className="mb-6">
            <button
              onClick={handleRefinePrompt}
              disabled={loading || !prompt.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '교정 중...' : '프롬프트 교정'}
            </button>
          </div>

          {/* 교정된 프롬프트 */}
          {refinedPrompt && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                교정된 프롬프트
              </label>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-gray-800">{refinedPrompt}</p>
              </div>
            </div>
          )}

          {/* 다음 단계 버튼 */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleNext}
              disabled={!refinedPrompt}
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

