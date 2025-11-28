'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { RefreshCcw, AlertCircle, CheckCircle, XCircle, Mail, Clock, Shield } from 'lucide-react';

export default function RefundPolicyPage() {
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
              <h1 className="text-3xl font-bold text-gray-900">환불 정책</h1>
              <p className="text-gray-500">Refund Policy</p>
            </div>
          </div>

          {/* 요약 배너 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">기본 원칙</h3>
                <ul className="text-amber-800 space-y-1 text-sm">
                  <li>• 디지털 콘텐츠·크레딧 특성상, 이미 사용한 크레딧과 생성 완료된 이미지에 대해서는 원칙적으로 <strong>환불이 불가</strong>합니다.</li>
                  <li>• 서비스 장애나 결제 오류 등 <strong>&quot;사용자 과실이 아닌 경우&quot;</strong>에 한해 예외적으로 환불 또는 크레딧 복구를 제공합니다.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="prose max-w-none text-gray-700 space-y-8">
            {/* 1. 요금제 유형별 환불 정책 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                요금제 유형별 환불 정책
              </h2>
              
              {/* 크레딧 팩 */}
              <div className="bg-blue-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-bold text-blue-900 mb-3">💳 크레딧 팩 (일회성 구매)</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">결제 후 전혀 사용하지 않은 크레딧</p>
                      <p className="text-gray-600 text-sm">결제일로부터 <strong>7일 이내</strong> 환불 요청 시 전액 환불</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">일부 사용한 크레딧</p>
                      <p className="text-gray-600 text-sm">사용한 분량은 환불 불가, 남은 크레딧은 원칙적으로 환불하지 않으며, 예외적인 서비스 장애 시에만 개별 검토</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 구독 요금제 */}
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">📅 구독 요금제 (월/연 단위)</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">현재 청구 기간 중 이미 활성화된 구독</p>
                      <p className="text-gray-600 text-sm">사용 여부와 관계없이 중도 해지에 따른 부분 환불은 제공하지 않음</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">구독 취소</p>
                      <p className="text-gray-600 text-sm">다음 결제부터 과금 중단을 원할 경우, 갱신일 전까지 언제든지 구독 취소 가능</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">시스템 오류·중복 결제</p>
                      <p className="text-gray-600 text-sm">명백한 청구 오류가 확인될 경우, 해당 결제 건 전액 환불 또는 동일 금액 크레딧 지급</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 환불 불가 기준 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                환불 불가 기준
              </h2>
              <div className="bg-red-50 rounded-xl p-6">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p><strong>이미지 생성이 정상적으로 완료된 경우:</strong> 결과물이 마음에 들지 않는다는 이유만으로는 환불/사용량 복구 불가</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p><strong>무료 크레딧:</strong> 프로모션·이벤트로 지급된 무료 크레딧, 보너스 크레딧, 추천 보상 크레딧</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p><strong>특가 상품:</strong> 세일/할인 가격으로 구입한 특가 상품(명시된 경우)</p>
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. 환불 요청 절차 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                환불 요청 절차
              </h2>
              <div className="bg-green-50 rounded-xl p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 mb-2">고객센터 이메일로 아래 정보를 포함해 문의:</p>
                    <ul className="text-gray-600 text-sm space-y-1 ml-4">
                      <li>• 계정 이메일</li>
                      <li>• 결제 일시 및 금액</li>
                      <li>• 결제 수단 (카드·PG사 등)</li>
                      <li>• 환불 사유 및 관련 스크린샷 (서비스 장애가 있었다면 에러 화면 등)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">처리 기간</p>
                    <p className="text-gray-600 text-sm">운영팀은 접수 후 통상 <strong>7영업일 이내</strong>에 승인 여부를 안내하며, 승인 시 원 결제 수단으로 환불을 진행합니다.</p>
                    <p className="text-gray-500 text-sm mt-1">※ 카드사·결제사 정책에 따라 실제 입금까지 최대 14영업일 정도 소요될 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. 서비스 장애 및 예외 처리 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                서비스 장애 및 예외 처리
              </h2>
              <div className="bg-amber-50 rounded-xl p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">
                    서버 장애, 결제는 됐으나 크레딧이 충전되지 않은 경우, 반복적인 실패로 이미지 생성 자체가 되지 않은 경우 등 
                    <strong> 서비스 책임이 명확한 상황</strong>에서는 <strong>전액 환불 또는 동일 금액 이상의 크레딧 지급</strong>을 원칙으로 합니다.
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  대규모 장애 등 특별한 상황에서는 별도의 공지와 함께 일시적인 사용량 복구나 추가 크레딧 지급 정책을 시행할 수 있습니다.
                </p>
              </div>
            </section>

            {/* 5. 정책 변경 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                정책 변경
              </h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <ul className="space-y-2 text-gray-700">
                  <li>• ImageFactory 환불 정책은 서비스 개선을 위해 수시로 변경될 수 있으며, 변경 사항은 <strong>공지사항 또는 이메일</strong>을 통해 사전 안내합니다.</li>
                  <li>• 변경된 정책은 공지된 시행일 이후 발생한 결제 건부터 적용됩니다.</li>
                </ul>
              </div>
            </section>
          </div>

          {/* 연락처 */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="font-bold text-indigo-900 mb-3">📧 환불 문의</h3>
              <p className="text-indigo-800">
                <strong>이메일:</strong> <a href="mailto:webmaster@geniuscat.co.kr" className="text-indigo-600 hover:underline">webmaster@geniuscat.co.kr</a>
              </p>
              <p className="text-indigo-800">
                <strong>전화:</strong> <a href="tel:010-8440-9820" className="text-indigo-600 hover:underline">010-8440-9820</a>
              </p>
              <p className="text-sm text-indigo-600 mt-2">평일 10:00 - 18:00 (주말·공휴일 휴무)</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <strong>시행일:</strong> 2025년 11월 28일
            </p>
          </div>

          {/* 버튼 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/terms"
              className="inline-block px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold text-center"
            >
              이용약관 보기
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-center"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

