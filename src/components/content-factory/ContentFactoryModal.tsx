'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';
import { 
  ContentStep, 
  CONTENT_STEPS, 
  ConceptData, 
  MessageData, 
  ScriptData, 
  CopyData,
  ContentProject 
} from '@/types/content.types';
import { useTranslation } from '@/lib/i18n';

// Step 컴포넌트들
import StepConcept from './steps/StepConcept';
import StepMessage from './steps/StepMessage';
import StepScript from './steps/StepScript';
import StepCopy from './steps/StepCopy';
import StepProduction from './steps/StepProduction';

interface ContentFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  referenceImageIds?: string[];
  selectedContentTypes?: string[];
  totalPrice?: number;
}

export default function ContentFactoryModal({
  isOpen,
  onClose,
  initialPrompt = '',
  referenceImageIds = [],
  selectedContentTypes = [],
  totalPrice = 0,
}: ContentFactoryModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 단계별 데이터
  const [prompt, setPrompt] = useState(initialPrompt);
  const [concept, setConcept] = useState<ConceptData | null>(null);
  const [message, setMessage] = useState<MessageData | null>(null);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [copy, setCopy] = useState<CopyData | null>(null);
  const [productionTaskId, setProductionTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      // 약간의 딜레이 후 초기화 (애니메이션 후)
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setConcept(null);
        setMessage(null);
        setScript(null);
        setCopy(null);
        setProductionTaskId(null);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const currentStepInfo = CONTENT_STEPS[currentStep];
  const totalSteps = CONTENT_STEPS.length;

  // 다음 단계로 이동
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  // 이전 단계로 이동
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError(null);
    }
  };

  // 단계별 컨텐츠 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepConcept
            prompt={prompt}
            setPrompt={setPrompt}
            concept={concept}
            setConcept={setConcept}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            referenceImageIds={referenceImageIds}
          />
        );
      case 1:
        return (
          <StepMessage
            concept={concept!}
            message={message}
            setMessage={setMessage}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        );
      case 2:
        return (
          <StepScript
            concept={concept!}
            message={message!}
            script={script}
            setScript={setScript}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        );
      case 3:
        return (
          <StepCopy
            concept={concept!}
            message={message!}
            script={script!}
            copy={copy}
            setCopy={setCopy}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        );
      case 4:
        return (
          <StepProduction
            concept={concept!}
            message={message!}
            script={script!}
            copy={copy!}
            taskId={productionTaskId}
            setTaskId={setProductionTaskId}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            referenceImageIds={referenceImageIds}
          />
        );
      default:
        return null;
    }
  };

  // 다음 버튼 활성화 여부
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return concept !== null;
      case 1:
        return message !== null;
      case 2:
        return script !== null;
      case 3:
        return copy !== null;
      case 4:
        return productionTaskId !== null;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative w-full max-w-[900px] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4">
        {/* 헤더 - Progress 표시 */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('contentFactory.modal.title')}</h2>
                <p className="text-xs text-white/80">{t('contentFactory.modal.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Progress Bar & Steps */}
          <div className="space-y-2">
            {/* Step 표시 */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">
                Step {currentStep + 1}/{totalSteps}
              </span>
              <span className="text-white/80">
                {currentStepInfo.emoji} {currentStepInfo.name}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {CONTENT_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      index < currentStep
                        ? 'bg-white text-indigo-600'
                        : index === currentStep
                        ? 'bg-white/30 text-white ring-2 ring-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.emoji
                    )}
                  </div>
                  {index < CONTENT_STEPS.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-1 rounded ${
                        index < currentStep ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 이름들 */}
            <div className="flex justify-between text-xs text-white/70">
              {CONTENT_STEPS.map((step) => (
                <span key={step.id} className="w-8 text-center">
                  {step.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}
          {renderStepContent()}
        </div>

        {/* 하단 네비게이션 */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0 || isLoading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('contentFactory.modal.prevStep')}
          </button>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  canProceed() && !isLoading
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('contentFactory.modal.generating')}
                  </>
                ) : (
                  <>
                    {t('contentFactory.modal.nextStep')}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onClose}
                disabled={!productionTaskId}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  productionTaskId
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                {t('contentFactory.modal.complete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

