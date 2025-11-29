// 이미지 진화 시스템 유틸리티

import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  ImageDocument, 
  FavoriteDocument, 
  UploadedImage, 
  EvolutionSession,
  EvolutionConfig,
  GalleryFilterOptions,
  getAllowedCounts,
  MAX_REFERENCE_IMAGES,
  GALLERY_PAGE_SIZE,
} from '@/types/evolution';

// ==================== 좋아요 관련 함수 ====================

/**
 * 이미지 좋아요 토글
 */
export async function toggleImageLike(
  userId: string, 
  imageId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  const imageRef = doc(db, 'images', imageId);
  const imageDoc = await getDoc(imageRef);
  
  if (!imageDoc.exists()) {
    throw new Error('이미지를 찾을 수 없습니다');
  }
  
  const imageData = imageDoc.data() as ImageDocument;
  const isCurrentlyLiked = imageData.isLiked;
  const newIsLiked = !isCurrentlyLiked;
  const newLikesCount = newIsLiked 
    ? (imageData.likesCount || 0) + 1 
    : Math.max(0, (imageData.likesCount || 0) - 1);
  
  // 이미지 문서 업데이트
  await updateDoc(imageRef, {
    isLiked: newIsLiked,
    likesCount: newLikesCount,
    updatedAt: serverTimestamp(),
  });
  
  // 좋아요면 선호 갤러리에 추가, 아니면 제거
  if (newIsLiked) {
    await addToFavorites(userId, imageData);
  } else {
    await removeFromFavorites(userId, imageId);
  }
  
  return { isLiked: newIsLiked, likesCount: newLikesCount };
}

/**
 * 선호 갤러리에 이미지 추가
 */
export async function addToFavorites(
  userId: string, 
  image: ImageDocument
): Promise<void> {
  const favoriteRef = doc(db, 'favorites', `${userId}_${image.id}`);
  
  const favoriteData: Omit<FavoriteDocument, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    id: `${userId}_${image.id}`,
    userId,
    imageId: image.id,
    imageUrl: image.imageUrl,
    thumbnailUrl: image.thumbnailUrl,
    prompt: image.prompt,
    modelId: image.modelId,
    generation: image.generation || 1,
    tags: image.styleTags || [],
    note: '',
    createdAt: serverTimestamp(),
  };
  
  await setDoc(favoriteRef, favoriteData);
}

/**
 * 선호 갤러리에서 이미지 제거
 */
export async function removeFromFavorites(
  userId: string, 
  imageId: string
): Promise<void> {
  const favoriteRef = doc(db, 'favorites', `${userId}_${imageId}`);
  await deleteDoc(favoriteRef);
}

// ==================== 업로드 이미지 관련 함수 ====================

/**
 * 레퍼런스 이미지 업로드 및 저장
 */
