'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '알 수 없는 오류가 발생했습니다';
  const code = searchParams.get('code') || 'UNKNOWN_ERROR';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-200">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-red-600 mb-2">{message}</p>
          <p className="text-sm text-gray-500 mb-6">오류 코드: {code}</p>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/points"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              다시 시도하기
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              홈으로 가기
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">문제가 계속되시나요?</p>
            <p className="text-sm">
              📧 <a href="mailto:webmaster@geniuscat.co.kr" className="text-indigo-600 hover:underline">webmaster@geniuscat.co.kr</a>
              {' '} | {' '}
              📞 <a href="tel:010-8440-9820" className="text-indigo-600 hover:underline">010-8440-9820</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FailContent />
    </Suspense>
  );
}

