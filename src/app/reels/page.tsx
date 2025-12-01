'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { ReelsProject } from '@/types/reels.types';
import Step0Modal from '@/components/reels-factory/Step0Modal';
import Step1Modal from '@/components/reels-factory/Step1Modal';
import Step2Modal from '@/components/reels-factory/Step2Modal';
import Step3Modal from '@/components/reels-factory/Step3Modal';
import Step4Modal from '@/components/reels-factory/Step4Modal';
import Step5Modal from '@/components/reels-factory/Step5Modal';
import Step6Modal from '@/components/reels-factory/Step6Modal';

export default function ReelsFactoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ReelsProject | null>(null);
  const [projects, setProjects] = useState<ReelsProject[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);

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

  // 사용자의 최근 프로젝트 불러오기
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      try {
        // URL 파라미터에서 projectId 확인
        const projectIdFromUrl = searchParams?.get('projectId');
        
        if (projectIdFromUrl) {
          // 특정 프로젝트 로드
          const projectDoc = await getDoc(doc(db, 'reelsProjects', projectIdFromUrl));
          if (projectDoc.exists() && projectDoc.data().userId === user.uid) {
            const projectData = {
              id: projectDoc.id,
              ...projectDoc.data(),
            } as ReelsProject;
            setProject(projectData);
            setCurrentStep(projectData.currentStep || 0);
            setIsStepModalOpen(true);
          }
        }

        // 최근 프로젝트 목록 로드
        const projectsRef = collection(db, 'reelsProjects');
        const q = query(
          projectsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const projectsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ReelsProject[];
        
        setProjects(projectsList);
        
        // URL 파라미터가 없고, 가장 최근 프로젝트가 진행 중이면 자동 선택
        if (!projectIdFromUrl && projectsList.length > 0) {
          const latest = projectsList[0];
          if (latest.status !== 'completed' && latest.status !== 'failed') {
            setProject(latest);
            setCurrentStep(latest.currentStep || 0);
          }
        }
      } catch (error) {
        console.error('프로젝트 로드 오류:', error);
      }
    };

    loadProjects();
  }, [user, searchParams]);

  // 프로젝트가 있으면 현재 단계로 모달 열기
  useEffect(() => {
    if (project && project.currentStep !== undefined && project.status !== 'completed') {
      setCurrentStep(project.currentStep);
    }
  }, [project]);

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

  if (!user) {
    return null;
  }

  const handleStepComplete = (step: number, data: any) => {
    // 프로젝트 상태 업데이트
    if (project) {
      setProject({
        ...project,
        ...data,
        currentStep: step + 1,
      });
    }
  };

  const renderStepModal = () => {
    if (!project) return null;

    switch (currentStep) {
      case 0:
        return (
          <Step0Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(0, data)}
          />
        );
      case 1:
        return (
          <Step1Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(1, data)}
          />
        );
      case 2:
        return (
          <Step2Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(2, data)}
          />
        );
      case 3:
        return (
          <Step3Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(3, data)}
          />
        );
      case 4:
        return (
          <Step4Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(4, data)}
          />
        );
      case 5:
        return (
          <Step5Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(5, data)}
          />
        );
      case 6:
        return (
          <Step6Modal
            open={isStepModalOpen}
            onClose={() => setIsStepModalOpen(false)}
            project={project}
            onComplete={(data) => handleStepComplete(6, data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 Reels Factory
          </h1>
          <p className="text-gray-600">
            이미지와 프롬프트만으로 40초 릴스를 자동 제작하세요
          </p>
        </div>

        {/* 진행 단계 표시 */}
        {project && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {[0, 1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step < project.currentStep
                        ? 'bg-green-500 text-white'
                        : step === project.currentStep
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < project.currentStep ? '✓' : step + 1}
                  </div>
                  {step < 6 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step < project.currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>입력</span>
              <span>리서치</span>
              <span>콘셉트</span>
              <span>대본</span>
              <span>영상</span>
              <span>음성</span>
              <span>완성</span>
            </div>
          </div>
        )}

        {/* 이전 프로젝트 목록 */}
        {projects.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">이전 프로젝트</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 6).map((p) => {
                  const stepNames = ['입력', '리서치', '콘셉트', '대본', '영상', 'TTS', '완성'];
                  const isActive = project?.id === p.id;
                  
                  return (
                    <div
                      key={p.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setProject(p);
                        setCurrentStep(p.currentStep || 0);
                        setIsStepModalOpen(true);
                        router.push(`/reels?projectId=${p.id}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">
                          {p.inputPrompt?.substring(0, 30)}...
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          p.status === 'completed' ? 'bg-green-100 text-green-700' :
                          p.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {p.status === 'completed' ? '완료' :
                           p.status === 'failed' ? '실패' : '진행중'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        단계: {stepNames[p.currentStep || 0]} ({p.currentStep || 0}/7)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {p.createdAt?.toDate?.()?.toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 시작 버튼 또는 프로젝트 상태 */}
        {!project ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">새로운 릴스 프로젝트 시작</h2>
              <p className="text-gray-600 mb-6">
                간단한 프롬프트와 이미지로 전문적인 릴스를 만들어보세요
              </p>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setIsStepModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                시작하기
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">프로젝트 진행 중</h2>
              <p className="text-gray-600 mb-4">
                현재 Step {project.currentStep + 1}/7 진행 중입니다.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsStepModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  계속하기
                </button>
                {project.id && (
                  <button
                    onClick={() => router.push(`/reels/${project.id}`)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    결과 보기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Step 모달 */}
        {renderStepModal()}
      </div>
    </div>
  );
}

