'use client';

import { useState } from 'react';
import { ReelsProject, VideoClip } from '@/types/reels.types';
import { Play, Loader2, AlertCircle, Download, RefreshCw, Check } from 'lucide-react';

interface Step4ResultProps {
  project: ReelsProject;
  onRefresh: () => void;
}

export default function Step4Result({ project, onRefresh }: Step4ResultProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const clips = project.videoClips || [];
  const scripts = project.videoScripts || [];

  // 영상이 없으면 생성 시작 버튼
  if (clips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">아직 영상이 생성되지 않았습니다.</p>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          영상 생성 시작
        </button>
      </div>
    );
  }

  const completedCount = clips.filter(c => c.status === 'completed').length;
  const processingCount = clips.filter(c => c.status === 'processing').length;
  const failedCount = clips.filter(c => c.status === 'failed').length;

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
            실패 영상 재생성
          </button>
        )}
      </div>

      {/* 영상 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {clips.map((clip, index) => {
          const script = scripts[index];
          
          return (
            <div
              key={index}
              className={`
                relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all
                ${clip.status === 'completed' 
                  ? 'border-green-500/30 bg-black' 
                  : clip.status === 'failed'
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-white/10 bg-white/5'
                }
              `}
            >
              {/* 비디오 또는 플레이스홀더 */}
              {clip.status === 'completed' && clip.url ? (
                <>
                  <video
                    src={clip.url}
                    className="w-full h-full object-cover"
                    controls={playingIndex === index}
                    onPlay={() => setPlayingIndex(index)}
                    onPause={() => setPlayingIndex(null)}
                  />
                  
                  {/* 재생 오버레이 */}
                  {playingIndex !== index && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                      onClick={() => {
                        const video = document.querySelector(`video[src="${clip.url}"]`) as HTMLVideoElement;
                        if (video) video.play();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  )}
                </>
              ) : clip.status === 'processing' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  <p className="text-blue-400 text-xs mt-2">생성중...</p>
                </div>
              ) : clip.status === 'failed' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <p className="text-red-400 text-xs mt-2 text-center">실패</p>
                  {clip.error && (
                    <p className="text-red-400/60 text-xs mt-1 text-center line-clamp-2">
                      {clip.error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 font-bold">{index + 1}</span>
                  </div>
                </div>
              )}

              {/* 인덱스 배지 */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                Video {index + 1}
              </div>

              {/* 완료 체크 */}
              {clip.status === 'completed' && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* 다운로드 버튼 */}
              {clip.status === 'completed' && clip.url && (
                <a
                  href={clip.url}
                  download
                  title="영상 다운로드"
                  className="absolute bottom-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded hover:bg-black/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-4 h-4 text-white" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* 내레이션 정보 */}
      {scripts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-purple-300">영상별 내레이션</h4>
          {scripts.map((script, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">Video {index + 1}</span>
                <span className="text-xs text-white/40">{script.duration}초</span>
              </div>
              <p className="text-white/80 text-sm line-clamp-2">"{script.narration}"</p>
            </div>
          ))}
        </div>
      )}

      {/* 안내 메시지 */}
      {completedCount === clips.length && (
        <div className="text-center py-4">
          <p className="text-green-400 font-medium">
            ✓ 모든 영상이 생성되었습니다
          </p>
          <p className="text-purple-200 text-sm mt-1">
            다음 단계에서 TTS 음성과 자막을 추가합니다
          </p>
        </div>
      )}

      {processingCount > 0 && (
        <div className="text-center py-4">
          <p className="text-blue-400 font-medium">
            영상을 생성 중입니다...
          </p>
          <p className="text-purple-200 text-sm mt-1">
            AI 영상 생성에는 몇 분 정도 소요될 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}

