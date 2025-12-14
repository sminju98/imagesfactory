'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ReelsProject, ResearchResult, Concept, VideoScript } from '@/types/reels.types';
import StepProgressBar from '@/components/reels-factory/StepProgressBar';
import Link from 'next/link';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Edit3,
  Check,
  Sparkles,
  Search,
  Lightbulb,
  FileText,
  Film,
  Mic,
  Layers,
  Play,
  Download,
} from 'lucide-react';

// 단계별 컴포넌트 import
import Step0Result from '@/components/reels-factory/steps/Step0Result';
import Step1Result from '@/components/reels-factory/steps/Step1Result';
import Step2Result from '@/components/reels-factory/steps/Step2Result';
import Step3Result from '@/components/reels-factory/steps/Step3Result';
import Step4Result from '@/components/reels-factory/steps/Step4Result';
import Step5Result from '@/components/reels-factory/steps/Step5Result';
import Step6Result from '@/components/reels-factory/steps/Step6Result';

// 단계별 정보, 크레딧 비용, 예상 소요 시간
const STEP_INFO = [
  { id: 0, name: '입력 & 교정', icon: Edit3, credits: 1, desc: 'GPT 프롬프트 교정', time: '~10초' },
  { id: 1, name: '리서치', icon: Search, credits: 2, desc: 'Perplexity AI 리서치', time: '~30초' },
  { id: 2, name: '콘셉트', icon: Lightbulb, credits: 1, desc: 'GPT 콘셉트 기획', time: '~20초' },
  { id: 3, name: '대본', icon: FileText, credits: 3, desc: 'Grok-2 대본 생성', time: '~30초' },
  { id: 4, name: '영상 생성', icon: Film, credits: 50, desc: 'Google Veo 3.1 (×5개=250C)', perItem: true, time: '2~5분 (병렬)' },
  { id: 5, name: 'TTS & 자막', icon: Mic, credits: 2, desc: 'Google TTS (×5개=10C)', perItem: true, time: '~30초 (병렬)' },
  { id: 6, name: '최종 결합', icon: Layers, credits: 10, desc: 'FFmpeg 영상 병합', time: '~30초' },
];

