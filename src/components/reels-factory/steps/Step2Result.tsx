'use client';

import { useState } from 'react';
import { ReelsProject, Concept } from '@/types/reels.types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Check, Sparkles, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';

interface Step2ResultProps {
  project: ReelsProject;
  onRefresh: () => void;
}

export default function Step2Result({ project, onRefresh }: Step2ResultProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    project.chosenConcept?.id || null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const concepts = project.concepts || [];

  // 콘셉트 선택 + 자동 저장
  const handleSelect = async (concept: Concept) => {
    setSelectedId(concept.id);
    
    // 자동 저장
    setSaving(true);
    try {
      const projectRef = doc(db, 'reelsProjects', project.id);
      await updateDoc(projectRef, {
        chosenConcept: concept,
        updatedAt: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      console.error('자동 저장 오류:', error);
    } finally {
      setSaving(false);
    }
  };

  if (concepts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">아직 콘셉트가 생성되지 않았습니다.</p>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          콘셉트 생성
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 - 자동 저장 표시 */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-white">마음에 드는 콘셉트를 선택하세요</span>
          </div>
          <p className="text-white/50 text-sm mt-1">선택 시 자동 저장됩니다</p>
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

      {/* 콘셉트 카드들 */}
      <div className="grid gap-4">
        {concepts.map((concept, index) => {
          const isSelected = selectedId === concept.id;

          return (
            <div
              key={concept.id}
              onClick={() => handleSelect(concept)}
              className={`
                relative p-6 rounded-2xl cursor-pointer transition-all
                ${isSelected
                  ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {/* 선택 표시 */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              {/* 번호 & 제목 */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                  ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60'}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1 pr-10">
                  <h3 className="text-lg font-bold text-white mb-1">{concept.title}</h3>
                  <p className="text-purple-200 text-sm">{concept.summary}</p>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-3 pl-14">
                {/* Hook */}
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-yellow-400">🪝 HOOK</span>
                  </div>
                  <p className="text-white text-sm">"{concept.hook}"</p>
                </div>

                {/* Flow */}
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">FLOW</span>
                  </div>
                  <p className="text-white/80 text-sm">{concept.flow}</p>
                </div>

                {/* CTA */}
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium text-green-400">CTA</span>
                  </div>
                  <p className="text-white text-sm">"{concept.cta}"</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택 완료 메시지 */}
      {selectedId && !saving && (
        <div className="text-center py-4">
          <p className="text-green-400 font-medium">
            ✓ 콘셉트가 선택 및 저장되었습니다
          </p>
          <p className="text-purple-200 text-sm mt-1">
            바로 다음 단계로 진행할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}

