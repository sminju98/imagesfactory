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

