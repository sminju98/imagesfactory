'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { Sparkles, User as UserIcon, Mail, Calendar, Award, Image as ImageIcon, TrendingUp, CreditCard, Settings, LogOut, Loader2, AlertCircle, Globe, ChevronDown, ImagePlus, FolderOpen, History } from 'lucide-react';
import GalleryTab from '@/components/gallery/GalleryTab';

export default function MyPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);
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
  
  // 콘텐츠 저장소 상태
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [savedContents, setSavedContents] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentStats, setContentStats] = useState<Record<string, number>>({});
  
  // 콘텐츠 히스토리 상태
  const [contentProjects, setContentProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

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

  // 콘텐츠 저장소 데이터 로드
  useEffect(() => {
    if (user && activeTab === 'contentStorage') {
      fetchSavedContents();
    }
  }, [user, activeTab, selectedContentType]);

  // 콘텐츠 히스토리 데이터 로드
  useEffect(() => {
    if (user && activeTab === 'contentHistory') {
      fetchContentProjects();
    }
  }, [user, activeTab]);

  const fetchSavedContents = async () => {
    if (!user) return;
    setContentLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.uid, limit: '50' });
      if (selectedContentType) {
        params.set('type', selectedContentType);
      }
      const response = await fetch(`/api/content/storage?${params}`);
      const data = await response.json();
      if (data.success) {
        setSavedContents(data.data.contents);
        setContentStats(data.data.stats);
      }
    } catch (error) {
      console.error('Content fetch error:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchContentProjects = async () => {
    if (!user) return;
    setProjectsLoading(true);
    try {
      const response = await fetch(`/api/content/history?userId=${user.uid}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setContentProjects(data.data.projects);
      }
    } catch (error) {
      console.error('Projects fetch error:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!user) return;
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const pmts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(pmts);
    } catch (error) {
      console.error('Payment fetch error:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const transactionsRef = collection(db, 'pointTransactions');
      const q = query(transactionsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
    } catch (error) {
      console.error('Transaction fetch error:', error);
    }
  };

  const fetchPointStats = async () => {
    if (!user) return;
    try {
      const transactionsRef = collection(db, 'pointTransactions');
      const q = query(transactionsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      let totalUsed = 0;
      let totalPurchased = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'usage') totalUsed += Math.abs(data.amount);
        else if (data.type === 'purchase') totalPurchased += data.amount;
      });
      setPointStats({ totalUsed, totalPurchased });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const fetchRecentGenerations = async () => {
    if (!user) return;
    try {
      const generationsRef = collection(db, 'tasks');
      const q = query(generationsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), firestoreLimit(6));
      const snapshot = await getDocs(q);
      const generations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentGenerations(generations);
    } catch (error: any) {
      console.error('History fetch error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    if (confirm(t('mypage.confirmLogout'))) {
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
                <h1 className="text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
                <p className="text-xs text-gray-500">{t('common.tagline')}</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {/* 언어 선택 */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>{currentLang?.flag} {currentLang?.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as LanguageCode);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2 ${language === lang.code ? 'bg-indigo-50 text-indigo-600' : ''}`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{t('common.currentPoints')}</p>
                <p className="text-2xl font-bold text-indigo-600">{user.points.toLocaleString()}</p>
              </div>
              <Link href="/points" className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                {t('common.chargePoints')}
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
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg">{user.displayName}</h3>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.dashboard')}</span>
                </button>
                <button onClick={() => setActiveTab('points')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'points' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Award className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.pointsTab')}</span>
                </button>
                <button onClick={() => setActiveTab('gallery')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'gallery' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ImagePlus className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.galleryTab')}</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.historyTab')}</span>
                </button>
                <button onClick={() => setActiveTab('contentStorage')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'contentStorage' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <FolderOpen className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.contentStorageTab')}</span>
                </button>
                <button onClick={() => setActiveTab('contentHistory')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'contentHistory' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <History className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.contentHistoryTab')}</span>
                </button>
                <button onClick={() => setActiveTab('payment')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'payment' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.paymentTab')}</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">{t('mypage.settingsTab')}</span>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('common.logout')}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{user.points.toLocaleString()}</span>
                    </div>
                    <p className="text-indigo-100">{t('mypage.currentBalance')}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <ImageIcon className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{user.stats?.totalImages || 0}</span>
                    </div>
                    <p className="text-purple-100">{t('mypage.totalImages')}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{user.stats?.totalGenerations || 0}</span>
                    </div>
                    <p className="text-pink-100">{t('mypage.totalGenerations')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('mypage.quickActions')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/" className="p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-center">
                      <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">{t('mypage.newGeneration')}</p>
                    </Link>
                    <Link href="/points" className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-center">
                      <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">{t('common.chargePoints')}</p>
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{t('mypage.recentImages')}</h2>
                    <Link href="/history" className="text-sm text-indigo-600 hover:underline">{t('mypage.viewAll')} →</Link>
                  </div>

                  {loadingData ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
                  ) : recentGenerations.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t('mypage.noImages')}</p>
                      <Link href="/" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">{t('mypage.createFirst')}</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {recentGenerations.map((gen) => (
                        <Link key={gen.id} href={`/generation/${gen.id}`} className="group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 hover:shadow-xl transition-all relative">
                          {gen.imageUrls && gen.imageUrls[0] ? (
                            <>
                              <img src={gen.imageUrls[0]} alt="Generated" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded text-sm font-semibold">{t('generation.viewDetails')}</span>
                              </div>
                              {gen.totalImages && gen.totalImages > 1 && <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">+{gen.totalImages - 1}</div>}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-12 h-12" /></div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <GalleryTab />
              </div>
            )}

            {/* Points Tab */}
            {activeTab === 'points' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">{t('common.currentPoints')}</h2>
                  <p className="text-5xl font-bold mb-4">{user.points.toLocaleString()}</p>
                  <p className="text-indigo-100 mb-6">{t('mypage.approxImages', { count: Math.floor(user.points / 5).toLocaleString() })}</p>
                  <Link href="/points" className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg">{t('common.chargePoints')} →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100 border-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">💸 {t('mypage.usedPoints')}</h3>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{t('mypage.expense')}</span>
                    </div>
                    <p className="text-4xl font-bold text-red-600 mb-2">{pointStats.totalUsed.toLocaleString()}pt</p>
                    <p className="text-sm text-gray-600">{t('mypage.approxImages', { count: Math.floor(pointStats.totalUsed / 5).toLocaleString() })}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 border-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">💰 {t('mypage.purchasedPoints')}</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t('mypage.income')}</span>
                    </div>
                    <p className="text-4xl font-bold text-green-600 mb-2">{pointStats.totalPurchased.toLocaleString()}pt</p>
                    <p className="text-sm text-gray-600">{t('mypage.approxImages', { count: Math.floor(pointStats.totalPurchased / 5).toLocaleString() })}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{t('mypage.transactionHistory')}</h3>
                    <p className="text-sm text-gray-600 mt-1">{t('mypage.totalTransactions', { count: transactions.length })}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">{t('mypage.noTransactions')}</div>
                    ) : (
                      transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((tx) => {
                        const createdAt = tx.createdAt?.toDate ? new Date(tx.createdAt.toDate()) : new Date();
                        const isPositive = tx.amount > 0;
                        const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
                          purchase: { icon: '💰', label: t('mypage.txType.purchase'), color: 'text-green-600' },
                          usage: { icon: '🎨', label: t('mypage.txType.usage'), color: 'text-red-600' },
                          refund: { icon: '↩️', label: t('mypage.txType.refund'), color: 'text-blue-600' },
                          bonus: { icon: '🎁', label: t('mypage.txType.bonus'), color: 'text-purple-600' },
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
                                <p className="text-sm text-gray-500 mb-1">{createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                  <span>{t('mypage.before')}: {(tx.balanceBefore || 0).toLocaleString()}pt</span>
                                  <span>→</span>
                                  <span>{t('mypage.after')}: {(tx.balanceAfter || 0).toLocaleString()}pt</span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className={`text-2xl font-bold ${config.color}`}>{isPositive ? '+' : ''}{tx.amount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">pt</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {transactions.length > itemsPerPage && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">←</button>
                        {Array.from({ length: Math.ceil(transactions.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-white text-gray-700'}`}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(prev => Math.min(Math.ceil(transactions.length / itemsPerPage), prev + 1))} disabled={currentPage === Math.ceil(transactions.length / itemsPerPage)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">→</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{t('mypage.profile')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.name')}</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={user.displayName} readOnly className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.email')}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="email" value={user.email} readOnly className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50" />
                      </div>
                      {!user.emailVerified && <p className="mt-2 text-sm text-yellow-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{t('mypage.emailNotVerified')}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('mypage.joinDate')}</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={new Date(user.createdAt.toDate()).toLocaleDateString()} readOnly className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('mypage.loginMethod')}</label>
                      <div className="flex items-center space-x-2">
                        {user.provider === 'google' ? (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            <span className="text-gray-700">Google</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">{t('common.email')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{t('mypage.usageStats')}</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('mypage.totalUsedPoints')}</p>
                      <p className="text-2xl font-bold text-red-600">{pointStats.totalUsed.toLocaleString()}<span className="text-sm text-gray-600 ml-1">pt</span></p>
                      <p className="text-xs text-gray-500 mt-1">{t('mypage.approxImages', { count: Math.floor(pointStats.totalUsed / 5).toLocaleString() })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('mypage.totalPurchasedPoints')}</p>
                      <p className="text-2xl font-bold text-green-600">{pointStats.totalPurchased.toLocaleString()}<span className="text-sm text-gray-600 ml-1">pt</span></p>
                      <p className="text-xs text-gray-500 mt-1">${(pointStats.totalPurchased / 100).toLocaleString()} {t('mypage.charged')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{t('mypage.generationHistory')}</h3>
                  {loadingData ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
                  ) : recentGenerations.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">{t('mypage.noImages')}</p>
                      <Link href="/" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">{t('mypage.createFirst')}</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentGenerations.map((gen) => {
                        const createdAt = gen.createdAt?.toDate ? new Date(gen.createdAt.toDate()) : new Date();
                        const statusColors = { pending: 'bg-yellow-100 text-yellow-800', processing: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800' };
                        return (
                          <Link key={gen.id} href={`/generation/${gen.id}`} className="block border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[gen.status as keyof typeof statusColors]}`}>{t(`generation.status.${gen.status}`)}</span>
                                  {gen.status === 'processing' && <span className="text-sm text-gray-600">{gen.progress || 0}%</span>}
                                </div>
                                <p className="text-gray-900 font-medium line-clamp-2 mb-2">{gen.prompt}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>📅 {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>🖼️ {gen.totalImages || 0}{t('home.images')}</span>
                                  <span>💰 {(gen.totalPoints || 0).toLocaleString()}pt</span>
                                </div>
                              </div>
                              {gen.status === 'completed' && gen.imageUrls && gen.imageUrls[0] && (
                                <div className="ml-4 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={gen.imageUrls[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                            {gen.modelConfigs && Array.isArray(gen.modelConfigs) && gen.modelConfigs.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                {gen.modelConfigs.map((config: any, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{config.modelId} ({config.count}{t('home.images')})</span>
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{t('mypage.paymentHistory')}</h3>
                    <p className="text-sm text-gray-600 mt-1">{t('mypage.totalPayments', { count: payments.length })}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {payments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">{t('mypage.noPayments')}</div>
                    ) : (
                      payments.slice((paymentPage - 1) * itemsPerPage, paymentPage * itemsPerPage).map((payment) => {
                        const createdAt = payment.createdAt?.toDate ? new Date(payment.createdAt.toDate()) : new Date();
                        const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                          completed: { label: `✅ ${t('generation.status.completed')}`, color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
                          pending: { label: `⏳ ${t('generation.status.pending')}`, color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-200' },
                          failed: { label: `❌ ${t('generation.status.failed')}`, color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
                          cancelled: { label: `🚫 ${t('mypage.cancelled')}`, color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
                        };
                        const config = statusConfig[payment.status] || statusConfig.pending;
                        return (
                          <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>{config.label}</span>
                                  {payment.paymentMethod && <span className="text-xs text-gray-500">{payment.paymentMethod}</span>}
                                </div>
                                <p className="font-semibold text-gray-900 mb-1">{t('mypage.pointCharge')} ({(payment.points || 0).toLocaleString()}pt)</p>
                                <p className="text-sm text-gray-500 mb-2">{createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                {payment.orderId && <p className="text-xs text-gray-400">{t('mypage.orderNumber')}: {payment.orderId}</p>}
                                {payment.failReason && <p className="text-xs text-red-500 mt-1">{t('mypage.failReason')}: {payment.failReason}</p>}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-3xl font-bold text-gray-900">${(payment.amount || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {payments.length > itemsPerPage && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => setPaymentPage(prev => Math.max(1, prev - 1))} disabled={paymentPage === 1} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">←</button>
                        {Array.from({ length: Math.ceil(payments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button key={page} onClick={() => setPaymentPage(page)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${paymentPage === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-white text-gray-700'}`}>{page}</button>
                        ))}
                        <button onClick={() => setPaymentPage(prev => Math.min(Math.ceil(payments.length / itemsPerPage), prev + 1))} disabled={paymentPage === Math.ceil(payments.length / itemsPerPage)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">→</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Storage Tab */}
            {activeTab === 'contentStorage' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">{t('mypage.contentStorage')}</h2>
                  <p className="text-indigo-100 mb-4">{t('mypage.contentStorageDesc')}</p>
                  <p className="text-3xl font-bold">{contentStats.total || 0} {t('mypage.totalContents')}</p>
                </div>

                {/* 콘텐츠 타입 필터 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{t('mypage.contentTypes')}</h3>
                    <p className="text-sm text-gray-600 mt-1">{t('mypage.contentTypesDesc')}</p>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedContentType(null)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${!selectedContentType ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {t('common.all')} ({contentStats.total || 0})
                    </button>
                    {[
                      { type: 'reels', labelKey: 'contentFactory.contentTypes.reels' },
                      { type: 'comic', labelKey: 'contentFactory.contentTypes.comic' },
                      { type: 'cardnews', labelKey: 'contentFactory.contentTypes.cardnews' },
                      { type: 'banner', labelKey: 'contentFactory.contentTypes.banner' },
                      { type: 'thumbnail', labelKey: 'contentFactory.contentTypes.thumbnail' },
                      { type: 'detail_header', labelKey: 'contentFactory.contentTypes.detail' },
                    ].map(item => (
                      <button
                        key={item.type}
                        onClick={() => setSelectedContentType(item.type)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedContentType === item.type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {t(item.labelKey)} ({contentStats[item.type] || 0})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 콘텐츠 그리드 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{selectedContentType ? t(`contentFactory.contentTypes.${selectedContentType === 'detail_header' ? 'detail' : selectedContentType}`) : t('common.all')}</h3>
                    <p className="text-sm text-gray-600 mt-1">{savedContents.length} {t('mypage.items')}</p>
                  </div>
                  {contentLoading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    </div>
                  ) : savedContents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>{t('mypage.noContents')}</p>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {savedContents.map((content: any) => (
                        <div key={content.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                          <img src={content.thumbnailUrl || content.imageUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => window.open(content.imageUrl, '_blank')}
                              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium"
                            >
                              {t('common.view')}
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white text-xs truncate">{content.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content History Tab */}
            {activeTab === 'contentHistory' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">{t('mypage.contentHistory')}</h2>
                  <p className="text-indigo-100 mb-4">{t('mypage.contentHistoryDesc')}</p>
                  <p className="text-3xl font-bold">{contentProjects.length} {t('mypage.totalProjects')}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{t('mypage.contentHistoryTitle')}</h3>
                    <p className="text-sm text-gray-600 mt-1">{t('mypage.totalProjects', { count: contentProjects.length })}</p>
                  </div>
                  {projectsLoading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    </div>
                  ) : contentProjects.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>{t('mypage.noProjects')}</p>
                      <button
                        onClick={() => router.push('/')}
                        className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        {t('mypage.createNewContent')} →
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {contentProjects.map((project: any) => {
                        const createdAt = project.createdAt?.toDate ? new Date(project.createdAt.toDate()) : (project.createdAt?._seconds ? new Date(project.createdAt._seconds * 1000) : new Date());
                        const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                          processing: { label: t('mypage.statusProcessing'), color: 'text-blue-600', bg: 'bg-blue-100' },
                          completed: { label: t('mypage.statusCompleted'), color: 'text-green-600', bg: 'bg-green-100' },
                          failed: { label: t('mypage.statusFailed'), color: 'text-red-600', bg: 'bg-red-100' },
                          partial: { label: t('mypage.statusPartial'), color: 'text-yellow-600', bg: 'bg-yellow-100' },
                        };
                        const status = statusConfig[project.status] || statusConfig.processing;
                        return (
                          <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-semibold text-gray-900">{project.concept?.productName || project.inputPrompt || t('mypage.untitledProject')}</p>
                                  <span className={`px-2 py-1 text-xs rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
                                </div>
                                <p className="text-sm text-gray-500">{createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>{project.tasksSummary?.completed || 0}/{project.tasksSummary?.total || 0} {t('mypage.completed')}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => router.push(`/content/${project.id}`)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                              >
                                {t('common.view')} →
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
              <h3 className="text-xl font-bold mb-4">{t('common.appName')}</h3>
              <p className="text-gray-400 text-sm">{t('footer.description')}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('common.email')}: <a href="mailto:webmaster@geniuscat.co.kr" className="hover:text-white transition-colors">webmaster@geniuscat.co.kr</a></li>
                <li>{t('footer.phone')}: <a href="tel:+82-10-8440-9820" className="hover:text-white transition-colors">(+82)-10-8440-9820</a></li>
                <li>{t('footer.hours')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('footer.companyInfo')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><strong>{t('footer.companyName')}:</strong> {t('footer.companyNameValue')}</li>
                <li><strong>{t('footer.representative')}:</strong> {t('footer.representativeValue')}</li>
                <li><strong>{t('footer.businessNumber')}:</strong> {t('footer.businessNumberValue')}</li>
                <li><strong>{t('footer.address')}:</strong> {t('footer.addressValue')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('footer.policies')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">{t('common.terms')}</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t('common.privacy')}</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">{t('common.refundPolicy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">© 2025 MJ Studio. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
