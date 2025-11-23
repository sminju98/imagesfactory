'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, DollarSign, Send, Shield, LogOut, Users, CreditCard } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');
  
  // 사용자 관리
  const [email, setEmail] = useState('');
  const [points, setPoints] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);

  // 입금 대기 목록
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  useEffect(() => {
    // 관리자 인증 확인
    const isAdmin = sessionStorage.getItem('adminAuth') === 'true';
    const loginTime = parseInt(sessionStorage.getItem('adminLoginTime') || '0');
    const now = Date.now();
    
    // 24시간 경과 체크
    if (isAdmin && (now - loginTime < 24 * 60 * 60 * 1000)) {
      setAuthenticated(true);
      fetchPendingPayments();
      
      // 10초마다 자동 갱신
      const interval = setInterval(() => {
        fetchPendingPayments();
      }, 10000);
      
      return () => clearInterval(interval);
    } else {
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminLoginTime');
      router.push('/admin/login');
    }
  }, [router]);

  const fetchPendingPayments = async () => {
    try {
      // Admin API로 입금 목록 조회
      const response = await fetch('/api/admin/pending-payments');
      const data = await response.json();
      
      if (data.success) {
        // 최근순 정렬
        const sorted = data.data.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setPendingPayments(sorted);
        console.log('✅ 입금 목록 조회:', sorted.length, '건');
      } else {
        console.error('입금 목록 조회 실패:', data.error);
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('입금 목록 조회 에러:', error);
      setPendingPayments([]);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminLoginTime');
    router.push('/admin/login');
  };

  // 사용자 검색 (Admin API 사용)
  const searchUser = async () => {
    try {
      setLoading(true);
      setMessage('');
      setFoundUser(null);

      const response = await fetch('/api/admin/search-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setFoundUser(data.data);
        setMessage(`✅ 사용자 발견: ${data.data.displayName} (현재 포인트: ${data.data.points?.toLocaleString() || 0}pt)`);
      } else {
        setMessage('❌ 사용자를 찾을 수 없습니다');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setMessage(`❌ 검색 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 지급 (Admin API 사용)
  const addPoints = async () => {
    if (!foundUser) {
      setMessage('❌ 먼저 사용자를 검색하세요');
      return;
    }

    if (points <= 0) {
      setMessage('❌ 포인트는 0보다 커야 합니다');
      return;
    }

    try {
      setLoading(true);

      const currentPoints = foundUser.points || 0;

      const response = await fetch('/api/admin/add-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: foundUser.id,
          points,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newPoints = data.data.newBalance;
        setMessage(`✅ 포인트 지급 완료!\n현재 포인트: ${currentPoints.toLocaleString()}pt → ${newPoints.toLocaleString()}pt`);
        setFoundUser({ ...foundUser, points: newPoints });
      } else {
        setMessage(`❌ 포인트 지급 실패: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Add points error:', error);
      setMessage(`❌ 포인트 지급 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 입금 승인
  const approvePayment = async (payment: any) => {
    const confirmed = confirm(
      `입금을 승인하시겠습니까?\n\n입금자: ${payment.depositorName}\n금액: ${payment.amount?.toLocaleString()}원\n포인트: ${payment.points?.toLocaleString()}pt`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ 입금 승인 완료! 포인트가 충전되었습니다.');
        // 목록 새로고침
        await fetchPendingPayments();
      } else {
        alert('승인 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('승인 중 오류가 발생했습니다');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
                <p className="text-sm text-gray-600">ImageFactory 관리 시스템</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-2 border border-gray-200 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'users'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>사용자 관리</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'payments'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>입금 승인 ({pendingPayments.length})</span>
            </button>
          </div>
        </div>

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <>
            {/* Search User */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                사용자 검색
              </h2>
              
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 입력"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={searchUser}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  검색
                </button>
              </div>

              {foundUser && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{foundUser.displayName}</p>
                      <p className="text-sm text-gray-600">{foundUser.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">현재 포인트</p>
                      <p className="text-2xl font-bold text-red-600">
                        {(foundUser.points || 0).toLocaleString()}pt
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Points */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                포인트 지급
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지급 포인트
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    placeholder="포인트 입력"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Quick Buttons */}
                <div className="flex space-x-2">
                  <button onClick={() => setPoints(1000)} className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                    +1,000
                  </button>
                  <button onClick={() => setPoints(10000)} className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                    +10,000
                  </button>
                  <button onClick={() => setPoints(100000)} className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                    +100,000
                  </button>
                  <button onClick={() => setPoints(1000000)} className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                    +1,000,000
                  </button>
                </div>

                <button
                  onClick={addPoints}
                  disabled={loading || !foundUser}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{loading ? '처리 중...' : '포인트 지급'}</span>
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                <pre className="whitespace-pre-wrap text-sm">{message}</pre>
              </div>
            )}
          </>
        )}

        {/* 입금 승인 탭 */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                입금 관리 
                <span className="ml-2 text-sm text-yellow-600">
                  (대기: {pendingPayments.filter(p => p.status === 'pending').length}건)
                </span>
              </h2>
              <button
                onClick={fetchPendingPayments}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                새로고침
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                입금 요청이 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => {
                  const createdAt = payment.createdAt?.toDate ? new Date(payment.createdAt.toDate()) : new Date();
                  const isPending = payment.status === 'pending';
                  const isCompleted = payment.status === 'completed';

                  return (
                    <div key={payment.id} className={`border rounded-xl p-6 transition-colors ${
                      isPending ? 'border-yellow-300 bg-yellow-50' : 
                      isCompleted ? 'border-green-300 bg-green-50' : 
                      'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {isPending ? (
                              <span className="px-3 py-1 bg-yellow-200 text-yellow-900 text-xs font-semibold rounded-full">
                                ⏳ 입금 대기
                              </span>
                            ) : isCompleted ? (
                              <span className="px-3 py-1 bg-green-200 text-green-900 text-xs font-semibold rounded-full">
                                ✅ 처리 완료
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-200 text-gray-900 text-xs font-semibold rounded-full">
                                {payment.status}
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {createdAt.toLocaleString('ko-KR')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-600">입금자명</p>
                              <p className="font-bold text-gray-900">{payment.depositorName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">사용자</p>
                              <p className="font-bold text-gray-900">{payment.userDisplayName}</p>
                              <p className="text-xs text-gray-500">{payment.userEmail}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">입금 금액</p>
                              <p className="text-xl font-bold text-red-600">{payment.amount?.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">충전 포인트</p>
                              <p className="text-xl font-bold text-green-600">{payment.points?.toLocaleString()}pt</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => approvePayment(payment)}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                      >
                        ✅ 입금 승인 및 포인트 충전
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

