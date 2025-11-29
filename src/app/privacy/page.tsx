'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('privacy.title')}</h1>
          </div>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article1.title')}</h2>
              <p>{t('privacy.article1.intro')}</p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>{t('privacy.article1.item1')}</li>
                <li>{t('privacy.article1.item2')}</li>
                <li>{t('privacy.article1.item3')}</li>
                <li>{t('privacy.article1.item4')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article2.title')}</h2>
              <p>{t('privacy.article2.intro')}</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>{t('privacy.article2.required')}</strong></li>
                <li><strong>{t('privacy.article2.optional')}</strong></li>
                <li><strong>{t('privacy.article2.auto')}</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article3.title')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('privacy.article3.item1')}</li>
                <li>{t('privacy.article3.item2')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article4.title')}</h2>
              <p>{t('privacy.article4.intro')}</p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>{t('privacy.article4.item1')}</li>
                <li>{t('privacy.article4.item2')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article5.title')}</h2>
              <p>{t('privacy.article5.intro')}</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>{t('privacy.article5.firebase')}</strong></li>
                <li><strong>{t('privacy.article5.ai')}</strong></li>
                <li><strong>{t('privacy.article5.email')}</strong></li>
                <li><strong>{t('privacy.article5.payment')}</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article6.title')}</h2>
              <p>{t('privacy.article6.intro')}</p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>{t('privacy.article6.item1')}</li>
                <li>{t('privacy.article6.item2')}</li>
                <li>{t('privacy.article6.item3')}</li>
                <li>{t('privacy.article6.item4')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article7.title')}</h2>
              <p>{t('privacy.article7.content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article8.title')}</h2>
              <div className="bg-gray-50 rounded-lg p-6 mt-4">
                <p className="font-bold mb-2">{t('privacy.article8.label')}</p>
                <ul className="space-y-1">
                  <li>• {t('privacy.article8.name')}</li>
                  <li>• {t('privacy.article8.position')}</li>
                  <li>• {t('privacy.article8.email')}</li>
                  <li>• {t('privacy.article8.phone')}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.article9.title')}</h2>
              <p>{t('privacy.article9.content')}</p>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>{t('common.effectiveDate')}:</strong> 2025-11-28
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>{t('privacy.officer')}:</strong> 송민주 (webmaster@geniuscat.co.kr | (+82)-10-8440-9820)
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
