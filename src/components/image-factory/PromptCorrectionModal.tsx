'use client';

import { useState } from 'react';

// 이미지 용도 옵션
const PURPOSE_OPTIONS = [
  { id: 'instagram', label: '인스타그램', ratio: '1:1', size: '1080x1080' },
  { id: 'instagram_story', label: '인스타 스토리/릴스', ratio: '9:16', size: '1080x1920' },
  { id: 'youtube_thumbnail', label: '유튜브 썸네일', ratio: '16:9', size: '1280x720' },
  { id: 'youtube_shorts', label: '유튜브 쇼츠', ratio: '9:16', size: '1080x1920' },
  { id: 'card_news', label: '카드뉴스', ratio: '1:1', size: '1080x1080' },
  { id: 'blog', label: '블로그 대표이미지', ratio: '16:9', size: '1200x630' },
  { id: 'presentation', label: '프레젠테이션', ratio: '16:9', size: '1920x1080' },
  { id: 'custom', label: '직접 지정', ratio: 'custom', size: 'custom' },
];

// 커스텀 비율 옵션
const CUSTOM_RATIOS = [
  { id: '1:1', label: '1:1 (정사각형)' },
  { id: '4:3', label: '4:3 (가로형)' },
  { id: '3:4', label: '3:4 (세로형)' },
  { id: '16:9', label: '16:9 (와이드)' },
  { id: '9:16', label: '9:16 (세로 와이드)' },
  { id: '3:2', label: '3:2' },
  { id: '2:3', label: '2:3' },
];

// 그림체(스타일) 옵션
const STYLE_OPTIONS = [
  { id: 'realistic', label: '실사', emoji: '📷', desc: '사진처럼 사실적인' },
  { id: 'anime', label: '애니메이션', emoji: '🎌', desc: '일본 애니메이션 스타일' },
  { id: 'cartoon', label: '카툰', emoji: '🎨', desc: '만화/일러스트 스타일' },
  { id: 'digital_art', label: '디지털 아트', emoji: '💻', desc: '현대적 디지털 일러스트' },
  { id: 'oil_painting', label: '유화', emoji: '🖼️', desc: '고전 유화 느낌' },
  { id: 'watercolor', label: '수채화', emoji: '🎨', desc: '부드러운 수채화 스타일' },
  { id: '3d_render', label: '3D 렌더링', emoji: '🧊', desc: '3D 그래픽 스타일' },
  { id: 'pixel_art', label: '픽셀 아트', emoji: '👾', desc: '레트로 픽셀 스타일' },
  { id: 'cinematic', label: '시네마틱', emoji: '🎬', desc: '영화같은 분위기' },
  { id: 'minimalist', label: '미니멀', emoji: '⬜', desc: '심플하고 깔끔한' },
  { id: 'fantasy', label: '판타지', emoji: '🧙', desc: '환상적이고 신비로운' },
  { id: 'cyberpunk', label: '사이버펑크', emoji: '🌃', desc: '네온과 미래도시' },
];

// 분위기(무드) 옵션
const MOOD_OPTIONS = [
  { id: 'bright', label: '밝은', emoji: '☀️', desc: '환하고 긍정적인 분위기' },
  { id: 'calm', label: '차분한', emoji: '🌊', desc: '평화롭고 고요한 분위기' },
  { id: 'serious', label: '진지한', emoji: '🎭', desc: '무게감 있고 진중한 분위기' },
  { id: 'dreamy', label: '몽환적', emoji: '🌙', desc: '신비롭고 꿈같은 분위기' },
  { id: 'energetic', label: '역동적', emoji: '⚡', desc: '활기차고 에너지 넘치는' },
  { id: 'romantic', label: '로맨틱', emoji: '💕', desc: '사랑스럽고 낭만적인' },
  { id: 'dark', label: '어두운', emoji: '🌑', desc: '무겁고 신비로운 분위기' },
  { id: 'warm', label: '따뜻한', emoji: '🔥', desc: '포근하고 온기 있는' },
  { id: 'cool', label: '차가운', emoji: '❄️', desc: '시원하고 세련된 분위기' },
  { id: 'playful', label: '유쾌한', emoji: '🎉', desc: '재미있고 밝은 분위기' },
  { id: 'nostalgic', label: '레트로', emoji: '📼', desc: '복고풍 감성' },
  { id: 'dramatic', label: '극적인', emoji: '🎬', desc: '강렬하고 드라마틱한' },
];

