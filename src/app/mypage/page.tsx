'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, User as UserIcon, Mail, Calendar, Award, Image as ImageIcon, TrendingUp, CreditCard, Settings, LogOut, Loader2, AlertCircle } from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [pointStats, setPointStats] = useState({
    totalUsed: 0,
    totalPurchased: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [authLoading, firebaseUser, router]);

  useEffect(() => {
    if (user) {
      fetchRecentGenerations();
      fetchPointStats();
      fetchTransactions();
      fetchPayments();
    }
  }, [user]);

  // 결제 내역 조회
  const fetchPayments = async () => {
    if (!user) return;

    try {
      console.log('💳 결제 내역 조회 시작');
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const pmts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setPayments(pmts);
      console.log('✅ 결제 내역 조회 완료:', pmts.length, '건');
    } catch (error) {
      console.error('결제 내역 조회 에러:', error);
    }
  };

  // 거래 내역 조회 (전체)
  const fetchTransactions = async () => {
    if (!user) return;

    try {
      console.log('💰 거래 내역 조회 시작');
      const transactionsRef = collection(db, 'pointTransactions');
      const q = query(
        transactionsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
        // limit 제거 - 전체 조회
      );
      
      const snapshot = await getDocs(q);
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setTransactions(txs);
      console.log('✅ 거래 내역 조회 완료:', txs.length, '건');
    } catch (error) {
      console.error('거래 내역 조회 에러:', error);
    }
  };

  // 포인트 통계 조회
  const fetchPointStats = async () => {
    if (!user) return;

    try {
      console.log('💰 포인트 통계 조회 시작');
      const transactionsRef = collection(db, 'pointTransactions');
      const q = query(
        transactionsRef,
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      console.log('✅ 거래 내역 조회:', snapshot.size, '건');
      
      let totalUsed = 0;
      let totalPurchased = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'usage') {
          totalUsed += Math.abs(data.amount);
        } else if (data.type === 'purchase') {
          totalPurchased += data.amount;
        }
      });
      
      setPointStats({ totalUsed, totalPurchased });
      console.log('📊 통계:', { totalUsed, totalPurchased });
    } catch (error) {
      console.error('포인트 통계 조회 에러:', error);
    }
  };

  const fetchRecentGenerations = async () => {
    if (!user) return;

    try {
      console.log('🔍 히스토리 조회 시작:', user.uid);
      const generationsRef = collection(db, 'imageGenerations');
      const q = query(
        generationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        firestoreLimit(6)
      );
      
      const snapshot = await getDocs(q);
      console.log('✅ 히스토리 조회 완료:', snapshot.size, '개');
      
      const generations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('📝 히스토리 데이터:', generations);
      setRecentGenerations(generations);
    } catch (error: any) {
      console.error('🔴 히스토리 조회 에러:', error);
      console.error('🔴 에러 코드:', error.code);
      console.error('🔴 에러 메시지:', error.message);
      
      if (error.code === 'failed-precondition') {
        console.error('⚠️ Firestore 복합 인덱스가 필요합니다!');
        console.error('⚠️ Firebase Console에서 인덱스를 생성해주세요');
      }
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
                <h1 className="text-2xl font-bold text-gray-900">ImageFactory</h1>
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
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors hidden sm:block"
              >
                포인트 충전
              </Link>
              <Link
                href="/points"
                className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs leading-tight block sm:hidden"
              >
                포인트<br/>충전
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
                <h3 className="font-bold text-gray-900 text-lg">{user.displayName}</h3>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
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
                        <Link
                          key={gen.id}
                          href={`/generation/${gen.id}`}
                          className="group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 hover:shadow-xl transition-all relative"
                        >
                          {gen.imageUrls && gen.imageUrls[0] ? (
                            <>
                              <img
                                src={gen.imageUrls[0]}
                                alt="생성된 이미지"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded text-sm font-semibold">
                                  자세히 보기
                                </span>
                              </div>
                              {gen.totalImages && gen.totalImages > 1 && (
                                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                  +{gen.totalImages - 1}
                                </div>
                              )}
                            </>
                          ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                          )}
                        </Link>
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
                  <p className="text-indigo-100 mb-6">약 {Math.floor(user.points / 100)}장의 이미지 생성 가능</p>
                  <Link
                    href="/points"
                    className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    포인트 충전하기 →
                  </Link>
                </div>

                {/* 포인트 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100 border-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">💸 사용한 포인트</h3>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">지출</span>
                    </div>
                    <p className="text-4xl font-bold text-red-600 mb-2">
                      {pointStats.totalUsed.toLocaleString()}pt
                    </p>
                    <p className="text-sm text-gray-600">
                      약 {Math.floor(pointStats.totalUsed / 30)}장 생성
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 border-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">💰 충전한 포인트</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">충전</span>
                    </div>
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      {pointStats.totalPurchased.toLocaleString()}pt
                    </p>
                    <p className="text-sm text-gray-600">
                      약 {Math.floor(pointStats.totalPurchased / 30)}장 생성 가능
                    </p>
                  </div>
                </div>

                {/* 거래 내역 (충전/사용) */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">거래 내역</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      총 {transactions.length}건의 포인트 거래 내역
                      {transactions.length > itemsPerPage && ` (${currentPage}/${Math.ceil(transactions.length / itemsPerPage)} 페이지)`}
                    </p>
                    </div>
                    
                  <div className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        거래 내역이 없습니다
                      </div>
                    ) : (
                      transactions
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((tx) => {
                        const createdAt = tx.createdAt?.toDate ? new Date(tx.createdAt.toDate()) : new Date();
                        const isPositive = tx.amount > 0;
                        const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
                          purchase: { icon: '💰', label: '포인트 충전', color: 'text-green-600' },
                          usage: { icon: '🎨', label: '이미지 생성', color: 'text-red-600' },
                          refund: { icon: '↩️', label: '환불', color: 'text-blue-600' },
                          bonus: { icon: '🎁', label: '보너스', color: 'text-purple-600' },
                        };
                        const config = typeConfig[tx.type] || { icon: '📝', label: tx.type, color: 'text-gray-600' };

                        return (
                          <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xl">{config.icon}</span>
                                  <p className="font-semibold text-gray-900">{config.label}</p>
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                  {createdAt.toLocaleDateString('ko-KR')} {createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {tx.description && (
                                  <p className="text-xs text-gray-400">{tx.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                  <span>이전: {(tx.balanceBefore || 0).toLocaleString()}pt</span>
                                  <span>→</span>
                                  <span>이후: {(tx.balanceAfter || 0).toLocaleString()}pt</span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className={`text-2xl font-bold ${config.color}`}>
                                  {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">pt</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {transactions.length > itemsPerPage && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        {/* 이전 버튼 */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ←
                        </button>

                        {/* 페이지 번호 */}
                        {Array.from({ length: Math.ceil(transactions.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-300 hover:bg-white text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        {/* 다음 버튼 */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(transactions.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.ceil(transactions.length / itemsPerPage)}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
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
                      <p className="text-2xl font-bold text-red-600">
                        {pointStats.totalUsed.toLocaleString()}
                        <span className="text-sm text-gray-600 ml-1">pt</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        약 {Math.floor(pointStats.totalUsed / 100)}장 생성
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">총 구매 포인트</p>
                      <p className="text-2xl font-bold text-green-600">
                        {pointStats.totalPurchased.toLocaleString()}
                        <span className="text-sm text-gray-600 ml-1">pt</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(pointStats.totalPurchased / 1).toLocaleString()}원 충전
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">생성 히스토리</h3>
                  
                  {loadingData ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : recentGenerations.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">아직 생성한 이미지가 없습니다</p>
                      <Link
                        href="/"
                        className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                      >
                        첫 이미지 생성하기
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentGenerations.map((gen) => {
                        const createdAt = gen.createdAt?.toDate ? new Date(gen.createdAt.toDate()) : new Date();
                        const statusColors = {
                          pending: 'bg-yellow-100 text-yellow-800',
                          processing: 'bg-blue-100 text-blue-800',
                          completed: 'bg-green-100 text-green-800',
                          failed: 'bg-red-100 text-red-800',
                        };
                        const statusLabels = {
                          pending: '대기 중',
                          processing: '생성 중',
                          completed: '완료',
                          failed: '실패',
                        };

                        return (
                          <Link
                            key={gen.id}
                            href={`/generation/${gen.id}`}
                            className="block border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[gen.status as keyof typeof statusColors]}`}>
                                    {statusLabels[gen.status as keyof typeof statusLabels]}
                                  </span>
                                  {gen.status === 'processing' && (
                                    <span className="text-sm text-gray-600">
                                      {gen.progress || 0}% 완료
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-900 font-medium line-clamp-2 mb-2">
                                  {gen.prompt}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>📅 {createdAt.toLocaleDateString('ko-KR')} {createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>🖼️ {gen.totalImages || 0}장</span>
                                  <span>💰 {(gen.totalPoints || 0).toLocaleString()}pt</span>
                                </div>
                              </div>
                              {gen.status === 'completed' && gen.imageUrls && gen.imageUrls[0] && (
                                <div className="ml-4 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={gen.imageUrls[0]}
                                    alt="썸네일"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>

                            {/* 모델 정보 */}
                            {gen.modelConfigs && Array.isArray(gen.modelConfigs) && gen.modelConfigs.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                {gen.modelConfigs.map((config: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {config.modelId} ({config.count}장)
                                  </span>
                                ))}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                {/* 결제 내역 목록 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">결제 내역</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      총 {payments.length}건의 결제 내역
                      {payments.length > itemsPerPage && ` (${paymentPage}/${Math.ceil(payments.length / itemsPerPage)} 페이지)`}
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {payments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        결제 내역이 없습니다
                      </div>
                    ) : (
                      payments
                        .slice((paymentPage - 1) * itemsPerPage, paymentPage * itemsPerPage)
                        .map((payment) => {
                          const createdAt = payment.createdAt?.toDate ? new Date(payment.createdAt.toDate()) : new Date();
                          const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                            completed: { label: '✅ 완료', color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
                            pending: { label: '⏳ 대기', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-200' },
                            failed: { label: '❌ 실패', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
                            cancelled: { label: '🚫 취소', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
                          };
                          const config = statusConfig[payment.status] || statusConfig.pending;

                          return (
                            <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
                                      {config.label}
                                    </span>
                                    {payment.paymentMethod && (
                                      <span className="text-xs text-gray-500">
                                        {payment.paymentMethod}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-gray-900 mb-1">
                                    포인트 충전 ({(payment.points || 0).toLocaleString()}pt)
                                  </p>
                                  <p className="text-sm text-gray-500 mb-2">
                                    {createdAt.toLocaleDateString('ko-KR')} {createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {payment.orderId && (
                                    <p className="text-xs text-gray-400">주문번호: {payment.orderId}</p>
                                  )}
                                  {payment.failReason && (
                                    <p className="text-xs text-red-500 mt-1">실패 사유: {payment.failReason}</p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-3xl font-bold text-gray-900">
                                    {(payment.amount || 0).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-gray-500">원</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {payments.length > itemsPerPage && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setPaymentPage(prev => Math.max(1, prev - 1))}
                          disabled={paymentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ←
                        </button>

                        {Array.from({ length: Math.ceil(payments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setPaymentPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              paymentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-300 hover:bg-white text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setPaymentPage(prev => Math.min(Math.ceil(payments.length / itemsPerPage), prev + 1))}
                          disabled={paymentPage === Math.ceil(payments.length / itemsPerPage)}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ImageFactory</h3>
              <p className="text-gray-400 text-sm">
                여러 AI 모델로 한 번에<br />
                수십 장의 이미지를 생성하세요
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  이메일: <a href="mailto:webmaster@geniuscat.co.kr" className="hover:text-white transition-colors">
                    webmaster@geniuscat.co.kr
                  </a>
                </li>
                <li>
                  전화: <a href="tel:010-8440-9820" className="hover:text-white transition-colors">
                    010-8440-9820
                  </a>
                </li>
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
            <div>
              <h4 className="font-bold mb-4">약관 및 정책</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    개인정보처리방침
                  </Link>
                </li>
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

