import React, { useRef, useEffect, useState } from 'react';
import type { TextBlock } from '../types';
import { renderComposition } from '../utils/canvas';

interface VisualCanvasProps {
  textBlocks: TextBlock[];
  backgroundImage: string | null;
  canvasWidth: number;
  canvasHeight: number;
  selectedTextBlockId: string | null;
  onTextBlockClick: (textBlockId: string) => void;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  textBlocks,
  backgroundImage,
  canvasWidth,
  canvasHeight,
  selectedTextBlockId,
  onTextBlockClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const updateCanvas = async () => {
    const dataUrl = await renderComposition(backgroundImage, textBlocks, canvasWidth, canvasHeight);
    setOutputImage(dataUrl);
  };

  useEffect(() => {
    updateCanvas();
  }, [textBlocks, backgroundImage, canvasWidth, canvasHeight]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 檢查點擊是否在文字區塊上
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 簡單的點擊檢測 - 檢查是否在文字區域附近
    for (const textBlock of textBlocks) {
      if (!textBlock.text.trim()) continue;
      
      const fontObject = textBlocks.find(tb => tb.id === textBlock.id);
      if (!fontObject) continue;

      ctx.font = `${textBlock.fontSize}px "${fontObject.fontId}"`;
      const metrics = ctx.measureText(textBlock.text);
      
      const textWidth = metrics.width;
      const textHeight = textBlock.fontSize;
      
      if (x >= textBlock.x && x <= textBlock.x + textWidth &&
          y >= textBlock.y && y <= textBlock.y + textHeight) {
        onTextBlockClick(textBlock.id);
        return;
      }
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border border-gray-600 rounded-lg cursor-pointer"
        onClick={handleCanvasClick}
        style={{ 
          width: '100%', 
          height: 'auto',
          maxWidth: '100%',
          aspectRatio: `${canvasWidth} / ${canvasHeight}`
        }}
      />
      
      {/* 顯示文字區塊邊界 */}
      {textBlocks.map(textBlock => {
        if (!textBlock.text.trim()) return null;
        
        const isSelected = selectedTextBlockId === textBlock.id;
        
        return (
          <div
            key={textBlock.id}
            className={`absolute border-2 pointer-events-none ${
              isSelected ? 'border-cyan-400 bg-cyan-400/10' : 'border-transparent'
            }`}
            style={{
              left: `${(textBlock.x / canvasWidth) * 100}%`,
              top: `${(textBlock.y / canvasHeight) * 100}%`,
              width: `${Math.max(100, textBlock.text.length * textBlock.fontSize * 0.6) / canvasWidth * 100}%`,
              height: `${textBlock.fontSize / canvasHeight * 100}%`,
              minWidth: '20px',
              minHeight: '20px'
            }}
          >
            <div className="absolute -top-6 left-0 text-xs text-cyan-400 font-semibold">
              {textBlock.type === 'main' ? '主標題' : textBlock.type === 'sub1' ? '副標題一' : '副標題二'}
            </div>
          </div>
        );
      })}
      
      {!outputImage && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-xl">您的藝術字體將會顯示在此</p>
            <p className="mt-2">請在左側輸入文字以開始</p>
          </div>
        </div>
      )}
    </div>
  );
};
