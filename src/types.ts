import type { fonts, effects, canvasSizes } from './constants';

export type Font = typeof fonts[number];
export type FontId = Font['id'];
export type EffectId = typeof effects[number]['id'];
export type CanvasSizeId = typeof canvasSizes[number]['id'];

export interface TextBlock {
    text: string;
    fontId: FontId;
    effectId: EffectId;
    color1: string;
    color2: string;
    fontSize: number;
}