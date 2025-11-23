'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, User, LogIn } from 'lucide-react';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Desktop - 기존 레이아웃 */}
        <div className="hidden md:flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">imagesfactory</h1>
              <p className="text-xs text-gray-500">by 엠제이스튜디오</p>
            </div>
          </Link>

          {!loading && (
            <div className="flex items-center space-x-6">
              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">현재 포인트</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {user.points.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href="/points"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold shadow-md"
                  >
                    💰 포인트 충전
                  </Link>
                  <Link
                    href="/mypage"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>마이페이지</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>회원가입</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile - 2줄 레이아웃 */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">imagesfactory</h1>
                <p className="text-[10px] text-gray-500">by 엠제이스튜디오</p>
              </div>
            </Link>

            {!loading && user && (
              <div className="text-right">
                <p className="text-xs text-gray-600">포인트</p>
                <p className="text-lg font-bold text-indigo-600">
                  {user.points.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {!loading && (
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/points"
                    className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-semibold text-center"
                  >
                    💰 충전
                  </Link>
                  <Link
                    href="/mypage"
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-center flex items-center justify-center space-x-1"
                  >
                    <User className="w-4 h-4" />
                    <span>마이페이지</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold text-center border border-gray-300 rounded-lg"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold text-center flex items-center justify-center space-x-1"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>회원가입</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

