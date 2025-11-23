'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Link from 'next/link';
import { Sparkles, Mail, Image as ImageIcon, Zap, CheckCircle } from 'lucide-react';

// AI 모델 타입 정의
interface AIModel {
  id: string;
  name: string;
  description: string;
  pointsPerImage: number;
  badge?: string;
  color: string;
  company: string;
  logo?: string;
  maxCount?: number; // 모델별 최대 생성 수량
}

// AI 모델 데이터 (병렬 처리 기준 최대치 설정)
const AI_MODELS: AIModel[] = [
  {
    id: 'pixart',
    name: 'PixArt-Σ',
    description: '초저가 초고속! 1-2초 생성',
    pointsPerImage: 10,
    badge: '최저가',
    color: 'bg-emerald-50 border-emerald-200',
    company: 'Huawei Noah\'s Ark Lab',
    logo: '🎨',
    maxCount: 48,
  },
  {
    id: 'realistic-vision',
    name: 'Realistic Vision',
    description: '인물/사진 특화, 초사실적',
    pointsPerImage: 20,
    badge: '인물특화',
    color: 'bg-cyan-50 border-cyan-200',
    company: 'SG_161222 (Civitai)',
    logo: '📸',
    maxCount: 24,
  },
  {
    id: 'flux',
    name: 'Flux Schnell',
    description: '초고속 생성, 우수한 품질',
    pointsPerImage: 10,
    badge: '초고속',
    color: 'bg-green-50 border-green-200',
    company: 'Black Forest Labs',
    logo: '⚡',
    maxCount: 48,
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    description: '빠르고 안정적인 범용 옵션',
    pointsPerImage: 30,
    badge: '추천',
    color: 'bg-blue-50 border-blue-200',
    company: 'Stability AI',
    logo: '🎯',
    maxCount: 24,
  },
  {
    id: 'leonardo',
    name: 'Leonardo.ai',
    description: '일러스트 & 게임 아트 특화',
    pointsPerImage: 30,
    color: 'bg-orange-50 border-orange-200',
    company: 'Leonardo.ai',
    logo: '🎮',
    maxCount: 20,
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'ChatGPT의 이미지 생성 AI',
    pointsPerImage: 150,
    badge: '최고품질',
    color: 'bg-purple-50 border-purple-200',
    company: 'OpenAI (ChatGPT)',
    logo: '🤖',
    maxCount: 12,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Grok의 이미지 생성 모델',
    pointsPerImage: 60,
    badge: 'NEW',
    color: 'bg-pink-50 border-pink-200',
    company: 'xAI (Grok)',
    logo: '🌟',
    maxCount: 12,
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    description: '텍스트 포함 이미지, 포스터/광고 특화',
    pointsPerImage: 60,
    badge: '텍스트특화',
    color: 'bg-rose-50 border-rose-200',
    company: 'Ideogram AI',
    logo: '✍️',
    maxCount: 12,
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [selectedModels, setSelectedModels] = useState<Record<string, number>>({
    'sdxl': 10,
  });
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // 사용자 이메일 동기화
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // 참고 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB 이하여야 합니다');
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다');
        return;
      }

      setReferenceImage(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 참고 이미지 제거
  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview('');
  };

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
    const model = AI_MODELS.find(m => m.id === modelId);
    const maxCount = model?.maxCount || 100;
    
    if (count >= 0 && count <= maxCount) {
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
      let referenceImageUrl = '';

      // 참고 이미지가 있으면 먼저 Storage에 업로드
      if (referenceImage) {
        setUploadingImage(true);
        try {
          const { ref: storageRef, uploadBytes: uploadBytesFunc, getDownloadURL: getDownloadURLFunc } = await import('firebase/storage');
          const { storage } = await import('@/lib/firebase');
          
          const timestamp = Date.now();
          const filename = `reference-images/${user.uid}/${timestamp}_${referenceImage.name}`;
          const imageRef = storageRef(storage, filename);
          
          await uploadBytesFunc(imageRef, referenceImage);
          referenceImageUrl = await getDownloadURLFunc(imageRef);
          
          console.log('✅ 참고 이미지 업로드 완료:', referenceImageUrl);
        } catch (uploadError) {
          console.error('❌ 참고 이미지 업로드 실패:', uploadError);
          alert('참고 이미지 업로드에 실패했습니다. 이미지 없이 생성하시겠습니까?');
          if (!confirm('계속하시겠습니까?')) {
            setUploadingImage(false);
            return;
          }
        } finally {
          setUploadingImage(false);
        }
      }

      // Firebase ID Token 가져오기
      console.log('🔵 ID Token 가져오기 시작...');
      const { auth: firebaseAuth } = await import('@/lib/firebase');
      console.log('🔵 Firebase Auth:', firebaseAuth.currentUser?.email);
      
      const idToken = await firebaseAuth.currentUser?.getIdToken();
      console.log('🔵 ID Token:', idToken ? '✅ 가져옴' : '❌ 없음');

      if (!idToken) {
        alert('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      console.log('🔵 API 호출 시작...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt,
          email,
          selectedModels,
          referenceImageUrl: referenceImageUrl || undefined,
        }),
      });
      console.log('🔵 API 응답:', response.status);

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

            {/* Reference Image Upload */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">참고 이미지 (선택)</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                이미지를 업로드하면 유사한 스타일로 생성됩니다
              </p>

              {referenceImagePreview ? (
                <div className="relative">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-indigo-200">
                    <img
                      src={referenceImagePreview}
                      alt="참고 이미지"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={removeReferenceImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    📎 {referenceImage?.name} ({(referenceImage!.size / 1024).toFixed(0)} KB)
                  </p>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-1">
                      클릭하여 이미지 업로드
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, WEBP (최대 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Email Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">결과 받을 이메일</h2>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || "your@email.com"}
                  disabled={!user}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
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
                여러 모델을 동시에 선택하여 다양한 스타일의 이미지를 한 번에 생성하세요 (병렬 처리로 빠른 생성!)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_MODELS.map((model) => {
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

                      {/* Checkbox */}
                      <div className="flex items-start space-x-3 mb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModel(model.id)}
                          className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xl">{model.logo}</span>
                            <h3 className="font-bold text-gray-900">{model.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">by {model.company}</p>
                          <p className="text-sm text-gray-600">{model.description}</p>
                          <p className="text-sm font-semibold text-indigo-600 mt-1">
                            {model.pointsPerImage}pt / 장
                          </p>
                        </div>
                      </div>

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
                              max={model.maxCount || 100}
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
                  disabled={totalImages === 0 || prompt.length < 10 || !user || uploadingImage}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                    totalImages === 0 || prompt.length < 10 || !user || uploadingImage
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {uploadingImage
                    ? '이미지 업로드 중...'
                    : !user
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                <li>
                  이메일: <a href="mailto:webmaster@geniuscat.co.kr" className="hover:text-white transition-colors">
                    webmaster@geniuscat.co.kr
                  </a>
                </li>
                <li>
                  전화: <a href="tel:010-8440-9820" className="hover:text-white transition-colors">
                    010-8440-9820
                  </a>
                </li>
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
            <div>
              <h4 className="font-bold mb-4">약관 및 정책</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    개인정보처리방침
                  </Link>
                </li>
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

