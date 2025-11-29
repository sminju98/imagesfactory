/**
 * 어드민 - 회원 조회/수정 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

// 회원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = db.collection('users').orderBy(sortBy, sortOrder as 'asc' | 'desc');
    
    // 검색어가 있으면 이메일로 필터링 (Firestore는 부분 검색이 제한적)
    // 전체 조회 후 클라이언트에서 필터링
    const snapshot = await query.limit(500).get();
    
    let users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        provider: data.provider,
        points: data.points || 0,
        emailVerified: data.emailVerified,
        stats: data.stats || {},
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // 검색어 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.email?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.uid.toLowerCase().includes(searchLower)
      );
    }

    // 페이지네이션
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error: any) {
    console.error('회원 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 회원 정보 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, updates } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 수정 가능한 필드만 허용
    const allowedFields = ['displayName', 'points', 'emailVerified'];
    const sanitizedUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 내용이 없습니다' },
        { status: 400 }
      );
    }

    // 포인트 변경 시 트랜잭션 기록
    const oldData = userDoc.data()!;
    if (sanitizedUpdates.points !== undefined && sanitizedUpdates.points !== oldData.points) {
      const pointDiff = sanitizedUpdates.points - (oldData.points || 0);
      
      await db.collection('pointTransactions').add({
        userId: uid,
        amount: pointDiff,
        type: pointDiff > 0 ? 'bonus' : 'usage',
        description: `관리자 포인트 ${pointDiff > 0 ? '지급' : '차감'}`,
        balanceBefore: oldData.points || 0,
        balanceAfter: sanitizedUpdates.points,
        createdAt: fieldValue.serverTimestamp(),
      });
    }

    sanitizedUpdates.updatedAt = fieldValue.serverTimestamp();
    await userRef.update(sanitizedUpdates);

    return NextResponse.json({
      success: true,
      message: '회원 정보가 수정되었습니다',
    });

  } catch (error: any) {
    console.error('회원 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


