'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">개인정보처리방침</h1>
          </div>

          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 1 조 (개인정보의 처리 목적)</h2>
              <p>
                엠제이스튜디오(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 
                처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>회원 가입 및 관리: 회원제 서비스 제공, 본인확인</li>
                <li>서비스 제공: AI 이미지 생성, 결과 이메일 발송</li>
                <li>결제 및 정산: 포인트 충전, 결제 처리</li>
                <li>고객 지원: 문의 응대, 불만 처리</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 2 조 (처리하는 개인정보 항목)</h2>
              <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>필수항목:</strong> 이메일, 비밀번호, 이름</li>
                <li><strong>선택항목:</strong> 프로필 사진</li>
                <li><strong>자동수집:</strong> IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 3 조 (개인정보의 보유 및 이용기간)</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 
                    동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                <li>회원 탈퇴 시 지체없이 파기합니다. 단, 관련 법령에 의한 정보보유 사유가 있는 경우 
                    해당 기간 동안 보관합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 4 조 (개인정보의 제3자 제공)</h2>
              <p>
                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 
                    수사기관의 요구가 있는 경우</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 5 조 (개인정보처리의 위탁)</h2>
              <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>Firebase (Google):</strong> 데이터 저장 및 인증</li>
                <li><strong>OpenAI, Replicate 등:</strong> AI 이미지 생성</li>
                <li><strong>Gmail SMTP:</strong> 이메일 발송</li>
                <li><strong>토스페이먼츠:</strong> 결제 처리</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 6 조 (정보주체의 권리·의무 및 행사방법)</h2>
              <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
                <li>회원 탈퇴 (동의 철회)</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 7 조 (개인정보의 파기)</h2>
              <p>
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
                지체없이 해당 개인정보를 파기합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 8 조 (개인정보 보호책임자)</h2>
              <div className="bg-gray-50 rounded-lg p-6 mt-4">
                <p className="font-bold mb-2">개인정보 보호책임자:</p>
                <ul className="space-y-1">
                  <li>• 성명: 송민주</li>
                  <li>• 직책: 대표</li>
                  <li>• 이메일: webmaster@geniuscat.co.kr</li>
                  <li>• 전화: 010-8440-9820</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 9 조 (쿠키의 운영 및 거부)</h2>
              <p>
                회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키를 사용합니다. 
                이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저에서 옵션을 설정함으로써 
                쿠키를 거부할 수 있습니다.
              </p>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>시행일:</strong> 2025년 11월 23일
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>개인정보 보호책임자:</strong> 송민주 (webmaster@geniuscat.co.kr | 010-8440-9820)
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