// 메인 색감 옵션
const COLOR_OPTIONS = [
  { id: 'vibrant', label: '비비드', emoji: '🌈', desc: '선명하고 강렬한 색상' },
  { id: 'pastel', label: '파스텔', emoji: '🍬', desc: '부드럽고 연한 색상' },
  { id: 'monochrome', label: '모노톤', emoji: '⚫', desc: '흑백 또는 단색 계열' },
  { id: 'earth', label: '어스톤', emoji: '🍂', desc: '자연스러운 갈색/베이지' },
  { id: 'neon', label: '네온', emoji: '💜', desc: '형광빛 강렬한 색상' },
  { id: 'golden', label: '골든', emoji: '✨', desc: '황금빛 따뜻한 색감' },
  { id: 'blue_hour', label: '블루아워', emoji: '🌌', desc: '푸른 새벽/황혼 색감' },
  { id: 'sunset', label: '선셋', emoji: '🌅', desc: '노을빛 오렌지/핑크' },
  { id: 'forest', label: '포레스트', emoji: '🌲', desc: '숲속 초록 자연색' },
  { id: 'ocean', label: '오션', emoji: '🌊', desc: '바다빛 청량한 블루' },
  { id: 'vintage', label: '빈티지', emoji: '📷', desc: '바랜 듯한 레트로 색감' },
  { id: 'candy', label: '캔디', emoji: '🍭', desc: '달콤한 핑크/민트 계열' },
];

// 조명 스타일 옵션
const LIGHTING_OPTIONS = [
  { id: 'natural', label: '자연광', emoji: '🌤️', desc: '자연스러운 햇빛' },
  { id: 'golden_hour', label: '골든아워', emoji: '🌇', desc: '황금빛 일몰/일출' },
  { id: 'studio', label: '스튜디오', emoji: '💡', desc: '전문 촬영 조명' },
  { id: 'dramatic', label: '드라마틱', emoji: '🎭', desc: '강한 명암 대비' },
  { id: 'soft', label: '소프트', emoji: '☁️', desc: '부드러운 확산광' },
  { id: 'backlight', label: '역광', emoji: '🌟', desc: '뒤에서 비추는 빛' },
  { id: 'neon_glow', label: '네온글로우', emoji: '💫', desc: '네온 불빛 효과' },
  { id: 'candlelight', label: '캔들라이트', emoji: '🕯️', desc: '촛불처럼 따뜻한' },
  { id: 'moonlight', label: '문라이트', emoji: '🌙', desc: '달빛 아래 분위기' },
  { id: 'volumetric', label: '볼류메트릭', emoji: '🌫️', desc: '빛 줄기가 보이는' },
  { id: 'rim', label: '림라이트', emoji: '✨', desc: '윤곽을 강조하는 빛' },
  { id: 'low_key', label: '로우키', emoji: '🌑', desc: '어두운 배경, 부분 조명' },
];

// 카메라 앵글 옵션
const ANGLE_OPTIONS = [
  { id: 'eye_level', label: '아이레벨', emoji: '👁️', desc: '눈높이 정면 샷' },
  { id: 'low_angle', label: '로우앵글', emoji: '⬆️', desc: '아래에서 위로 올려다보는' },
  { id: 'high_angle', label: '하이앵글', emoji: '⬇️', desc: '위에서 아래로 내려다보는' },
  { id: 'birds_eye', label: '버즈아이', emoji: '🦅', desc: '완전 위에서 내려다보는' },
  { id: 'dutch', label: '더치앵글', emoji: '📐', desc: '기울어진 역동적 구도' },
  { id: 'close_up', label: '클로즈업', emoji: '🔍', desc: '가까이서 촬영' },
  { id: 'wide', label: '와이드샷', emoji: '🏞️', desc: '넓은 배경 포함' },
  { id: 'portrait', label: '인물샷', emoji: '🧑', desc: '인물 중심 구도' },
  { id: 'macro', label: '매크로', emoji: '🔬', desc: '극도로 가까운 접사' },
  { id: 'over_shoulder', label: '오버숄더', emoji: '👤', desc: '어깨 너머로 보는' },
  { id: 'symmetrical', label: '대칭구도', emoji: '⚖️', desc: '좌우 대칭 균형' },
  { id: 'rule_of_thirds', label: '삼등분', emoji: '📊', desc: '삼등분 법칙 구도' },
];

