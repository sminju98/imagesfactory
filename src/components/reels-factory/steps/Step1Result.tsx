'use client';

import { useState, useEffect, useRef } from 'react';
import { ReelsProject, ResearchResult } from '@/types/reels.types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Check, TrendingUp, AlertCircle, Hash, MessageCircle, Zap, Loader2, Save } from 'lucide-react';

interface Step1ResultProps {
  project: ReelsProject;
  onRefresh: () => void;
}

const CATEGORY_INFO: Record<string, { icon: any; label: string; color: string }> = {
  keyword: { icon: Hash, label: '키워드', color: 'text-blue-400' },
  painpoint: { icon: AlertCircle, label: '페인포인트', color: 'text-red-400' },
  trend: { icon: TrendingUp, label: '트렌드', color: 'text-green-400' },
  usp: { icon: Zap, label: 'USP', color: 'text-yellow-400' },
  expression: { icon: MessageCircle, label: '표현', color: 'text-purple-400' },
  general: { icon: Hash, label: '일반', color: 'text-gray-400' },
};

export default function Step1Result({ project, onRefresh }: Step1ResultProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(project.selectedInsights || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const results = project.researchResults || [];

  // 인사이트 선택/해제 + 자동 저장
  const toggleInsight = async (id: string) => {
    const newSelectedIds = selectedIds.includes(id) 
      ? selectedIds.filter(i => i !== id) 
      : [...selectedIds, id];
    
    setSelectedIds(newSelectedIds);
    
    // 디바운스된 자동 저장 (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newSelectedIds);
    }, 500);
  };

  // 자동 저장
  const autoSave = async (ids: string[]) => {
    setSaving(true);
    try {
      const projectRef = doc(db, 'reelsProjects', project.id);
      await updateDoc(projectRef, {
        selectedInsights: ids,
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

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 카테고리별로 그룹화
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(result);
    return acc;
  }, {} as Record<string, ResearchResult[]>);

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">아직 리서치 결과가 없습니다.</p>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          리서치 시작
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 선택 상태 & 자동 저장 표시 */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
        <div>
          <p className="text-white font-medium">
            {selectedIds.length}개 인사이트 선택됨
          </p>
          <p className="text-white/50 text-sm">체크박스 선택 시 자동 저장됩니다</p>
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

      {/* 카테고리별 결과 */}
      {Object.entries(groupedResults).map(([category, items]) => {
        const info = CATEGORY_INFO[category] || CATEGORY_INFO.general;
        const Icon = info.icon;

        return (
          <div key={category} className="bg-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`w-5 h-5 ${info.color}`} />
              <h3 className={`font-medium ${info.color}`}>{info.label}</h3>
              <span className="text-white/40 text-sm">({items.length})</span>
            </div>

            <div className="space-y-2">
              {items.map((result) => {
                const isSelected = selectedIds.includes(result.id);
                
                return (
                  <div
                    key={result.id}
                    onClick={() => toggleInsight(result.id)}
                    className={`
                      p-4 rounded-lg cursor-pointer transition-all
                      ${isSelected 
                        ? 'bg-purple-500/30 border border-purple-500/50' 
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected 
                          ? 'bg-purple-500 border-purple-500' 
                          : 'border-white/30'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{result.content}</p>
                        {result.source && (
                          <p className="text-white/40 text-sm mt-1">출처: {result.source}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 안내 메시지 */}
      <div className="text-center py-4">
        <p className="text-purple-200 text-sm">
          릴스에 반영하고 싶은 인사이트를 선택하세요.
          <br />
          선택한 인사이트를 바탕으로 콘셉트가 생성됩니다.
        </p>
      </div>
    </div>
  );
}

