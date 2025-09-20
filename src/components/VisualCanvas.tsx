import React, { useRef, useEffect, useState } from 'react';
import type { TextBlock } from '../types';

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedTextBlockId, setDraggedTextBlockId] = useState<string | null>(null);


  // 直接在 canvas 上繪製內容
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景圖片
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        // 重新繪製背景和文字
        drawCanvasContent();
      };
      img.src = backgroundImage;
    } else {
      drawCanvasContent();
    }

    function drawCanvasContent() {
      if (!ctx) return;
      
      // 繪製背景圖片（如果有的話）
      if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
          if (!canvas) return;
          const canvasAspect = canvas.width / canvas.height;
          const imageAspect = img.width / img.height;
          let sx, sy, sWidth, sHeight;

          if (imageAspect > canvasAspect) {
            sHeight = img.height;
            sWidth = sHeight * canvasAspect;
            sx = (img.width - sWidth) / 2;
            sy = 0;
          } else {
            sWidth = img.width;
            sHeight = sWidth / canvasAspect;
            sx = 0;
            sy = (img.height - sHeight) / 2;
          }
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
          
          // 繪製文字
          drawAllText();
        };
        img.src = backgroundImage;
      } else {
        // 繪製文字
        drawAllText();
      }
    }

    function drawAllText() {
      if (!ctx) return;
      
      textBlocks.forEach(textBlock => {
        if (!textBlock.text.trim()) return;
        
        const { text, color1, fontSize, x, y } = textBlock;
        
        // 這裡需要導入字體相關的邏輯，暫時使用簡化版本
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color1;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // 簡單的文字繪製
        ctx.fillText(text, x, y);
      });
    }
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

  const findTextBlockAtPosition = (x: number, y: number): { textBlock: TextBlock; mode: 'move' | 'resize' } | null => {
    for (const textBlock of textBlocks) {
      if (!textBlock.text.trim()) continue;
      
      // 簡單的點擊檢測 - 檢查是否在文字區域附近
      const textWidth = textBlock.text.length * textBlock.fontSize * 0.6; // 估算文字寬度
      const textHeight = textBlock.fontSize;
      
      // 檢查是否在調整大小的控制點上（右下角）
      const resizeHandleSize = 20;
      const resizeHandleX = textBlock.x + textWidth - resizeHandleSize;
      const resizeHandleY = textBlock.y + textHeight - resizeHandleSize;
      
      if (x >= resizeHandleX && x <= textBlock.x + textWidth &&
          y >= resizeHandleY && y <= textBlock.y + textHeight) {
        return { textBlock, mode: 'resize' };
      }
      
      // 檢查是否在文字區域內（移動模式）
      if (x >= textBlock.x && x <= textBlock.x + textWidth &&
          y >= textBlock.y && y <= textBlock.y + textHeight) {
        return { textBlock, mode: 'move' };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedResult = findTextBlockAtPosition(coords.x, coords.y);
    
    if (clickedResult) {
      setIsDragging(true);
      setDraggedTextBlockId(clickedResult.textBlock.id);
      onTextBlockClick(clickedResult.textBlock.id);
      
      // 計算拖動偏移量
      setDragOffset({
        x: coords.x - clickedResult.textBlock.x,
        y: coords.y - clickedResult.textBlock.y
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
      
      {/* 如果沒有任何文字，顯示提示 */}
      {textBlocks.every(tb => !tb.text.trim()) && (
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
