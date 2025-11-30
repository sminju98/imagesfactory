'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n';
import { Zap, Check, CreditCard, Loader2 } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'sonner';

// 충전 패키지 (USD 기반, 1포인트 = $0.01)
const POINT_PACKAGES = [
  {
    id: 'basic',
    points: 1000,      // 1000pt
    amount: 10,        // $10
    bonus: 0,          // 보너스 없음
    badge: 'Starter',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'standard',
    points: 5000,      // 5000pt 기본
    amount: 50,        // $50
    bonus: 5,          // +5% = 5250pt
    badge: 'Popular',
    color: 'from-indigo-500 to-purple-500',
    popular: true,
  },
  {
    id: 'pro',
    points: 10000,     // 10000pt 기본
    amount: 100,       // $100
    bonus: 10,         // +10% = 11000pt
    badge: 'Pro',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'premium',
    points: 30000,     // 30000pt 기본
    amount: 300,       // $300
    bonus: 15,         // +15% = 34500pt
    badge: 'Premium',
    color: 'from-pink-500 to-rose-500',
  },
];

// 보너스 계산 함수 (USD 기준)
function calculateBonus(amount: number): number {
  if (amount >= 300) return 15;
  if (amount >= 100) return 10;
  if (amount >= 50) return 5;
  return 0;
}

