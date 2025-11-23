'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Sparkles, Mail, Image as ImageIcon, Zap, CheckCircle, Info } from 'lucide-react';
import { AI_MODELS_INFO, QUALITY_ICONS, SPEED_ICONS } from '@/data/ai-models-info';

// AI 모델 타입 정의
interface AIModel {
  id: string;
  name: string;
  description: string;
  pointsPerImage: number;
  badge?: string;
  color: string;
}

// AI 모델 데이터
const AI_MODELS: AIModel[] = [
  {
    id: 'pixart',
    name: 'PixArt-Σ',
    description: '초저가 초고속! 1-2초 생성',
    pointsPerImage: 50,
    badge: '초저가',
    color: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'realistic-vision',
    name: 'Realistic Vision',
    description: '인물/사진 특화, 초사실적',
    pointsPerImage: 60,
    badge: '인물특화',
    color: 'bg-cyan-50 border-cyan-200',
  },
  {
    id: 'flux',
    name: 'Flux Schnell',
    description: '초고속 생성, 우수한 품질',
    pointsPerImage: 80,
    badge: '초고속',
    color: 'bg-green-50 border-green-200',
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    description: '빠르고 안정적인 범용 옵션',
    pointsPerImage: 100,
    badge: '추천',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'leonardo',
    name: 'Leonardo.ai',
    description: '일러스트 & 게임 아트 특화',
    pointsPerImage: 120,
    color: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: '최고 품질의 정교한 이미지',
    pointsPerImage: 200,
    badge: '최고품질',
    color: 'bg-purple-50 border-purple-200',
  },
  {
    id: 'aurora',
    name: 'Aurora (xAI Grok)',
    description: '일론 머스크의 최신 AI, 초고품질',
    pointsPerImage: 250,
    badge: 'NEW',
    color: 'bg-pink-50 border-pink-200',
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState(user?.email || 'user@example.com');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [selectedModels, setSelectedModels] = useState<Record<string, number>>({
    'sdxl': 10,
  });
  const [showModelInfo, setShowModelInfo] = useState<string | null>(null);

  // 사용자 이메일 동기화
  useState(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  });

  // 모델 선택/해제
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      const newModels = { ...prev };
      if (newModels[modelId]) {
        delete newModels[modelId];
      } else {
        newModels[modelId] = 10; // 기본 10장
      }
      return newModels;
    });
  };

  // 수량 변경
  const updateModelCount = (modelId: string, count: number) => {
    if (count >= 0 && count <= 100) {
      setSelectedModels(prev => ({
        ...prev,
        [modelId]: count,
      }));
    }
  };

  // 총 비용 계산
  const calculateTotal = () => {
    let totalImages = 0;
    let totalPoints = 0;

    Object.entries(selectedModels).forEach(([modelId, count]) => {
      const model = AI_MODELS.find(m => m.id === modelId);
      if (model && count > 0) {
        totalImages += count;
        totalPoints += model.pointsPerImage * count;
      }
    });

    return { totalImages, totalPoints };
  };

  const { totalImages, totalPoints } = calculateTotal();
  const currentPoints = user?.points || 0;
  const isInsufficient = totalPoints > currentPoints;

  // 이미지 생성 요청
  const handleGenerate = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      window.location.href = '/login';
      return;
    }

    if (totalImages === 0) {
      alert('최소 1개의 모델을 선택해주세요');
      return;
    }

    if (prompt.length < 10) {
      alert('프롬프트를 10자 이상 입력해주세요');
      return;
    }

    if (isInsufficient) {
      alert('포인트가 부족합니다');
      return;
    }

    const confirmed = confirm(
      `총 ${totalImages}장의 이미지를 ${totalPoints.toLocaleString()} 포인트로 생성하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          prompt,
          email,
          selectedModels,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('이미지 생성이 시작되었습니다! 완료되면 이메일로 전송됩니다.');
        // 생성 진행 화면으로 이동
        window.location.href = `/generation/${data.data.generationId}`;
      } else {
        alert('생성 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('이미지 생성 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">프롬프트 입력</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성하고 싶은 이미지를 자세히 설명해주세요...&#10;&#10;예시: a beautiful sunset over the ocean, with vibrant orange and pink colors, peaceful atmosphere, photorealistic"
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {prompt.length} / 1,000자
                </p>
                {prompt.length >= 10 && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    좋은 프롬프트예요!
                  </p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">결과 받을 이메일</h2>
              </div>
              <div className="flex items-center space-x-3">
                {isEditingEmail ? (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setIsEditingEmail(false)}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      확인
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                      {email}
                    </div>
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                💡 생성 완료 시 이메일로 ZIP 파일을 보내드립니다
              </p>
            </div>

            {/* AI Models Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">AI 모델 선택 및 수량</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                여러 모델을 동시에 선택하여 다양한 스타일의 이미지를 한 번에 생성하세요 (모델당 최대 100장)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_MODELS_INFO.map((model) => {
                  const isSelected = selectedModels[model.id] !== undefined;
                  const count = selectedModels[model.id] || 0;

                  return (
                    <div
                      key={model.id}
                      className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? `${model.color} border-current shadow-md`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => !isSelected && toggleModel(model.id)}
                    >
                      {/* Badge */}
                      {model.badge && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                            {model.badge}
                          </span>
                        </div>
                      )}

                      {/* Info Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModelInfo(showModelInfo === model.id ? null : model.id);
                        }}
                        className="absolute top-2 left-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Info className="w-4 h-4 text-gray-600" />
                      </button>

                      {/* Checkbox & Info */}
                      <div className="flex items-start space-x-3 mb-3 mt-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModel(model.id)}
                          className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{model.name}</h3>
                          <p className="text-sm text-gray-600">{model.shortDescription}</p>
                          
                          {/* Used In */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.usedIn.slice(0, 2).map((platform, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {platform}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-3 mt-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">품질:</span>
                              <span className="text-xs">{QUALITY_ICONS[model.quality]}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">속도:</span>
                              <span className="text-xs">{SPEED_ICONS[model.speed]}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm font-semibold text-indigo-600 mt-2">
                            {model.pointsPerImage}pt / 장
                          </p>
                        </div>
                      </div>

                      {/* Detailed Info Popup */}
                      {showModelInfo === model.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 right-0 top-full mt-2 bg-white border-2 border-indigo-300 rounded-xl p-4 shadow-xl z-10 max-h-96 overflow-y-auto"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-gray-900 mb-1">📝 설명</h4>
                              <p className="text-sm text-gray-700">{model.fullDescription}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-bold text-gray-900 mb-1">🏢 사용처</h4>
                              <div className="flex flex-wrap gap-1">
                                {model.usedIn.map((platform, idx) => (
                                  <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                    {platform}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-bold text-gray-900 mb-1">✨ 주요 특징</h4>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {model.features.map((feature, idx) => (
                                  <li key={idx}>• {feature}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-bold text-gray-900 mb-1">🎯 추천 용도</h4>
                              <div className="flex flex-wrap gap-1">
                                {model.bestFor.map((use, idx) => (
                                  <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {use}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-500">
                                {model.developer} • {model.releaseYear}
                              </div>
                              <button
                                onClick={() => setShowModelInfo(null)}
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                닫기
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Count Selector */}
                      {isSelected && (
                        <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                          <label className="text-sm font-medium text-gray-700">수량:</label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateModelCount(model.id, count - 5);
                              }}
                              className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={count}
                              onChange={(e) => updateModelCount(model.id, parseInt(e.target.value) || 0)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold"
                              min="0"
                              max="100"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateModelCount(model.id, count + 5);
                              }}
                              className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold"
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-600">장</span>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-sm text-gray-600">소계</p>
                            <p className="font-bold text-indigo-600">
                              {(model.pointsPerImage * count).toLocaleString()}pt
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Cost Summary */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="w-5 h-5" />
                  <h2 className="text-xl font-bold">예상 비용</h2>
                </div>

                <div className="space-y-3 mb-6">
                  {Object.entries(selectedModels).map(([modelId, count]) => {
                    const model = AI_MODELS.find(m => m.id === modelId);
                    if (!model || count === 0) return null;

                    return (
                      <div key={modelId} className="flex justify-between text-sm">
                        <span>{model.name}: {count}장</span>
                        <span className="font-semibold">
                          {(model.pointsPerImage * count).toLocaleString()}pt
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/30 pt-4 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>총 이미지</span>
                    <span className="font-bold">{totalImages}장</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold">
                    <span>총 비용</span>
                    <span>{totalPoints.toLocaleString()}pt</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span>현재 포인트</span>
                    <span className="font-semibold">{currentPoints.toLocaleString()}pt</span>
                  </div>
                  {isInsufficient ? (
                    <div className="bg-red-500 rounded-lg p-3 text-center">
                      <p className="font-bold">포인트 부족</p>
                      <p className="text-sm">{(totalPoints - currentPoints).toLocaleString()}pt 부족</p>
                    </div>
                  ) : (
                    <div className="bg-white/20 rounded-lg p-3 text-center">
                      <p className="font-semibold">잔여 포인트</p>
                      <p className="text-lg font-bold">{(currentPoints - totalPoints).toLocaleString()}pt</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              {isInsufficient ? (
                <button 
                  onClick={() => window.location.href = '/points'}
                  className="w-full py-4 bg-yellow-500 text-white rounded-xl font-bold text-lg hover:bg-yellow-600 transition-all shadow-lg"
                >
                  포인트 충전하기
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={totalImages === 0 || prompt.length < 10 || !user}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                    totalImages === 0 || prompt.length < 10 || !user
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {!user
                    ? '로그인이 필요합니다'
                    : totalImages === 0
                    ? '모델을 선택해주세요'
                    : prompt.length < 10
                    ? '프롬프트를 입력해주세요'
                    : `이미지 생성하기 (${totalPoints.toLocaleString()}pt)`}
                </button>
              )}

              {/* Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">💡 TIP</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 여러 모델을 선택하면 다양한 스타일을 비교할 수 있어요</li>
                  <li>• 평균 생성 시간은 이미지당 약 30초입니다</li>
                  <li>• 완료되면 이메일로 자동 전송됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">imagesfactory</h3>
              <p className="text-gray-400 text-sm">
                여러 AI 모델로 한 번에<br />
                수십 장의 이미지를 생성하세요
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>이메일: support@imagesfactory.com</li>
                <li>전화: 010-4882-9820</li>
                <li>평일 10:00 - 18:00</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">회사 정보</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>상호명: 엠제이스튜디오(MJ)</li>
                <li>대표: 송민주</li>
                <li>사업자번호: 829-04-03406</li>
                <li>통신판매업: 2025-서울강남-06359</li>
                <li>주소: 서울특별시 강남구 봉은사로30길 68, 6층-S42호</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 엠제이스튜디오. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

