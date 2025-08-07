import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadIcon, ClearIcon, InspirationIcon } from './components/Icons';
import { ColorInput } from './components/ColorInput';
import { renderTextImage, getRandomItem, getRandomHexColor } from './utils/canvas';
import { fonts, effects, DEFAULT_COLOR_1, DEFAULT_COLOR_2 } from './constants';
import type { Font, FontId, EffectId } from './types';

const App: React.FC = () => {
  const [text, setText] = useState('口袋裡的猫');
  const [selectedFont, setSelectedFont] = useState<FontId>('noto-sans-tc-500');
  const [selectedEffectId, setSelectedEffectId] = useState<EffectId>('none');
  const [color1, setColor1] = useState(DEFAULT_COLOR_1);
  const [color2, setColor2] = useState(DEFAULT_COLOR_2);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const renderRef = useRef(0);

  const updateImage = useCallback(async () => {
    const renderId = ++renderRef.current;
    if (!text.trim()) {
      setOutputImage(null);
      return;
    }
    
    const fontObject = fonts.find(f => f.id === selectedFont);
    if (!fontObject) {
        console.error('Selected font not found!');
        return;
    }

    const dataUrl = await renderTextImage(text, fontObject, selectedEffectId, color1, color2);
    
    if (renderId === renderRef.current) {
        setOutputImage(dataUrl);
    }
  }, [text, selectedFont, selectedEffectId, color1, color2]);

  useEffect(() => {
    updateImage();
  }, [updateImage]);

  const handleClear = () => {
    setText('');
    setSelectedFont('noto-sans-tc-500');
    setSelectedEffectId('none');
    setColor1(DEFAULT_COLOR_1);
    setColor2(DEFAULT_COLOR_2);
  };

  const handleDownload = () => {
    if (!outputImage) return;
    const link = document.createElement('a');
    link.href = outputImage;
    link.download = `text-effect-${selectedEffectId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleInspiration = () => {
    const randomFont = getRandomItem(fonts);
    const randomEffect = getRandomItem(effects);

    if (!text.trim()) {
         const sampleTexts = ['靈感湧現', '創意無限', '設計之美', '風格獨具', '你好世界'];
         setText(getRandomItem(sampleTexts));
    }
    
    setSelectedFont(randomFont.id);
    setSelectedEffectId(randomEffect.id);
    setColor1(getRandomHexColor());
    setColor2(getRandomHexColor());
  };

  const renderColorPickers = () => {
    switch(selectedEffectId) {
        case 'none':
            return <ColorInput label="文字顏色" value={color1} onChange={setColor1} />;
        case 'shadow':
            return <>
                <ColorInput label="文字顏色" value={color1} onChange={setColor1} />
                <ColorInput label="陰影顏色" value={color2} onChange={setColor2} />
            </>;
        case 'neon':
            return <ColorInput label="光暈顏色" value={color1} onChange={setColor1} />;
        case 'glitch':
            return <ColorInput label="文字顏色" value={color1} onChange={setColor1} />;
        case 'gradient':
            return <>
                <ColorInput label="漸層起始" value={color1} onChange={setColor1} />
                <ColorInput label="漸層結束" value={color2} onChange={setColor2} />
            </>;
        case 'outline':
            return <>
                <ColorInput label="文字顏色" value={color1} onChange={setColor1} />
                <ColorInput label="描邊顏色" value={color2} onChange={setColor2} />
            </>;
        case 'faux-3d':
            return <>
                <ColorInput label="文字顏色" value={color1} onChange={setColor1} />
                <ColorInput label="立體陰影" value={color2} onChange={setColor2} />
            </>;
        default:
            return null;
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <header className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500" style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900 }}>字體特效產生器</h1>
        <p className="text-gray-400 mt-2">即時預覽、一鍵下載，輕鬆創造獨特的藝術字</p>
      </header>
      
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col gap-6">
          
          <div>
            <label htmlFor="text-input" className="block text-lg font-semibold mb-3 text-gray-300">1. 輸入您的文字</label>
            <input
              id="text-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此輸入文字..."
              maxLength={10}
              className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
             <p className="text-right text-sm text-gray-500 mt-1">{text.length} / 10</p>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-300">2. 選擇一款字體</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fonts.map(font => (
                <button
                  key={font.id}
                  onClick={() => setSelectedFont(font.id)}
                  className={`py-2 px-3 rounded-lg text-center transition-all duration-200 border-2 text-sm sm:text-base ${selectedFont === font.id ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                  style={{fontFamily: `"${font.family}"`, fontWeight: font.weight }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-300">3. 選擇一種特效</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {effects.map(effect => (
                <button
                  key={effect.id}
                  onClick={() => setSelectedEffectId(effect.id)}
                  className={`py-2 px-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${selectedEffectId === effect.id ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                >
                  {effect.name}
                </button>
              ))}
            </div>
          </div>
          
          {selectedEffectId !== 'none' && (
             <div>
                <label className="block text-lg font-semibold mb-3 text-gray-300">4. 自訂顏色</label>
                <div className="flex flex-col gap-3">
                    {renderColorPickers()}
                </div>
              </div>
          )}


          <div className="mt-auto pt-6 border-t border-gray-700/50 flex flex-col gap-4">
            <button
              onClick={handleInspiration}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              <InspirationIcon /> 給我靈感！
            </button>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownload}
                  disabled={!outputImage}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                  <DownloadIcon /> 下載圖片
                </button>
                <button
                  onClick={handleClear}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                  <ClearIcon /> 全部清除
                </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-transparent p-6 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center justify-center aspect-square" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%234B556380' stroke-width='2' stroke-dasharray='6%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`, backgroundSize: 'cover' }}>
          {outputImage ? (
            <img src={outputImage} alt="Generated text art" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-2xl">您的藝術字體將會顯示在此</p>
              <p className="mt-2">請在左側輸入文字以開始</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;