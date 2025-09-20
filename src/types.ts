import type { fonts, effects, canvasSizes } from './constants';

export type Font = typeof fonts[number];
export type FontId = Font['id'];
export type EffectId = typeof effects[number]['id'];
export type CanvasSizeId = typeof canvasSizes[number]['id'];

export interface TextBlock {
    text: string;
    fontId: FontId;
    effectIds: EffectId[];
    color1: string;
    color2: string;
    fontSize: number;
    x: number; // 新增：X 座標
    y: number; // 新增：Y 座標
    id: string; // 新增：唯一識別碼
    type: 'main' | 'sub1' | 'sub2'; // 新增：文字區塊類型
}

export interface SavedPreset {
    id: string;
    name: string;
    createdAt: string;
    canvasSizeId: CanvasSizeId;
    backgroundImage: string | null;
    textBlocks: TextBlock[];
    selectedTextBlockId: string | null;
}