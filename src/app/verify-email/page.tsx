'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Sparkles, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // 이미 인증된 경우
    if (currentUser.emailVerified) {
      router.push('/');
      return;
    }

    // 이메일 재발송 여부 물어보기
    const askResend = async () => {
      const shouldResend = confirm(
        '이메일 인증이 필요합니다.\n\n인증 메일을 다시 받으시겠습니까?'
      );

      if (shouldResend) {
        try {
          await sendEmailVerification(currentUser);
          setMessage('✅ 인증 메일이 발송되었습니다! 메일함을 확인해주세요.');
        } catch (error: any) {
          if (error.code === 'auth/too-many-requests') {
            setMessage('❌ 너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.');
          } else {
            setMessage('❌ 인증 메일 발송에 실패했습니다.');
          }
        }
      } else {
        setMessage('📧 이미 발송된 인증 메일을 확인해주세요.');
      }
    };

    // 1초 후 물어보기 (페이지 로드 후)
    setTimeout(askResend, 1000);
  }, [router]);

  const handleResendEmail = async () => {
    if (!user) return;

    try {
      setSending(true);
      setMessage('');
      
      await sendEmailVerification(user);
      
      setMessage('✅ 인증 메일이 발송되었습니다! 메일함을 확인해주세요.');
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      if (error.code === 'auth/too-many-requests') {
        setMessage('❌ 너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setMessage('❌ 인증 메일 발송에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;

    try {
      await reload(user);
      
      if (user.emailVerified) {
        alert('이메일 인증이 완료되었습니다! 🎉');
        router.push('/');
      } else {
        alert('아직 인증되지 않았습니다. 메일함을 확인해주세요.');
      }
    } catch (error) {
      console.error('Check verification error:', error);
      alert('인증 상태 확인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">ImageFactory</h1>
              <p className="text-xs text-gray-500">by 엠제이스튜디오</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <Mail className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일 인증</h2>
            <p className="text-gray-600">
              {user?.email}
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border flex items-start space-x-2 ${
              message.includes('✅') 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {message.includes('✅') ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-800">
                📧 회원가입 시 발송된 인증 메일의 링크를 클릭해주세요.
              </p>
            </div>

            <button
              onClick={handleResendEmail}
              disabled={sending}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '발송 중...' : '인증 메일 재발송'}
            </button>

            <button
              onClick={handleCheckVerification}
              className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all"
            >
              인증 완료 확인
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                메일이 오지 않았나요?
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• 스팸 메일함을 확인해주세요</li>
                <li>• 최대 5분 정도 소요될 수 있습니다</li>
                <li>• 재발송은 1분에 1회만 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>문제가 계속되시나요?</p>
          <p className="mt-2">
            📧 <a href="mailto:webmaster@geniuscat.co.kr" className="text-indigo-600 hover:underline">webmaster@geniuscat.co.kr</a>
            {' '} | {' '}
            📞 <a href="tel:+82-10-8440-9820" className="text-indigo-600 hover:underline">(+82)-10-8440-9820</a>
          </p>
        </div>
      </div>
    </div>
  );
}

