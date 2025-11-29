'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, DollarSign, Send, Shield, LogOut, Users, CreditCard, Cpu, RefreshCw, 
  Image as ImageIcon, Eye, Edit2, X, Check, ChevronLeft, ChevronRight, 
  AlertTriangle, Download, RotateCcw, Plus, Minus
} from 'lucide-react';

interface AICredit {
  service: string;
  modelId: string;
  balance: number | string;
  unit: string;
  status: 'ok' | 'error' | 'unknown';
  error?: string;
  lastUpdated: string;
  lastSuccess?: string;
  successCount?: number;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  points: number;
  emailVerified: boolean;
  provider: string;
  stats: any;
  createdAt: string;
}

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  points: number;
  status: string;
  paymentMethod: string;
  orderId: string;
  depositorName: string;
  createdAt: string;
}

interface Generation {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  prompt: string;
  fullPrompt: string;
  totalImages: number;
  totalPoints: number;
  status: string;
  imageUrls: string[];
  completedJobs: number;
  failedJobs: number;
  createdAt: string;
}

type TabType = 'users' | 'payments' | 'generations' | 'pending' | 'ai-credits';

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // 공통
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 회원 관리
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userGallery, setUserGallery] = useState<any>(null);
  
  // 포인트 지급/차감
  const [pointModal, setPointModal] = useState<{ user: User; type: 'add' | 'subtract' } | null>(null);
  const [pointAmount, setPointAmount] = useState(0);
  const [pointReason, setPointReason] = useState('');

  // 결제 관리
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [refundingPayment, setRefundingPayment] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // 생성 기록
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [genSearch, setGenSearch] = useState('');
  const [genStatus, setGenStatus] = useState('');
  const [genPage, setGenPage] = useState(1);
  const [genTotal, setGenTotal] = useState(0);
  const [genStats, setGenStats] = useState<any>(null);
  const [selectedGen, setSelectedGen] = useState<any>(null);

  // 입금 대기
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // AI 크레딧
  const [aiCredits, setAiCredits] = useState<AICredit[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuth') === 'true';
    const loginTime = parseInt(sessionStorage.getItem('adminLoginTime') || '0');
    const now = Date.now();
    
    if (isAdmin && (now - loginTime < 24 * 60 * 60 * 1000)) {
      setAuthenticated(true);
      fetchPendingPayments();
      
      const interval = setInterval(() => {
        fetchPendingPayments();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      sessionStorage.removeItem('adminAuth');
      sessionStorage.removeItem('adminLoginTime');
      router.push('/admin/login');
    }
  }, [router]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!authenticated) return;
    
    switch (activeTab) {
      case 'users':
        fetchUsers();
        break;
      case 'payments':
        fetchPayments();
        break;
      case 'generations':
        fetchGenerations();
        break;
      case 'ai-credits':
        fetchAiCredits();
        break;
    }
  }, [activeTab, authenticated]);

  // ==================== API 호출 함수 ====================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: userSearch,
        page: userPage.toString(),
        limit: '20',
      });
      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setUserTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('회원 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (uid: string, includeGallery = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        gallery: includeGallery.toString(),
        generations: 'true',
        payments: 'true',
      });
      const response = await fetch(`/api/admin/users/${uid}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedUser(data.data);
        if (includeGallery) {
          setUserGallery(data.data.gallery);
        }
      }
    } catch (error) {
      console.error('회원 상세 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: editingUser.uid,
          updates: {
            displayName: editingUser.displayName,
            points: editingUser.points,
            emailVerified: editingUser.emailVerified,
          },
        }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('회원 정보가 수정되었습니다');
        setEditingUser(null);
        fetchUsers();
        if (selectedUser?.user?.uid === editingUser.uid) {
          fetchUserDetail(editingUser.uid);
        }
      } else {
        setMessage(`오류: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 지급/차감
  const handlePointChange = async () => {
    if (!pointModal || !pointAmount || pointAmount <= 0) {
      setMessage('오류: 올바른 포인트 금액을 입력하세요');
      return;
    }

    const actualAmount = pointModal.type === 'add' ? pointAmount : -pointAmount;
    const newPoints = pointModal.user.points + actualAmount;

    if (newPoints < 0) {
      setMessage('오류: 포인트가 0 미만이 될 수 없습니다');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: pointModal.user.uid,
          updates: {
            points: newPoints,
          },
        }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`${pointModal.type === 'add' ? '지급' : '차감'} 완료: ${pointAmount}pt (${pointReason || '관리자 처리'})`);
        setPointModal(null);
        setPointAmount(0);
        setPointReason('');
        fetchUsers();
      } else {
        setMessage(`오류: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: paymentSearch,
        page: paymentPage.toString(),
        limit: '20',
        ...(paymentStatus && { status: paymentStatus }),
      });
      const response = await fetch(`/api/admin/payments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPayments(data.data.payments);
        setPaymentTotal(data.data.pagination.total);
        setPaymentStats(data.data.stats);
      }
    } catch (error) {
      console.error('결제 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async (paymentId: string) => {
    if (!confirm('정말 환불 처리하시겠습니까? 사용자의 포인트가 차감됩니다.')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          reason: refundReason || '관리자 환불 처리',
        }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`환불 완료: ${data.data.refundedPoints} 포인트 차감`);
        setRefundingPayment(null);
        setRefundReason('');
        fetchPayments();
      } else {
        setMessage(`오류: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: genSearch,
        page: genPage.toString(),
        limit: '20',
        ...(genStatus && { status: genStatus }),
      });
      const response = await fetch(`/api/admin/generations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGenerations(data.data.generations);
        setGenTotal(data.data.pagination.total);
        setGenStats(data.data.stats);
      }
    } catch (error) {
      console.error('생성 기록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch('/api/admin/pending-payments');
      const data = await response.json();
      
      if (data.success) {
        const sorted = data.data.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setPendingPayments(sorted);
      }
    } catch (error) {
      console.error('입금 목록 조회 에러:', error);
    }
  };

  const approvePayment = async (paymentId: string) => {
    if (!confirm('이 입금을 승인하시겠습니까?')) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('입금 승인 완료!');
        fetchPendingPayments();
      } else {
        setMessage(`오류: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiCredits = async () => {
    try {
      setCreditsLoading(true);
      const response = await fetch('/api/admin/ai-credits');
      const data = await response.json();
      
      if (data.success) {
        setAiCredits(data.data);
      }
    } catch (error) {
      console.error('AI 크레딧 조회 오류:', error);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminLoginTime');
    router.push('/admin/login');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
        {/* Header */}
      <header className="bg-red-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">ImageFactory 관리자</h1>
            </div>
            <button
              onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            >
            <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className={`p-4 rounded-lg ${message.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
            <button onClick={() => setMessage('')} className="float-right">✕</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex flex-wrap gap-2">
          {[
            { id: 'users', label: '회원 관리', icon: Users },
            { id: 'payments', label: '결제 내역', icon: CreditCard },
            { id: 'generations', label: '생성 기록', icon: ImageIcon },
            { id: 'pending', label: `입금 승인 (${pendingPayments.length})`, icon: DollarSign },
            { id: 'ai-credits', label: 'AI 크레딧', icon: Cpu },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ==================== 회원 관리 탭 ==================== */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              회원 관리
              </h2>
              
            {/* 검색 */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이메일, 이름, UID로 검색..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                검색
              </button>
            </div>

            {/* 회원 목록 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">이메일</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">이름</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">포인트</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">인증</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">가입일</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.displayName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{user.points?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {user.emailVerified ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center space-x-1">
                        <button
                          onClick={() => fetchUserDetail(user.uid, true)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser({ ...user })}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setPointModal({ user, type: 'add' }); setPointAmount(0); setPointReason(''); }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="포인트 지급"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setPointModal({ user, type: 'subtract' }); setPointAmount(0); setPointReason(''); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="포인트 차감"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">총 {userTotal}명</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setUserPage(p => Math.max(1, p - 1)); fetchUsers(); }}
                  disabled={userPage <= 1}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4">{userPage}</span>
                <button
                  onClick={() => { setUserPage(p => p + 1); fetchUsers(); }}
                  disabled={users.length < 20}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 회원 수정 모달 */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">회원 정보 수정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">이메일 (수정불가)</label>
                  <input
                    type="text"
                    value={editingUser.email}
                    disabled
                    className="w-full px-4 py-2 border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이름</label>
                  <input
                    type="text"
                    value={editingUser.displayName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">포인트</label>
                  <input
                    type="number"
                    value={editingUser.points}
                    onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.emailVerified}
                    onChange={(e) => setEditingUser({ ...editingUser, emailVerified: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm">이메일 인증됨</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={updateUser}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 포인트 증감 모달 */}
        {pointModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                {pointModal.type === 'add' ? (
                  <>
                    <Plus className="w-5 h-5 mr-2 text-green-600" />
                    포인트 지급
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5 mr-2 text-red-600" />
                    포인트 차감
                  </>
                )}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">대상 회원</p>
                <p className="font-medium">{pointModal.user.email}</p>
                <p className="text-sm text-blue-600">현재 보유: {pointModal.user.points?.toLocaleString()}pt</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {pointModal.type === 'add' ? '지급' : '차감'} 포인트
                  </label>
                  <input
                    type="number"
                    value={pointAmount || ''}
                    onChange={(e) => setPointAmount(parseInt(e.target.value) || 0)}
                    placeholder="포인트 금액 입력"
                    min="1"
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">사유 (선택)</label>
                  <input
                    type="text"
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                    placeholder="예: 이벤트 보상, 오류 보상 등"
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {pointAmount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">변경 후 포인트</p>
                  <p className={`text-xl font-bold ${pointModal.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                    {(pointModal.user.points + (pointModal.type === 'add' ? pointAmount : -pointAmount)).toLocaleString()}pt
                    <span className="text-sm ml-2">
                      ({pointModal.type === 'add' ? '+' : '-'}{pointAmount.toLocaleString()})
                    </span>
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => { setPointModal(null); setPointAmount(0); setPointReason(''); }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handlePointChange}
                  disabled={loading || pointAmount <= 0}
                  className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                    pointModal.type === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {pointModal.type === 'add' ? '지급' : '차감'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 회원 상세 모달 */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">회원 상세 정보</h3>
                <button onClick={() => { setSelectedUser(null); setUserGallery(null); }} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500">이메일</span>
                  <p className="font-medium">{selectedUser.user.email}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">이름</span>
                  <p className="font-medium">{selectedUser.user.displayName || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">포인트</span>
                  <p className="font-medium text-blue-600">{selectedUser.user.points?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">가입일</span>
                  <p className="font-medium">{selectedUser.user.createdAt ? new Date(selectedUser.user.createdAt).toLocaleDateString('ko-KR') : '-'}</p>
                </div>
              </div>

              {/* 갤러리 */}
              {userGallery && (
                <div className="mb-6">
                  <h4 className="font-bold mb-3">📸 갤러리 (좋아요: {userGallery.favorites?.length || 0}, 업로드: {userGallery.uploads?.length || 0})</h4>
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                    {[...(userGallery.favorites || []), ...(userGallery.uploads || [])].slice(0, 24).map((img: any, idx: number) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img src={img.imageUrl || img.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 생성 기록 */}
              {selectedUser.generations && (
                <div className="mb-6">
                  <h4 className="font-bold mb-3">🎨 최근 생성 기록 ({selectedUser.generations.length}건)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.generations.slice(0, 10).map((gen: any) => (
                      <div key={gen.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm truncate">{gen.prompt?.substring(0, 50)}...</p>
                          <p className="text-xs text-gray-500">{gen.createdAt ? new Date(gen.createdAt).toLocaleString('ko-KR') : ''}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            gen.status === 'completed' ? 'bg-green-100 text-green-700' :
                            gen.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {gen.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{gen.totalPoints}pt</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 결제 내역 */}
              {selectedUser.payments && (
                <div>
                  <h4 className="font-bold mb-3">💳 결제 내역 ({selectedUser.payments.length}건)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.payments.slice(0, 10).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                          <p className="font-medium">₩{payment.amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleString('ko-KR') : ''}</p>
                    </div>
                    <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {payment.status}
                          </span>
                          <p className="text-xs text-blue-600 mt-1">+{payment.points?.toLocaleString()}pt</p>
                        </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 결제 내역 탭 ==================== */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              결제 내역
              </h2>
              
            {/* 통계 */}
            {paymentStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{paymentStats.total}</p>
                  <p className="text-xs text-gray-500">전체</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</p>
                  <p className="text-xs text-gray-500">대기</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{paymentStats.completed}</p>
                  <p className="text-xs text-gray-500">완료</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{paymentStats.refunded}</p>
                  <p className="text-xs text-gray-500">환불</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">₩{(paymentStats.totalAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">총 매출</p>
                </div>
              </div>
            )}

            {/* 필터 */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이메일, 이름, 주문번호로 검색..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <select
                value={paymentStatus}
                onChange={(e) => { setPaymentStatus(e.target.value); setPaymentPage(1); }}
                className="px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="">전체 상태</option>
                <option value="pending">대기</option>
                <option value="completed">완료</option>
                <option value="failed">실패</option>
                <option value="refunded">환불</option>
              </select>
              <button
                onClick={fetchPayments}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                검색
                  </button>
            </div>

            {/* 결제 목록 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">사용자</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">금액</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">포인트</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">일시</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{payment.userEmail}</p>
                        <p className="text-xs text-gray-500">{payment.userName}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">₩{payment.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-600">+{payment.points?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payment.status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => setRefundingPayment(payment.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                            title="환불"
                          >
                            <RotateCcw className="w-4 h-4" />
                  </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">총 {paymentTotal}건</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setPaymentPage(p => Math.max(1, p - 1)); fetchPayments(); }}
                  disabled={paymentPage <= 1}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                  </button>
                <span className="px-4">{paymentPage}</span>
                <button
                  onClick={() => { setPaymentPage(p => p + 1); fetchPayments(); }}
                  disabled={payments.length < 20}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
            </div>
          </div>
        )}

        {/* 환불 모달 */}
        {refundingPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                결제 환불
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                환불 시 해당 사용자의 포인트가 차감됩니다. 계속하시겠습니까?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">환불 사유</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="환불 사유를 입력하세요"
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setRefundingPayment(null); setRefundReason(''); }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => refundPayment(refundingPayment)}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  환불 처리
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 생성 기록 탭 ==================== */}
        {activeTab === 'generations' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              이미지 생성 기록
            </h2>

            {/* 통계 */}
            {genStats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{genStats.total}</p>
                  <p className="text-xs text-gray-500">전체</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">{genStats.pending}</p>
                  <p className="text-xs text-gray-500">대기</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{genStats.processing}</p>
                  <p className="text-xs text-gray-500">처리중</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{genStats.completed}</p>
                  <p className="text-xs text-gray-500">완료</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{genStats.failed}</p>
                  <p className="text-xs text-gray-500">실패</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{genStats.totalImages}</p>
                  <p className="text-xs text-gray-500">총 이미지</p>
                </div>
              </div>
            )}

            {/* 필터 */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이메일, 프롬프트로 검색..."
                  value={genSearch}
                  onChange={(e) => setGenSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchGenerations()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <select
                value={genStatus}
                onChange={(e) => { setGenStatus(e.target.value); setGenPage(1); }}
                className="px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="">전체 상태</option>
                <option value="pending">대기</option>
                <option value="processing">처리중</option>
                <option value="completed">완료</option>
                <option value="failed">실패</option>
              </select>
              <button
                onClick={fetchGenerations}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                검색
              </button>
            </div>

            {/* 생성 목록 */}
            <div className="space-y-3">
              {generations.map(gen => (
                <div key={gen.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          gen.status === 'completed' ? 'bg-green-100 text-green-700' :
                          gen.status === 'failed' ? 'bg-red-100 text-red-700' :
                          gen.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {gen.status}
                        </span>
                        <span className="text-xs text-gray-500">{gen.userEmail}</span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-500">{gen.createdAt ? new Date(gen.createdAt).toLocaleString('ko-KR') : ''}</span>
                      </div>
                      <p className="text-sm">{gen.prompt}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>🎨 {gen.totalImages}장</span>
                        <span>💰 {gen.totalPoints}pt</span>
                        <span>✅ {gen.completedJobs}/{gen.completedJobs + gen.failedJobs}</span>
                      </div>
                    </div>
                    {gen.imageUrls && gen.imageUrls.length > 0 && (
                      <div className="flex space-x-1 ml-4">
                        {gen.imageUrls.slice(0, 4).map((url, idx) => (
                          <div key={idx} className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {gen.imageUrls.length > 4 && (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                            +{gen.imageUrls.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">총 {genTotal}건</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setGenPage(p => Math.max(1, p - 1)); fetchGenerations(); }}
                  disabled={genPage <= 1}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4">{genPage}</span>
                <button
                  onClick={() => { setGenPage(p => p + 1); fetchGenerations(); }}
                  disabled={generations.length < 20}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 입금 승인 탭 ==================== */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                입금 대기 목록
              </h2>
              <button
                onClick={fetchPendingPayments}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침</span>
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>대기 중인 입금이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map(payment => (
                  <div key={payment.id} className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between">
                            <div>
                        <p className="font-bold text-lg">₩{payment.amount?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{payment.userEmail}</p>
                        <p className="text-xs text-gray-500">
                          입금자: {payment.depositorName || '-'} | 
                          주문번호: {payment.orderId}
                        </p>
                        <p className="text-xs text-gray-400">
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleString('ko-KR') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-600 font-bold mb-2">+{payment.points?.toLocaleString()} pt</p>
                      <button
                          onClick={() => approvePayment(payment.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                          <Check className="w-4 h-4" />
                          <span>승인</span>
                      </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== AI 크레딧 탭 ==================== */}
        {activeTab === 'ai-credits' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                AI 서비스 크레딧 현황
              </h2>
              <button
                onClick={fetchAiCredits}
                disabled={creditsLoading}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${creditsLoading ? 'animate-spin' : ''}`} />
                <span>{creditsLoading ? '조회 중...' : '새로고침'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiCredits.map((credit, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    credit.status === 'ok'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">{credit.service}</span>
                      <h3 className="font-bold text-gray-900">{credit.modelId}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      credit.status === 'ok'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {credit.status === 'ok' ? '정상' : '오류'}
                    </span>
                  </div>
                  
                  <p className={`text-lg font-bold mb-2 ${
                    credit.status === 'ok' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {credit.balance}
                  </p>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">마지막 성공</span>
                      <span className={`font-medium ${credit.lastSuccess ? 'text-blue-600' : 'text-gray-400'}`}>
                        {credit.lastSuccess 
                          ? new Date(credit.lastSuccess).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '기록 없음'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">성공 횟수</span>
                      <span className="font-medium text-gray-700">{credit.successCount || 0}회</span>
                    </div>
                  </div>
                  
                  {credit.error && (
                    <div className="mt-2 p-2 bg-red-100 rounded-lg">
                      <p className="text-xs text-red-700 font-medium">⚠️ {credit.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
      </div>
        )}
      </main>
    </div>
  );
}
