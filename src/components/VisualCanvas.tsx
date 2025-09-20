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
  onTextBlockUpdate: (updatedTextBlock: TextBlock) => void;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  textBlocks,
  backgroundImage,
  canvasWidth,
  canvasHeight,
  selectedTextBlockId,
  onTextBlockClick,
  onTextBlockUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedTextBlockId, setDraggedTextBlockId] = useState<string | null>(null);

  const updateCanvas = async () => {
    const dataUrl = await renderComposition(backgroundImage, textBlocks, canvasWidth, canvasHeight);
    setOutputImage(dataUrl);
  };

  useEffect(() => {
    updateCanvas();
  }, [textBlocks, backgroundImage, canvasWidth, canvasHeight]);

  const getCanvasRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getBoundingClientRect();
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const rect = getCanvasRect();
    if (!rect) return { x: 0, y: 0 };
    
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const findTextBlockAtPosition = (x: number, y: number): TextBlock | null => {
    for (const textBlock of textBlocks) {
      if (!textBlock.text.trim()) continue;
      
      // 簡單的點擊檢測 - 檢查是否在文字區域附近
      const textWidth = textBlock.text.length * textBlock.fontSize * 0.6; // 估算文字寬度
      const textHeight = textBlock.fontSize;
      
      if (x >= textBlock.x && x <= textBlock.x + textWidth &&
          y >= textBlock.y && y <= textBlock.y + textHeight) {
        return textBlock;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedTextBlock = findTextBlockAtPosition(coords.x, coords.y);
    
    if (clickedTextBlock) {
      setIsDragging(true);
      setDraggedTextBlockId(clickedTextBlock.id);
      onTextBlockClick(clickedTextBlock.id);
      
      // 計算拖動偏移量
      setDragOffset({
        x: coords.x - clickedTextBlock.x,
        y: coords.y - clickedTextBlock.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggedTextBlockId) return;
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const textBlock = textBlocks.find(tb => tb.id === draggedTextBlockId);
    
    if (!textBlock) return;
    
    // 計算新位置
    const newX = coords.x - dragOffset.x;
    const newY = coords.y - dragOffset.y;
    
    // 限制在畫布範圍內
    const textWidth = textBlock.text.length * textBlock.fontSize * 0.6;
    const textHeight = textBlock.fontSize;
    
    const constrainedX = Math.max(0, Math.min(newX, canvasWidth - textWidth));
    const constrainedY = Math.max(0, Math.min(newY, canvasHeight - textHeight));
    
    // 更新文字區塊位置
    onTextBlockUpdate({
      ...textBlock,
      x: constrainedX,
      y: constrainedY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedTextBlockId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, draggedTextBlockId]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`border border-gray-600 rounded-lg ${
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        onMouseDown={handleMouseDown}
        style={{ 
          width: '100%', 
          height: 'auto',
          maxWidth: '100%',
          aspectRatio: `${canvasWidth} / ${canvasHeight}`
        }}
      />
      
      {/* 顯示文字區塊邊界和拖動提示 */}
      {textBlocks.map(textBlock => {
        if (!textBlock.text.trim()) return null;
        
        const isSelected = selectedTextBlockId === textBlock.id;
        const isDragged = draggedTextBlockId === textBlock.id;
        
        return (
          <div
            key={textBlock.id}
            className={`absolute border-2 pointer-events-none transition-all duration-200 ${
              isSelected ? 'border-cyan-400 bg-cyan-400/10' : 'border-transparent'
            } ${isDragged ? 'border-yellow-400 bg-yellow-400/20' : ''}`}
            style={{
              left: `${(textBlock.x / canvasWidth) * 100}%`,
              top: `${(textBlock.y / canvasHeight) * 100}%`,
              width: `${Math.max(100, textBlock.text.length * textBlock.fontSize * 0.6) / canvasWidth * 100}%`,
              height: `${textBlock.fontSize / canvasHeight * 100}%`,
              minWidth: '20px',
              minHeight: '20px'
            }}
          >
            <div className={`absolute -top-6 left-0 text-xs font-semibold transition-colors ${
              isDragged ? 'text-yellow-400' : 'text-cyan-400'
            }`}>
              {textBlock.type === 'main' ? '主標題' : textBlock.type === 'sub1' ? '副標題一' : '副標題二'}
              {isDragged && ' (拖動中)'}
            </div>
          </div>
        );
      })}
      
      {/* 拖動提示 */}
      {isDragging && (
        <div className="absolute top-4 left-4 bg-yellow-500/90 text-black px-3 py-2 rounded-lg text-sm font-semibold">
          🖱️ 拖動中... 放開滑鼠完成移動
        </div>
      )}
      
      {!outputImage && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-xl">您的藝術字體將會顯示在此</p>
            <p className="mt-2">請在左側輸入文字以開始</p>
            <p className="mt-1 text-sm text-gray-400">💡 提示：可以直接在畫布上拖動文字區塊</p>
          </div>
        </div>
      )}
    </div>
  );
};
