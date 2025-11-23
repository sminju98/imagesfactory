'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { CreditCard, Copy, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function BankTransferContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [depositorName, setDepositorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amount = parseInt(searchParams.get('amount') || '0');
  const points = parseInt(searchParams.get('points') || '0');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (amount === 0 || points === 0) {
      router.push('/points');
      return;
    }

    // 기본 입금자명을 사용자 이름으로 설정
    setDepositorName(user.displayName || '');
  }, [user, amount, points, router]);

  const copyAccount = () => {
    navigator.clipboard.writeText('110452180013');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!depositorName) {
      alert('입금자명을 입력해주세요');
      return;
    }

    const confirmed = confirm(
      `입금 정보를 제출하시겠습니까?\n\n금액: ${amount.toLocaleString()}원\n입금자명: ${depositorName}\n\n입금 확인 후 포인트가 충전됩니다.`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);

      // Firebase ID Token 가져오기
      const { auth: firebaseAuth } = await import('@/lib/firebase');
      const idToken = await firebaseAuth.currentUser?.getIdToken();

      const response = await fetch('/api/payment/bank-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          amount,
          points,
          depositorName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ 입금 요청이 완료되었습니다!\n\n입금 확인 후 포인트가 충전됩니다.\n평일 기준 1-2시간 내에 처리됩니다.');
        router.push('/mypage');
      } else {
        alert('요청 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('요청 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">무통장 입금</h1>
          <p className="text-gray-600">
            아래 계좌로 입금 후 정보를 제출해주세요
          </p>
        </div>

        {/* 충전 정보 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-xl font-bold mb-6">충전 정보</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>입금 금액</span>
              <span className="font-bold text-2xl">{amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>충전될 포인트</span>
              <span className="font-bold text-2xl">{points.toLocaleString()}pt</span>
            </div>
          </div>
        </div>

        {/* 입금 계좌 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">입금 계좌</h2>
          
          <div className="space-y-6">
            {/* 은행명 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2">은행명</p>
              <p className="text-2xl font-bold text-gray-900">신한은행</p>
            </div>

            {/* 계좌번호 */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-2">계좌번호</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-blue-900 tracking-wider">110-452-180013</p>
                <button
                  onClick={copyAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 예금주 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2">예금주</p>
              <p className="text-2xl font-bold text-gray-900">송민주</p>
            </div>

            {/* 입금액 */}
            <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">입금할 금액</p>
              <p className="text-3xl font-bold text-yellow-900">{amount.toLocaleString()}원</p>
              <p className="text-sm text-yellow-700 mt-2">
                ⚠️ 정확한 금액을 입금해주세요
              </p>
            </div>
          </div>
        </div>

        {/* 입금자 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">입금자 정보</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              입금자명 *
            </label>
            <input
              type="text"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금하실 분의 성함"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              💡 입금 확인을 위해 정확한 입금자명을 입력해주세요
            </p>
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            입금 안내
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• 입금 후 아래 "입금 완료" 버튼을 클릭해주세요</li>
            <li>• 평일 기준 1-2시간 내에 포인트가 충전됩니다</li>
            <li>• 주말/공휴일은 익일 처리됩니다</li>
            <li>• 입금자명이 다를 경우 확인이 지연될 수 있습니다</li>
            <li>• 문의: webmaster@geniuscat.co.kr / 010-8440-9820</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            disabled={submitting || !depositorName}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
              submitting || !depositorName
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
            }`}
          >
            {submitting ? '제출 중...' : '입금 완료'}
          </button>

          <Link
            href="/points"
            className="block w-full py-4 text-center border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
          >
            취소
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function BankTransferPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BankTransferContent />
    </Suspense>
  );
}

