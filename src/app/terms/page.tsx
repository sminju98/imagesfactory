'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">이용약관</h1>
          </div>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 1 조 (목적)</h2>
              <p>
                본 약관은 엠제이스튜디오(이하 "회사")가 운영하는 ImageFactory(이하 "서비스")의 이용과 관련하여 
                회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 2 조 (정의)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>"서비스"란 회사가 제공하는 AI 이미지 생성 플랫폼을 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이란 서비스에 회원가입을 하여 서비스를 이용하는 자를 말합니다.</li>
                <li>"포인트"란 서비스 이용을 위한 사이버 자산으로, 이미지 생성에 사용됩니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 3 조 (약관의 명시와 개정)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                <li>약관이 개정될 경우 적용일자 및 개정사유를 명시하여 공지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 4 조 (서비스의 제공 및 변경)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>AI 이미지 생성 서비스</li>
                    <li>포인트 충전 및 관리</li>
                    <li>생성된 이미지 저장 및 다운로드</li>
                    <li>이메일 전송 서비스</li>
                  </ul>
                </li>
                <li>회사는 서비스의 내용을 변경할 수 있으며, 변경 시 사전에 공지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 5 조 (포인트 정책)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>포인트는 유료 결제를 통해 충전할 수 있습니다.</li>
                <li>충전된 포인트의 유효기간은 충전일로부터 5년입니다.</li>
                <li>포인트는 현금으로 환불되지 않습니다.</li>
                <li>회원 탈퇴 시 잔여 포인트는 자동 소멸됩니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 6 조 (저작권)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>생성된 이미지의 저작권은 이용자에게 귀속됩니다.</li>
                <li>다만, 생성된 이미지를 불법적인 용도로 사용할 수 없습니다.</li>
                <li>회사는 서비스 개선을 위해 생성된 이미지를 통계 및 분석 목적으로 사용할 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 7 조 (면책조항)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
                <li>회사는 생성된 이미지의 상업적 사용으로 인한 법적 문제에 대해 책임지지 않습니다.</li>
              </ol>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>시행일:</strong> 2025년 11월 23일
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>문의:</strong> webmaster@geniuscat.co.kr | 010-8440-9820
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

