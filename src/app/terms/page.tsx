'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('terms.title')}</h1>
          </div>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article1.title')}</h2>
              <p>{t('terms.article1.content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article2.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('terms.article2.item1')}</li>
                <li>{t('terms.article2.item2')}</li>
                <li>{t('terms.article2.item3')}</li>
                <li>{t('terms.article2.item4')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article3.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('terms.article3.item1')}</li>
                <li>{t('terms.article3.item2')}</li>
                <li>{t('terms.article3.item3')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article4.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('terms.article4.intro')}
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>{t('terms.article4.service1')}</li>
                    <li>{t('terms.article4.service2')}</li>
                    <li>{t('terms.article4.service3')}</li>
                    <li>{t('terms.article4.service4')}</li>
                  </ul>
                </li>
                <li>{t('terms.article4.item2')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article5.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('terms.article5.item1')}</li>
                <li>{t('terms.article5.item2')}</li>
                <li>{t('terms.article5.item3')}</li>
                <li>{t('terms.article5.item4')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article6.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('terms.article6.item1')}</li>
                <li>{t('terms.article6.item2')}</li>
                <li>{t('terms.article6.item3')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article7.title')}</h2>
              <p>
                {t('terms.article7.seeRefundPage')}{' '}
                <Link href="/refund" className="text-indigo-600 hover:underline">
                  {t('common.refundPolicy')}
                </Link>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.article8.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('terms.article8.item1')}</li>
                <li>{t('terms.article8.item2')}</li>
                <li>{t('terms.article8.item3')}</li>
              </ol>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>{t('common.effectiveDate')}:</strong> 2025-11-28
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>{t('common.contact')}:</strong> webmaster@geniuscat.co.kr | 010-8440-9820
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
