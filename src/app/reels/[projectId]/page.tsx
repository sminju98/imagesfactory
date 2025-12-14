'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ReelsProject } from '@/types/reels.types';
import Link from 'next/link';
import StepProgressBar from '@/components/reels-factory/StepProgressBar';
import {
  Loader2,
  Download,
  Share2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Edit3,
  Film,
  FileText,
  Lightbulb,
  Search,
  Mic,
  Layers,
} from 'lucide-react';

const STEP_INFO = [
  { id: 0, name: '입력 & 교정', icon: Edit3, color: 'from-blue-500 to-cyan-500' },
  { id: 1, name: '리서치', icon: Search, color: 'from-green-500 to-emerald-500' },
  { id: 2, name: '콘셉트', icon: Lightbulb, color: 'from-yellow-500 to-orange-500' },
  { id: 3, name: '대본', icon: FileText, color: 'from-purple-500 to-violet-500' },
  { id: 4, name: '영상 생성', icon: Film, color: 'from-pink-500 to-rose-500' },
  { id: 5, name: 'TTS & 자막', icon: Mic, color: 'from-indigo-500 to-blue-500' },
  { id: 6, name: '최종 결합', icon: Layers, color: 'from-red-500 to-pink-500' },
];

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const [project, setProject] = useState<ReelsProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'reelsProjects', projectId);
    const unsubscribe = onSnapshot(
      projectRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setProject({
            id: snapshot.id,
            ...snapshot.data(),
          } as ReelsProject);
        } else {
          setProject(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('프로젝트 로드 오류:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  const handleCopyUrl = async () => {
    if (project?.finalReelUrl) {
      await navigator.clipboard.writeText(project.finalReelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="mt-4 text-purple-200">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">프로젝트를 찾을 수 없습니다.</p>
          <Link
            href="/reels"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 진행 바 */}
      <StepProgressBar currentStep={project.currentStep} projectId={project.id} />

      {/* 최종 결과 (완료된 경우) */}
      {project.status === 'completed' && project.finalReelUrl && (
        <div className="mt-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">🎉 릴스 완성!</h2>
              <p className="text-sm text-purple-200">다운로드하거나 공유하세요</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 비디오 플레이어 */}
            <div className="aspect-[9/16] max-h-[500px] bg-black rounded-xl overflow-hidden">
              <video
                src={project.finalReelUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* 정보 & 액션 */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-sm font-medium text-purple-300 mb-2">프롬프트</h3>
                <p className="text-white">{project.refinedPrompt || project.inputPrompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{project.pointsUsed || 0}</p>
                  <p className="text-sm text-purple-300">사용 포인트</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">40초</p>
                  <p className="text-sm text-purple-300">영상 길이</p>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={project.finalReelUrl}
                  download
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all"
                >
                  <Download className="w-5 h-5" />
                  다운로드
                </a>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 진행 중인 경우 - 현재 단계로 이동 버튼 */}
      {project.status !== 'completed' && project.status !== 'failed' && (
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {STEP_INFO[project.currentStep]?.name || '진행 중'}
          </h2>
          <p className="text-purple-200 mb-6">
            현재 Step {project.currentStep + 1}/7 단계입니다.
          </p>
          <Link
            href={`/reels/${project.id}/step/${project.currentStep}`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all"
          >
            이어서 작업하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* 단계별 결과 카드 */}
      <div className="mt-8 grid gap-4">
        <h3 className="text-lg font-semibold text-white">단계별 결과</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEP_INFO.map((step) => {
            const isCompleted = step.id < project.currentStep;
            const isCurrent = step.id === project.currentStep;
            const isLocked = step.id > project.currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`
                  relative bg-white/5 border rounded-xl p-5 transition-all
                  ${isCompleted ? 'border-green-500/30 hover:bg-white/10' : ''}
                  ${isCurrent ? 'border-purple-500/50 ring-2 ring-purple-500/30' : ''}
                  ${isLocked ? 'border-white/5 opacity-50' : ''}
                `}
              >
                {/* 아이콘 */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  ${isCompleted || isCurrent
                    ? `bg-gradient-to-br ${step.color}`
                    : 'bg-white/10'
                  }
                `}>
                  <Icon className={`w-6 h-6 ${isCompleted || isCurrent ? 'text-white' : 'text-white/40'}`} />
                </div>

                {/* 제목 & 상태 */}
                <h4 className={`font-medium mb-1 ${isLocked ? 'text-white/40' : 'text-white'}`}>
                  Step {step.id + 1}: {step.name}
                </h4>
                <p className="text-sm text-purple-300/70 mb-3">
                  {isCompleted ? '완료됨' : isCurrent ? '진행 중' : '대기 중'}
                </p>

                {/* 액션 버튼 */}
                {(isCompleted || isCurrent) && (
                  <Link
                    href={`/reels/${project.id}/step/${step.id}`}
                    className={`
                      inline-flex items-center gap-1 text-sm font-medium
                      ${isCompleted ? 'text-green-400 hover:text-green-300' : 'text-purple-400 hover:text-purple-300'}
                    `}
                  >
                    {isCurrent ? '작업하기' : '결과 보기'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {/* 완료 체크 */}
                {isCompleted && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 프로젝트 정보 */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">프로젝트 정보</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-purple-300">생성일</p>
            <p className="text-white font-medium">{formatDate(project.createdAt)}</p>
          </div>
          <div>
            <p className="text-purple-300">최근 수정</p>
            <p className="text-white font-medium">{formatDate(project.updatedAt)}</p>
          </div>
          <div>
            <p className="text-purple-300">상태</p>
            <p className={`font-medium ${
              project.status === 'completed' ? 'text-green-400' :
              project.status === 'failed' ? 'text-red-400' :
              project.status === 'processing' ? 'text-blue-400' : 'text-yellow-400'
            }`}>
              {project.status === 'completed' ? '완료' :
               project.status === 'failed' ? '실패' :
               project.status === 'processing' ? '처리 중' : '진행 중'}
            </p>
          </div>
          <div>
            <p className="text-purple-300">사용 포인트</p>
            <p className="text-white font-medium">{project.pointsUsed || 0} pt</p>
          </div>
        </div>
      </div>
    </div>
  );
}

