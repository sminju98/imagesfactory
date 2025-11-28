'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Zap, Check, CreditCard } from 'lucide-react';

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

  // 결제 요청
  const handleCharge = async () => {
    if (!user) {
      alert('Please login first');
      router.push('/login');
      return;
    }

    if (finalAmount < 1) {
      alert('Minimum charge amount is $1');
      return;
    }

    if (finalAmount > 1000) {
      alert('Maximum charge amount is $1,000');
      return;
    }

    // 결제 페이지로 이동
    router.push(`/payment/bank-transfer?amount=${finalAmount}&points=${finalPoints}`);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Buy Points</h1>
          <p className="text-gray-600">
            {user ? (
              <>Current Balance: <span className="text-indigo-600 font-bold text-xl">{user.points.toLocaleString()}</span> points</>
            ) : (
              'Please login to continue'
            )}
          </p>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-12">
          <h3 className="font-bold text-lg mb-3">💡 Points Info</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              1 point = $0.01 (1 cent)
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              Model prices: 1pt ~ 60pt per image
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              Valid for 5 years from purchase
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              Non-refundable digital content
            </li>
          </ul>
        </div>

        {/* Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Point Packages</h2>
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
                      ⭐ BEST
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
                      +{pkg.bonus}% bonus included
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatUSD(pkg.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ~{Math.floor((pkg.points + Math.floor(pkg.points * (pkg.bonus / 100))) / 5)} images
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Custom Amount</h2>
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
                placeholder="Enter amount (USD)"
                min="1"
                max="1000"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="text-right min-w-[150px]">
              <p className="text-sm text-gray-600">Points you&apos;ll get</p>
              <p className="text-2xl font-bold text-indigo-600">
                {customPoints.toLocaleString()}pt
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            💡 $1 = 100 points (Min $1 ~ Max $1,000)
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>Amount</span>
              <span className="font-bold">{formatUSD(finalAmount)}</span>
            </div>
            <div className="border-t border-white/30 pt-4 space-y-3">
              <div className="flex justify-between text-lg">
                <span>Base Points</span>
                <span className="font-bold">{basePoints.toLocaleString()}pt</span>
              </div>
              {bonusPercent > 0 && (
                <div className="flex justify-between text-lg text-yellow-300">
                  <span>🎁 Bonus Points (+{bonusPercent}%)</span>
                  <span className="font-bold">+{bonusPoints.toLocaleString()}pt</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-white/30">
                <span>Total Points</span>
                <span>{finalPoints.toLocaleString()}pt</span>
              </div>
            </div>
            <div className="border-t border-white/30 pt-4">
              <div className="flex justify-between">
                <span>Balance After Purchase</span>
                <span className="font-bold text-lg">
                  {((user?.points || 0) + finalPoints).toLocaleString()}pt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handleCharge}
          disabled={loading || !user || finalAmount === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center space-x-2 ${
            loading || !user || finalAmount === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
          }`}
        >
          <CreditCard className="w-6 h-6" />
          <span>
            {loading
              ? 'Processing...'
              : !user
              ? 'Please Login'
              : finalAmount === 0
              ? 'Select an amount'
              : `Pay ${formatUSD(finalAmount)}`}
          </span>
        </button>

        {/* Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-3">⚠️ Before You Pay</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• Points are non-refundable (digital content)</li>
            <li>• Points are valid for 5 years</li>
            <li>• Payment methods: Credit card, PayPal</li>
            <li>• Points are credited instantly after payment</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">FAQ</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. Do points expire?</p>
              <p className="text-sm text-gray-600">A. Yes, points are valid for 5 years from purchase date.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. Can I get a refund?</p>
              <p className="text-sm text-gray-600">A. Points are non-refundable as they are digital content.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. When will I receive my points?</p>
              <p className="text-sm text-gray-600">A. Points are credited instantly after payment confirmation.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. Can I get an invoice?</p>
              <p className="text-sm text-gray-600">A. Yes, please contact support at webmaster@geniuscat.co.kr</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Need help?</p>
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
