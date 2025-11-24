import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.co.imagefactory',
  appName: 'ImageFactory',
  webDir: 'out',
  server: {
    // 개발 시 웹 서버 URL 사용 (앱에서 웹 로드)
    url: process.env.CAPACITOR_SERVER_URL || 'https://imagefactory.co.kr',
    cleartext: true
  }
};

export default config;
