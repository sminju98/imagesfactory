'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Search, DollarSign, Send } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('sminju98@gmail.com');
  const [points, setPoints] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);

  // 사용자 검색
  const searchUser = async () => {
    try {
      setLoading(true);
      setMessage('');
      setFoundUser(null);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage('❌ 사용자를 찾을 수 없습니다');
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() };
      setFoundUser(userData);
      setMessage(`✅ 사용자 발견: ${userData.displayName} (현재 포인트: ${userData.points?.toLocaleString() || 0}pt)`);
    } catch (error: any) {
      console.error('Search error:', error);
      setMessage(`❌ 검색 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 지급
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
      const newPoints = currentPoints + points;

      // 현재 통계 가져오기
      const currentStats = foundUser.stats || {
        totalGenerations: 0,
        totalImages: 0,
        totalPointsUsed: 0,
        totalPointsPurchased: 0,
      };

      // 포인트 및 통계 업데이트
      await updateDoc(doc(db, 'users', foundUser.id), {
        points: newPoints,
        'stats.totalPointsPurchased': (currentStats.totalPointsPurchased || 0) + points,
        updatedAt: serverTimestamp(),
      });

      // 거래 내역 저장
      await addDoc(collection(db, 'pointTransactions'), {
        userId: foundUser.id,
        amount: points,
        type: 'purchase', // bonus에서 purchase로 변경
        description: '관리자 포인트 지급',
        balanceBefore: currentPoints,
        balanceAfter: newPoints,
        createdAt: serverTimestamp(),
      });

      setMessage(`✅ 포인트 지급 완료!\n현재 포인트: ${currentPoints.toLocaleString()}pt → ${newPoints.toLocaleString()}pt`);
      
      // 사용자 정보 갱신
      setFoundUser({ ...foundUser, points: newPoints });
    } catch (error: any) {
      console.error('Add points error:', error);
      setMessage(`❌ 포인트 지급 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 관리자 페이지</h1>
          <p className="text-gray-600">사용자 포인트 관리</p>
        </div>

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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={searchUser}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-2xl font-bold text-indigo-600">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
      </div>
    </div>
  );
}


