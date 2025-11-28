'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, FileText, Edit3, Film, Grid2X2, Layers } from 'lucide-react';
import { ConceptData, MessageData, ScriptData, ReelsScene, ComicPanel, CardNewsPage } from '@/types/content.types';

interface StepScriptProps {
  concept: ConceptData;
  message: MessageData;
  script: ScriptData | null;
  setScript: (script: ScriptData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function StepScript({
  concept,
  message,
  script,
  setScript,
  isLoading,
  setIsLoading,
  setError,
}: StepScriptProps) {
  const [activeTab, setActiveTab] = useState<'reels' | 'comic' | 'cardnews'>('reels');
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState<ScriptData | null>(null);

  // 자동 생성
  useEffect(() => {
    if (!script && concept && message) {
      generateScript();
    }
  }, [concept, message]);

  const generateScript = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, message }),
      });

      const data = await response.json();

      if (data.success) {
        setScript(data.data);
        setEditedScript(data.data);
      } else {
        setError(data.error || '대본 생성에 실패했습니다');
      }
    } catch (err) {
      setError('대본 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = () => {
    if (editedScript) {
      setScript(editedScript);
      setIsEditing(false);
    }
  };

  if (isLoading && !script) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">GPT가 대본을 작성하고 있어요...</p>
        <p className="text-sm text-gray-400 mt-1">릴스, 4컷 만화, 카드뉴스 스토리 생성 중</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            대본 / 시나리오 승인
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            각 콘텐츠 포맷의 스토리라인을 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={generateScript}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                재생성
              </button>
            </>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      {script && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <TabButton
            active={activeTab === 'reels'}
            onClick={() => setActiveTab('reels')}
            icon={<Film className="w-4 h-4" />}
            label="릴스/틱톡"
            count={10}
          />
          <TabButton
            active={activeTab === 'comic'}
            onClick={() => setActiveTab('comic')}
            icon={<Grid2X2 className="w-4 h-4" />}
            label="4컷 만화"
            count={4}
          />
          <TabButton
            active={activeTab === 'cardnews'}
            onClick={() => setActiveTab('cardnews')}
            icon={<Layers className="w-4 h-4" />}
            label="카드뉴스"
            count={5}
          />
        </div>
      )}

      {/* 탭 컨텐츠 */}
      {script && !isEditing && (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-100">
          {activeTab === 'reels' && (
            <ReelsScriptView scenes={script.reelsStory} />
          )}
          {activeTab === 'comic' && (
            <ComicScriptView panels={script.comicStory} />
          )}
          {activeTab === 'cardnews' && (
            <CardNewsScriptView pages={script.cardNewsFlow} />
          )}
        </div>
      )}

      {/* 편집 모드 */}
      {script && isEditing && editedScript && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">✏️ 대본 수정</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedScript(script);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                저장
              </button>
            </div>
          </div>

          {/* 편집 UI - 간소화 버전 */}
          <div className="text-sm text-gray-500">
            대본 편집 기능은 추후 상세 구현 예정입니다.
          </div>
        </div>
      )}
    </div>
  );
}

// 탭 버튼
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active
          ? 'bg-white shadow-sm text-orange-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        active ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
      }`}>
        {count}
      </span>
    </button>
  );
}

// 릴스 스크립트 뷰
function ReelsScriptView({ scenes }: { scenes: ReelsScene[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 mb-4">🎬 릴스/틱톡 컷씬 (10개)</h4>
      <div className="grid gap-3">
        {scenes.map((scene) => (
          <div key={scene.order} className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {scene.order}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{scene.description}</p>
                <p className="text-sm text-gray-600 mt-1 italic">"{scene.caption}"</p>
                <span className="text-xs text-gray-400 mt-2 inline-block">{scene.duration}초</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4컷 만화 스크립트 뷰
function ComicScriptView({ panels }: { panels: ComicPanel[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 mb-4">📖 4컷 만화 스토리</h4>
      <div className="grid grid-cols-2 gap-4">
        {panels.map((panel) => (
          <div key={panel.order} className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="text-center mb-2">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
                {panel.order}컷
              </span>
            </div>
            <p className="text-gray-900 text-sm">{panel.description}</p>
            <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm text-gray-700">💬 "{panel.dialogue}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 카드뉴스 스크립트 뷰
function CardNewsScriptView({ pages }: { pages: CardNewsPage[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 mb-4">📱 카드뉴스 흐름 (5장)</h4>
      <div className="space-y-3">
        {pages.map((page) => (
          <div key={page.order} className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {page.order}
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{page.title}</h5>
                <p className="text-sm text-gray-600 mt-1">{page.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

