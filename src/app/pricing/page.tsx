'use client';

import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, Zap, Crown, Star } from 'lucide-react';

export default function PricingPage() {
  const { t } = useTranslation();

  // 실제 포인트 충전 패키지 (points/page.tsx와 동일)
  const pricingPlans = [
    {
      name: 'Starter',
      price: '$10',
      points: '1,000',
      bonus: null,
      perPoint: '$0.01',
      features: [
        t('pricing.starter.feature1'),
        t('pricing.starter.feature2'),
        t('pricing.starter.feature3'),
      ],
      icon: Sparkles,
      color: 'indigo',
      popular: false,
    },
    {
      name: 'Popular',
      price: '$50',
      points: '5,250',
      bonus: '+5%',
      perPoint: '$0.0095',
      features: [
        t('pricing.standard.feature1'),
        t('pricing.standard.feature2'),
        t('pricing.standard.feature3'),
        t('pricing.standard.feature4'),
      ],
      icon: Zap,
      color: 'purple',
      popular: true,
    },
    {
      name: 'Pro',
      price: '$100',
      points: '11,000',
      bonus: '+10%',
      perPoint: '$0.0091',
      features: [
        t('pricing.pro.feature1'),
        t('pricing.pro.feature2'),
        t('pricing.pro.feature3'),
        t('pricing.pro.feature4'),
        t('pricing.pro.feature5'),
      ],
      icon: Crown,
      color: 'amber',
      popular: false,
    },
    {
      name: 'Premium',
      price: '$300',
      points: '34,500',
      bonus: '+15%',
      perPoint: '$0.0087',
      features: [
        t('pricing.premium.feature1'),
        t('pricing.premium.feature2'),
        t('pricing.premium.feature3'),
        t('pricing.premium.feature4'),
        t('pricing.premium.feature5'),
      ],
      icon: Star,
      color: 'rose',
      popular: false,
    },
  ];

  // 실제 AI 모델 요금 (page.tsx AI_MODELS와 동일)
  const modelPricing = [
    { name: 'Midjourney v6.1', points: '60', time: '~60s', badge: 'BEST' },
    { name: 'GPT-Image-1 (DALL·E 4)', points: '10', time: '~30s', badge: 'NEW' },
    { name: 'Nano Banana Pro (Gemini)', points: '8', time: '~15s', badge: 'Google' },
    { name: 'Grok-2 Image', points: '6', time: '~20s', badge: 'xAI' },
    { name: 'Ideogram V3 Turbo', points: '6', time: '~15s', badge: 'Text' },
    { name: 'Leonardo Phoenix', points: '5', time: '~15s', badge: 'Game Art' },
    { name: 'Seedream 4.0', points: '5', time: '~15s', badge: '4K' },
    { name: 'SD 3.5 Large', points: '4', time: '~10s', badge: 'Latest' },
    { name: 'Recraft V3', points: '4', time: '~10s', badge: 'Design' },
    { name: 'Flux 1.1 Pro', points: '3', time: '~10s', badge: 'Official' },
    { name: 'Hunyuan Image 3.0', points: '3', time: '~10s', badge: 'Tencent' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-indigo-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.backToHome')}</span>
            </Link>
            <Link href="/" className="text-2xl font-bold text-white">
              ImageFactory
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
          <p className="text-lg text-indigo-300 mt-4">
            💡 $1 = 100 {t('points.pointsUnit')} | {t('pricing.validFor5Years')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border ${
                plan.popular ? 'border-purple-500 ring-2 ring-purple-500' : 'border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  ⭐ {t('pricing.popular')}
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-xl bg-${plan.color}-500/20`}>
                  <plan.icon className={`w-6 h-6 text-${plan.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-2xl font-semibold text-indigo-400">{plan.points} P</span>
                  {plan.bonus && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm font-medium">
                      {plan.bonus}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{t('pricing.perPoint')}: {plan.perPoint}</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/points"
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {t('pricing.selectPlan')}
              </Link>
            </div>
          ))}
        </div>

        {/* Custom Amount Notice */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border border-indigo-500/30 mb-12 text-center">
          <h3 className="text-xl font-bold text-white mb-2">{t('pricing.customAmountTitle')}</h3>
          <p className="text-gray-300">{t('pricing.customAmountDesc')}</p>
        </div>

        {/* Model Pricing Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {t('pricing.modelPricing')}
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {t('pricing.modelPricingDesc')}
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">{t('pricing.model')}</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">{t('pricing.pointsPerImage')}</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">{t('pricing.avgTime')}</th>
                </tr>
              </thead>
              <tbody>
                {modelPricing.map((model, index) => (
                  <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{model.name}</span>
                        {model.badge && (
                          <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded">
                            {model.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold">
                        {model.points} P
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">{model.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {t('pricing.faqTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">{t('pricing.faq1.question')}</h3>
              <p className="text-gray-400">{t('pricing.faq1.answer')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">{t('pricing.faq2.question')}</h3>
              <p className="text-gray-400">{t('pricing.faq2.answer')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">{t('pricing.faq3.question')}</h3>
              <p className="text-gray-400">{t('pricing.faq3.answer')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">{t('pricing.faq4.question')}</h3>
              <p className="text-gray-400">{t('pricing.faq4.answer')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© 2025 MJ Studio. {t('footer.allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
}
