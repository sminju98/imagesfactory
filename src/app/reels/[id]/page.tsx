'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ReelsProject } from '@/types/reels.types';

interface ReelsResultPageProps {
  params: Promise<{ id: string }>;
}

export default function ReelsResultPage({ params }: ReelsResultPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ReelsProject | null>(null);

  // 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 프로젝트 데이터 실시간 조회
  useEffect(() => {
    if (!projectId || !user) return;

    const projectRef = doc(db, 'reelsProjects', projectId);
    const unsubscribe = onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProject({
          id: snapshot.id,
          ...data,
        } as ReelsProject);
      } else {
        setProject(null);
      }
    });

    return () => unsubscribe();
  }, [projectId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">프로젝트를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/reels')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            새 프로젝트 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/reels')}
            className="text-indigo-600 hover:text-indigo-700 mb-4"
          >
            ← 뒤로 가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Reels 프로젝트 결과</h1>
          <p className="text-gray-600 mt-2">프로젝트 ID: {project.id}</p>
        </div>

        {/* 진행 단계 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">진행 상황</h2>
          <div className="flex items-center justify-between">
            {[0, 1, 2, 3, 4, 5, 6].map((step) => {
              const stepNames = ['프롬프트 교정', '리서치', '콘셉트', '대본', '영상 생성', 'TTS+자막', '결합'];
              const isCompleted = step < project.currentStep;
              const isCurrent = step === project.currentStep;
              const stepResult = project.stepResults?.[`step${step}`] || project.stepResults?.[`step${step}_video0`];
              
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                      title={stepNames[step]}
                    >
                      {isCompleted ? '✓' : step + 1}
                    </div>
                    <span className="text-xs mt-1 text-gray-600 text-center">
                      {stepNames[step]}
                    </span>
                    {stepResult && (
                      <span className="text-xs text-green-600 mt-1">
                        {stepResult.pointsUsed}pt
                      </span>
                    )}
                  </div>
                  {step < 6 && (
                    <div
                      className={`flex-1 h-1 mx-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              현재 단계: {project.currentStep + 1}/7
            </span>
            {project.status !== 'completed' && project.status !== 'failed' && (
              <button
                onClick={() => router.push(`/reels?projectId=${project.id}`)}
                className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                이어서 작업하기
              </button>
            )}
          </div>
        </div>

        {/* 프로젝트 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold mb-4">프롬프트</h3>
            <p className="text-gray-700 mb-2">{project.inputPrompt}</p>
            {project.refinedPrompt && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm font-semibold text-indigo-900 mb-1">교정된 프롬프트:</p>
                <p className="text-sm text-gray-800">{project.refinedPrompt}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold mb-4">옵션</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">타겟:</span> {project.options?.target || '-'}</p>
              <p><span className="font-semibold">톤앤매너:</span> {project.options?.tone || '-'}</p>
              <p><span className="font-semibold">목적:</span> {project.options?.purpose || '-'}</p>
            </div>
          </div>
        </div>

        {/* 콘셉트 */}
        {project.chosenConcept && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-bold mb-4">선택된 콘셉트</h3>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">{project.chosenConcept.title}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>Hook:</strong> {project.chosenConcept.hook}</p>
              <p className="text-sm text-gray-700 mb-2"><strong>Flow:</strong> {project.chosenConcept.flow}</p>
              <p className="text-sm text-gray-700"><strong>CTA:</strong> {project.chosenConcept.cta}</p>
            </div>
          </div>
        )}

        {/* 대본 */}
        {project.videoScripts && project.videoScripts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-bold mb-4">대본</h3>
            <div className="space-y-4">
              {project.videoScripts.map((script, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Video {index + 1} ({script.duration}초)</h4>
                  <p className="text-gray-700 mb-2">"{script.narration}"</p>
                  <div className="text-sm text-gray-600">
                    {script.shots?.length || 0}개 샷
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 영상 클립 */}
        {project.videoClips && project.videoClips.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-bold mb-4">생성된 영상</h3>
            <div className="grid grid-cols-5 gap-4">
              {project.videoClips.map((clip, index) => (
                <div key={index} className="text-center">
                  <div className="mb-2 font-semibold">Video {index + 1}</div>
                  {clip.status === 'completed' && clip.url ? (
                    <video src={clip.url} controls className="w-full rounded" />
                  ) : clip.status === 'processing' ? (
                    <div className="py-8 bg-gray-100 rounded">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-xs text-gray-600">생성 중...</p>
                    </div>
                  ) : (
                    <div className="py-8 bg-gray-100 rounded text-gray-400">
                      대기 중
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최종 릴스 */}
        {project.finalReelUrl && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-bold mb-4 text-2xl">🎉 최종 릴스</h3>
            <div className="text-center">
              <video
                src={project.finalReelUrl}
                controls
                className="w-full max-w-md mx-auto rounded-lg mb-4"
              />
              <div className="flex gap-4 justify-center">
                <a
                  href={project.finalReelUrl}
                  download
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  다운로드
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(project.finalReelUrl)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  URL 복사
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상태 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold mb-4">상태 정보</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">상태:</span>{' '}
              <span className={
                project.status === 'completed' ? 'text-green-600' :
                project.status === 'processing' ? 'text-blue-600' :
                project.status === 'failed' ? 'text-red-600' : 'text-gray-600'
              }>
                {project.status === 'completed' ? '완료' :
                 project.status === 'processing' ? '진행 중' :
                 project.status === 'failed' ? '실패' : '초안'}
              </span>
            </div>
            <div>
              <span className="font-semibold">사용 포인트:</span> {project.pointsUsed || 0}pt
            </div>
            <div>
              <span className="font-semibold">생성일:</span>{' '}
              {project.createdAt?.toDate?.()?.toLocaleString('ko-KR') || '-'}
            </div>
            <div>
              <span className="font-semibold">수정일:</span>{' '}
              {project.updatedAt?.toDate?.()?.toLocaleString('ko-KR') || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

