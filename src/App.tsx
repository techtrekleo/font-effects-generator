import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadIcon, ClearIcon, InspirationIcon, PhotoIcon } from './components/Icons';
import { ColorInput } from './components/ColorInput';
import { renderComposition, getRandomItem, getRandomHexColor } from './utils/canvas';
import { fonts, effects, canvasSizes, DEFAULT_COLOR_1, DEFAULT_COLOR_2 } from './constants';
import type { FontId, EffectId, TextBlock, CanvasSizeId } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'center' | 'corner'>('center');
  const [canvasSizeId, setCanvasSizeId] = useState<CanvasSizeId>('square');
  
  const initialCenterText: TextBlock = {
    text: '口袋裡的猫',
    fontId: 'noto-sans-tc-900',
    effectId: 'shadow',
    color1: '#FFFFFF',
    color2: '#000000',
    fontSize: 120,
  };
  const initialCornerText: TextBlock = {
    text: '',
    fontId: 'taipei-sans-700',
    effectId: 'none',
    color1: '#FFFFFF',
    color2: '#000000',
    fontSize: 40,
  };

  const [centerText, setCenterText] = useState<TextBlock>(initialCenterText);
  const [cornerText, setCornerText] = useState<TextBlock>(initialCornerText);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderRef = useRef(0);

  const activeTextConfig = activeTab === 'center' ? centerText : cornerText;
  const setActiveTextConfig = activeTab === 'center' ? setCenterText : setCornerText;
  const activeCanvasSize = canvasSizes.find(s => s.id === canvasSizeId) || canvasSizes[0];

  const updateImage = useCallback(async () => {
    const renderId = ++renderRef.current;
    
    const dataUrl = await renderComposition(backgroundImage, centerText, cornerText, activeCanvasSize.width, activeCanvasSize.height);
    
    if (renderId === renderRef.current) {
        setOutputImage(dataUrl);
    }
  }, [backgroundImage, centerText, cornerText, activeCanvasSize]);

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
     // Reset file input to allow re-uploading the same file
    if(event.target) {
      event.target.value = '';
    }
  };

  const handleClear = () => {
    setCenterText(initialCenterText);
    setCornerText(initialCornerText);
    setBackgroundImage(null);
    setCanvasSizeId('square');
    setActiveTab('center');
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
  
  const handleInspiration = () => {
    const randomFont = getRandomItem(fonts);
    const randomEffect = getRandomItem(effects);
    
    setActiveTextConfig(prev => {
        const newText = !prev.text.trim()
            ? getRandomItem(['靈感湧現', '創意無限', '設計之美', '風格獨具', '你好世界'])
            : prev.text;

        return {
            ...prev,
            text: newText,
            fontId: randomFont.id,
            effectId: randomEffect.id,
            color1: getRandomHexColor(),
            color2: getRandomHexColor(),
            fontSize: prev.fontSize // Keep existing font size
        };
    });
  };

  const renderColorPickers = () => {
    switch(activeTextConfig.effectId) {
        case 'none':
            return <ColorInput label="文字顏色" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />;
        case 'shadow':
            return <>
                <ColorInput label="文字顏色" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />
                <ColorInput label="陰影顏色" value={activeTextConfig.color2} onChange={(c) => setActiveTextConfig(p => ({...p, color2: c}))} />
            </>;
        case 'neon':
            return <ColorInput label="光暈顏色" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />;
        case 'glitch':
            return <ColorInput label="文字顏色" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />;
        case 'gradient':
            return <>
                <ColorInput label="漸層起始" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />
                <ColorInput label="漸層結束" value={activeTextConfig.color2} onChange={(c) => setActiveTextConfig(p => ({...p, color2: c}))} />
            </>;
        case 'outline':
            return <>
                <ColorInput label="文字顏色" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />
                <ColorInput label="描邊顏色" value={activeTextConfig.color2} onChange={(c) => setActiveTextConfig(p => ({...p, color2: c}))} />
            </>;
        case 'faux-3d':
            return <>
                <ColorInput label="文字顏色" value={activeTextConfig.color1} onChange={(c) => setActiveTextConfig(p => ({...p, color1: c}))} />
                <ColorInput label="立體陰影" value={activeTextConfig.color2} onChange={(c) => setActiveTextConfig(p => ({...p, color2: c}))} />
            </>;
        default:
            return null;
    }
  }

  const hasContent = centerText.text.trim() || cornerText.text.trim() || backgroundImage;

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <header className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500" style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900 }}>字體特效產生器</h1>
        <p className="text-gray-400 mt-2">結合背景圖片，創造獨一無二的客製化字卡</p>
      </header>
      
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col gap-6">
          
          <div className="flex flex-col gap-3">
              <label className="block text-lg font-semibold text-gray-300">1. 選擇畫布尺寸</label>
              <div className="grid grid-cols-2 gap-3">
                {canvasSizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setCanvasSizeId(size.id)}
                    className={`py-2 px-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 text-sm truncate ${canvasSizeId === size.id ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                    title={`${size.name} (${size.width}x${size.height})`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="block text-lg font-semibold text-gray-300">2. 上傳背景 (選用)</label>
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    <PhotoIcon /> 上傳圖片
                </button>
                {backgroundImage && (
                    <button onClick={handleClearImage} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        <ClearIcon /> 清除圖片
                    </button>
                )}
            </div>
          </div>
          
          <div className="border-t border-b border-gray-700 py-4 flex flex-col gap-4">
              <label className="block text-lg font-semibold text-gray-300">3. 編輯文字區塊</label>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setActiveTab('center')} className={`py-2 px-3 rounded-lg font-semibold transition-colors ${activeTab === 'center' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>中央文字</button>
                  <button onClick={() => setActiveTab('corner')} className={`py-2 px-3 rounded-lg font-semibold transition-colors ${activeTab === 'corner' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>角落文字</button>
              </div>
          </div>
          
          <div className="flex flex-col gap-4 flex-grow">
            <input
              type="text"
              value={activeTextConfig.text}
              onChange={(e) => setActiveTextConfig(p => ({...p, text: e.target.value}))}
              placeholder={`在此輸入${activeTab === 'center' ? '中央' : '角落'}文字...`}
              maxLength={30}
              className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <p className="text-right text-sm text-gray-500 -mt-3">{activeTextConfig.text.length} / 30</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fonts.map(font => (
                <button
                  key={font.id}
                  onClick={() => setActiveTextConfig(p => ({...p, fontId: font.id}))}
                  className={`py-2 px-3 rounded-lg text-center transition-all duration-200 border-2 text-sm sm:text-base truncate ${activeTextConfig.fontId === font.id ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                  style={{fontFamily: `"${font.family}"`, fontWeight: font.weight }}
                  title={font.name}
                >
                  {font.name}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {effects.map(effect => (
                <button
                  key={effect.id}
                  onClick={() => setActiveTextConfig(p => ({...p, effectId: effect.id}))}
                  className={`py-2 px-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${activeTextConfig.effectId === effect.id ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                >
                  {effect.name}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-3">
              <label className="block text-base font-semibold text-gray-300">字體大小: {activeTextConfig.fontSize}px</label>
              <input type="range" min="10" max="400" value={activeTextConfig.fontSize} onChange={e => setActiveTextConfig(p => ({...p, fontSize: Number(e.target.value)}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>

            {activeTextConfig.effectId !== 'none' && (
              <div className="flex flex-col gap-3">{renderColorPickers()}</div>
            )}
          </div>


          <div className="mt-auto pt-6 border-t border-gray-700/50 flex flex-col gap-4">
            <button onClick={handleInspiration} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg">
              <InspirationIcon /> 給我靈感！
            </button>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleDownload} disabled={!outputImage} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg">
                <DownloadIcon /> 下載圖片
              </button>
              <button onClick={handleClear} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg">
                <ClearIcon /> 全部清除
              </button>
            </div>
          </div>
        </div>

        <div 
            className="bg-gray-800/20 p-2 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden" 
            style={{ 
              aspectRatio: `${activeCanvasSize.width} / ${activeCanvasSize.height}`,
              backgroundImage: !backgroundImage && !outputImage ? `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%234B556380' stroke-width='2' stroke-dasharray='6%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")` : 'none',
              backgroundSize: 'cover'
            }}
        >
          {outputImage ? (
            <img src={outputImage} alt="Generated text art" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center text-gray-500 p-4">
              <p className="text-2xl">您的藝術字體將會顯示在此</p>
              <p className="mt-2">請在左側選擇尺寸、輸入文字或上傳圖片以開始</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;