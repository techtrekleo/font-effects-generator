import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TextBlock } from '../types';
import { fonts } from '../constants';

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
  const [alignmentGuides, setAlignmentGuides] = useState<{
    vertical: number[];
    horizontal: number[];
  }>({ vertical: [], horizontal: [] });


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

    // 繪製對齊線（在拖動時）
    if (isDragging && alignmentGuides) {
      ctx.save();
      ctx.strokeStyle = '#00ff00'; // 綠色對齊線
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // 虛線樣式
      
      // 繪製垂直對齊線
      alignmentGuides.vertical.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      });
      
      // 繪製水平對齊線
      alignmentGuides.horizontal.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      });
      
      ctx.restore();
    }

    // 繪製所有文字
    textBlocks.forEach(textBlock => {
      drawTextWithEffects(ctx, textBlock);
    });
  }, [textBlocks, canvasWidth, canvasHeight, isDragging, alignmentGuides]);

  // 當文字區塊或畫布尺寸改變時重新繪製
  useEffect(() => {
    if (backgroundImageLoadedRef.current) {
      drawCanvas();
    }
  }, [drawCanvas]);

  // 計算文字實際寬度
  const getTextWidth = (text: string, fontSize: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return text.length * fontSize * 0.6; // 備用計算
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return text.length * fontSize * 0.6; // 備用計算
    
    ctx.font = `${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    return metrics.width;
  };

  // 根據 TextBlock 設定繪製文字
  const drawTextWithEffects = (ctx: CanvasRenderingContext2D, textBlock: TextBlock) => {
    if (!textBlock.text.trim()) return;
    
    const { text, fontId, effectIds, color1, color2, fontSize, x, y } = textBlock;
    
    // 獲取字體設定
    const font = fonts.find(f => f.id === fontId);
    const fontFamily = font ? font.family : 'Arial';
    const fontWeight = font ? font.weight : 400;
    
    // 設定字體
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // 應用特效 - 支援組合使用
    ctx.save();
    
    // 1. 粗體效果
    if (effectIds.includes('bold')) {
      ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    }
    
    // 2. 3D效果
    if (effectIds.includes('faux-3d')) {
      // 3D效果：多層陰影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = color1;
      ctx.fillText(text, x, y);
      
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
      ctx.fillText(text, x, y);
      
      ctx.shadowOffsetX = 9;
      ctx.shadowOffsetY = 9;
      ctx.fillText(text, x, y);
    }
    
    // 3. 描邊效果
    if (effectIds.includes('outline')) {
      ctx.strokeStyle = color2;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      // 多方向描邊
      ctx.strokeText(text, x - 1, y - 1);
      ctx.strokeText(text, x + 1, y - 1);
      ctx.strokeText(text, x - 1, y + 1);
      ctx.strokeText(text, x + 1, y + 1);
    }
    
    // 4. 設定填充樣式
    ctx.fillStyle = color1;
    
    // 5. 陰影效果
    if (effectIds.includes('shadow')) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // 6. 霓虹光效果
    if (effectIds.includes('neon')) {
      ctx.shadowColor = color1;
      ctx.shadowBlur = 10;
    }
    
    // 7. 故障感效果 - 改進版本
    if (effectIds.includes('glitch')) {
      // 故障感：更明顯的效果
      const glitchIntensity = 8; // 增加偏移強度
      const glitchOffsetX = (Math.random() - 0.5) * glitchIntensity;
      const glitchOffsetY = (Math.random() - 0.5) * glitchIntensity;
      
      // 繪製多層故障效果
      ctx.save();
      
      // 紅色故障層
      ctx.fillStyle = '#ff0000';
      ctx.fillText(text, x + glitchOffsetX, y + glitchOffsetY);
      
      // 藍色故障層
      ctx.fillStyle = '#0000ff';
      ctx.fillText(text, x - glitchOffsetX, y - glitchOffsetY);
      
      // 綠色故障層
      ctx.fillStyle = '#00ff00';
      ctx.fillText(text, x + glitchOffsetX * 0.5, y - glitchOffsetY * 0.5);
      
      ctx.restore();
      
      // 最後繪製正常文字
      ctx.fillText(text, x, y);
    } else {
      // 繪製文字
      ctx.fillText(text, x, y);
    }
    
    ctx.restore();
  };

  // 計算對齊線
  const calculateAlignmentGuides = (draggedBlock: TextBlock, otherBlocks: TextBlock[]) => {
    const tolerance = 5; // 對齊容差（像素）
    const verticalGuides: number[] = [];
    const horizontalGuides: number[] = [];
    
    // 獲取拖動區塊的邊界
    const draggedWidth = getTextWidth(draggedBlock.text, draggedBlock.fontSize);
    const draggedHeight = draggedBlock.fontSize;
    const draggedLeft = draggedBlock.x;
    const draggedRight = draggedBlock.x + draggedWidth;
    const draggedTop = draggedBlock.y;
    const draggedBottom = draggedBlock.y + draggedHeight;
    const draggedCenterX = draggedBlock.x + draggedWidth / 2;
    const draggedCenterY = draggedBlock.y + draggedHeight / 2;
    
    // 檢查與其他區塊的對齊
    otherBlocks.forEach(block => {
      if (block.id === draggedBlock.id || !block.text.trim()) return;
      
      const blockWidth = getTextWidth(block.text, block.fontSize);
      const blockHeight = block.fontSize;
      const blockLeft = block.x;
      const blockRight = block.x + blockWidth;
      const blockTop = block.y;
      const blockBottom = block.y + blockHeight;
      const blockCenterX = block.x + blockWidth / 2;
      const blockCenterY = block.y + blockHeight / 2;
      
      // 垂直對齊線
      if (Math.abs(draggedLeft - blockLeft) <= tolerance) {
        verticalGuides.push(blockLeft);
      }
      if (Math.abs(draggedRight - blockRight) <= tolerance) {
        verticalGuides.push(blockRight);
      }
      if (Math.abs(draggedCenterX - blockCenterX) <= tolerance) {
        verticalGuides.push(blockCenterX);
      }
      if (Math.abs(draggedLeft - blockRight) <= tolerance) {
        verticalGuides.push(blockRight);
      }
      if (Math.abs(draggedRight - blockLeft) <= tolerance) {
        verticalGuides.push(blockLeft);
      }
      
      // 水平對齊線
      if (Math.abs(draggedTop - blockTop) <= tolerance) {
        horizontalGuides.push(blockTop);
      }
      if (Math.abs(draggedBottom - blockBottom) <= tolerance) {
        horizontalGuides.push(blockBottom);
      }
      if (Math.abs(draggedCenterY - blockCenterY) <= tolerance) {
        horizontalGuides.push(blockCenterY);
      }
      if (Math.abs(draggedTop - blockBottom) <= tolerance) {
        horizontalGuides.push(blockBottom);
      }
      if (Math.abs(draggedBottom - blockTop) <= tolerance) {
        horizontalGuides.push(blockTop);
      }
    });
    
    // 檢查與畫布邊界的對齊
    if (Math.abs(draggedLeft) <= tolerance) verticalGuides.push(0);
    if (Math.abs(draggedRight - canvasWidth) <= tolerance) verticalGuides.push(canvasWidth);
    if (Math.abs(draggedCenterX - canvasWidth / 2) <= tolerance) verticalGuides.push(canvasWidth / 2);
    if (Math.abs(draggedTop) <= tolerance) horizontalGuides.push(0);
    if (Math.abs(draggedBottom - canvasHeight) <= tolerance) horizontalGuides.push(canvasHeight);
    if (Math.abs(draggedCenterY - canvasHeight / 2) <= tolerance) horizontalGuides.push(canvasHeight / 2);
    
    return { vertical: verticalGuides, horizontal: horizontalGuides };
  };

  const getCanvasRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getBoundingClientRect();
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const rect = getCanvasRect();
    if (!rect) return { x: 0, y: 0 };
    
    // 計算相對於畫布的座標
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // 轉換到畫布內部座標系統
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    const result = {
      x: x * scaleX,
      y: y * scaleY
    };
    
    return result;
  };

  const findTextBlockAtPosition = (x: number, y: number): { textBlock: TextBlock; mode: 'move' | 'resize' } | null => {
    // 從後往前檢查，優先選擇最上層的文字區塊
    for (let i = textBlocks.length - 1; i >= 0; i--) {
      const textBlock = textBlocks[i];
      if (!textBlock.text.trim()) continue;
      
      const textWidth = getTextWidth(textBlock.text, textBlock.fontSize);
      const textHeight = textBlock.fontSize;
      
      // 檢查是否在調整大小的控制點上（右下角）
      const resizeHandleSize = 16; // 控制點大小
      const resizeHandleX = textBlock.x + textWidth - resizeHandleSize;
      const resizeHandleY = textBlock.y + textHeight - resizeHandleSize;
      
      if (x >= resizeHandleX && x <= resizeHandleX + resizeHandleSize &&
          y >= resizeHandleY && y <= resizeHandleY + resizeHandleSize) {
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
        const textWidth = getTextWidth(textBlock.text, textBlock.fontSize);
        const textHeight = textBlock.fontSize;
        
        // 計算從控制點開始的拖動距離
        const deltaX = coords.x - (textBlock.x + textWidth);
        const deltaY = coords.y - (textBlock.y + textHeight);
        
        // 使用對角線距離來調整字體大小
        const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scaleFactor = 0.2; // 降低靈敏度，更容易控制
        
        let newFontSize = initialFontSize + delta * scaleFactor;
        
        // 限制字體大小範圍（支持大標題）
        newFontSize = Math.max(10, Math.min(500, newFontSize));
        
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
        const textWidth = getTextWidth(textBlock.text, textBlock.fontSize);
        const textHeight = textBlock.fontSize;
        
        const constrainedX = Math.max(0, Math.min(newX, canvasWidth - textWidth));
        const constrainedY = Math.max(0, Math.min(newY, canvasHeight - textHeight));
        
        // 創建臨時文字區塊來計算對齊線
        const tempTextBlock = {
          ...textBlock,
          x: constrainedX,
          y: constrainedY
        };
        
        // 計算對齊線
        const guides = calculateAlignmentGuides(tempTextBlock, textBlocks);
        setAlignmentGuides(guides);
        
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
    setAlignmentGuides({ vertical: [], horizontal: [] }); // 清除對齊線
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
              width: `${Math.max(100, getTextWidth(textBlock.text, textBlock.fontSize)) / canvasWidth * 100}%`,
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                  setDraggedTextBlockId(textBlock.id);
                  setDragMode('resize');
                  setInitialFontSize(textBlock.fontSize);
                  onTextBlockClick(textBlock.id);
                  
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  
                  const coords = getCanvasCoordinates(e.clientX, e.clientY);
                  const textWidth = getTextWidth(textBlock.text, textBlock.fontSize);
                  setDragOffset({
                    x: coords.x - (textBlock.x + textWidth),
                    y: coords.y - (textBlock.y + textBlock.fontSize)
                  });
                }}
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
