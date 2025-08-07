
import type { fonts, effects } from './constants';

export type Font = typeof fonts[number];
export type FontId = Font['id'];
export type EffectId = typeof effects[number]['id'];
