// --- 字體設定 ---
export const fonts = [
  { id: 'noto-sans-tc-900', name: '思源黑體 (黑)', family: 'Noto Sans TC', weight: 900 },
  { id: 'taipei-sans-700', name: '台北黑體 (粗)', family: 'Taipei Sans TC Beta', weight: 700 },
  { id: 'noto-sans-tc-500', name: '思源黑體 (中)', family: 'Noto Sans TC', weight: 500 },
  { id: 'm-plus-rounded-1c-700', name: '圓體 (粗)', family: 'M PLUS Rounded 1c', weight: 700 },
  { id: 'hina-mincho', name: '日式明朝', family: 'Hina Mincho', weight: 400 },
  { id: 'jason-handwriting-1', name: '清松手寫體 v1', family: 'Jason Handwriting 1', weight: 400 },
  { id: 'jason-handwriting-2', name: '清松手寫體 v2', family: 'Jason Handwriting 2', weight: 400 },
  { id: 'rocknroll-one', name: '搖滾圓體', family: 'RocknRoll One', weight: 400 },
  { id: 'reggae-one', name: '雷鬼 Stencil', family: 'Reggae One', weight: 400 },
  { id: 'rampart-one', name: '立體裝甲', family: 'Rampart One', weight: 400 },
] as const;


// --- 本地 Canvas 特效設定 ---
export const effects = [
  { id: 'none', name: '無' },
  { id: 'bold', name: '粗體' },
  { id: 'shadow', name: '陰影' },
  { id: 'neon', name: '霓虹光' },
  { id: 'outline', name: '描邊' },
  { id: 'faux-3d', name: '偽3D' },
  { id: 'glitch', name: '故障感' },
] as const;

// --- 畫布尺寸設定 ---
export const canvasSizes = [
  { id: 'square', name: '方形 (1:1)', width: 1080, height: 1080 },
  { id: 'youtube_hd', name: 'YT影片 (16:9)', width: 1920, height: 1080 },
  { id: 'youtube_thumb', name: 'YT縮圖 (16:9)', width: 1280, height: 720 },
  { id: 'youtube_short', name: 'YT Short (9:16)', width: 1080, height: 1920 },
] as const;

// --- 預設顏色 ---
export const DEFAULT_COLOR_1 = '#FFFFFF';
export const DEFAULT_COLOR_2 = '#000000';