'use client';

import { useState, useEffect } from 'react';
import { Loader2, Factory, Play, CheckCircle, XCircle, Image, Film, Grid2X2, Layers, Youtube, FileImage, LayoutTemplate } from 'lucide-react';
import { ConceptData, MessageData, ScriptData, CopyData, CONTENT_SIZES, ContentType } from '@/types/content.types';

interface StepProductionProps {
  concept: ConceptData;
  message: MessageData;
  script: ScriptData;
  copy: CopyData;
  taskId: string | null;
  setTaskId: (taskId: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  referenceImageIds?: string[];
}

interface ProductionLine {
  id: ContentType;
  name: string;
  icon: React.ReactNode;
  count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[]; // 생성된 이미지 URL들
}

export default function StepProduction({
  concept,
  message,
  script,
  copy,
  taskId,
  setTaskId,
  isLoading,
  setIsLoading,
  setError,
  referenceImageIds = [],
}: StepProductionProps) {
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([
    { id: 'reels', name: '릴스/틱톡 컷씬', icon: <Film className="w-5 h-5" />, count: 10, status: 'pending', progress: 0 },
    { id: 'comic', name: '4컷 만화', icon: <Grid2X2 className="w-5 h-5" />, count: 4, status: 'pending', progress: 0 },
    { id: 'card_news', name: '카드뉴스', icon: <Layers className="w-5 h-5" />, count: 5, status: 'pending', progress: 0 },
    { id: 'banner', name: '배너 광고', icon: <LayoutTemplate className="w-5 h-5" />, count: 2, status: 'pending', progress: 0 },
    { id: 'story', name: '스토리 광고', icon: <Image className="w-5 h-5" />, count: 2, status: 'pending', progress: 0 },
    { id: 'thumbnail', name: '유튜브 썸네일', icon: <Youtube className="w-5 h-5" />, count: 3, status: 'pending', progress: 0 },
    { id: 'detail_header', name: '상세페이지 헤더', icon: <FileImage className="w-5 h-5" />, count: 2, status: 'pending', progress: 0 },
  ]);
  const [isStarted, setIsStarted] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // 생산 시작
  const startProduction = async () => {
    setIsLoading(true);
    setIsStarted(true);
    setError(null);

    try {
      const response = await fetch('/api/content/start-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          message,
          script,
          copy,
          referenceImageIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTaskId(data.taskId);
        // 시뮬레이션: 실제로는 SSE나 polling으로 진행 상황 업데이트
        simulateProduction();
      } else {
        setError(data.error || '생산 시작에 실패했습니다');
        setIsStarted(false);
      }
    } catch (err) {
      setError('생산 시작 중 오류가 발생했습니다');
      setIsStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 생산 시뮬레이션 (실제 구현 시 SSE/Polling으로 대체)
  const simulateProduction = () => {
    let currentLine = 0;
    const lines = [...productionLines];

    const processLine = () => {
      if (currentLine >= lines.length) {
        setOverallProgress(100);
        return;
      }

      lines[currentLine].status = 'processing';
      setProductionLines([...lines]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          lines[currentLine].status = 'completed';
          lines[currentLine].progress = 100;
          setProductionLines([...lines]);
          clearInterval(interval);

          // 전체 진행률 업데이트
          const completed = lines.filter(l => l.status === 'completed').length;
          setOverallProgress(Math.round((completed / lines.length) * 100));

          currentLine++;
          setTimeout(processLine, 500);
        } else {
          lines[currentLine].progress = Math.round(progress);
          setProductionLines([...lines]);
        }
      }, 300);
    };

    processLine();
  };

  const totalImages = productionLines.reduce((sum, line) => sum + line.count, 0);
  const completedCount = productionLines.filter(l => l.status === 'completed').length;
  const allCompleted = completedCount === productionLines.length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
          <Factory className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">자동 콘텐츠 생산</h3>
        <p className="text-sm text-gray-500 mt-1">
          총 {totalImages}장의 콘텐츠가 생성됩니다
        </p>
      </div>

      {/* 시작 전 */}
      {!isStarted && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center border border-indigo-100">
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span className="px-3 py-1 bg-white rounded-full">🎬 릴스 10장</span>
              <span className="px-3 py-1 bg-white rounded-full">📖 만화 4장</span>
              <span className="px-3 py-1 bg-white rounded-full">📱 카드뉴스 5장</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span className="px-3 py-1 bg-white rounded-full">🖼️ 배너 2장</span>
              <span className="px-3 py-1 bg-white rounded-full">📲 스토리 2장</span>
              <span className="px-3 py-1 bg-white rounded-full">🎥 썸네일 3장</span>
              <span className="px-3 py-1 bg-white rounded-full">📄 상세페이지 2장</span>
            </div>
          </div>

          <button
            onClick={startProduction}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                준비 중...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                생산 시작하기
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            약 3-5분 소요 예상 • 생산 완료 후 갤러리에 자동 저장
          </p>
        </div>
      )}

      {/* 생산 진행 중 */}
      {isStarted && (
        <div className="space-y-4">
          {/* 전체 진행률 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">전체 진행률</span>
              <span className="text-sm font-bold text-indigo-600">{overallProgress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* 생산 라인들 */}
          <div className="space-y-3">
            {productionLines.map((line) => (
              <ProductionLineCard key={line.id} line={line} />
            ))}
          </div>

          {/* 완료 메시지 */}
          {allCompleted && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-gray-900 mb-1">🎉 생산 완료!</h4>
              <p className="text-sm text-gray-600">
                {totalImages}장의 콘텐츠가 성공적으로 생성되었습니다.
                <br />
                갤러리에서 확인하고 다운로드하세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 생산 라인 카드
function ProductionLineCard({ line }: { line: ProductionLine }) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-500',
    processing: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
  };

  const statusIcons = {
    pending: null,
    processing: <Loader2 className="w-4 h-4 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4" />,
    failed: <XCircle className="w-4 h-4" />,
  };

  return (
    <div className={`rounded-xl p-4 border transition-all ${
      line.status === 'processing' 
        ? 'bg-blue-50 border-blue-200 shadow-md' 
        : line.status === 'completed'
        ? 'bg-green-50 border-green-200'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-4">
        {/* 아이콘 */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[line.status]}`}>
          {line.icon}
        </div>

        {/* 정보 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-900">{line.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{line.count}장</span>
              {statusIcons[line.status]}
            </div>
          </div>

          {/* 진행 바 */}
          {line.status === 'processing' && (
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${line.progress}%` }}
              />
            </div>
          )}

          {line.status === 'completed' && (
            <span className="text-xs text-green-600">완료</span>
          )}
        </div>
      </div>
    </div>
  );
}

