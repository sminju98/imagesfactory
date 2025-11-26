'use client';

import React, { useState } from 'react';
import { Newspaper, Image, Film, Palette, LayoutTemplate, Bell, Mail, CheckCircle } from 'lucide-react';
import { CONTENT_MENU_ITEMS } from '@/types/content.types';

const iconMap: Record<string, React.ReactNode> = {
  '📰': <Newspaper className="w-8 h-8" />,
  '🎬': <Image className="w-8 h-8" />,
  '📱': <Film className="w-8 h-8" />,
  '🎨': <Palette className="w-8 h-8" />,
  '🖼️': <LayoutTemplate className="w-8 h-8" />,
};

export default function ContentFactoryTab() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    
    // TODO: 실제 구독 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubscribed(true);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* 헤더 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4">
          <LayoutTemplate className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ContentFactory
        </h1>
        <p className="text-lg text-gray-600">
          ImageFactory에서 만든 이미지로 콘텐츠를 자동 생성하세요
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
          <span className="text-sm font-medium text-indigo-700">🚀 Coming Soon</span>
        </div>
      </div>

      {/* 기능 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {CONTENT_MENU_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`
              relative p-6 rounded-2xl border-2 transition-all duration-300
              ${item.isAvailable 
                ? 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer' 
                : 'bg-gray-50 border-gray-100 cursor-not-allowed'
              }
            `}
          >
            {/* Coming Soon 배지 */}
            {item.comingSoon && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                  준비중
                </span>
              </div>
            )}

            {/* 아이콘 */}
            <div className={`
              w-14 h-14 rounded-xl flex items-center justify-center mb-4
              ${item.isAvailable 
                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600' 
                : 'bg-gray-100 text-gray-400'
              }
            `}>
              {iconMap[item.icon] || <span className="text-2xl">{item.icon}</span>}
            </div>

            {/* 제목 및 설명 */}
            <h3 className={`text-lg font-semibold mb-2 ${item.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {item.title}
            </h3>
            <p className={`text-sm ${item.isAvailable ? 'text-gray-600' : 'text-gray-400'}`}>
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* 출시 알림 신청 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-center text-white">
        <Bell className="w-12 h-12 mx-auto mb-4 opacity-90" />
        <h2 className="text-2xl font-bold mb-2">
          출시 알림 받기
        </h2>
        <p className="text-white/80 mb-6">
          ContentFactory가 출시되면 가장 먼저 알려드릴게요!
        </p>

        {isSubscribed ? (
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/20 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span className="font-medium">알림 신청이 완료되었습니다!</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 animate-pulse" />
                    <span>신청 중...</span>
                  </span>
                ) : (
                  '알림 신청'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 예정 기능 상세 */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📰</span> 카드뉴스 자동 생성
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 이미지 + 텍스트 자동 레이아웃</li>
            <li>• 다양한 템플릿 제공</li>
            <li>• 인스타그램/페이스북 최적화</li>
            <li>• PDF/이미지 내보내기</li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎬</span> 썸네일 자동 생성
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• YouTube/Instagram 최적 사이즈</li>
            <li>• 클릭을 유도하는 텍스트 자동 배치</li>
            <li>• 트렌디한 디자인 템플릿</li>
            <li>• 브랜드 컬러 적용</li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📱</span> 릴스/틱톡 영상
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 이미지 슬라이드 → 영상 변환</li>
            <li>• 트랜지션 효과 적용</li>
            <li>• 배경 음악 추가</li>
            <li>• 5~30초 짧은 영상 생성</li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎨</span> 포스터/배너
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 이벤트/프로모션 포스터</li>
            <li>• 웹/앱 배너 이미지</li>
            <li>• 광고 크리에이티브</li>
            <li>• 다양한 사이즈 일괄 생성</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

