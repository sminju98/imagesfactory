'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, User as UserIcon, Mail, Calendar, Award, Image as ImageIcon, TrendingUp, CreditCard, Settings, LogOut, Loader2 } from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [authLoading, firebaseUser, router]);

  useEffect(() => {
    if (user) {
      fetchRecentGenerations();
    }
  }, [user]);

  const fetchRecentGenerations = async () => {
    if (!user) return;

    try {
      const generationsRef = collection(db, 'imageGenerations');
      const q = query(
        generationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      
      const snapshot = await getDocs(q);
      const generations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setRecentGenerations(generations);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut(auth);
      router.push('/');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">imagesfactory</h1>
                <p className="text-xs text-gray-500">by 엠제이스튜디오</p>
              </div>
            </Link>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">현재 포인트</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {user.points.toLocaleString()}
                </p>
              </div>
              <Link
                href="/points"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                포인트 충전
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 sticky top-24">
              {/* Profile */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-900">{user.displayName}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              {/* Menu */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">대시보드</span>
                </button>

                <button
                  onClick={() => setActiveTab('points')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'points'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Award className="w-5 h-5" />
                  <span className="font-medium">포인트</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'history'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-medium">히스토리</span>
                </button>

                <button
                  onClick={() => setActiveTab('payment')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'payment'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">결제 내역</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">설정</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">로그아웃</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{user.points.toLocaleString()}</span>
                    </div>
                    <p className="text-indigo-100">보유 포인트</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <ImageIcon className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{user.stats?.totalImages || 0}</span>
                    </div>
                    <p className="text-purple-100">총 생성 이미지</p>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{user.stats?.totalGenerations || 0}</span>
                    </div>
                    <p className="text-pink-100">총 생성 작업</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 실행</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Link
                      href="/"
                      className="p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-center"
                    >
                      <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">새 이미지 생성</p>
                    </Link>
                    <Link
                      href="/points"
                      className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-center"
                    >
                      <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">포인트 충전</p>
                    </Link>
                  </div>
                </div>

                {/* Recent Generations */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">최근 생성 이미지</h2>
                    <Link href="/history" className="text-sm text-indigo-600 hover:underline">
                      전체 보기 →
                    </Link>
                  </div>

                  {loadingData ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : recentGenerations.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">아직 생성한 이미지가 없습니다</p>
                      <Link
                        href="/"
                        className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        첫 이미지 생성하기
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {recentGenerations.map((gen) => (
                        <div
                          key={gen.id}
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                        >
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Points Tab */}
            {activeTab === 'points' && (
              <div className="space-y-6">
                {/* 포인트 잔액 */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">현재 포인트</h2>
                  <p className="text-5xl font-bold mb-4">{user.points.toLocaleString()}</p>
                  <p className="text-indigo-100">약 {Math.floor(user.points / 100)}장의 이미지 생성 가능</p>
                  <Link
                    href="/points"
                    className="inline-block mt-6 px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    포인트 충전하기
                  </Link>
                </div>

                {/* 포인트 패키지 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">포인트 패키지</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: '스타터', points: 1000, price: 5000, discount: 0 },
                      { name: '베이직', points: 3000, price: 13500, discount: 10 },
                      { name: '프로', points: 10000, price: 40000, discount: 20, popular: true },
                      { name: '비즈니스', points: 30000, price: 105000, discount: 30 },
                    ].map((pkg) => (
                      <div
                        key={pkg.name}
                        className={`relative border-2 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                          pkg.popular
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                              인기
                            </span>
                          </div>
                        )}
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{pkg.name}</h4>
                        <p className="text-3xl font-bold text-indigo-600 mb-1">
                          {pkg.points.toLocaleString()}
                          <span className="text-lg text-gray-600">pt</span>
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mb-3">
                          ₩{pkg.price.toLocaleString()}
                        </p>
                        {pkg.discount > 0 && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded mb-3">
                            {pkg.discount}% 할인
                          </span>
                        )}
                        <p className="text-sm text-gray-600 mb-4">
                          약 {Math.floor(pkg.points / 100)}장 생성 가능
                        </p>
                        <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                          구매하기
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 사용 내역 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">최근 거래 내역</h3>
                  <div className="space-y-3">
                    {/* 예시 데이터 */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">가입 보너스</p>
                        <p className="text-sm text-gray-500">2025-11-23 10:00</p>
                      </div>
                      <span className="text-lg font-bold text-green-600">+1,000pt</span>
                    </div>
                    
                    {recentGenerations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        거래 내역이 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* 프로필 정보 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">프로필 정보</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이름
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={user.displayName}
                          readOnly
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={user.email}
                          readOnly
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      {!user.emailVerified && (
                        <p className="mt-2 text-sm text-yellow-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          이메일 인증이 필요합니다
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        가입일
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={new Date(user.createdAt.toDate()).toLocaleDateString('ko-KR')}
                          readOnly
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        로그인 방식
                      </label>
                      <div className="flex items-center space-x-2">
                        {user.provider === 'google' ? (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-gray-700">Google</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">이메일</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 통계 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">사용 통계</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">총 사용 포인트</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(user.stats?.totalPointsUsed || 0).toLocaleString()}
                        <span className="text-sm text-gray-600 ml-1">pt</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">총 구매 포인트</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(user.stats?.totalPointsPurchased || 0).toLocaleString()}
                        <span className="text-sm text-gray-600 ml-1">pt</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Points Tab */}
            {activeTab === 'points' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">포인트 관리</h3>
                <p className="text-gray-600">포인트 충전 기능은 곧 추가됩니다.</p>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">생성 히스토리</h3>
                <p className="text-gray-600">히스토리 기능은 곧 추가됩니다.</p>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">결제 내역</h3>
                <p className="text-gray-600">결제 내역 기능은 곧 추가됩니다.</p>
              </div>
            )}

            {/* Settings Tab Detail */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">설정</h3>
                  <p className="text-gray-600">설정 기능은 곧 추가됩니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">imagesfactory</h3>
              <p className="text-gray-400 text-sm">
                여러 AI 모델로 한 번에<br />
                수십 장의 이미지를 생성하세요
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>이메일: support@imagesfactory.com</li>
                <li>전화: 010-4882-9820</li>
                <li>평일 10:00 - 18:00</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">회사 정보</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>상호명: 엠제이스튜디오(MJ)</li>
                <li>대표: 송민주</li>
                <li>사업자번호: 829-04-03406</li>
                <li>통신판매업: 2025-서울강남-06359</li>
                <li>주소: 서울특별시 강남구 봉은사로30길 68, 6층-S42호</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 엠제이스튜디오. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

