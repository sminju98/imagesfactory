'use client';

import { useState, useRef } from 'react';
import { ReelsProject, VideoScript } from '@/types/reels.types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Check, Clock, Film, Edit3, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Step3ResultProps {
  project: ReelsProject;
  onRefresh: () => void;
}

export default function Step3Result({ project, onRefresh }: Step3ResultProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedNarration, setEditedNarration] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localScripts, setLocalScripts] = useState<VideoScript[]>(project.videoScripts || []);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scripts = localScripts.length > 0 ? localScripts : (project.videoScripts || []);

  // 내레이션 수정 시작
  const startEditing = (index: number, narration: string) => {
    setEditingIndex(index);
    setEditedNarration(narration);
  };

  // 내레이션 로컬 업데이트 + 자동 저장
  const updateNarrationLocal = async (index: number) => {
    if (!editedNarration.trim()) return;

    const updatedScripts = [...scripts];
    updatedScripts[index] = {
      ...updatedScripts[index],
      narration: editedNarration,
    };
    setLocalScripts(updatedScripts);
    setEditingIndex(null);
    
    // 자동 저장
    await autoSave(updatedScripts);
  };

  // 승인 토글 + 자동 저장
  const toggleApprovalLocal = async (index: number) => {
    const updatedScripts = [...scripts];
    updatedScripts[index] = {
      ...updatedScripts[index],
      approved: !updatedScripts[index].approved,
    };
    setLocalScripts(updatedScripts);
    
    // 자동 저장
    await autoSave(updatedScripts);
  };

  // 자동 저장
  const autoSave = async (scriptsToSave: VideoScript[]) => {
    // 디바운스
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const projectRef = doc(db, 'reelsProjects', project.id);
        await updateDoc(projectRef, {
          videoScripts: scriptsToSave,
          updatedAt: new Date(),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch (error) {
        console.error('자동 저장 오류:', error);
      } finally {
        setSaving(false);
      }
    }, 300);
  };

  if (scripts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">아직 대본이 생성되지 않았습니다.</p>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          대본 생성
        </button>
      </div>
    );
  }

  const approvedCount = scripts.filter(s => s.approved).length;
  const allApproved = approvedCount === scripts.length;

  return (
    <div className="space-y-6">
      {/* 상단 - 승인 상태 & 자동 저장 표시 */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
        <div>
          <p className="text-white font-medium">
            {approvedCount} / {scripts.length} 대본 승인됨
          </p>
          <div className="flex items-center gap-2 text-sm text-purple-300 mt-1">
            <Clock className="w-4 h-4" />
            <span>총 {scripts.length * 8}초 (8초 × {scripts.length}개)</span>
          </div>
          <p className="text-white/50 text-xs mt-1">승인/수정 시 자동 저장됩니다</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-purple-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              저장됨
            </span>
          )}
        </div>
      </div>

      {/* 대본 목록 */}
      <div className="space-y-4">
        {scripts.map((script, index) => {
          const isExpanded = expandedIndex === index;
          const isEditing = editingIndex === index;

          return (
            <div
              key={index}
              className={`
                bg-white/5 border rounded-xl overflow-hidden transition-all
                ${script.approved ? 'border-green-500/30' : 'border-white/10'}
              `}
            >
              {/* 헤더 */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${script.approved 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 text-white/60'
                    }
                  `}>
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Video {index + 1}</h4>
                    <p className="text-sm text-purple-300">{script.duration}초 · {script.shots?.length || 0}개 샷</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {script.approved && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      승인됨
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </div>
              </div>

              {/* 상세 내용 */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* 내레이션 */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-300">내레이션</span>
                      {!isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(index, script.narration);
                          }}
                          className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          수정
                        </button>
                      )}
                    </div>

                      {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedNarration}
                          onChange={(e) => setEditedNarration(e.target.value)}
                          className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                          onClick={(e) => e.stopPropagation()}
                          placeholder="내레이션을 입력하세요"
                          title="내레이션 수정"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateNarrationLocal(index);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            확인
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingIndex(null);
                            }}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/90 leading-relaxed">"{script.narration}"</p>
                    )}
                  </div>

                  {/* 샷 리스트 */}
                  {script.shots && script.shots.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-purple-300">샷 리스트</span>
                      {script.shots.map((shot, shotIndex) => (
                        <div key={shotIndex} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/40">Shot {shotIndex + 1}</span>
                            <span className="text-xs text-white/40">{shot.duration}초</span>
                          </div>
                          <p className="text-white/80 text-sm">{shot.description}</p>
                          {shot.visualPrompt && (
                            <p className="text-white/50 text-xs mt-1 font-mono">
                              {shot.visualPrompt.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 승인 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleApprovalLocal(index);
                    }}
                    className={`
                      w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                      ${script.approved
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }
                    `}
                  >
                    <Check className="w-4 h-4" />
                    {script.approved ? '승인됨 (클릭하여 취소)' : '이 대본 승인'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      <div className="text-center py-4">
        <p className="text-purple-200 text-sm">
          각 대본을 확인하고 필요시 수정한 후 승인하세요.
          <br />
          승인 및 수정 시 자동 저장되며, 바로 다음 단계로 진행할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