interface PromptCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  onCorrect: (correctedPrompt: string, purpose: string, size: string) => void;
}

export const PromptCorrectionModal = ({
  isOpen,
  onClose,
  prompt,
  onCorrect,
}: PromptCorrectionModalProps) => {
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedLighting, setSelectedLighting] = useState<string>('');
  const [selectedAngle, setSelectedAngle] = useState<string>('');
  const [customRatio, setCustomRatio] = useState<string>('1:1');
  const [customWidth, setCustomWidth] = useState<string>('1024');
  const [customHeight, setCustomHeight] = useState<string>('1024');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSelectedSize = () => {
    if (selectedPurpose === 'custom') {
      return `${customWidth}x${customHeight}`;
    }
    const option = PURPOSE_OPTIONS.find(o => o.id === selectedPurpose);
    return option?.size || '1024x1024';
  };

  const getSelectedRatio = () => {
    if (selectedPurpose === 'custom') {
      return customRatio;
    }
    const option = PURPOSE_OPTIONS.find(o => o.id === selectedPurpose);
    return option?.ratio || '1:1';
  };

  const handleCorrect = async () => {
    if (!selectedPurpose) {
      setError('용도를 선택해주세요.');
      return;
    }
    if (!selectedStyle) {
      setError('그림체를 선택해주세요.');
      return;
    }
    // 분위기는 선택사항 (optional)

    setIsLoading(true);
    setError(null);

    try {
      const styleOption = STYLE_OPTIONS.find(s => s.id === selectedStyle);
      const moodOption = MOOD_OPTIONS.find(m => m.id === selectedMood);
      const colorOption = COLOR_OPTIONS.find(c => c.id === selectedColor);
      const lightingOption = LIGHTING_OPTIONS.find(l => l.id === selectedLighting);
      const angleOption = ANGLE_OPTIONS.find(a => a.id === selectedAngle);
      
      const response = await fetch('/api/gpt/correct-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          purpose: selectedPurpose,
          style: selectedStyle,
          styleLabel: styleOption?.label || '',
          styleDesc: styleOption?.desc || '',
          mood: selectedMood,
          moodLabel: moodOption?.label || '',
          moodDesc: moodOption?.desc || '',
          color: selectedColor,
          colorLabel: colorOption?.label || '',
          colorDesc: colorOption?.desc || '',
          lighting: selectedLighting,
          lightingLabel: lightingOption?.label || '',
          lightingDesc: lightingOption?.desc || '',
          angle: selectedAngle,
          angleLabel: angleOption?.label || '',
          angleDesc: angleOption?.desc || '',
          ratio: getSelectedRatio(),
          size: getSelectedSize(),
        }),
      });

      if (!response.ok) {
        throw new Error('프롬프트 교정에 실패했습니다.');
      }

      const data = await response.json();
      onCorrect(data.correctedPrompt, selectedPurpose, getSelectedSize());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 커스텀 비율 선택 시 사이즈 자동 계산
  const handleCustomRatioChange = (ratio: string) => {
    setCustomRatio(ratio);
    const baseSize = 1024;
    const [w, h] = ratio.split(':').map(Number);
    if (w > h) {
      setCustomWidth(String(baseSize));
      setCustomHeight(String(Math.round(baseSize * (h / w))));
    } else {
      setCustomHeight(String(baseSize));
      setCustomWidth(String(Math.round(baseSize * (w / h))));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
        {/* 헤더 - 고정 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ✨ 프롬프트 교정 (GPT-5.1)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI가 용도에 맞게 프롬프트를 최적화합니다
          </p>
        </div>

        {/* 본문 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 현재 프롬프트 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              현재 프롬프트
            </label>
            <div className="p-3 bg-gray-800/50 rounded-lg text-gray-300 text-sm border border-gray-700/50">
              {prompt || '(프롬프트가 비어있습니다)'}
            </div>
          </div>

          {/* 용도 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              📸 이미지 용도 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPurpose(option.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedPurpose === option.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  {option.id !== 'custom' && (
                    <div className="text-xs opacity-70 mt-1">
                      {option.ratio} • {option.size}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 그림체(스타일) 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🎨 그림체 선택
            </label>
            <div className="grid grid-cols-4 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedStyle === style.id
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  <div className="text-base mb-0.5">{style.emoji}</div>
                  <div className="font-medium text-[10px]">{style.label}</div>
                </button>
              ))}
            </div>
            {selectedStyle && (
              <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400">
                  {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.desc}
                </p>
              </div>
            )}
          </div>

          {/* 분위기(무드) 선택 - 선택사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🌈 분위기 선택 <span className="text-gray-500 text-xs">(선택)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedMood === mood.id
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  <div className="text-base mb-0.5">{mood.emoji}</div>
                  <div className="font-medium text-[10px]">{mood.label}</div>
                </button>
              ))}
            </div>
            {selectedMood && (
              <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400">
                  {MOOD_OPTIONS.find(m => m.id === selectedMood)?.desc}
                </p>
              </div>
            )}
          </div>

          {/* 메인 색감 선택 (선택사항) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🎨 메인 색감 <span className="text-gray-500 text-xs">(선택)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(selectedColor === color.id ? '' : color.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedColor === color.id
                      ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  <div className="text-base mb-0.5">{color.emoji}</div>
                  <div className="font-medium text-[10px]">{color.label}</div>
                </button>
              ))}
            </div>
            {selectedColor && (
              <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400">
                  {COLOR_OPTIONS.find(c => c.id === selectedColor)?.desc}
                </p>
              </div>
            )}
          </div>

          {/* 조명 스타일 선택 (선택사항) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              💡 조명 스타일 <span className="text-gray-500 text-xs">(선택)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LIGHTING_OPTIONS.map((lighting) => (
                <button
                  key={lighting.id}
                  onClick={() => setSelectedLighting(selectedLighting === lighting.id ? '' : lighting.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedLighting === lighting.id
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  <div className="text-base mb-0.5">{lighting.emoji}</div>
                  <div className="font-medium text-[10px]">{lighting.label}</div>
                </button>
              ))}
            </div>
            {selectedLighting && (
              <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400">
                  {LIGHTING_OPTIONS.find(l => l.id === selectedLighting)?.desc}
                </p>
              </div>
            )}
          </div>

          {/* 카메라 앵글 선택 (선택사항) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              📷 카메라 앵글 <span className="text-gray-500 text-xs">(선택)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ANGLE_OPTIONS.map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => setSelectedAngle(selectedAngle === angle.id ? '' : angle.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedAngle === angle.id
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  <div className="text-base mb-0.5">{angle.emoji}</div>
                  <div className="font-medium text-[10px]">{angle.label}</div>
                </button>
              ))}
            </div>
            {selectedAngle && (
              <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400">
                  {ANGLE_OPTIONS.find(a => a.id === selectedAngle)?.desc}
                </p>
              </div>
            )}
          </div>

          {/* 커스텀 사이즈 옵션 */}
          {selectedPurpose === 'custom' && (
            <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  비율 선택
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CUSTOM_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => handleCustomRatioChange(ratio.id)}
                      className={`p-2 rounded-lg text-xs transition-all ${
                        customRatio === ratio.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">너비 (px)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="256"
                    max="2048"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">높이 (px)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="256"
                    max="2048"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 푸터 - 고정 */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-700/50 bg-gray-900/50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={handleCorrect}
            disabled={isLoading || !selectedPurpose || !selectedStyle}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                교정 중...
              </>
            ) : (
              <>✨ 교정하기</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptCorrectionModal;