export default function PointsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [loading, setLoading] = useState(false);

  // 커스텀 금액으로 포인트 계산 ($1 = 100pt + 보너스)
  const customAmount_num = parseInt(customAmount) || 0;
  const customBonus = calculateBonus(customAmount_num);
  const customBasePoints = customAmount_num * 100; // $1 = 100pt
  const customPoints = customBasePoints + Math.floor(customBasePoints * (customBonus / 100));

  // 선택된 패키지 정보
  const selectedPackageInfo = POINT_PACKAGES.find(p => p.id === selectedPackage);
  const finalAmount = useCustomAmount ? customAmount_num : selectedPackageInfo?.amount || 0;
  const basePoints = useCustomAmount ? customBasePoints : selectedPackageInfo?.points || 0;
  const bonusPercent = useCustomAmount ? customBonus : selectedPackageInfo?.bonus || 0;
  const bonusPoints = Math.floor(basePoints * (bonusPercent / 100));
  const finalPoints = basePoints + bonusPoints;

  // PayPal Client ID
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';


  // PayPal 주문 생성
  const createPayPalOrder = async () => {
    if (!user) {
      toast.error(t('points.pleaseLogin'));
      router.push('/login');
      return '';
    }

    if (finalAmount < 10) {
      toast.error(t('points.minAmount'));
      return '';
    }

    if (finalAmount > 1000) {
      toast.error(t('points.maxAmount'));
      return '';
    }

    try {
      const response = await fetch('/api/payment/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          amount: finalAmount,
          points: finalPoints,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.data.orderId;
    } catch (error: any) {
      console.error('Create order error:', error);
      toast.error(error.message || t('common.error'));
      return '';
    }
  };

  // PayPal 결제 승인
  const onPayPalApprove = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          userId: user?.uid,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('points.paymentSuccess'));
        // 페이지 새로고침하여 포인트 업데이트
        window.location.reload();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Capture error:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // 달러 포맷팅
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('points.title')}</h1>
          <p className="text-gray-600">
            {user ? (
              <>{t('points.currentBalance')}: <span className="text-indigo-600 font-bold text-xl">{user.points.toLocaleString()}</span> {t('points.pointsUnit')}</>
            ) : (
              t('points.pleaseLoginToContinue')
            )}
          </p>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-12">
          <h3 className="font-bold text-lg mb-3">💡 {t('points.info')}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {t('points.infoPointValue')}
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {t('points.infoModelPrice')}
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {t('points.infoValidity')}
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {t('points.infoNonRefundable')}
            </li>
          </ul>
        </div>

        {/* Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('points.packages')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {POINT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  setUseCustomAmount(false);
                  setCustomAmount(pkg.amount.toString());
                }}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                  selectedPackage === pkg.id && !useCustomAmount
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      ⭐ {t('points.best')}
                    </span>
                  </div>
                )}

                <div className={`bg-gradient-to-r ${pkg.color} rounded-xl p-4 text-white mb-4`}>
                  <p className="text-sm font-semibold mb-1">{pkg.badge}</p>
                  <p className="text-3xl font-bold">
                    {(pkg.points + Math.floor(pkg.points * (pkg.bonus / 100))).toLocaleString()}pt
                  </p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs opacity-90 mt-1">
                      +{pkg.bonus}% {t('points.bonusIncluded')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatUSD(pkg.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ~{Math.floor((pkg.points + Math.floor(pkg.points * (pkg.bonus / 100))) / 5)} {t('points.imagesApprox')}
                  </p>
                </div>

                {selectedPackage === pkg.id && !useCustomAmount && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('points.customAmount')}</h2>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setUseCustomAmount(true);
                  setSelectedPackage(null);
                }}
                onFocus={() => {
                  setUseCustomAmount(true);
                  setSelectedPackage(null);
                }}
                placeholder={t('points.enterAmount')}
                min="10"
                max="1000"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="text-right min-w-[150px]">
              <p className="text-sm text-gray-600">{t('points.pointsYouGet')}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {customPoints.toLocaleString()}pt
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            💡 {t('points.exchangeRate')}
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('points.orderSummary')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>{t('points.amount')}</span>
              <span className="font-bold">{formatUSD(finalAmount)}</span>
            </div>
            <div className="border-t border-white/30 pt-4 space-y-3">
              <div className="flex justify-between text-lg">
                <span>{t('points.basePoints')}</span>
                <span className="font-bold">{basePoints.toLocaleString()}pt</span>
              </div>
              {bonusPercent > 0 && (
                <div className="flex justify-between text-lg text-yellow-300">
                  <span>🎁 {t('points.bonusPoints')} (+{bonusPercent}%)</span>
                  <span className="font-bold">+{bonusPoints.toLocaleString()}pt</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-white/30">
                <span>{t('points.totalPoints')}</span>
                <span>{finalPoints.toLocaleString()}pt</span>
              </div>
            </div>
            <div className="border-t border-white/30 pt-4">
              <div className="flex justify-between">
                <span>{t('points.balanceAfter')}</span>
                <span className="font-bold text-lg">
                  {((user?.points || 0) + finalPoints).toLocaleString()}pt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PayPal Button */}
        {user && finalAmount > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              {t('points.payWith')} PayPal
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">{t('points.processing')}</span>
              </div>
            ) : !paypalClientId ? (
              <div className="text-center py-8 text-red-500">
                <p>PayPal is not configured. Please contact support.</p>
              </div>
            ) : (
              <PayPalScriptProvider
                options={{
                  clientId: paypalClientId,
                  currency: 'USD',
                }}
              >
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'pay',
                  }}
                  createOrder={createPayPalOrder}
                  onApprove={onPayPalApprove}
                  onError={(err) => {
                    console.error('PayPal error:', err);
                    toast.error(t('common.error'));
                  }}
                  onCancel={() => {
                    toast.info(t('points.paymentCancelled'));
                  }}
                />
              </PayPalScriptProvider>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-2xl p-6 mb-8 text-center">
            {!user ? (
              <div>
                <p className="text-gray-600 mb-4">{t('points.pleaseLoginToContinue')}</p>
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  {t('common.login')}
                </button>
              </div>
            ) : (
              <p className="text-gray-600">{t('points.selectAmount')}</p>
            )}
          </div>
        )}

        {/* Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-3">⚠️ {t('points.beforeYouPay')}</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• {t('points.noticeNonRefundable')}</li>
            <li>• {t('points.noticeValidity')}</li>
            <li>• {t('points.noticePaymentMethods')}</li>
            <li>• {t('points.noticeInstant')}</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">{t('points.faq')}</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-1">{t('points.faqExpireQ')}</p>
              <p className="text-sm text-gray-600">{t('points.faqExpireA')}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">{t('points.faqRefundQ')}</p>
              <p className="text-sm text-gray-600">{t('points.faqRefundA')}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">{t('points.faqReceiveQ')}</p>
              <p className="text-sm text-gray-600">{t('points.faqReceiveA')}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">{t('points.faqInvoiceQ')}</p>
              <p className="text-sm text-gray-600">{t('points.faqInvoiceA')}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>{t('points.needHelp')}</p>
          <p className="mt-2">
            📧 <a href="mailto:webmaster@geniuscat.co.kr" className="text-indigo-600 hover:underline">webmaster@geniuscat.co.kr</a>
            {' '} | {' '}
            📞 <a href="tel:+82-10-8440-9820" className="text-indigo-600 hover:underline">+82-10-8440-9820</a>
          </p>
        </div>
      </main>
    </div>
  );
}
