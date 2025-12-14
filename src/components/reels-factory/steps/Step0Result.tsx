'use client';

import { useState } from 'react';
import { ReelsProject } from '@/types/reels.types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Sparkles, Target, MessageSquare, Goal, Image as ImageIcon, Edit3, Save, Loader2, Check } from 'lucide-react';

interface Step0ResultProps {
  project: ReelsProject;
}

export default function Step0Result({ project }: Step0ResultProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // 수정 가능한 필드들
  const [editedPrompt, setEditedPrompt] = useState(project.refinedPrompt || '');
  const [editedOptions, setEditedOptions] = useState({
    target: project.options?.target || '',
    tone: project.options?.tone || '',
    purpose: project.options?.purpose || '',
  });

  // 저장 핸들러
  const handleSave = async () => {
    setSaving(true);
    try {
      const projectRef = doc(db, 'reelsProjects', project.id);
      await updateDoc(projectRef, {
        refinedPrompt: editedPrompt,
        options: editedOptions,
        updatedAt: new Date(),
      });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setEditedPrompt(project.refinedPrompt || '');
    setEditedOptions({
      target: project.options?.target || '',
      tone: project.options?.tone || '',
      purpose: project.options?.purpose || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* 수정/저장 버튼 */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white rounded-lg text-sm transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            수정
          </button>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <Check className="w-4 h-4" />
            저장됨
          </span>
        )}
      </div>

      {/* 원본 프롬프트 */}
      <div className="bg-white/5 rounded-xl p-5">
        <h3 className="text-sm font-medium text-purple-300 mb-2">원본 프롬프트</h3>
        <p className="text-white/80">{project.inputPrompt || '입력된 프롬프트가 없습니다.'}</p>
      </div>

      {/* 교정된 프롬프트 */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-purple-300">AI 교정 프롬프트</h3>
        </div>
        {isEditing ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            placeholder="교정된 프롬프트를 입력하세요..."
            className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        ) : (
          <p className="text-white leading-relaxed">{project.refinedPrompt || '아직 교정된 프롬프트가 없습니다.'}</p>
        )}
      </div>

      {/* 옵션 정보 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">타겟</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedOptions.target}
              onChange={(e) => setEditedOptions({ ...editedOptions, target: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
              placeholder="예: 20-30대 여성"
            />
          ) : (
            <p className="text-white">{project.options?.target || '-'}</p>
          )}
        </div>
        
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">톤앤매너</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedOptions.tone}
              onChange={(e) => setEditedOptions({ ...editedOptions, tone: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
              placeholder="예: 친근하고 유머러스"
            />
          ) : (
            <p className="text-white">{project.options?.tone || '-'}</p>
          )}
        </div>
        
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Goal className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">목적</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedOptions.purpose}
              onChange={(e) => setEditedOptions({ ...editedOptions, purpose: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
              placeholder="예: 제품 홍보"
            />
          ) : (
            <p className="text-white">{project.options?.purpose || '-'}</p>
          )}
        </div>
      </div>

      {/* 업로드된 이미지 */}
      {project.uploadedImages && project.uploadedImages.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-purple-300">참고 이미지</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {project.uploadedImages.map((img, index) => (
              <img
                key={index}
                src={img.url || img.thumbnailUrl}
                alt={`uploaded-${index}`}
                className="w-24 h-24 object-cover rounded-xl border border-white/20"
              />
            ))}
          </div>
        </div>
      )}

      {/* 완료 메시지 */}
      {project.refinedPrompt && !isEditing && (
        <div className="text-center py-4">
          <p className="text-green-400 font-medium">
            ✓ 프롬프트 교정이 완료되었습니다
          </p>
          <p className="text-purple-200 text-sm mt-1">
            다음 단계에서 AI가 트렌드를 리서치합니다
          </p>
        </div>
      )}
    </div>
  );
}