export default function StepResultPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const step = parseInt(params.step as string, 10);
  const router = useRouter();
  
  const [project, setProject] = useState<ReelsProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프로젝트 데이터 실시간 구독
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'reelsProjects', projectId);
    const unsubscribe = onSnapshot(
      projectRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setProject({
            id: snapshot.id,
            ...snapshot.data(),
          } as ReelsProject);
        } else {
          setProject(null);
          setError('프로젝트를 찾을 수 없습니다.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('프로젝트 로드 오류:', err);
        setError('프로젝트를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // 단계 처리 함수
  const processStep = useCallback(async () => {
    if (!project) return;
    
    setProcessing(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      let endpoint = '';
      let body: any = { projectId: project.id };

      // 단계별 필수 데이터 확인
      switch (step) {
        case 1: // 리서치
          if (!project.refinedPrompt) {
            throw new Error('프롬프트가 없습니다. Step 0을 먼저 완료해주세요.');
          }
          endpoint = '/api/reels/research';
          body.refinedPrompt = project.refinedPrompt;
          break;
        case 2: // 콘셉트
          if (!project.refinedPrompt) {
            throw new Error('프롬프트가 없습니다.');
          }
          endpoint = '/api/reels/concept';
          body.refinedPrompt = project.refinedPrompt;
          body.selectedInsights = project.selectedInsights || [];
          body.options = project.options;
          break;
        case 3: // 대본
          if (!project.chosenConcept) {
            throw new Error('콘셉트가 선택되지 않았습니다. Step 2에서 콘셉트를 선택하고 저장해주세요.');
          }
          endpoint = '/api/reels/script';
          body.chosenConcept = project.chosenConcept;
          body.uploadedImages = project.uploadedImages || [];
          break;
        case 4: // 영상 생성
          if (!project.videoScripts || project.videoScripts.length === 0) {
            throw new Error('대본이 없습니다. Step 3을 먼저 완료해주세요.');
          }
          endpoint = '/api/reels/generate-video';
          body.videoScripts = project.videoScripts;
          break;
        case 5: // TTS
          if (!project.videoClips || project.videoClips.length === 0) {
            throw new Error('영상이 없습니다. Step 4를 먼저 완료해주세요.');
          }
          endpoint = '/api/reels/tts';
          body.videoScripts = project.videoScripts;
          body.videoClips = project.videoClips;
          break;
        case 6: // 최종 결합
          if (!project.finalClips || project.finalClips.length === 0) {
            throw new Error('TTS 결과가 없습니다. Step 5를 먼저 완료해주세요.');
          }
          endpoint = '/api/reels/merge';
          body.finalClips = project.finalClips;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || '처리에 실패했습니다.');
      }
    } catch (err) {
      console.error('단계 처리 오류:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  }, [project, step]);

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (step < 6) {
      router.push(`/reels/${projectId}/step/${step + 1}`);
    } else {
      router.push(`/reels/${projectId}`);
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (step > 0) {
      router.push(`/reels/${projectId}/step/${step - 1}`);
    }
  };

  // 자동 처리 비활성화 - 사용자가 명시적으로 버튼 클릭해야 함
  // (무한 루프 방지)

  // 단계별 데이터 확인
  const checkStepHasData = (proj: ReelsProject, stepNum: number): boolean => {
    switch (stepNum) {
      case 0:
        return !!proj.refinedPrompt;
      case 1:
        return proj.researchResults && proj.researchResults.length > 0;
      case 2:
        return proj.concepts && proj.concepts.length > 0;
      case 3:
        return proj.videoScripts && proj.videoScripts.length > 0;
      case 4:
        return proj.videoClips && proj.videoClips.length > 0;
      case 5:
        return proj.finalClips && proj.finalClips.length > 0;
      case 6:
        return !!proj.finalReelUrl;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="mt-4 text-purple-200">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">프로젝트를 찾을 수 없습니다.</p>
          <Link href="/reels" className="px-6 py-3 bg-purple-600 text-white rounded-lg">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const stepInfo = STEP_INFO[step];
  const Icon = stepInfo?.icon || Edit3;
  const hasData = checkStepHasData(project, step);
  const canProceed = hasData && step < 6;
  const isCompleted = step < project.currentStep;
  
  // 백그라운드 처리 상태 확인
  const stepStatus = (project as any).stepStatus?.[`step${step}`];
  const stepError = (project as any).stepError?.[`step${step}`];
  
  // Step 4, 5는 데이터가 있으면 결과 화면 표시 (일부 처리 중이어도)
  const hasPartialData = () => {
    if (step === 4) return project.videoClips && project.videoClips.length > 0;
    if (step === 5) return project.finalClips && project.finalClips.length > 0;
    return false;
  };
  
  // 처리 중 상태 결정 (데이터가 있으면 결과 화면 보여줌)
  const isProcessingInBackground = !hasPartialData() && (stepStatus === 'processing' || project.status === 'processing');
  const isStepProcessing = processing || (isProcessingInBackground && !hasData);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 진행 바 */}
      <StepProgressBar 
        currentStep={project.currentStep} 
        projectId={project.id}
        processingStep={processing ? step : undefined}
      />

      {/* 메인 카드 */}
      <div className="mt-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Step {step}: {stepInfo?.name}
                </h1>
                <p className="text-sm text-purple-200">
                  {isStepProcessing ? '🔄 AI가 처리 중입니다...' :
                   isCompleted ? '완료됨 · 결과를 확인하세요' : 
                   hasData ? '결과를 확인하고 다음 단계로 진행하세요' : 
                   '이 단계를 시작하세요'}
                </p>
              </div>
            </div>

            {/* 재생성 버튼 */}
            {hasData && !isStepProcessing && step > 0 && (
              <button
                onClick={processStep}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                재생성 ({stepInfo?.points}pt)
              </button>
            )}
          </div>

          {/* 포인트 비용 및 소요 시간 안내 */}
          <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
              💰 {stepInfo?.perItem ? `${stepInfo?.points}pt × 영상 수` : `${stepInfo?.points}pt`}
            </span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
              ⏱️ {stepInfo?.time}
            </span>
            <span className="text-white/50">{stepInfo?.desc}</span>
            {!hasData && step > 0 && (
              <span className="text-white/40 ml-auto">생성 시 포인트가 차감됩니다</span>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          {/* 에러 표시 */}
          {(error || stepError) && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
              <p className="font-medium mb-1">⚠️ 오류가 발생했습니다</p>
              <p>{error || stepError}</p>
              {stepError && (
                <p className="text-sm mt-2 text-red-300">💸 포인트가 자동으로 환불되었습니다.</p>
              )}
            </div>
          )}

          {/* 처리 중 상태 - Step 4,5는 데이터가 있으면 결과도 함께 표시 */}
          {isStepProcessing && !hasPartialData() && (
            <div className="py-16 text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500" />
                <Sparkles className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-lg text-white font-medium">
                AI가 {stepInfo?.name}을(를) 처리 중입니다...
              </p>
              <p className="mt-2 text-purple-200">
                {isProcessingInBackground 
                  ? '🔄 페이지를 나가도 백그라운드에서 계속 진행됩니다'
                  : '잠시만 기다려주세요'}
              </p>
            </div>
          )}

          {/* 단계별 결과 컴포넌트 - Step 4,5는 일부 데이터라도 있으면 표시 */}
          {(!isStepProcessing || hasPartialData()) && (
            <>
              {step === 0 && <Step0Result project={project} />}
              {step === 1 && <Step1Result project={project} onRefresh={processStep} />}
              {step === 2 && <Step2Result project={project} onRefresh={processStep} />}
              {step === 3 && <Step3Result project={project} onRefresh={processStep} />}
              {step === 4 && <Step4Result project={project} onRefresh={processStep} />}
              {step === 5 && <Step5Result project={project} onRefresh={processStep} />}
              {step === 6 && <Step6Result project={project} onRefresh={processStep} />}
            </>
          )}
        </div>

        {/* 푸터 - 네비게이션 */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
          {/* 이전 버튼 */}
          <button
            onClick={goToPrevStep}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 단계
          </button>

          {/* 대시보드로 */}
          <Link
            href={`/reels/${projectId}`}
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            대시보드로 이동
          </Link>

          {/* 다음 버튼 */}
          {step < 6 ? (
            <button
              onClick={goToNextStep}
              disabled={!hasData || processing}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
            >
              다음 단계
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href={`/reels/${projectId}`}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all"
            >
              <Check className="w-4 h-4" />
              완료
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

