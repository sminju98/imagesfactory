'use client';

import { useState } from 'react';
import { ReelsProject, FinalClip } from '@/types/reels.types';
import { Play, Loader2, Volume2, FileText, Check, Download, RefreshCw, AlertCircle } from 'lucide-react';

interface Step5ResultProps {
  project: ReelsProject;
  onRefresh: () => void;
}

export default function Step5Result({ project, onRefresh }: Step5ResultProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [audioPlayingIndex, setAudioPlayingIndex] = useState<number | null>(null);

  const finalClips = project.finalClips || [];
  const videoClips = project.videoClips || [];
  const scripts = project.videoScripts || [];

  // 영상이 없으면 Step4로 안내
  if (videoClips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">먼저 영상을 생성해주세요 (Step 4).</p>
      </div>
    );
  }

  // TTS가 아직 시작되지 않았으면 생성 시작 버튼
  if (finalClips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">영상 {videoClips.length}개가 준비되었습니다. TTS를 생성하세요.</p>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          TTS 생성 시작
        </button>
      </div>
    );
  }

  const completedCount = finalClips.filter(c => c.status === 'completed').length;
  const processingCount = finalClips.filter(c => c.status === 'processing').length;
  const failedCount = finalClips.filter(c => c.status === 'failed').length;
  const pendingCount = finalClips.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* 상태 요약 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white text-sm">{completedCount} 완료</span>
          </div>
          {processingCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-white text-sm">{processingCount} 생성중</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-white text-sm">{failedCount} 실패</span>
            </div>
          )}
        </div>

        {failedCount > 0 && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            실패 항목 재생성
          </button>
        )}
      </div>

      {/* 클립 목록 */}
      <div className="space-y-4">
        {scripts.map((script, index) => {
          const finalClip = finalClips[index];
          const videoClip = videoClips[index];
          const hasVideo = videoClip?.status === 'completed';
          const hasTTS = finalClip?.audioUrl;
          const hasSubtitle = finalClip?.subtitle;
          const isFailed = finalClip?.status === 'failed';
          const isProcessing = finalClip?.status === 'processing';
          const isPending = finalClip?.status === 'pending' || (!finalClip && hasVideo);

          return (
            <div
              key={index}
              className={`bg-white/5 border rounded-xl overflow-hidden ${
                isFailed ? 'border-red-500/30' : 'border-white/10'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* 비디오 썸네일 */}
                  <div className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden flex-shrink-0 relative">
                    {finalClip?.url || videoClip?.url ? (
                      <video
                        src={finalClip?.url || videoClip?.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <span className="text-white/40 font-bold">{index + 1}</span>
                      </div>
                    )}
                    
                    {/* 상태 오버레이 */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                      </div>
                    )}
                    {isFailed && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">Video {index + 1}</h4>
                      <span className="text-xs text-white/40">{script.duration}초</span>
                    </div>

                    {/* 내레이션 */}
                    <p className="text-white/70 text-sm line-clamp-2 mb-3">
                      "{script.narration}"
                    </p>

                    {/* 상태 배지 */}
                    <div className="flex flex-wrap gap-2">
                      {hasVideo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          <Check className="w-3 h-3" />
                          영상
                        </span>
                      )}
                      {hasTTS && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          <Volume2 className="w-3 h-3" />
                          음성
                        </span>
                      )}
                      {hasSubtitle && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          <FileText className="w-3 h-3" />
                          자막
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          생성중
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          대기중
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          실패
                        </span>
                      )}
                    </div>
                    
                    {/* 에러 메시지 */}
                    {isFailed && finalClip?.error && (
                      <p className="text-red-400/70 text-xs mt-2">
                        {finalClip.error}
                      </p>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-2">
                    {finalClip?.url && (
                      <a
                        href={finalClip.url}
                        download
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    )}
                    {finalClip?.audioUrl && (
                      <button
                        onClick={() => {
                          const audio = new Audio(finalClip.audioUrl);
                          if (audioPlayingIndex === index) {
                            audio.pause();
                            setAudioPlayingIndex(null);
                          } else {
                            audio.play();
                            setAudioPlayingIndex(index);
                            audio.onended = () => setAudioPlayingIndex(null);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          audioPlayingIndex === index 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title="음성 재생"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      {completedCount === scripts.length && (
        <div className="text-center py-4">
          <p className="text-green-400 font-medium">
            ✓ TTS 음성과 자막이 모두 생성되었습니다
          </p>
          <p className="text-purple-200 text-sm mt-1">
            다음 단계에서 모든 영상을 하나로 결합합니다
          </p>
        </div>
      )}

      {processingCount > 0 && (
        <div className="text-center py-4">
          <p className="text-blue-400 font-medium flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            TTS 음성을 생성 중입니다... ({completedCount}/{scripts.length})
          </p>
          <p className="text-purple-200 text-sm mt-1">
            🔄 페이지를 나가도 백그라운드에서 계속 진행됩니다
          </p>
        </div>
      )}
    </div>
  );
}
