import React, { useState, useEffect } from 'react';
import type { TextBlock } from '../types';

interface DebugPanelProps {
  textBlocks: TextBlock[];
  canvasWidth: number;
  canvasHeight: number;
  selectedTextBlockId: string | null;
  mousePosition: { x: number; y: number };
  isVisible: boolean;
  onToggle: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  textBlocks,
  canvasWidth,
  canvasHeight,
  selectedTextBlockId,
  mousePosition,
  isVisible,
  onToggle
}) => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // 捕獲所有 console.log
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setDebugLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${logMessage}`]);
    };
    
    return () => {
      console.log = originalLog;
    };
  }, []);

  // 捕獲錯誤
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = `ERROR: ${event.message} at ${event.filename}:${event.lineno}`;
      setDebugLogs(prev => [...prev.slice(-20), errorMessage]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = `PROMISE REJECTION: ${event.reason}`;
      setDebugLogs(prev => [...prev.slice(-20), errorMessage]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 計算文字區塊信息
  const getTextBlockInfo = (textBlock: TextBlock) => {
    const textWidth = textBlock.text.length * textBlock.fontSize * 0.8;
    const textHeight = textBlock.fontSize;
    const resizeHandleSize = 16;
    const resizeHandleX = textBlock.x + textWidth - resizeHandleSize;
    const resizeHandleY = textBlock.y + textHeight - resizeHandleSize;
    
    return {
      id: textBlock.id,
      text: textBlock.text,
      position: { x: textBlock.x, y: textBlock.y },
      size: { width: textWidth, height: textHeight },
      fontSize: textBlock.fontSize,
      resizeHandle: {
        x: resizeHandleX,
        y: resizeHandleY,
        endX: resizeHandleX + resizeHandleSize,
        endY: resizeHandleY + resizeHandleSize,
        size: resizeHandleSize
      },
      bounds: {
        textStartX: textBlock.x,
        textEndX: textBlock.x + textWidth,
        textStartY: textBlock.y,
        textEndY: textBlock.y + textHeight
      }
    };
  };

  const testClickDetection = (x: number, y: number) => {
    console.log(`\n=== 測試點擊檢測 (${x}, ${y}) ===`);
    console.log(`畫布尺寸: ${canvasWidth} x ${canvasHeight}`);
    
    textBlocks.forEach(textBlock => {
      if (!textBlock.text.trim()) return;
      
      const info = getTextBlockInfo(textBlock);
      console.log(`\n文字區塊 ${textBlock.id}:`);
      console.log(`  文字: "${info.text}"`);
      console.log(`  位置: (${info.position.x}, ${info.position.y})`);
      console.log(`  大小: ${info.size.width} x ${info.size.height}`);
      console.log(`  字體大小: ${info.fontSize}px`);
      console.log(`  調整控制點: (${info.resizeHandle.x}, ${info.resizeHandle.y}) 到 (${info.resizeHandle.endX}, ${info.resizeHandle.endY})`);
      console.log(`  文字邊界: (${info.bounds.textStartX}, ${info.bounds.textStartY}) 到 (${info.bounds.textEndX}, ${info.bounds.textEndY})`);
      
      // 檢測是否在調整控制點內
      const inResizeHandle = x >= info.resizeHandle.x && x <= info.resizeHandle.endX && 
                           y >= info.resizeHandle.y && y <= info.resizeHandle.endY;
      console.log(`  在調整控制點內: ${inResizeHandle}`);
      
      // 檢測是否在文字區域內
      const inTextArea = x >= info.bounds.textStartX && x <= info.bounds.textEndX && 
                        y >= info.bounds.textStartY && y <= info.bounds.textEndY;
      console.log(`  在文字區域內: ${inTextArea}`);
      
      if (inResizeHandle) {
        console.log(`  ✅ 找到調整控制點！`);
      } else if (inTextArea) {
        console.log(`  ✅ 找到文字區域！`);
      }
    });
    console.log(`=== 測試完成 ===\n`);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold z-50"
      >
        🐛 開啟調試
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-96 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <h3 className="text-white font-bold text-sm">🐛 調試面板</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {/* 基本資訊 */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-white font-semibold text-sm mb-2">基本資訊</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div>畫布尺寸: {canvasWidth} x {canvasHeight}</div>
            <div>選中文字: {selectedTextBlockId || '無'}</div>
            <div>滑鼠位置: ({mousePosition.x}, {mousePosition.y})</div>
            <div>文字區塊數: {textBlocks.filter(tb => tb.text.trim()).length}</div>
          </div>
        </div>

        {/* 文字區塊詳情 */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-white font-semibold text-sm mb-2">文字區塊詳情</h4>
          {textBlocks.filter(tb => tb.text.trim()).map(textBlock => {
            const info = getTextBlockInfo(textBlock);
            const isSelected = selectedTextBlockId === textBlock.id;
            return (
              <div key={textBlock.id} className={`text-xs p-2 rounded mb-2 ${isSelected ? 'bg-cyan-900' : 'bg-gray-700'}`}>
                <div className="font-semibold text-cyan-400">{textBlock.id}</div>
                <div className="text-gray-300">
                  <div>文字: "{info.text}"</div>
                  <div>位置: ({info.position.x}, {info.position.y})</div>
                  <div>大小: {info.size.width} x {info.size.height}</div>
                  <div>字體: {info.fontSize}px</div>
                  <div>控制點: ({info.resizeHandle.x}, {info.resizeHandle.y}) - ({info.resizeHandle.endX}, {info.resizeHandle.endY})</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 測試按鈕 */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-white font-semibold text-sm mb-2">測試功能</h4>
          <div className="space-y-2">
            <button
              onClick={() => testClickDetection(mousePosition.x, mousePosition.y)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
            >
              測試當前滑鼠位置檢測
            </button>
            <button
              onClick={() => {
                const selectedBlock = textBlocks.find(tb => tb.id === selectedTextBlockId);
                if (selectedBlock) {
                  const info = getTextBlockInfo(selectedBlock);
                  testClickDetection(info.resizeHandle.x + 8, info.resizeHandle.y + 8);
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
            >
              測試選中文字的控制點
            </button>
            <button
              onClick={() => setDebugLogs([])}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
            >
              清除日誌
            </button>
          </div>
        </div>

        {/* 日誌 */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-white font-semibold text-sm mb-2">調試日誌</h4>
          <div className="bg-black p-2 rounded text-xs text-green-400 font-mono max-h-32 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">等待日誌...</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1 break-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
