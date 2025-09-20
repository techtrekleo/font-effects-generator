import React from 'react';
import type { TextBlock, EffectId } from '../types';
import { fonts, effects } from '../constants';
import { ColorInput } from './ColorInput';

interface DraggableTextBlockProps {
  textBlock: TextBlock;
  onUpdate: (updatedTextBlock: TextBlock) => void;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export const DraggableTextBlock: React.FC<DraggableTextBlockProps> = ({
  textBlock,
  onUpdate,
  isSelected,
  canvasWidth,
  canvasHeight
}) => {
  // 移除未使用的拖動相關代碼，因為我們使用滑塊控制位置

  const handleEffectToggle = (effectId: EffectId) => {
    if (effectId === 'none') {
      onUpdate({ ...textBlock, effectIds: [] });
      return;
    }
    
    const currentEffectIds = textBlock.effectIds || [];
    const newEffectIds = new Set(currentEffectIds);
    
    if (newEffectIds.has(effectId)) {
      newEffectIds.delete(effectId);
    } else {
      newEffectIds.add(effectId);
    }
    
    onUpdate({
      ...textBlock,
      effectIds: Array.from(newEffectIds).sort()
    });
  };

  const renderColorPickers = () => {
    const effects = new Set(textBlock.effectIds);
    const pickers: React.ReactNode[] = [];

    if (effects.has('gradient')) {
      pickers.push(
        <ColorInput key="grad1" label="漸層起始" value={textBlock.color1} onChange={(c) => onUpdate({ ...textBlock, color1: c })} />,
        <ColorInput key="grad2" label="漸層結束" value={textBlock.color2} onChange={(c) => onUpdate({ ...textBlock, color2: c })} />
      );
    } else if (effects.has('neon')) {
      pickers.push(
        <ColorInput key="neon1" label="光暈顏色" value={textBlock.color1} onChange={(c) => onUpdate({ ...textBlock, color1: c })} />
      );
    } else {
      pickers.push(
        <ColorInput key="c1" label="文字顏色" value={textBlock.color1} onChange={(c) => onUpdate({ ...textBlock, color1: c })} />
      );
    }

    const hasColor2Effect = effects.has('shadow') || effects.has('outline') || effects.has('faux-3d');
    if (!effects.has('gradient') && hasColor2Effect) {
      const labels = [];
      if (effects.has('shadow')) labels.push('陰影');
      if (effects.has('outline')) labels.push('描邊');
      if (effects.has('faux-3d')) labels.push('立體');
      
      pickers.push(
        <ColorInput key="c2" label={`${labels.join('/')} 顏色`} value={textBlock.color2} onChange={(c) => onUpdate({ ...textBlock, color2: c })} />
      );
    }
    
    return <>{pickers}</>;
  };

  const getTypeLabel = () => {
    switch (textBlock.type) {
      case 'main': return '主標題';
      case 'sub1': return '副標題一';
      case 'sub2': return '副標題二';
      default: return '文字';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-300">{getTypeLabel()}</h3>
        <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-cyan-500' : 'bg-gray-500'}`}></div>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={textBlock.text}
          onChange={(e) => onUpdate({ ...textBlock, text: e.target.value })}
          placeholder={`輸入${getTypeLabel()}...`}
          maxLength={30}
          className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <p className="text-right text-sm text-gray-500 -mt-2">{textBlock.text.length} / 30</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">字體</label>
        <div className="grid grid-cols-2 gap-2">
          {fonts.map(font => (
            <button
              key={font.id}
              onClick={() => onUpdate({ ...textBlock, fontId: font.id })}
              className={`py-2 px-2 rounded-lg text-center transition-all duration-200 border text-xs truncate ${
                textBlock.fontId === font.id ? 'bg-cyan-600 border-cyan-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
              style={{ fontFamily: `"${font.family}"`, fontWeight: font.weight }}
              title={font.name}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">特效 (可複選)</label>
        <div className="grid grid-cols-3 gap-2">
          {effects.map(effect => {
            const isActive = effect.id === 'none' 
              ? textBlock.effectIds.length === 0 
              : textBlock.effectIds.includes(effect.id);
            return (
              <button
                key={effect.id}
                onClick={() => handleEffectToggle(effect.id)}
                className={`py-2 px-2 rounded-lg text-center font-semibold transition-all duration-200 border text-xs ${
                  isActive ? 'bg-cyan-600 border-cyan-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {effect.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">字體大小: {textBlock.fontSize}px</label>
        <input 
          type="range" 
          min="10" 
          max="200" 
          value={textBlock.fontSize} 
          onChange={e => onUpdate({ ...textBlock, fontSize: Number(e.target.value) })} 
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
        />
      </div>

      <div className="space-y-3">{renderColorPickers()}</div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-300">位置</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">X: {Math.round(textBlock.x)}</label>
            <input 
              type="range" 
              min="0" 
              max={canvasWidth - 200} 
              value={textBlock.x} 
              onChange={e => onUpdate({ ...textBlock, x: Number(e.target.value) })} 
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Y: {Math.round(textBlock.y)}</label>
            <input 
              type="range" 
              min="0" 
              max={canvasHeight - 100} 
              value={textBlock.y} 
              onChange={e => onUpdate({ ...textBlock, y: Number(e.target.value) })} 
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
