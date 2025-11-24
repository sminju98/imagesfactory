'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 승인 처리 중...');

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const points = searchParams.get('points');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setMessage('결제 정보가 올바르지 않습니다');
        return;
      }

      try {
        // 결제 승인 API 호출
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
            points: parseInt(points || amount), // 1원 = 1포인트
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(`${parseInt(points || amount).toLocaleString()} 포인트가 충전되었습니다!`);
          
          // 3초 후 메인 페이지로 이동
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('결제 승인 실패: ' + data.error);
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        setStatus('error');
        setMessage('결제 승인 중 오류가 발생했습니다');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-200">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 승인 중...</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">충전 완료!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">잠시 후 메인 페이지로 이동합니다...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">충전 실패</h1>
              <p className="text-red-600 mb-6">{message}</p>
              <button
                onClick={() => router.push('/points')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                다시 시도하기
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}


