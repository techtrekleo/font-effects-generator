import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TextBlock } from '../types';
import { DebugPanel } from './DebugPanel';

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
  const [dragMode, setDragMode] = useState<'move' | 'resize'>('move');
  const [initialFontSize, setInitialFontSize] = useState(0);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });


  // 使用 useRef 來緩存背景圖片，避免重複載入
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundImageLoadedRef = useRef<boolean>(false);

  // 載入背景圖片
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        backgroundImageLoadedRef.current = true;
        drawCanvas();
      };
      img.src = backgroundImage;
    } else {
      backgroundImageRef.current = null;
      backgroundImageLoadedRef.current = true;
      drawCanvas();
    }
  }, [backgroundImage]);

  // 繪製 canvas 內容
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景圖片（如果有的話）
    if (backgroundImageRef.current && backgroundImageLoadedRef.current) {
      const img = backgroundImageRef.current;
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
    }

    // 繪製所有文字
    textBlocks.forEach(textBlock => {
      if (!textBlock.text.trim()) return;
      
      const { text, color1, fontSize, x, y } = textBlock;
      
      // 使用簡化的字體繪製
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color1;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      ctx.fillText(text, x, y);
    });
  }, [textBlocks, canvasWidth, canvasHeight]);

  // 當文字區塊或畫布尺寸改變時重新繪製
  useEffect(() => {
    if (backgroundImageLoadedRef.current) {
      drawCanvas();
    }
  }, [drawCanvas]);

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
    // 從後往前檢查，優先選擇最上層的文字區塊
    for (let i = textBlocks.length - 1; i >= 0; i--) {
      const textBlock = textBlocks[i];
      if (!textBlock.text.trim()) continue;
      
      const textWidth = textBlock.text.length * textBlock.fontSize * 0.8;
      const textHeight = textBlock.fontSize;
      
      // 檢查是否在調整大小的控制點上（右下角）
      const resizeHandleSize = 16; // 控制點大小
      const resizeHandleX = textBlock.x + textWidth - resizeHandleSize;
      const resizeHandleY = textBlock.y + textHeight - resizeHandleSize;
      
      console.log(`TextBlock ${textBlock.id}:`, {
        text: textBlock.text,
        x: textBlock.x, y: textBlock.y,
        textWidth, textHeight,
        resizeHandleX, resizeHandleY,
        resizeHandleEndX: resizeHandleX + resizeHandleSize,
        resizeHandleEndY: resizeHandleY + resizeHandleSize,
        clickX: x, clickY: y,
        inResizeHandle: x >= resizeHandleX && x <= resizeHandleX + resizeHandleSize && y >= resizeHandleY && y <= resizeHandleY + resizeHandleSize,
        inTextArea: x >= textBlock.x && x <= textBlock.x + textWidth && y >= textBlock.y && y <= textBlock.y + textHeight
      });
      
      if (x >= resizeHandleX && x <= resizeHandleX + resizeHandleSize &&
          y >= resizeHandleY && y <= resizeHandleY + resizeHandleSize) {
        console.log('Found resize handle!');
        return { textBlock, mode: 'resize' };
      }
      
      // 檢查是否在文字區域內（移動模式）
      if (x >= textBlock.x && x <= textBlock.x + textWidth &&
          y >= textBlock.y && y <= textBlock.y + textHeight) {
        console.log('Found text area!');
        return { textBlock, mode: 'move' };
      }
    }
    console.log('No text block found');
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    console.log('Mouse down at:', coords);
    const clickedResult = findTextBlockAtPosition(coords.x, coords.y);
    console.log('Clicked result:', clickedResult);
    
    if (clickedResult) {
      console.log('Starting drag:', clickedResult.mode);
      setIsDragging(true);
      setDraggedTextBlockId(clickedResult.textBlock.id);
      setDragMode(clickedResult.mode);
      onTextBlockClick(clickedResult.textBlock.id);
      
      if (clickedResult.mode === 'resize') {
        // 調整大小模式：記錄初始字體大小
        setInitialFontSize(clickedResult.textBlock.fontSize);
        setDragOffset({
          x: coords.x - (clickedResult.textBlock.x + clickedResult.textBlock.text.length * clickedResult.textBlock.fontSize * 0.8),
          y: coords.y - (clickedResult.textBlock.y + clickedResult.textBlock.fontSize)
        });
      } else {
        // 移動模式：計算拖動偏移量
        setDragOffset({
          x: coords.x - clickedResult.textBlock.x,
          y: coords.y - clickedResult.textBlock.y
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggedTextBlockId) return;
    
    // 取消之前的動畫幀
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // 使用 requestAnimationFrame 來優化性能
    const frameId = requestAnimationFrame(() => {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      const textBlock = textBlocks.find(tb => tb.id === draggedTextBlockId);
      
      if (!textBlock) return;
      
      if (dragMode === 'resize') {
        // 調整大小模式：根據拖動距離計算新的字體大小
        const textWidth = textBlock.text.length * textBlock.fontSize * 0.8;
        const textHeight = textBlock.fontSize;
        
        // 計算從控制點開始的拖動距離
        const deltaX = coords.x - (textBlock.x + textWidth);
        const deltaY = coords.y - (textBlock.y + textHeight);
        
        // 使用對角線距離來調整字體大小
        const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scaleFactor = 0.5; // 調整靈敏度
        
        let newFontSize = initialFontSize + delta * scaleFactor;
        
        // 限制字體大小範圍
        newFontSize = Math.max(10, Math.min(400, newFontSize));
        
        // 更新文字區塊字體大小
        onTextBlockUpdate({
          ...textBlock,
          fontSize: Math.round(newFontSize)
        });
      } else {
        // 移動模式：計算新位置
        const newX = coords.x - dragOffset.x;
        const newY = coords.y - dragOffset.y;
        
        // 限制在畫布範圍內
        const textWidth = textBlock.text.length * textBlock.fontSize * 0.8;
        const textHeight = textBlock.fontSize;
        
        const constrainedX = Math.max(0, Math.min(newX, canvasWidth - textWidth));
        const constrainedY = Math.max(0, Math.min(newY, canvasHeight - textHeight));
        
        // 更新文字區塊位置
        onTextBlockUpdate({
          ...textBlock,
          x: constrainedX,
          y: constrainedY
        });
      }
    });
    
    setAnimationFrameId(frameId);
  };

  const handleMouseUp = () => {
    // 取消動畫幀
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }
    
    setIsDragging(false);
    setDraggedTextBlockId(null);
    setDragMode('move');
    setInitialFontSize(0);
    setDragOffset({ x: 0, y: 0 });
  };

  // 追蹤滑鼠位置
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setMousePosition(coords);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, draggedTextBlockId, dragMode, initialFontSize, textBlocks, canvasWidth, canvasHeight, onTextBlockUpdate]);

  // 清理動畫幀
  useEffect(() => {
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationFrameId]);

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
      
      {/* 調試面板 */}
      <DebugPanel
        textBlocks={textBlocks}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        selectedTextBlockId={selectedTextBlockId}
        mousePosition={mousePosition}
        isVisible={showDebugPanel}
        onToggle={() => setShowDebugPanel(!showDebugPanel)}
      />
      
      {/* 顯示文字區塊邊界和拖動提示 */}
      {textBlocks.map(textBlock => {
        if (!textBlock.text.trim()) return null;
        
        const isSelected = selectedTextBlockId === textBlock.id;
        const isDragged = draggedTextBlockId === textBlock.id;
        const isResizing = isDragged && dragMode === 'resize';
        
        return (
          <div
            key={textBlock.id}
            className={`absolute border-2 pointer-events-none transition-all duration-200 ${
              isSelected ? 'border-cyan-400 bg-cyan-400/10' : 'border-transparent'
            } ${isDragged ? 'border-yellow-400 bg-yellow-400/20' : ''}`}
            style={{
              left: `${(textBlock.x / canvasWidth) * 100}%`,
              top: `${(textBlock.y / canvasHeight) * 100}%`,
              width: `${Math.max(100, textBlock.text.length * textBlock.fontSize * 0.8) / canvasWidth * 100}%`,
              height: `${textBlock.fontSize / canvasHeight * 100}%`,
              minWidth: '20px',
              minHeight: '20px'
            }}
          >
            {/* 文字區塊標籤 */}
            <div className={`absolute -top-6 left-0 text-xs font-semibold transition-colors ${
              isDragged ? 'text-yellow-400' : 'text-cyan-400'
            }`}>
              {textBlock.type === 'main' ? '主標題' : textBlock.type === 'sub1' ? '副標題一' : '副標題二'}
              {isDragged && (isResizing ? ' (調整大小中)' : ' (拖動中)')}
            </div>
            
            {/* 調整大小的控制點 */}
            {isSelected && (
              <div
                className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize shadow-lg hover:bg-blue-600 transition-colors"
                style={{
                  right: '-8px',
                  bottom: '-8px',
                  transform: 'translate(50%, 50%)',
                  pointerEvents: 'auto'
                }}
                title="拖動調整字體大小"
              />
            )}
          </div>
        );
      })}
      
      {/* 拖動提示 */}
      {isDragging && (
        <div className="absolute top-4 left-4 bg-yellow-500/90 text-black px-3 py-2 rounded-lg text-sm font-semibold">
          {dragMode === 'resize' ? (
            <>🔧 調整字體大小中... 放開滑鼠完成調整</>
          ) : (
            <>🖱️ 拖動中... 放開滑鼠完成移動</>
          )}
        </div>
      )}
      
      {/* 如果沒有任何文字，顯示提示 */}
      {textBlocks.every(tb => !tb.text.trim()) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-xl">您的藝術字體將會顯示在此</p>
            <p className="mt-2">請在左側輸入文字以開始</p>
            <p className="mt-1 text-sm text-gray-400">💡 提示：拖動文字區塊移動位置，拖動右下角藍點調整字體大小</p>
          </div>
        </div>
      )}
    </div>
  );
};