export async function uploadReferenceImage(
  file: File, 
  userId: string
): Promise<UploadedImage> {
  // 1. Firebase Storage에 업로드
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `uploads/${userId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(snapshot.ref);
  
  // 2. 이미지 메타데이터 추출
  const dimensions = await getImageDimensions(file);
  
  // 3. 썸네일 URL (동일하게 사용, 추후 Cloud Function으로 최적화 가능)
  const thumbnailUrl = imageUrl;
  
  // 4. Firestore에 저장
  const uploadId = `${userId}_${timestamp}`;
  const uploadRef = doc(db, 'uploadedImages', uploadId);
  
  const uploadedImage: Omit<UploadedImage, 'uploadedAt' | 'lastUsedAt'> & { 
    uploadedAt: ReturnType<typeof serverTimestamp>;
    lastUsedAt: ReturnType<typeof serverTimestamp>;
  } = {
    id: uploadId,
    userId,
    imageUrl,
    thumbnailUrl,
    originalFileName: file.name,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    mimeType: file.type,
    usedInTasks: [],
    usedCount: 0,
    tags: [],
    note: '',
    uploadedAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
  };
  
  await setDoc(uploadRef, uploadedImage);
  
  return {
    ...uploadedImage,
    uploadedAt: Timestamp.now(),
    lastUsedAt: Timestamp.now(),
  } as UploadedImage;
}

/**
 * 업로드 이미지 사용 기록 업데이트
 */
export async function markUploadedImageAsUsed(
  imageId: string, 
  taskId: string
): Promise<void> {
  const imageRef = doc(db, 'uploadedImages', imageId);
  await updateDoc(imageRef, {
    usedInTasks: arrayUnion(taskId),
    usedCount: increment(1),
    lastUsedAt: serverTimestamp(),
  });
}

/**
 * 이미지 크기 추출
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ==================== 갤러리 조회 함수 ====================

/**
 * 사용자의 갤러리 이미지 조회
 */
export async function getUserGalleryImages(
  userId: string,
  options: GalleryFilterOptions,
  pageSize: number = GALLERY_PAGE_SIZE
): Promise<ImageDocument[]> {
  let q = query(
    collection(db, 'images'),
    where('userId', '==', userId)
  );
  
  // 필터 적용
  if (options.type === 'liked') {
    q = query(q, where('isLiked', '==', true));
  } else if (options.type === 'evolution' && options.generation) {
    q = query(q, where('generation', '>=', 2));
  }
  
  if (options.modelId) {
    q = query(q, where('modelId', '==', options.modelId));
  }
  
  // 정렬 적용
  switch (options.sortBy) {
    case 'newest':
      q = query(q, orderBy('createdAt', 'desc'));
      break;
    case 'oldest':
      q = query(q, orderBy('createdAt', 'asc'));
      break;
    case 'mostLiked':
      q = query(q, orderBy('likesCount', 'desc'));
      break;
    case 'generation':
      q = query(q, orderBy('generation', 'desc'));
      break;
  }
  
  q = query(q, limit(pageSize));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImageDocument));
}

/**
 * 사용자의 업로드된 이미지 조회
 */
export async function getUserUploadedImages(
  userId: string,
  pageSize: number = GALLERY_PAGE_SIZE
): Promise<UploadedImage[]> {
  const q = query(
    collection(db, 'uploadedImages'),
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc'),
    limit(pageSize)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UploadedImage));
}

/**
 * 사용자의 선호 이미지 조회
 */
export async function getUserFavorites(
  userId: string,
  pageSize: number = GALLERY_PAGE_SIZE
): Promise<FavoriteDocument[]> {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FavoriteDocument));
}

// ==================== 진화 세션 관련 함수 ====================

/**
 * 새 진화 세션 생성
 */
export async function createEvolutionSession(
  userId: string,
  basePrompt: string,
  initialImageIds: string[]
): Promise<EvolutionSession> {
  const sessionId = `${userId}_${Date.now()}`;
  const sessionRef = doc(db, 'evolutionSessions', sessionId);
  
  const session: Omit<EvolutionSession, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    id: sessionId,
    userId,
    name: `진화 세션 ${new Date().toLocaleDateString('ko-KR')}`,
    generations: {
      '1': initialImageIds,
    },
    selectedImageIds: [],
    basePrompt,
    currentGeneration: 1,
    totalImages: initialImageIds.length,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(sessionRef, session);
  
  return {
    ...session,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as EvolutionSession;
}

/**
 * 진화 세션 조회
 */
export async function getEvolutionSession(sessionId: string): Promise<EvolutionSession | null> {
  const sessionRef = doc(db, 'evolutionSessions', sessionId);
  const sessionDoc = await getDoc(sessionRef);
  
  if (!sessionDoc.exists()) {
    return null;
  }
  
  return { id: sessionDoc.id, ...sessionDoc.data() } as EvolutionSession;
}

/**
 * 진화 세션 업데이트
 */
export async function updateEvolutionSession(
  sessionId: string,
  updates: Partial<EvolutionSession>
): Promise<void> {
  const sessionRef = doc(db, 'evolutionSessions', sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ==================== 진화 설정 검증 함수 ====================

/**
 * 진화 설정 검증
 */
export function validateEvolutionConfig(config: EvolutionConfig): { valid: boolean; error?: string } {
  // 참고 이미지 개수 검증
  if (config.selectedImageIds.length === 0) {
    return { valid: false, error: '최소 1개의 참고 이미지를 선택해주세요' };
  }
  
  if (config.selectedImageIds.length > MAX_REFERENCE_IMAGES) {
    return { valid: false, error: `참고 이미지는 최대 ${MAX_REFERENCE_IMAGES}개까지 선택 가능합니다` };
  }
  
  // 배수 규칙 검증
  const referenceCount = config.selectedImageIds.length;
  const allowedCounts = getAllowedCounts(referenceCount);
  
  for (const [modelId, count] of Object.entries(config.modelsConfig)) {
    if (count > 0 && !allowedCounts.includes(count)) {
      return { 
        valid: false, 
        error: `${modelId}의 생성 개수는 ${referenceCount}의 배수여야 합니다 (${allowedCounts.join(', ')})` 
      };
    }
  }
  
  // 진화 강도 검증
  if (config.evolutionStrength < 0.1 || config.evolutionStrength > 1.0) {
    return { valid: false, error: '진화 강도는 0.1 ~ 1.0 사이여야 합니다' };
  }
  
  // 최소 1개 모델 선택 검증
  const totalImages = Object.values(config.modelsConfig).reduce((sum, count) => sum + count, 0);
  if (totalImages === 0) {
    return { valid: false, error: '최소 1개 이상의 이미지를 생성해야 합니다' };
  }
  
  return { valid: true };
}

// ==================== 갤러리 통계 함수 ====================

/**
 * 사용자 갤러리 통계 조회
 */
export async function getUserGalleryStats(userId: string): Promise<{
  totalImages: number;
  likedImages: number;
  uploadedImages: number;
  evolutionImages: number;
}> {
  // 전체 이미지 수
  const allImagesQuery = query(
    collection(db, 'images'),
    where('userId', '==', userId)
  );
  const allImagesSnapshot = await getDocs(allImagesQuery);
  
  // 좋아요 이미지 수
  const likedQuery = query(
    collection(db, 'images'),
    where('userId', '==', userId),
    where('isLiked', '==', true)
  );
  const likedSnapshot = await getDocs(likedQuery);
  
  // 업로드 이미지 수
  const uploadedQuery = query(
    collection(db, 'uploadedImages'),
    where('userId', '==', userId)
  );
  const uploadedSnapshot = await getDocs(uploadedQuery);
  
  // 진화 이미지 수 (2세대 이상)
  const evolutionQuery = query(
    collection(db, 'images'),
    where('userId', '==', userId),
    where('generation', '>=', 2)
  );
  const evolutionSnapshot = await getDocs(evolutionQuery);
  
  return {
    totalImages: allImagesSnapshot.size,
    likedImages: likedSnapshot.size,
    uploadedImages: uploadedSnapshot.size,
    evolutionImages: evolutionSnapshot.size,
  };
}


