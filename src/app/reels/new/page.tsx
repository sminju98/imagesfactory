'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Sparkles, Upload, X, ArrowRight, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import StepProgressBar from '@/components/reels-factory/StepProgressBar';

export default function NewReelsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [options, setOptions] = useState({
    target: '',
    tone: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [isRefined, setIsRefined] = useState(false); // 교정 완료 여부
  const [projectId, setProjectId] = useState<string | null>(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 프롬프트 교정 (선택사항)
  const handleRefinePrompt = async () => {
    if (!prompt.trim()) {
      alert('프롬프트를 입력해주세요.');
      return;
    }

    setRefining(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      let currentProjectId = projectId;

      // 프로젝트가 없으면 먼저 생성
      if (!currentProjectId) {
        const createResponse = await fetch('/api/reels/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt,
            images: [],
            options,
          }),
        });

        const createData = await createResponse.json();
        if (!createData.success) {
          alert(createData.error || '프로젝트 생성에 실패했습니다.');
          return;
        }

        currentProjectId = createData.data.projectId;
        setProjectId(currentProjectId);
      }

      // 프롬프트 교정
      const response = await fetch('/api/reels/refine-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: currentProjectId,
          prompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 교정된 프롬프트를 입력창에 반영
        setPrompt(data.data.refinedPrompt);
        setIsRefined(true);
      } else {
        alert(data.error || '프롬프트 교정에 실패했습니다.');
      }
    } catch (error) {
      console.error('프롬프트 교정 오류:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setRefining(false);
    }
  };

  // 다음 단계로 진행 (교정 없이도 가능)
  const handleNext = async () => {
    if (!prompt.trim()) {
      alert('프롬프트를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      let currentProjectId = projectId;

      // 프로젝트가 없으면 먼저 생성
      if (!currentProjectId) {
        const createResponse = await fetch('/api/reels/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt,
            images: [],
            options,
          }),
        });

        const createData = await createResponse.json();
        if (!createData.success) {
          alert(createData.error || '프로젝트 생성에 실패했습니다.');
          return;
        }

        currentProjectId = createData.data.projectId;
        setProjectId(currentProjectId);
      }

      // Step 1 (리서치) 결과 페이지로 이동
      router.push(`/reels/${currentProjectId}/step/1`);
    } catch (error) {
      console.error('오류:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 진행 바 */}
      <StepProgressBar currentStep={0} projectId={projectId || undefined} />

      {/* 메인 카드 */}
      <div className="mt-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Step 0: 릴스 입력</h1>
          <p className="text-sm text-purple-200 mt-1">
            프롬프트와 참고 이미지를 입력하세요
          </p>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-6">
          {/* 프롬프트 입력 */}
          <div>
            <label className="block text-sm font-medium text-purple-100 mb-2">
              릴스 주제 / 프롬프트 *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 프리미엄 스킨케어 로션을 소개하는 릴스, 20-30대 여성 타겟, 고급스럽고 신뢰감 있는 톤"
              className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
              rows={4}
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-purple-100 mb-2">
              참고 이미지 (선택)
            </label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`preview-${index}`}
                    className="w-24 h-24 object-cover rounded-xl border border-white/20"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    title="이미지 삭제"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="w-24 h-24 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <ImageIcon className="w-6 h-6 text-white/40" />
                <span className="text-xs text-white/40 mt-1">추가</span>
              </label>
            </div>
          </div>

          {/* 옵션 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                타겟 고객
              </label>
              <input
                type="text"
                value={options.target}
                onChange={(e) => setOptions({ ...options, target: e.target.value })}
                placeholder="예: 20-30대 여성"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                톤 & 매너
              </label>
              <input
                type="text"
                value={options.tone}
                onChange={(e) => setOptions({ ...options, tone: e.target.value })}
                placeholder="예: 친근하고 유머러스"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                목적
              </label>
              <input
                type="text"
                value={options.purpose}
                onChange={(e) => setOptions({ ...options, purpose: e.target.value })}
                placeholder="예: 제품 홍보"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 프롬프트 교정 버튼 (선택사항) */}
          <div className="flex gap-3">
            <button
              onClick={handleRefinePrompt}
              disabled={refining || !prompt.trim()}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {refining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI가 프롬프트를 다듬는 중...
                </>
              ) : isRefined ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">교정 완료</span> (재교정 가능)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI 프롬프트 교정 (선택)
                </>
              )}
            </button>
          </div>

          {/* 안내 메시지 */}
          <p className="text-sm text-purple-200/60 text-center">
            💡 프롬프트 교정 없이도 다음 단계로 진행할 수 있습니다
          </p>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
          <button
            onClick={() => router.push('/reels')}
            className="px-5 py-2.5 text-white/70 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleNext}
            disabled={!prompt.trim() || loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                다음 단계로
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

