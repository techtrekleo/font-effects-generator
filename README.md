# 字體特效產生器

一款基於瀏覽器的字體特效產生器，您可以輸入文字、選擇字體與特效，快速生成可用於影片剪輯或設計專案的透明背景 PNG 圖檔。

![應用程式截圖](https://i.imgur.com/example.png)
*(請替換為您自己的應用程式截圖)*

## ✨ 功能特色

- **即時預覽**：所有調整（文字、字體、特效、顏色）都會即時呈現在畫布上。
- **多樣化字體**：內建多款精選繁體中文字體，涵蓋手寫、藝術、像素等風格。
- **豐富特效**：支援陰影、霓虹光、漸層、描邊、偽 3D、故障感等多種效果。
- **自由配色**：可自訂特效中使用的顏色，創造獨一無二的組合。
- **一鍵下載**：輕鬆將完成的藝術字下載為 512x512 的透明背景 PNG 圖檔。
- **靈感模式**：點擊「給我靈感！」，隨機產生酷炫的字體與特效組合。

## 🛠️ 技術棧

- **前端框架**: React
- **建置工具**: Vite
- **程式語言**: TypeScript
- **樣式**: Tailwind CSS

## 📂 專案結構

```
font-effects-generator/
├── public/
├── src/
│   ├── components/
│   │   ├── ColorInput.tsx  # 顏色選擇器元件
│   │   └── Icons.tsx       # 圖示元件
│   ├── utils/
│   │   └── canvas.ts       # Canvas 繪圖工具函式
│   ├── App.tsx             # 主要應用程式元件
│   ├── constants.ts        # 常數 (字體、特效列表)
│   ├── index.tsx           # React 應用程式進入點
│   └── types.ts            # TypeScript 類型定義
├── index.html
├── package.json
└── tsconfig.json
```

## 🚀 本地開發

1.  **安裝依賴**
    ```bash
    npm install
    ```

2.  **啟動開發伺服器**
    ```bash
    npm run dev
    ```
    應用程式將會運行在 `http://localhost:5173` 或 Vite 指定的其他埠號。

## 部署

此專案已設定好可直接部署於 Vercel, Netlify, Railway 等現代化託管平台。

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
