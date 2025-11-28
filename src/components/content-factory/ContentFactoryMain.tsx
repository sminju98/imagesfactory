'use client';

import { useState } from 'react';
import { Factory, Sparkles, Image, Film, Grid2X2, Layers, Youtube, LayoutTemplate, ArrowRight, Zap } from 'lucide-react';
import ContentFactoryModal from './ContentFactoryModal';

interface ContentFactoryMainProps {
  selectedImageIds?: string[];
}

const CONTENT_TYPES = [
  {
    id: 'reels',
    name: '릴스/틱톡',
    icon: Film,
    count: '10컷',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    id: 'comic',
    name: '4컷 만화',
    icon: Grid2X2,
    count: '4컷',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    id: 'cardnews',
    name: '카드뉴스',
    icon: Layers,
    count: '5장',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    id: 'banner',
    name: '배너 광고',
    icon: LayoutTemplate,
    count: '2종',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    id: 'thumbnail',
    name: '유튜브 썸네일',
    icon: Youtube,
    count: '3종',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    id: 'detail',
    name: '상세페이지',
    icon: Image,
    count: '2종',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

export default function ContentFactoryMain({ selectedImageIds = [] }: ContentFactoryMainProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');

  const handleStartFactory = () => {
    if (inputPrompt.trim().length < 10) {
      alert('프롬프트를 10자 이상 입력해주세요');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* 히어로 섹션 */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                <Factory className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">콘텐츠 공장</h1>
                <p className="text-white/80 text-sm">프롬프트 하나로 하루치 콘텐츠 자동 생성</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {CONTENT_TYPES.map((type) => (
                <div
                  key={type.id}
                  className="bg-white/10 backdrop-blur rounded-xl p-3 text-center hover:bg-white/20 transition-colors"
                >
                  <type.icon className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-sm font-medium">{type.name}</p>
                  <p className="text-xs text-white/70">{type.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">제품/서비스 정보 입력</h2>
          </div>

          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="생성하고 싶은 콘텐츠의 제품/서비스 정보를 입력하세요&#10;&#10;예시: 피부과 전문 병원의 여드름 치료 프로그램을 홍보하고 싶어요. 타겟은 20-30대 여성이고, 트렌디하고 신뢰감 있는 이미지로 SNS 마케팅을 하려고 합니다. 특장점은 비침습적 시술, 빠른 효과, 합리적인 가격입니다."
            className="w-full h-36 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
            maxLength={2000}
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-500">{inputPrompt.length} / 2,000자</p>
            <button
              onClick={handleStartFactory}
              disabled={inputPrompt.trim().length < 10}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                inputPrompt.trim().length >= 10
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-5 h-5" />
              콘텐츠 생성 시작
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 생성 과정 설명 */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏭 콘텐츠 공장 5단계 프로세스</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, name: '콘셉트', desc: 'AI가 제품 분석 및 전략 수립', emoji: '💡' },
              { step: 2, name: '메시지', desc: '메인/서브 카피 자동 생성', emoji: '💬' },
              { step: 3, name: '대본', desc: '릴스, 만화, 카드뉴스 시나리오', emoji: '📝' },
              { step: 4, name: '카피', desc: '각 포맷별 문구 확정', emoji: '✍️' },
              { step: 5, name: '생산', desc: '28장 이미지 자동 생성', emoji: '🏭' },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {item.step}
                    </span>
                    <span className="text-lg">{item.emoji}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
                {index < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 생성되는 콘텐츠 미리보기 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📦 한 번에 생성되는 콘텐츠</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CONTENT_TYPES.map((type) => (
              <div
                key={type.id}
                className={`${type.bgColor} rounded-xl p-4 text-center border border-transparent hover:border-gray-200 transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-3 text-white shadow-lg`}>
                  <type.icon className="w-6 h-6" />
                </div>
                <h4 className={`font-semibold ${type.textColor}`}>{type.name}</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">{type.count}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900">총 28장의 콘텐츠가 자동 생성됩니다</p>
                <p className="text-sm text-indigo-700">예상 소요 시간: 약 3-5분 • 생산 완료 후 갤러리에 자동 저장</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 생성 모달 */}
      <ContentFactoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPrompt={inputPrompt}
        referenceImageIds={selectedImageIds}
      />
    </>
  );
}

