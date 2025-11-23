const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * imageGenerations 문서가 생성되면 자동으로 이미지 생성 시작
 */
exports.processImageGeneration = functions
  .region('asia-northeast3')
  .runWith({
    timeoutSeconds: 540, // 9분
    memory: '2GB',
  })
  .firestore
  .document('imageGenerations/{generationId}')
  .onCreate(async (snap, context) => {
    const generationId = context.params.generationId;
    const generationData = snap.data();
    
    const { userId, prompt, email, modelConfigs, totalPoints, referenceImageUrl } = generationData;
    
    console.log('🎨 [Firebase Functions] 이미지 생성 시작:', {
      generationId,
      userId,
      totalImages: generationData.totalImages,
    });
    
    try {
      // Vercel의 process API 호출
      const vercelUrl = process.env.VERCEL_APP_URL || 'https://imagesfactory.vercel.app';
      
      const response = await fetch(`${vercelUrl}/api/generate/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Process failed: ${response.status} - ${errorText}`);
      }

      console.log('✅ [Firebase Functions] 이미지 생성 완료:', generationId);
      
    } catch (error) {
      console.error('❌ [Firebase Functions] 이미지 생성 실패:', error);
      
      // 실패 상태 업데이트
      await snap.ref.update({
        status: 'failed',
        failedReason: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
