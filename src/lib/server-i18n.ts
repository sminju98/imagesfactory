// 서버 측 다국어 지원 유틸리티
// 이메일 및 API 응답에서 사용

export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de';

// 이메일 관련 번역
export const emailTranslations: Record<SupportedLanguage, {
  welcome: {
    subject: string;
    title: string;
    greeting: (name: string) => string;
    bonusMessage: (points: number) => string;
    freeImages: (count: number) => string;
    startButton: string;
  };
  generation: {
    subject: string;
    title: string;
    greeting: (name: string) => string;
    completedMessage: (count: number) => string;
    promptLabel: string;
    imageLinksLabel: string;
    viewResultButton: string;
    validityNote: string;
    checkWebsite: string;
  };
  common: {
    companyName: string;
    footer: string;
  };
}> = {
  ko: {
    welcome: {
      subject: '🎉 ImageFactory에 오신 것을 환영합니다!',
      title: '🎉 환영합니다!',
      greeting: (name) => `${name}님, ImageFactory에 오신 것을 환영합니다!`,
      bonusMessage: (points) => `가입 축하 보너스로 ${points.toLocaleString()} 포인트를 드렸습니다! 🎁`,
      freeImages: (count) => `지금 바로 약 ${count}장의 이미지를 무료로 생성해보세요.`,
      startButton: '🚀 지금 시작하기',
    },
    generation: {
      subject: '🎨 이미지 생성이 완료되었습니다!',
      title: '🎉 이미지 생성 완료!',
      greeting: (name) => `안녕하세요, ${name}님!`,
      completedMessage: (count) => `요청하신 이미지 ${count}장이 성공적으로 생성되었습니다.`,
      promptLabel: '프롬프트:',
      imageLinksLabel: '🖼️ 생성된 이미지 링크',
      viewResultButton: '📥 결과 페이지 보기',
      validityNote: '💡 이미지 링크는 30일간 유효합니다.',
      checkWebsite: '웹사이트에서도 언제든지 확인하실 수 있습니다.',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
  en: {
    welcome: {
      subject: '🎉 Welcome to ImageFactory!',
      title: '🎉 Welcome!',
      greeting: (name) => `Welcome to ImageFactory, ${name}!`,
      bonusMessage: (points) => `We've given you ${points.toLocaleString()} bonus points! 🎁`,
      freeImages: (count) => `Start generating about ${count} images for free right now.`,
      startButton: '🚀 Start Now',
    },
    generation: {
      subject: '🎨 Your images are ready!',
      title: '🎉 Image Generation Complete!',
      greeting: (name) => `Hello, ${name}!`,
      completedMessage: (count) => `Your ${count} images have been successfully generated.`,
      promptLabel: 'Prompt:',
      imageLinksLabel: '🖼️ Generated Image Links',
      viewResultButton: '📥 View Results',
      validityNote: '💡 Image links are valid for 30 days.',
      checkWebsite: 'You can also check anytime on our website.',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
  ja: {
    welcome: {
      subject: '🎉 ImageFactoryへようこそ！',
      title: '🎉 ようこそ！',
      greeting: (name) => `${name}様、ImageFactoryへようこそ！`,
      bonusMessage: (points) => `入会特典として${points.toLocaleString()}ポイントをプレゼントしました！🎁`,
      freeImages: (count) => `今すぐ約${count}枚の画像を無料で生成できます。`,
      startButton: '🚀 今すぐ始める',
    },
    generation: {
      subject: '🎨 画像の生成が完了しました！',
      title: '🎉 画像生成完了！',
      greeting: (name) => `${name}様、こんにちは！`,
      completedMessage: (count) => `ご依頼の画像${count}枚が正常に生成されました。`,
      promptLabel: 'プロンプト:',
      imageLinksLabel: '🖼️ 生成された画像リンク',
      viewResultButton: '📥 結果ページを見る',
      validityNote: '💡 画像リンクは30日間有効です。',
      checkWebsite: 'ウェブサイトでいつでもご確認いただけます。',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
  zh: {
    welcome: {
      subject: '🎉 欢迎来到ImageFactory！',
      title: '🎉 欢迎！',
      greeting: (name) => `${name}，欢迎来到ImageFactory！`,
      bonusMessage: (points) => `注册奖励${points.toLocaleString()}积分已到账！🎁`,
      freeImages: (count) => `立即免费生成约${count}张图片。`,
      startButton: '🚀 立即开始',
    },
    generation: {
      subject: '🎨 图片生成完成！',
      title: '🎉 图片生成完成！',
      greeting: (name) => `您好，${name}！`,
      completedMessage: (count) => `您请求的${count}张图片已成功生成。`,
      promptLabel: '提示词:',
      imageLinksLabel: '🖼️ 生成的图片链接',
      viewResultButton: '📥 查看结果',
      validityNote: '💡 图片链接30天内有效。',
      checkWebsite: '您也可以随时在网站上查看。',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
  es: {
    welcome: {
      subject: '🎉 ¡Bienvenido a ImageFactory!',
      title: '🎉 ¡Bienvenido!',
      greeting: (name) => `¡Bienvenido a ImageFactory, ${name}!`,
      bonusMessage: (points) => `¡Te hemos dado ${points.toLocaleString()} puntos de bonificación! 🎁`,
      freeImages: (count) => `Comienza a generar alrededor de ${count} imágenes gratis ahora mismo.`,
      startButton: '🚀 Comenzar Ahora',
    },
    generation: {
      subject: '🎨 ¡Tus imágenes están listas!',
      title: '🎉 ¡Generación de Imágenes Completada!',
      greeting: (name) => `¡Hola, ${name}!`,
      completedMessage: (count) => `Tus ${count} imágenes se han generado exitosamente.`,
      promptLabel: 'Prompt:',
      imageLinksLabel: '🖼️ Enlaces de Imágenes Generadas',
      viewResultButton: '📥 Ver Resultados',
      validityNote: '💡 Los enlaces de imágenes son válidos por 30 días.',
      checkWebsite: 'También puedes verificar en cualquier momento en nuestro sitio web.',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
  fr: {
    welcome: {
      subject: '🎉 Bienvenue sur ImageFactory !',
      title: '🎉 Bienvenue !',
      greeting: (name) => `Bienvenue sur ImageFactory, ${name} !`,
      bonusMessage: (points) => `Nous vous avons offert ${points.toLocaleString()} points bonus ! 🎁`,
      freeImages: (count) => `Commencez à générer environ ${count} images gratuitement dès maintenant.`,
      startButton: '🚀 Commencer Maintenant',
    },
    generation: {
      subject: '🎨 Vos images sont prêtes !',
      title: '🎉 Génération d\'Images Terminée !',
      greeting: (name) => `Bonjour, ${name} !`,
      completedMessage: (count) => `Vos ${count} images ont été générées avec succès.`,
      promptLabel: 'Prompt :',
      imageLinksLabel: '🖼️ Liens des Images Générées',
      viewResultButton: '📥 Voir les Résultats',
      validityNote: '💡 Les liens des images sont valides pendant 30 jours.',
      checkWebsite: 'Vous pouvez également vérifier à tout moment sur notre site web.',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
  de: {
    welcome: {
      subject: '🎉 Willkommen bei ImageFactory!',
      title: '🎉 Willkommen!',
      greeting: (name) => `Willkommen bei ImageFactory, ${name}!`,
      bonusMessage: (points) => `Wir haben Ihnen ${points.toLocaleString()} Bonuspunkte geschenkt! 🎁`,
      freeImages: (count) => `Generieren Sie jetzt etwa ${count} Bilder kostenlos.`,
      startButton: '🚀 Jetzt Starten',
    },
    generation: {
      subject: '🎨 Ihre Bilder sind fertig!',
      title: '🎉 Bildgenerierung Abgeschlossen!',
      greeting: (name) => `Hallo, ${name}!`,
      completedMessage: (count) => `Ihre ${count} Bilder wurden erfolgreich generiert.`,
      promptLabel: 'Prompt:',
      imageLinksLabel: '🖼️ Generierte Bildlinks',
      viewResultButton: '📥 Ergebnisse Anzeigen',
      validityNote: '💡 Bildlinks sind 30 Tage gültig.',
      checkWebsite: 'Sie können auch jederzeit auf unserer Website nachsehen.',
    },
    common: {
      companyName: 'MJ Studio',
      footer: '© 2025 MJ Studio. All rights reserved.',
    },
  },
};

// 언어 코드 감지 함수 (Accept-Language 헤더에서)
export function detectLanguage(acceptLanguage: string | null): SupportedLanguage {
  if (!acceptLanguage) return 'en';
  
  const languages = acceptLanguage.split(',').map(lang => {
    const [code] = lang.trim().split(';');
    return code.toLowerCase().split('-')[0];
  });
  
  for (const lang of languages) {
    if (lang in emailTranslations) {
      return lang as SupportedLanguage;
    }
  }
  
  return 'en';
}

// 번역 가져오기
export function getEmailTranslation(language: SupportedLanguage) {
  return emailTranslations[language] || emailTranslations.en;
}

// API 응답 번역
export const apiTranslations: Record<SupportedLanguage, {
  errors: {
    unauthorized: string;
    invalidToken: string;
    userNotFound: string;
    insufficientPoints: string;
    promptTooShort: string;
    promptTooLong: string;
    invalidModel: string;
    noModelsSelected: string;
    serverError: string;
    paymentFailed: string;
    invalidAmount: string;
    taskNotFound: string;
    invalidRequest: string;
    emailRequired: string;
    promptRequired: string;
    generationFailed: string;
    conceptGenerationFailed: string;
    messageGenerationFailed: string;
    scriptGenerationFailed: string;
    copyGenerationFailed: string;
    productionStartFailed: string;
  };
  success: {
    generationStarted: string;
    paymentComplete: string;
    pointsCharged: string;
    emailSent: string;
  };
}> = {
  ko: {
    errors: {
      unauthorized: '인증이 필요합니다',
      invalidToken: '유효하지 않은 토큰입니다',
      userNotFound: '사용자를 찾을 수 없습니다',
      insufficientPoints: '포인트가 부족합니다',
      promptTooShort: '프롬프트는 최소 10자 이상이어야 합니다',
      promptTooLong: '프롬프트는 최대 1000자까지 입력 가능합니다',
      invalidModel: '유효하지 않은 모델입니다',
      noModelsSelected: '최소 하나 이상의 모델을 선택해주세요',
      serverError: '서버 오류가 발생했습니다',
      paymentFailed: '결제 처리에 실패했습니다',
      invalidAmount: '유효하지 않은 금액입니다',
      taskNotFound: '작업을 찾을 수 없습니다',
      invalidRequest: '잘못된 요청입니다',
      emailRequired: '이메일을 입력해주세요',
      promptRequired: '프롬프트를 입력해주세요',
      generationFailed: '이미지 생성에 실패했습니다',
      conceptGenerationFailed: '콘셉트 생성에 실패했습니다',
      messageGenerationFailed: '메시지 생성에 실패했습니다',
      scriptGenerationFailed: '대본 생성에 실패했습니다',
      copyGenerationFailed: '카피 생성에 실패했습니다',
      productionStartFailed: '생산 시작에 실패했습니다',
    },
    success: {
      generationStarted: '이미지 생성이 시작되었습니다',
      paymentComplete: '결제가 완료되었습니다',
      pointsCharged: '포인트가 충전되었습니다',
      emailSent: '이메일이 발송되었습니다',
    },
  },
  en: {
    errors: {
      unauthorized: 'Authentication required',
      invalidToken: 'Invalid token',
      userNotFound: 'User not found',
      insufficientPoints: 'Insufficient points',
      promptTooShort: 'Prompt must be at least 10 characters',
      promptTooLong: 'Prompt must be 1000 characters or less',
      invalidModel: 'Invalid model',
      noModelsSelected: 'Please select at least one model',
      serverError: 'Server error occurred',
      paymentFailed: 'Payment processing failed',
      invalidAmount: 'Invalid amount',
      taskNotFound: 'Task not found',
      invalidRequest: 'Invalid request',
      emailRequired: 'Email is required',
      promptRequired: 'Prompt is required',
      generationFailed: 'Image generation failed',
      conceptGenerationFailed: 'Concept generation failed',
      messageGenerationFailed: 'Message generation failed',
      scriptGenerationFailed: 'Script generation failed',
      copyGenerationFailed: 'Copy generation failed',
      productionStartFailed: 'Production start failed',
    },
    success: {
      generationStarted: 'Image generation started',
      paymentComplete: 'Payment complete',
      pointsCharged: 'Points have been charged',
      emailSent: 'Email sent successfully',
    },
  },
  ja: {
    errors: {
      unauthorized: '認証が必要です',
      invalidToken: '無効なトークンです',
      userNotFound: 'ユーザーが見つかりません',
      insufficientPoints: 'ポイントが不足しています',
      promptTooShort: 'プロンプトは10文字以上必要です',
      promptTooLong: 'プロンプトは1000文字以下にしてください',
      invalidModel: '無効なモデルです',
      noModelsSelected: '少なくとも1つのモデルを選択してください',
      serverError: 'サーバーエラーが発生しました',
      paymentFailed: '決済処理に失敗しました',
      invalidAmount: '無効な金額です',
      taskNotFound: 'タスクが見つかりません',
      invalidRequest: '無効なリクエストです',
      emailRequired: 'メールアドレスを入力してください',
      promptRequired: 'プロンプトを入力してください',
      generationFailed: '画像生成に失敗しました',
      conceptGenerationFailed: 'コンセプト生成に失敗しました',
      messageGenerationFailed: 'メッセージ生成に失敗しました',
      scriptGenerationFailed: 'スクリプト生成に失敗しました',
      copyGenerationFailed: 'コピー生成に失敗しました',
      productionStartFailed: '生産開始に失敗しました',
    },
    success: {
      generationStarted: '画像生成を開始しました',
      paymentComplete: '決済が完了しました',
      pointsCharged: 'ポイントがチャージされました',
      emailSent: 'メールが送信されました',
    },
  },
  zh: {
    errors: {
      unauthorized: '需要认证',
      invalidToken: '无效的令牌',
      userNotFound: '找不到用户',
      insufficientPoints: '积分不足',
      promptTooShort: '提示词至少需要10个字符',
      promptTooLong: '提示词不能超过1000个字符',
      invalidModel: '无效的模型',
      noModelsSelected: '请至少选择一个模型',
      serverError: '服务器错误',
      paymentFailed: '支付处理失败',
      invalidAmount: '无效的金额',
      taskNotFound: '找不到任务',
      invalidRequest: '无效的请求',
      emailRequired: '请输入电子邮箱',
      promptRequired: '请输入提示词',
      generationFailed: '图片生成失败',
      conceptGenerationFailed: '概念生成失败',
      messageGenerationFailed: '消息生成失败',
      scriptGenerationFailed: '脚本生成失败',
      copyGenerationFailed: '文案生成失败',
      productionStartFailed: '生产启动失败',
    },
    success: {
      generationStarted: '图片生成已开始',
      paymentComplete: '支付完成',
      pointsCharged: '积分已充值',
      emailSent: '邮件已发送',
    },
  },
  es: {
    errors: {
      unauthorized: 'Se requiere autenticación',
      invalidToken: 'Token inválido',
      userNotFound: 'Usuario no encontrado',
      insufficientPoints: 'Puntos insuficientes',
      promptTooShort: 'El prompt debe tener al menos 10 caracteres',
      promptTooLong: 'El prompt debe tener 1000 caracteres o menos',
      invalidModel: 'Modelo inválido',
      noModelsSelected: 'Por favor seleccione al menos un modelo',
      serverError: 'Error del servidor',
      paymentFailed: 'El procesamiento del pago falló',
      invalidAmount: 'Cantidad inválida',
      taskNotFound: 'Tarea no encontrada',
      invalidRequest: 'Solicitud inválida',
      emailRequired: 'El correo electrónico es requerido',
      promptRequired: 'El prompt es requerido',
      generationFailed: 'La generación de imagen falló',
      conceptGenerationFailed: 'La generación del concepto falló',
      messageGenerationFailed: 'La generación del mensaje falló',
      scriptGenerationFailed: 'La generación del script falló',
      copyGenerationFailed: 'La generación del copy falló',
      productionStartFailed: 'El inicio de producción falló',
    },
    success: {
      generationStarted: 'La generación de imágenes ha comenzado',
      paymentComplete: 'Pago completado',
      pointsCharged: 'Puntos cargados',
      emailSent: 'Correo enviado exitosamente',
    },
  },
  fr: {
    errors: {
      unauthorized: 'Authentification requise',
      invalidToken: 'Token invalide',
      userNotFound: 'Utilisateur non trouvé',
      insufficientPoints: 'Points insuffisants',
      promptTooShort: 'Le prompt doit contenir au moins 10 caractères',
      promptTooLong: 'Le prompt doit contenir 1000 caractères ou moins',
      invalidModel: 'Modèle invalide',
      noModelsSelected: 'Veuillez sélectionner au moins un modèle',
      serverError: 'Erreur du serveur',
      paymentFailed: 'Le traitement du paiement a échoué',
      invalidAmount: 'Montant invalide',
      taskNotFound: 'Tâche non trouvée',
      invalidRequest: 'Requête invalide',
      emailRequired: 'L\'email est requis',
      promptRequired: 'Le prompt est requis',
      generationFailed: 'La génération d\'image a échoué',
      conceptGenerationFailed: 'La génération du concept a échoué',
      messageGenerationFailed: 'La génération du message a échoué',
      scriptGenerationFailed: 'La génération du script a échoué',
      copyGenerationFailed: 'La génération du copy a échoué',
      productionStartFailed: 'Le démarrage de la production a échoué',
    },
    success: {
      generationStarted: 'La génération d\'images a commencé',
      paymentComplete: 'Paiement effectué',
      pointsCharged: 'Points crédités',
      emailSent: 'Email envoyé avec succès',
    },
  },
  de: {
    errors: {
      unauthorized: 'Authentifizierung erforderlich',
      invalidToken: 'Ungültiges Token',
      userNotFound: 'Benutzer nicht gefunden',
      insufficientPoints: 'Nicht genügend Punkte',
      promptTooShort: 'Der Prompt muss mindestens 10 Zeichen lang sein',
      promptTooLong: 'Der Prompt darf maximal 1000 Zeichen lang sein',
      invalidModel: 'Ungültiges Modell',
      noModelsSelected: 'Bitte wählen Sie mindestens ein Modell aus',
      serverError: 'Serverfehler aufgetreten',
      paymentFailed: 'Zahlungsverarbeitung fehlgeschlagen',
      invalidAmount: 'Ungültiger Betrag',
      taskNotFound: 'Aufgabe nicht gefunden',
      invalidRequest: 'Ungültige Anfrage',
      emailRequired: 'E-Mail ist erforderlich',
      promptRequired: 'Prompt ist erforderlich',
      generationFailed: 'Bilderzeugung fehlgeschlagen',
      conceptGenerationFailed: 'Konzepterstellung fehlgeschlagen',
      messageGenerationFailed: 'Nachrichtenerstellung fehlgeschlagen',
      scriptGenerationFailed: 'Skripterstellung fehlgeschlagen',
      copyGenerationFailed: 'Texterstellung fehlgeschlagen',
      productionStartFailed: 'Produktionsstart fehlgeschlagen',
    },
    success: {
      generationStarted: 'Bilderzeugung gestartet',
      paymentComplete: 'Zahlung abgeschlossen',
      pointsCharged: 'Punkte wurden gutgeschrieben',
      emailSent: 'E-Mail erfolgreich gesendet',
    },
  },
};

// API 번역 가져오기
export function getApiTranslation(language: SupportedLanguage) {
  return apiTranslations[language] || apiTranslations.en;
}

// 요청에서 언어 감지하여 번역 반환
export function getTranslationFromRequest(request: Request) {
  const acceptLanguage = request.headers.get('Accept-Language');
  const lang = detectLanguage(acceptLanguage);
  return {
    lang,
    t: getApiTranslation(lang),
    email: getEmailTranslation(lang),
  };
}
