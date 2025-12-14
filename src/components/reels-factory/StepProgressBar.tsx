'use client';

import { Check, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { id: 0, name: '입력', description: '프롬프트 & 이미지' },
  { id: 1, name: '리서치', description: 'AI 트렌드 분석' },
  { id: 2, name: '콘셉트', description: '기획안 생성' },
  { id: 3, name: '대본', description: '영상 스크립트' },
  { id: 4, name: '영상', description: 'AI 영상 생성' },
  { id: 5, name: '음성', description: 'TTS & 자막' },
  { id: 6, name: '완성', description: '최종 합성' },
];

interface StepProgressBarProps {
  currentStep: number;
  projectId?: string;
  processingStep?: number; // 현재 처리 중인 단계
}

export default function StepProgressBar({
  currentStep,
  projectId,
  processingStep,
}: StepProgressBarProps) {
  return (
    <div className="w-full py-6">
      {/* 모바일 뷰 */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center justify-between text-sm text-purple-200">
          <span>Step {currentStep + 1} / {STEPS.length}</span>
          <span className="font-medium text-white">{STEPS[currentStep]?.name}</span>
        </div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 데스크탑 뷰 */}
      <div className="hidden sm:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isProcessing = index === processingStep;
          const isClickable = isCompleted && projectId;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* 단계 원형 */}
              <div className="flex flex-col items-center">
                {isClickable ? (
                  <Link
                    href={`/reels/${projectId}/step/${step.id}`}
                    className="group"
                  >
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${isCompleted
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30 group-hover:scale-110'
                          : isCurrent
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/30'
                          : 'bg-white/10 text-white/40'
                        }
                      `}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{step.id + 1}</span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                        : isCurrent
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/30'
                        : 'bg-white/10 text-white/40'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{step.id + 1}</span>
                    )}
                  </div>
                )}
                
                {/* 단계 이름 */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {step.name}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    isCurrent ? 'text-purple-300' : 'text-white/30'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* 연결선 */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-24px]">
                  <div
                    className={`h-1 rounded-full transition-all duration-500 ${
                      index < currentStep
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-white/10'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

