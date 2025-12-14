'use client';

import { useState } from 'react';
import { Factory, Sparkles, Film, Grid2X2, Layers, Youtube, LayoutTemplate, ArrowRight, Zap, Check, Image } from 'lucide-react';
import ContentFactoryModal from './ContentFactoryModal';
import { useTranslation } from '@/lib/i18n';

interface ContentFactoryMainProps {
  selectedImageIds?: string[];
}

// 글로벌 가격: 1 포인트 = $0.01 (1센트)
const CONTENT_TYPES = [
  {
    id: 'reels',
    name: 'Reels/TikTok',
    nameKo: '릴스/틱톡',
    icon: Film,
    count: '10 cuts',
    countKo: '10컷',
    price: 50, // $0.50
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-400',
  },
  {
    id: 'comic',
    name: '4-Panel Comic',
    nameKo: '4컷 만화',
    icon: Grid2X2,
    count: '4 panels',
    countKo: '4컷',
    price: 30, // $0.30
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-400',
  },
  {
    id: 'cardnews',
    name: 'Card News',
    nameKo: '카드뉴스',
    icon: Layers,
    count: '5 pages',
    countKo: '5장',
    price: 40, // $0.40
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-400',
  },
  {
    id: 'banner',
    name: 'Banner Ads',
    nameKo: '배너 광고',
    icon: LayoutTemplate,
    count: '2 types',
    countKo: '2종',
    price: 20, // $0.20
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-400',
  },
  {
    id: 'thumbnail',
    name: 'YouTube Thumbnail',
    nameKo: '유튜브 썸네일',
    icon: Youtube,
    count: '3 types',
    countKo: '3종',
    price: 25, // $0.25
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-400',
  },
  {
    id: 'detail',
    name: 'Detail Page',
    nameKo: '상세페이지',
    icon: Image,
    count: '2 types',
    countKo: '2종',
    price: 30, // $0.30
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-400',
  },
];

export default function ContentFactoryMain({ selectedImageIds = [] }: ContentFactoryMainProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const selectContentType = (typeId: string) => {
    setSelectedType(typeId === selectedType ? null : typeId);
  };

  const selectedTypeData = CONTENT_TYPES.find(type => type.id === selectedType);
  const totalPrice = selectedTypeData?.price || 0;

  const handleStartFactory = () => {
    if (inputPrompt.trim().length < 10) {
      alert(t('contentFactory.minChars'));
      return;
    }
    if (!selectedType) {
      alert(t('contentFactory.selectContentType'));
      return;
    }
    setIsModalOpen(true);
  };

  // 콘텐츠 타입 이름 번역 헬퍼
  const getContentTypeName = (typeId: string) => {
    return t(`contentFactory.contentTypes.${typeId}`);
  };

  const getContentTypeCount = (typeId: string) => {
    return t(`contentFactory.contentTypes.${typeId}Count`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* 콘텐츠 타입 선택 섹션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          {/* 헤더 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('contentFactory.title')}</h1>
              <p className="text-gray-500 text-sm">{t('contentFactory.subtitle')}</p>
            </div>
          </div>
          
          {/* 콘텐츠 타입 카드 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CONTENT_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => selectContentType(type.id)}
                  className={`relative ${type.bgColor} rounded-xl p-4 text-center border-2 transition-all hover:shadow-md ${
                    isSelected ? type.borderColor + ' shadow-lg' : 'border-transparent'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-3 text-white shadow-lg`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <h4 className={`font-semibold ${type.textColor}`}>{getContentTypeName(type.id)}</h4>
                  <p className="text-sm text-gray-600 mt-1">{getContentTypeCount(type.id)}</p>
                  <p className="text-xl font-bold text-gray-900 mt-2">{type.price}P</p>
                  <p className="text-xs text-gray-500">${(type.price / 100).toFixed(2)}</p>
                </button>
              );
            })}
          </div>

          {/* 선택 요약 */}
          {selectedType && selectedTypeData && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-900">
                      {getContentTypeName(selectedType)} {t('contentFactory.selected')}
                    </p>
                    <p className="text-sm text-indigo-700">{t('contentFactory.estimatedTime')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-900">{totalPrice}P</p>
                  <p className="text-sm text-indigo-600">${(totalPrice / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">{t('contentFactory.productInfo')}</h2>
          </div>

          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={t('contentFactory.productInfoPlaceholder')}
            className="w-full h-36 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
            maxLength={2000}
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-500">{inputPrompt.length} / 2,000</p>
            <button
              onClick={handleStartFactory}
              disabled={inputPrompt.trim().length < 10 || !selectedType}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                inputPrompt.trim().length >= 10 && selectedType
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-5 h-5" />
              {t('contentFactory.start')} ({totalPrice}P)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Process Explanation */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('contentFactory.processTitle')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, name: t('contentFactory.step1Name'), desc: t('contentFactory.step1Desc'), emoji: '💡' },
              { step: 2, name: t('contentFactory.step2Name'), desc: t('contentFactory.step2Desc'), emoji: '💬' },
              { step: 3, name: t('contentFactory.step3Name'), desc: t('contentFactory.step3Desc'), emoji: '📝' },
              { step: 4, name: t('contentFactory.step4Name'), desc: t('contentFactory.step4Desc'), emoji: '✍️' },
              { step: 5, name: t('contentFactory.step5Name'), desc: t('contentFactory.step5Desc'), emoji: '🏭' },
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

        </div>

      {/* Content Generation Modal */}
      <ContentFactoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPrompt={inputPrompt}
        referenceImageIds={selectedImageIds}
        selectedContentType={selectedType || ''}
        totalPrice={totalPrice}
      />
    </>
  );
}
