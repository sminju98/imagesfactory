'use client';

import React from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

// 예상 소요 시간 컴포넌트
function EstimatedTime({ remainingImages }: { remainingImages: number }) {
  // 현실적인 예상 시간 계산
  // - 병렬 처리를 고려하면 이미지당 약 2-4초
  // - 최소 5초, 최대 5분으로 제한
  const secondsPerImage = 3; // 병렬 처리 고려
  const estimatedSeconds = Math.max(5, Math.min(remainingImages * secondsPerImage, 300));
  
  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    if (seconds <= 5) return '곧 완료';
    if (seconds < 60) return `약 ${Math.ceil(seconds / 5) * 5}초`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes === 1) return '약 1분';
    return `약 ${minutes}분`;
  };

  return (
    <span className="text-gray-500">
      예상 남은 시간: {formatTime(estimatedSeconds)}
    </span>
  );
}

interface TaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  imageUrls: string[];
  resultPageUrl?: string;
  failedReason?: string;
}

interface GenerationProgressProps {
  task: TaskStatus | null;
  isLoading: boolean;
}

export default function GenerationProgress({ task, isLoading }: GenerationProgressProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="font-medium text-indigo-700">요청을 처리하고 있습니다...</span>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const statusConfig = {
    pending: {
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      label: '대기 중',
      bgClass: 'from-yellow-50 to-orange-50 border-yellow-200',
      textClass: 'text-yellow-700',
      progressClass: 'bg-yellow-500',
    },
    processing: {
      icon: <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />,
      label: '생성 중',
      bgClass: 'from-indigo-50 to-purple-50 border-indigo-200',
      textClass: 'text-indigo-700',
      progressClass: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    },
    completed: {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      label: '완료',
      bgClass: 'from-green-50 to-emerald-50 border-green-200',
      textClass: 'text-green-700',
      progressClass: 'bg-green-500',
    },
    failed: {
      icon: <XCircle className="w-6 h-6 text-red-500" />,
      label: '실패',
      bgClass: 'from-red-50 to-rose-50 border-red-200',
      textClass: 'text-red-700',
      progressClass: 'bg-red-500',
    },
  };

  const config = statusConfig[task.status];

  return (
    <div className={`p-6 bg-gradient-to-r ${config.bgClass} rounded-xl border`}>
      {/* 상태 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {config.icon}
          <span className={`font-semibold ${config.textClass}`}>
            {config.label}
          </span>
        </div>
        <span className={`text-2xl font-bold ${config.textClass}`}>
          {task.progress}%
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-3 bg-white/50 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${config.progressClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* 통계 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {task.completedImages} / {task.totalImages} 완료
          {task.failedImages > 0 && (
            <span className="text-red-500 ml-2">
              ({task.failedImages} 실패)
            </span>
          )}
        </span>
        
        {task.status === 'processing' && (
          <EstimatedTime remainingImages={task.totalImages - task.completedImages} />
        )}
      </div>

      {/* 이미지 미리보기 */}
      {task.imageUrls.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {task.imageUrls.slice(0, 8).map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Generated ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm"
            />
          ))}
          {task.imageUrls.length > 8 && (
            <div className="w-16 h-16 flex items-center justify-center bg-white/50 rounded-lg border-2 border-white text-gray-500 text-sm font-medium">
              +{task.imageUrls.length - 8}
            </div>
          )}
        </div>
      )}

      {/* 완료 시 결과 페이지 링크 */}
      {task.status === 'completed' && task.resultPageUrl && (
        <div className="mt-4">
          <a
            href={task.resultPageUrl}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
          >
            결과 페이지에서 보기 →
          </a>
        </div>
      )}

      {/* 실패 사유 */}
      {task.status === 'failed' && task.failedReason && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <p className="text-sm text-red-700">{task.failedReason}</p>
        </div>
      )}
    </div>
  );
}
