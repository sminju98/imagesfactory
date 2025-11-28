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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 7 조 (환불 정책)</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">1. 기본 원칙</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>디지털 콘텐츠·크레딧 특성상, 이미 사용한 크레딧과 생성 완료된 이미지에 대해서는 원칙적으로 환불이 불가합니다.</li>
                <li>서비스 장애나 결제 오류 등 &quot;사용자 과실이 아닌 경우&quot;에 한해 예외적으로 환불 또는 크레딧 복구를 제공합니다.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2. 요금제 유형별 환불 정책</h3>
              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium text-gray-700">크레딧 팩(일회성 구매)</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
                    <li>결제 후 전혀 사용하지 않은 크레딧: 결제일로부터 7일 이내 환불 요청 시 전액 환불.</li>
                    <li>일부 사용한 크레딧: 사용한 분량은 환불 불가, 남은 크레딧은 원칙적으로 환불하지 않으며, 예외적인 서비스 장애 시에만 개별 검토.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-700">구독 요금제(월/연 단위)</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
                    <li>현재 청구 기간 중 이미 활성화된 구독: 사용 여부와 관계없이 중도 해지에 따른 부분 환불은 제공하지 않음.</li>
                    <li>다음 결제부터 과금 중단을 원할 경우, 갱신일 전까지 언제든지 구독 취소 가능.</li>
                    <li>시스템 오류·중복 결제 등 명백한 청구 오류가 확인될 경우, 해당 결제 건 전액 환불 또는 동일 금액 크레딧 지급.</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">3. 환불 불가 기준</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>이미지 생성이 정상적으로 완료된 경우: 결과물이 마음에 들지 않는다는 이유만으로는 환불/사용량 복구 불가.</li>
                <li>프로모션·이벤트로 지급된 무료 크레딧, 보너스 크레딧, 추천 보상 크레딧.</li>
                <li>세일/할인 가격으로 구입한 특가 상품(명시된 경우).</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">4. 환불 요청 절차</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>앱 내 &quot;결제/청구&quot; 메뉴 또는 고객센터 이메일로 아래 정보를 포함해 문의:
                  <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                    <li>계정 이메일</li>
                    <li>결제 일시 및 금액</li>
                    <li>결제 수단(카드·PG사 등)</li>
                    <li>환불 사유 및 관련 스크린샷(서비스 장애가 있었다면 에러 화면 등)</li>
                  </ul>
                </li>
                <li>운영팀은 접수 후 통상 7영업일 이내에 승인 여부를 안내하며, 승인 시 원 결제 수단으로 환불을 진행합니다.</li>
                <li>카드사·결제사 정책에 따라 실제 입금까지 최대 14영업일 정도 소요될 수 있습니다.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">5. 서비스 장애 및 예외 처리</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>서버 장애, 결제는 됐으나 크레딧이 충전되지 않은 경우, 반복적인 실패로 이미지 생성 자체가 되지 않은 경우 등 서비스 책임이 명확한 상황에서는 전액 환불 또는 동일 금액 이상의 크레딧 지급을 원칙으로 합니다.</li>
                <li>대규모 장애 등 특별한 상황에서는 별도의 공지와 함께 일시적인 사용량 복구나 추가 크레딧 지급 정책을 시행할 수 있습니다.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">6. 정책 변경</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ImageFactory 환불 정책은 서비스 개선을 위해 수시로 변경될 수 있으며, 변경 사항은 공지사항 또는 이메일을 통해 사전 안내합니다.</li>
                <li>변경된 정책은 공지된 시행일 이후 발생한 결제 건부터 적용됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 8 조 (면책조항)</h2>
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

