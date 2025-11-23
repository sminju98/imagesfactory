'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Zap, Check, CreditCard } from 'lucide-react';

// 충전 패키지
const POINT_PACKAGES = [
  {
    id: 'basic',
    points: 10000,
    amount: 10000,
    badge: '입문',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'standard',
    points: 50000,
    amount: 50000,
    badge: '인기',
    color: 'from-indigo-500 to-purple-500',
    popular: true,
  },
  {
    id: 'pro',
    points: 100000,
    amount: 100000,
    badge: '추천',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'premium',
    points: 300000,
    amount: 300000,
    badge: '프리미엄',
    color: 'from-pink-500 to-rose-500',
  },
];

export default function PointsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [loading, setLoading] = useState(false);

  // 커스텀 금액으로 포인트 계산 (1원 = 1포인트)
  const customPoints = parseInt(customAmount) || 0;

  // 선택된 패키지 정보
  const selectedPackageInfo = POINT_PACKAGES.find(p => p.id === selectedPackage);
  const finalAmount = useCustomAmount ? customPoints : selectedPackageInfo?.amount || 0;
  const finalPoints = useCustomAmount ? customPoints : selectedPackageInfo?.points || 0;

  // 결제 요청 (간단한 방식 - 개발 모드)
  const handleCharge = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    if (finalAmount < 1000) {
      alert('최소 충전 금액은 1,000원입니다');
      return;
    }

    if (finalAmount > 1000000) {
      alert('최대 충전 금액은 1,000,000원입니다');
      return;
    }

    const confirmed = confirm(
      `${finalAmount.toLocaleString()}원을 결제하여 ${finalPoints.toLocaleString()} 포인트를 충전하시겠습니까?\n\n🚨 개발 모드: 실제 결제 없이 바로 충전됩니다.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      // Firebase ID Token 가져오기
      const { auth: firebaseAuth } = await import('@/lib/firebase');
      const idToken = await firebaseAuth.currentUser?.getIdToken();

      // 🚨 개발 모드: 실제 결제 없이 바로 충전
      const response = await fetch('/api/payment/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          amount: finalAmount,
          points: finalPoints,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${finalPoints.toLocaleString()} 포인트가 충전되었습니다!`);
        router.push('/mypage');
      } else {
        alert('충전 실패: ' + data.error);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('충전 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">포인트 충전</h1>
          <p className="text-gray-600">
            {user ? (
              <>현재 포인트: <span className="text-indigo-600 font-bold text-xl">{user.points.toLocaleString()}</span>pt</>
            ) : (
              '로그인 후 이용하실 수 있습니다'
            )}
          </p>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-12">
          <h3 className="font-bold text-lg mb-3">💡 포인트 안내</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              1포인트 = 1원
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              모델별 차등 가격 (50pt ~ 280pt/장)
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              유효기간: 충전일로부터 5년
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              환불 불가 (전자상거래법 적용)
            </li>
          </ul>
        </div>

        {/* Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">충전 패키지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {POINT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  setUseCustomAmount(false);
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
                      ⭐ 인기
                    </span>
                  </div>
                )}

                <div className={`bg-gradient-to-r ${pkg.color} rounded-xl p-4 text-white mb-4`}>
                  <p className="text-sm font-semibold mb-1">{pkg.badge}</p>
                  <p className="text-3xl font-bold">{pkg.points.toLocaleString()}pt</p>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {pkg.amount.toLocaleString()}원
                  </p>
                  <p className="text-sm text-gray-500">
                    약 {Math.floor(pkg.points / 100)}장 생성 가능
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">금액 직접 입력</h2>
          <div className="flex items-center space-x-4">
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
              placeholder="충전할 금액 입력 (원)"
              min="1000"
              max="1000000"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="text-right min-w-[150px]">
              <p className="text-sm text-gray-600">받을 포인트</p>
              <p className="text-2xl font-bold text-indigo-600">
                {customPoints.toLocaleString()}pt
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            💡 1포인트 = 1원 (최소 1,000원 ~ 최대 1,000,000원)
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-6">결제 정보</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>충전 금액</span>
              <span className="font-bold">{finalAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>받을 포인트</span>
              <span className="font-bold">{finalPoints.toLocaleString()}pt</span>
            </div>
            <div className="border-t border-white/30 pt-4">
              <div className="flex justify-between text-sm">
                <span>결제 후 보유 포인트</span>
                <span className="font-semibold">
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
              ? '처리 중...'
              : !user
              ? '로그인이 필요합니다'
              : finalAmount === 0
              ? '충전 금액을 선택해주세요'
              : `${finalAmount.toLocaleString()}원 결제하기`}
          </span>
        </button>

        {/* Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-3">⚠️ 결제 전 확인사항</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• 충전된 포인트는 환불되지 않습니다 (전자상거래법 적용)</li>
            <li>• 포인트 유효기간은 5년입니다</li>
            <li>• 결제 수단: 신용카드, 계좌이체, 간편결제</li>
            <li>• 결제 후 즉시 포인트가 충전됩니다</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">자주 묻는 질문</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. 포인트 유효기간이 있나요?</p>
              <p className="text-sm text-gray-600">A. 네, 충전일로부터 5년간 유효합니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. 환불이 가능한가요?</p>
              <p className="text-sm text-gray-600">A. 포인트는 디지털 콘텐츠로 환불이 불가능합니다. (전자상거래법 적용)</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. 결제 후 언제 충전되나요?</p>
              <p className="text-sm text-gray-600">A. 결제 승인 즉시 자동으로 충전됩니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Q. 세금계산서 발행이 가능한가요?</p>
              <p className="text-sm text-gray-600">A. 네, 고객지원(webmaster@geniuscat.co.kr)으로 요청해주세요.</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>문의사항이 있으신가요?</p>
          <p className="mt-2">
            📧 <a href="mailto:webmaster@geniuscat.co.kr" className="text-indigo-600 hover:underline">webmaster@geniuscat.co.kr</a>
            {' '} | {' '}
            📞 <a href="tel:010-8440-9820" className="text-indigo-600 hover:underline">010-8440-9820</a>
          </p>
        </div>
      </main>
    </div>
  );
}

