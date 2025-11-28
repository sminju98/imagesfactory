'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { RefreshCcw, AlertCircle, CheckCircle, XCircle, Mail, Clock, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function RefundPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* 헤더 */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <RefreshCcw className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('refund.title')}</h1>
              <p className="text-gray-500">{t('refund.subtitle')}</p>
            </div>
          </div>

          {/* 요약 배너 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">{t('refund.principle.title')}</h3>
                <ul className="text-amber-800 space-y-1 text-sm">
                  <li>• {t('refund.principle.item1')}</li>
                  <li>• {t('refund.principle.item2')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="prose max-w-none text-gray-700 space-y-8">
            {/* 1. 요금제 유형별 환불 정책 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                {t('refund.section1.title')}
              </h2>
              
              {/* 크레딧 팩 */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">💳 {t('refund.section1.creditPack.title')}</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('refund.section1.creditPack.unused.title')}</p>
                      <p className="text-gray-600 text-sm">{t('refund.section1.creditPack.unused.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{t('refund.section1.creditPack.partial.title')}</p>
                      <p className="text-gray-600 text-sm">{t('refund.section1.creditPack.partial.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 환불 불가 기준 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                {t('refund.section2.title')}
              </h2>
              <div className="bg-red-50 rounded-xl p-6">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p>{t('refund.section2.item1')}</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p>{t('refund.section2.item2')}</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p>{t('refund.section2.item3')}</p>
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. 환불 요청 절차 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                {t('refund.section3.title')}
              </h2>
              <div className="bg-green-50 rounded-xl p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{t('refund.section3.intro')}</p>
                    <ul className="text-gray-600 text-sm space-y-1 ml-4">
                      <li>• {t('refund.section3.item1')}</li>
                      <li>• {t('refund.section3.item2')}</li>
                      <li>• {t('refund.section3.item3')}</li>
                      <li>• {t('refund.section3.item4')}</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{t('refund.section3.processingTime')}</p>
                    <p className="text-gray-600 text-sm">{t('refund.section3.processingDesc')}</p>
                    <p className="text-gray-500 text-sm mt-1">{t('refund.section3.processingNote')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. 서비스 장애 및 예외 처리 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                {t('refund.section4.title')}
              </h2>
              <div className="bg-amber-50 rounded-xl p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{t('refund.section4.content')}</p>
                </div>
                <p className="text-gray-600 text-sm">{t('refund.section4.note')}</p>
              </div>
            </section>

            {/* 5. 정책 변경 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                {t('refund.section5.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <ul className="space-y-2 text-gray-700">
                  <li>• {t('refund.section5.item1')}</li>
                  <li>• {t('refund.section5.item2')}</li>
                </ul>
              </div>
            </section>
          </div>

          {/* 연락처 */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="font-bold text-indigo-900 mb-3">📧 {t('refund.contact.title')}</h3>
              <p className="text-indigo-800">
                <strong>{t('refund.contact.email')}:</strong> <a href="mailto:webmaster@geniuscat.co.kr" className="text-indigo-600 hover:underline">webmaster@geniuscat.co.kr</a>
              </p>
              <p className="text-indigo-800">
                <strong>{t('refund.contact.phone')}:</strong> <a href="tel:010-8440-9820" className="text-indigo-600 hover:underline">010-8440-9820</a>
              </p>
              <p className="text-sm text-indigo-600 mt-2">{t('refund.contact.hours')}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <strong>{t('common.effectiveDate')}:</strong> 2025-11-28
            </p>
          </div>

          {/* 버튼 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/terms"
              className="inline-block px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold text-center"
            >
              {t('common.viewTerms')}
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-center"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
