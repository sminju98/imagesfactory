'use client';

import { useState } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { Play, Download, Copy, Check, Share2, Loader2, Film, RefreshCw } from 'lucide-react';

interface Step6ResultProps {
  project: ReelsProject;
  onRefresh?: () => void;
}

export default function Step6Result({ project, onRefresh }: Step6ResultProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const finalUrl = project.finalReelUrl;
  const finalClips = project.finalClips || [];
  const isReady = finalClips.length > 0 && finalClips.every(c => c.status === 'completed');

  // URL 복사
  const handleCopy = async () => {
    if (finalUrl) {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 최종 릴스가 없는 경우
  if (!finalUrl) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
          <Film className="w-10 h-10 text-white/40" />
        </div>
        <p className="text-white/60 mb-2">최종 릴스가 아직 생성되지 않았습니다.</p>
        
        {isReady ? (
          <>
            <p className="text-green-400 text-sm mb-4">
              ✓ 영상과 TTS가 모두 준비되었습니다!
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all flex items-center gap-2 mx-auto"
              >
                <Film className="w-5 h-5" />
                최종 릴스 결합 시작
              </button>
            )}
          </>
        ) : (
          <p className="text-purple-200 text-sm">
            영상과 TTS가 준비되면 결합할 수 있습니다.
          </p>
        )}
        
        {project.status === 'processing' && (
          <div className="mt-6 flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>영상 결합 중...</span>
          </div>
        )}

        {/* 준비된 클립 상태 표시 */}
        {finalClips.length > 0 && (
          <div className="mt-6 max-w-md mx-auto">
            <p className="text-sm text-white/60 mb-3">준비된 클립: {finalClips.filter(c => c.status === 'completed').length}/{finalClips.length}</p>
            <div className="flex justify-center gap-2">
              {finalClips.map((clip, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    clip.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : clip.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 성공 메시지 */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full mb-4">
          <Check className="w-5 h-5" />
          <span className="font-medium">릴스 제작 완료!</span>
        </div>
      </div>

      {/* 비디오 플레이어 */}
      <div className="max-w-md mx-auto">
        <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
          <video
            src={finalUrl}
            controls
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      </div>

      {/* 정보 */}
      <div className="max-w-md mx-auto grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{finalClips.length * 6}초</p>
          <p className="text-xs text-purple-300">영상 길이</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{finalClips.length}개</p>
          <p className="text-xs text-purple-300">클립 수</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{project.pointsUsed || 0}</p>
          <p className="text-xs text-purple-300">사용 크레딧</p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="max-w-md mx-auto flex gap-3">
        <a
          href={finalUrl}
          download="reels-video.mp4"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all"
        >
          <Download className="w-5 h-5" />
          다운로드
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>URL 복사</span>
            </>
          )}
        </button>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            title="다시 결합"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 프로젝트 요약 */}
      <div className="max-w-md mx-auto bg-white/5 rounded-xl p-4 space-y-3">
        <h4 className="font-medium text-purple-300 text-sm">프로젝트 요약</h4>
        
        <div>
          <p className="text-xs text-white/40 mb-1">프롬프트</p>
          <p className="text-white text-sm">{project.refinedPrompt || project.inputPrompt}</p>
        </div>

        {project.chosenConcept && (
          <div>
            <p className="text-xs text-white/40 mb-1">콘셉트</p>
            <p className="text-white text-sm">{project.chosenConcept.title}</p>
          </div>
        )}

        {project.options && (
          <div className="flex gap-2 flex-wrap">
            {project.options.target && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                타겟: {project.options.target}
              </span>
            )}
            {project.options.tone && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                톤: {project.options.tone}
              </span>
            )}
            {project.options.purpose && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                목적: {project.options.purpose}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 공유 안내 */}
      <div className="text-center">
        <p className="text-purple-200 text-sm">
          완성된 릴스를 다운로드하여 인스타그램, 틱톡 등에 업로드하세요!
        </p>
      </div>
    </div>
  );
}
