// AI 모델 상세 정보
export interface AIModelDetail {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  pointsPerImage: number;
  badge?: string;
  color: string;
  usedIn: string[];
  features: string[];
  strengths: string[];
  bestFor: string[];
  developer: string;
  releaseYear: string;
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'premium' | 'ultra';
}

export const AI_MODELS_INFO: AIModelDetail[] = [
  {
    id: 'pixart',
    name: 'PixArt-Σ (Sigma)',
    shortDescription: '초저가 초고속! 1-2초 생성',
    fullDescription: 'PixArt-Σ는 2024년 출시된 최신 오픈소스 AI 모델로, 1-2초의 초고속 생성 속도와 낮은 컴퓨팅 비용이 특징입니다.',
    pointsPerImage: 50,
    badge: '초저가',
    color: 'bg-emerald-50 border-emerald-200',
    usedIn: ['Replicate', 'Hugging Face', '오픈소스 커뮤니티'],
    features: [
      '초고속 생성 (1-2초)',
      '낮은 비용',
      'SDXL 수준 품질',
      '효율적인 리소스 사용',
    ],
    strengths: [
      '가격 대비 최고 성능',
      '빠른 프로토타이핑',
      '대량 생성에 최적',
    ],
    bestFor: [
      '예산 중시',
      '빠른 결과물',
      '대량 생성',
      '테스트/실험',
    ],
    developer: 'PixArt Team',
    releaseYear: '2024',
    speed: 'very-fast',
    quality: 'high',
  },
  {
    id: 'realistic-vision',
    name: 'Realistic Vision v5',
    shortDescription: '인물/사진 특화, 초사실적',
    fullDescription: 'Civitai 커뮤니티에서 가장 인기 있는 모델로, 실제 사진과 구분하기 어려운 초사실적 이미지 생성에 특화되어 있습니다.',
    pointsPerImage: 60,
    badge: '인물특화',
    color: 'bg-cyan-50 border-cyan-200',
    usedIn: ['Civitai (1위)', 'Replicate', '사진 작가 커뮤니티'],
    features: [
      '초사실적 렌더링',
      '인물 얼굴 디테일 우수',
      '자연스러운 조명',
      '제품 사진 품질',
    ],
    strengths: [
      '실제 사진처럼',
      '인물 이미지 최고',
      '포토리얼리즘',
    ],
    bestFor: [
      '인물 사진',
      '제품 촬영',
      '광고용 이미지',
      '포트폴리오',
    ],
    developer: 'SG161222 (Civitai)',
    releaseYear: '2023',
    speed: 'very-fast',
    quality: 'ultra',
  },
  {
    id: 'flux',
    name: 'Flux Schnell',
    shortDescription: '초고속 생성, 우수한 품질',
    fullDescription: '2024년 Black Forest Labs (Stable Diffusion 원개발팀)가 출시한 최신 모델. DALL-E 3 수준의 품질을 Stable Diffusion 속도로 제공합니다.',
    pointsPerImage: 80,
    badge: '초고속',
    color: 'bg-green-50 border-green-200',
    usedIn: ['Replicate', 'Black Forest Labs', 'Perplexity AI'],
    features: [
      'DALL-E 3급 품질',
      'SD 속도',
      '최신 기술 (2024)',
      '오픈소스',
    ],
    strengths: [
      '가격과 품질의 완벽한 균형',
      '빠른 생성',
      '안정적인 결과',
    ],
    bestFor: [
      '범용 이미지',
      '비즈니스 용도',
      '품질과 속도 모두 중요',
      '예산 효율',
    ],
    developer: 'Black Forest Labs',
    releaseYear: '2024',
    speed: 'very-fast',
    quality: 'premium',
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    shortDescription: '빠르고 안정적인 범용 옵션',
    fullDescription: 'Stability AI의 대표 모델로, 전 세계에서 가장 많이 사용되는 오픈소스 AI 이미지 생성 모델입니다. 다양한 스타일을 안정적으로 생성합니다.',
    pointsPerImage: 100,
    badge: '추천',
    color: 'bg-blue-50 border-blue-200',
    usedIn: ['전 세계 1,000만+ 사용자', 'Discord 봇', '다양한 앱들'],
    features: [
      '가장 많이 사용됨',
      '안정적인 품질',
      '다양한 스타일 지원',
      '커뮤니티 방대',
    ],
    strengths: [
      '검증된 안정성',
      '범용성',
      '예측 가능한 결과',
    ],
    bestFor: [
      '모든 용도',
      '안정성 중시',
      '다양한 실험',
      '첫 사용자',
    ],
    developer: 'Stability AI',
    releaseYear: '2023',
    speed: 'fast',
    quality: 'high',
  },
  {
    id: 'leonardo',
    name: 'Leonardo.ai',
    shortDescription: '일러스트 & 게임 아트 특화',
    fullDescription: '게임 개발자와 일러스트레이터를 위해 특별히 설계된 모델. 캐릭터 일관성 유지와 판타지 아트에 강점이 있습니다.',
    pointsPerImage: 120,
    badge: '게임',
    color: 'bg-orange-50 border-orange-200',
    usedIn: ['게임 개발사', '일러스트레이터', 'NFT 아티스트'],
    features: [
      '캐릭터 일관성',
      '게임 아트 스타일',
      '애니메이션 풍',
      '판타지 특화',
    ],
    strengths: [
      '같은 캐릭터 유지',
      '게임 에셋 제작',
      '스타일 일관성',
    ],
    bestFor: [
      '게임 개발',
      '캐릭터 디자인',
      '일러스트',
      'NFT 아트',
    ],
    developer: 'Leonardo.ai',
    releaseYear: '2023',
    speed: 'fast',
    quality: 'high',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    shortDescription: '최고 품질의 정교한 이미지',
    fullDescription: 'OpenAI의 최신 이미지 생성 모델로, ChatGPT Plus에 통합되어 있습니다. 복잡한 프롬프트를 가장 정확하게 이해하고 구현합니다.',
    pointsPerImage: 200,
    badge: '최고품질',
    color: 'bg-purple-50 border-purple-200',
    usedIn: ['ChatGPT Plus', 'Microsoft Bing', 'Canva'],
    features: [
      'ChatGPT 통합',
      '가장 정교한 품질',
      '복잡한 프롬프트 이해',
      '한글 지원',
    ],
    strengths: [
      '업계 최고 품질',
      'OpenAI 브랜드 신뢰',
      '안전 필터 강력',
    ],
    bestFor: [
      '프리미엄 작업',
      '복잡한 요구사항',
      '최고 품질 필요',
      '비즈니스 프레젠테이션',
    ],
    developer: 'OpenAI',
    releaseYear: '2023',
    speed: 'medium',
    quality: 'ultra',
  },
  {
    id: 'aurora',
    name: 'Aurora (xAI Grok)',
    shortDescription: '일론 머스크의 최신 AI, 초고품질',
    fullDescription: '일론 머스크의 xAI가 2024년 출시한 최신 이미지 생성 모델. Grok AI의 이미지 생성 엔진으로, 사실적이고 세밀한 디테일이 특징입니다.',
    pointsPerImage: 250,
    badge: 'NEW',
    color: 'bg-pink-50 border-pink-200',
    usedIn: ['Grok (X.com)', 'xAI 플랫폼'],
    features: [
      '2024 최신 모델',
      '초고품질',
      '세밀한 디테일',
      'xAI 기술',
    ],
    strengths: [
      '최신 기술',
      '일론 머스크 브랜드',
      '사실적 렌더링',
    ],
    bestFor: [
      '최신 기술 체험',
      '고품질 요구',
      '트렌디한 결과물',
      '프리미엄 프로젝트',
    ],
    developer: 'xAI (Elon Musk)',
    releaseYear: '2024',
    speed: 'medium',
    quality: 'ultra',
  },
];

// 품질/속도 아이콘
export const QUALITY_ICONS = {
  standard: '⭐⭐⭐',
  high: '⭐⭐⭐⭐',
  premium: '⭐⭐⭐⭐⭐',
  ultra: '⭐⭐⭐⭐⭐',
};

export const SPEED_ICONS = {
  'very-fast': '⚡⚡⚡',
  'fast': '⚡⚡',
  'medium': '⚡',
  'slow': '🐢',
};

