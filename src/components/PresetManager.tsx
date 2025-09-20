import React, { useState, useEffect } from 'react';
import type { SavedPreset, TextBlock, CanvasSizeId } from '../types';

interface PresetManagerProps {
  textBlocks: TextBlock[];
  backgroundImage: string | null;
  canvasSizeId: CanvasSizeId;
  selectedTextBlockId: string | null;
  onLoadPreset: (preset: SavedPreset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  textBlocks,
  backgroundImage,
  canvasSizeId,
  selectedTextBlockId,
  onLoadPreset
}) => {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // 載入已保存的預設
  useEffect(() => {
    const savedPresets = localStorage.getItem('font-effects-presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error('載入預設失敗:', error);
      }
    }
  }, []);

  // 保存預設到 localStorage
  const savePresets = (newPresets: SavedPreset[]) => {
    localStorage.setItem('font-effects-presets', JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  // 保存當前設定
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('請輸入預設名稱');
      return;
    }

    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      createdAt: new Date().toISOString(),
      canvasSizeId,
      backgroundImage,
      textBlocks: [...textBlocks],
      selectedTextBlockId
    };

    const updatedPresets = [...presets, newPreset];
    savePresets(updatedPresets);
    
    setPresetName('');
    setShowSaveDialog(false);
    alert('預設已保存！');
  };

  // 載入預設
  const handleLoadPreset = (preset: SavedPreset) => {
    onLoadPreset(preset);
    setShowLoadDialog(false);
  };

  // 刪除預設
  const handleDeletePreset = (presetId: string) => {
    if (confirm('確定要刪除這個預設嗎？')) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      savePresets(updatedPresets);
    }
  };

  return (
    <div className="space-y-4">
      {/* 保存和載入按鈕 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          💾 保存預設
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          📂 載入預設
        </button>
      </div>

      {/* 保存對話框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">保存預設</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  預設名稱
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="輸入預設名稱..."
                  className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  maxLength={50}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSavePreset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPresetName('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 載入對話框 */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-4">載入預設</h3>
            
            {presets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg">還沒有保存的預設</p>
                <p className="text-sm mt-2">請先保存一個預設</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-gray-700 p-4 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{preset.name}</h4>
                        <p className="text-sm text-gray-400">
                          保存時間: {new Date(preset.createdAt).toLocaleString('zh-TW')}
                        </p>
                        <p className="text-xs text-gray-500">
                          畫布: {preset.canvasSizeId} | 文字區塊: {preset.textBlocks.length} | 
                          {preset.backgroundImage ? ' 有背景圖' : ' 無背景圖'}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                        >
                          載入
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
