import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadIcon, ClearIcon, InspirationIcon, PhotoIcon } from './components/Icons';
import { DraggableTextBlock } from './components/DraggableTextBlock';
import { VisualCanvas } from './components/VisualCanvas';
import { renderComposition, getRandomItem, getRandomHexColor } from './utils/canvas';
import { fonts, effects, canvasSizes, DEFAULT_COLOR_1, DEFAULT_COLOR_2 } from './constants';
import type { TextBlock, CanvasSizeId, EffectId } from './types';

const App: React.FC = () => {
  const [canvasSizeId, setCanvasSizeId] = useState<CanvasSizeId>('square');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [selectedTextBlockId, setSelectedTextBlockId] = useState<string | null>('main');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderRef = useRef(0);

  const activeCanvasSize = canvasSizes.find(s => s.id === canvasSizeId) || canvasSizes[0];

  // 初始化三個文字區塊
  const initialTextBlocks: TextBlock[] = [
    {
      id: 'main',
      type: 'main',
      text: '主標題',
      fontId: 'noto-sans-tc-900',
      effectIds: ['shadow'],
      color1: DEFAULT_COLOR_1,
      color2: DEFAULT_COLOR_2,
      fontSize: 120,
      x: activeCanvasSize.width * 0.1,
      y: activeCanvasSize.height * 0.3,
    },
    {
      id: 'sub1',
      type: 'sub1',
      text: '副標題一',
      fontId: 'taipei-sans-700',
      effectIds: [],
      color1: DEFAULT_COLOR_1,
      color2: DEFAULT_COLOR_2,
      fontSize: 60,
      x: activeCanvasSize.width * 0.1,
      y: activeCanvasSize.height * 0.5,
    },
    {
      id: 'sub2',
      type: 'sub2',
      text: '副標題二',
      fontId: 'noto-sans-tc-500',
      effectIds: [],
      color1: DEFAULT_COLOR_1,
      color2: DEFAULT_COLOR_2,
      fontSize: 40,
      x: activeCanvasSize.width * 0.1,
      y: activeCanvasSize.height * 0.7,
    },
  ];

  const [textBlocks, setTextBlocks] = useState<TextBlock[]>(initialTextBlocks);

  const updateImage = useCallback(async () => {
    const renderId = ++renderRef.current;
    
    const dataUrl = await renderComposition(backgroundImage, textBlocks, activeCanvasSize.width, activeCanvasSize.height);
    
    if (renderId === renderRef.current) {
        setOutputImage(dataUrl);
    }
  }, [backgroundImage, textBlocks, activeCanvasSize]);

  useEffect(() => {
    updateImage();
  }, [updateImage]);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if(event.target) {
      event.target.value = '';
    }
  };

  const handleClear = () => {
    setTextBlocks(initialTextBlocks);
    setBackgroundImage(null);
    setCanvasSizeId('square');
    setSelectedTextBlockId('main');
  };
  
  const handleClearImage = () => {
    setBackgroundImage(null);
  };

  const handleDownload = () => {
    if (!outputImage) return;
    const link = document.createElement('a');
    link.href = outputImage;
    link.download = `text-effect-composite-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTextBlockUpdate = (updatedTextBlock: TextBlock) => {
    setTextBlocks(prev => prev.map(tb => 
      tb.id === updatedTextBlock.id ? updatedTextBlock : tb
    ));
  };

  const handleInspiration = () => {
    const randomFont = getRandomItem(fonts);
    const effectsToSample = effects.filter(e => e.id !== 'none');
    const numEffects = Math.floor(Math.random() * 3) + 1; // 1 to 3 effects
    const randomEffectIds: EffectId[] = [];
    while (randomEffectIds.length < numEffects && effectsToSample.length > 0) {
        const randomIndex = Math.floor(Math.random() * effectsToSample.length);
        const randomEffect = effectsToSample.splice(randomIndex, 1)[0];
        // Avoid incompatible combinations for better results
        if (randomEffect.id === 'gradient' && randomEffectIds.includes('neon')) continue;
        if (randomEffect.id === 'neon' && randomEffectIds.includes('gradient')) continue;
        randomEffectIds.push(randomEffect.id);
    }
    
    setTextBlocks(prev => prev.map(textBlock => {
        const newText = !textBlock.text.trim()
            ? getRandomItem(['靈感湧現', '創意無限', '設計之美', '風格獨具', '你好世界'])
            : textBlock.text;

        return {
            ...textBlock,
            text: newText,
            fontId: randomFont.id,
            effectIds: randomEffectIds.sort(),
            color1: getRandomHexColor(),
            color2: getRandomHexColor(),
            fontSize: textBlock.fontSize // Keep existing font size
        };
    }));
  };

  const isPristine = 
    JSON.stringify(textBlocks) === JSON.stringify(initialTextBlocks) &&
    backgroundImage === null &&
    canvasSizeId === 'square';

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <header className="w-full max-w-7xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600" style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900 }}>字體特效產生器</h1>
        <p className="text-gray-400 mt-2">三個可拖動文字區塊，創造獨一無二的客製化字卡</p>
      </header>
      
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側控制面板 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700">
            <div className="flex flex-col gap-3">
              <label className="block text-lg font-semibold text-gray-300">1. 選擇畫布尺寸</label>
              <div className="grid grid-cols-2 gap-3">
                {canvasSizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setCanvasSizeId(size.id)}
                    className={`py-2 px-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 text-sm truncate ${
                      canvasSizeId === size.id ? 'bg-cyan-600 border-cyan-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    title={`${size.name} (${size.width}x${size.height})`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700">
            <div className="flex flex-col gap-3">
              <label className="block text-lg font-semibold text-gray-300">2. 上傳背景 (選用)</label>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition">
                  <PhotoIcon /> 上傳圖片
                </button>
                {backgroundImage && (
                  <button onClick={handleClearImage} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    <ClearIcon /> 清除圖片
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 文字區塊選擇 */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700">
            <div className="flex flex-col gap-3">
              <label className="block text-lg font-semibold text-gray-300">3. 選擇文字區塊</label>
              <div className="grid grid-cols-3 gap-2">
                {textBlocks.map(textBlock => (
                  <button
                    key={textBlock.id}
                    onClick={() => setSelectedTextBlockId(textBlock.id)}
                    className={`py-2 px-3 rounded-lg font-semibold transition-colors text-sm ${
                      selectedTextBlockId === textBlock.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {textBlock.type === 'main' ? '主標題' : textBlock.type === 'sub1' ? '副標題一' : '副標題二'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 當前選中文字區塊的編輯面板 */}
          {selectedTextBlockId && (
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700">
              <DraggableTextBlock
                textBlock={textBlocks.find(tb => tb.id === selectedTextBlockId)!}
                onUpdate={handleTextBlockUpdate}
                isSelected={true}
                canvasWidth={activeCanvasSize.width}
                canvasHeight={activeCanvasSize.height}
              />
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700">
            <div className="flex flex-col gap-4">
              <button onClick={handleInspiration} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg">
                <InspirationIcon /> 給我靈感！
              </button>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleDownload} disabled={!outputImage} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg">
                  <DownloadIcon /> 下載圖片
                </button>
                <button onClick={handleClear} disabled={isPristine} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                  <ClearIcon /> 全部清除
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右側預覽區域 */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/20 p-4 rounded-2xl border border-dashed border-gray-700">
            <VisualCanvas
              textBlocks={textBlocks}
              backgroundImage={backgroundImage}
              canvasWidth={activeCanvasSize.width}
              canvasHeight={activeCanvasSize.height}
              selectedTextBlockId={selectedTextBlockId}
              onTextBlockClick={setSelectedTextBlockId}
              onTextBlockUpdate={handleTextBlockUpdate}
            />
          </div>
        </div>
      </main>
      
      {/* 抖內按鈕頁腳 */}
      <footer className="w-full max-w-7xl mt-8 mb-4">
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 text-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-300 text-sm">© {new Date().getFullYear()} Sonic Pulse. Built with ❤️ by 音樂脈動-Sonic Pulse</p>
            <p className="mt-2">
              <a 
                href="https://www.youtube.com/@%E9%9F%B3%E6%A8%82%E8%84%88%E5%8B%95SonicPulse" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                🎵 Sonic Pulse YouTube Channel
              </a>
            </p>
            <a
              href="https://www.paypal.com/ncp/payment/PK49RJYSTAV6Y"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="text-xl">🐱</span>
              <span>抖內支持開發者</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
