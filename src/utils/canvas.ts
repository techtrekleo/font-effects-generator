import type { Font, EffectId } from '../types';

// Helper to generate an image from text with canvas effects
export const renderTextImage = async (text: string, font: Font, effectId: EffectId, color1: string, color2: string): Promise<string | null> => {
    if (!text.trim()) return null;

    // Ensure fonts loaded via CSS are ready
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Common text settings
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Auto-size font to fit canvas
    const PADDING = 40;
    let fontSize = 180;
    ctx.font = `${font.weight} ${fontSize}px "${font.family}"`;
    while (ctx.measureText(text).width > canvas.width - PADDING * 2 && fontSize > 20) {
        fontSize -= 5;
        ctx.font = `${font.weight} ${fontSize}px "${font.family}"`;
    }

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // Reset any lingering shadow effects from previous renders
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Apply selected effect
    switch (effectId) {
        case 'shadow':
            ctx.shadowColor = color2;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
            ctx.fillStyle = color1;
            ctx.fillText(text, x, y);
            break;
        case 'neon':
            ctx.fillStyle = color1;
            ctx.shadowColor = color1;
            ctx.shadowBlur = 15;
            ctx.fillText(text, x, y);
             // Add a second layer for a stronger glow
            ctx.shadowBlur = 30;
            ctx.fillText(text, x, y);
            break;
        case 'gradient':
            const gradient = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            ctx.fillStyle = gradient;
            ctx.fillText(text, x, y);
            break;
        case 'outline':
            ctx.strokeStyle = color2;
            ctx.lineWidth = 8;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(text, x, y);
            ctx.fillStyle = color1;
            ctx.fillText(text, x, y);
            break;
        case 'faux-3d':
            ctx.fillStyle = color2;
            for (let i = 1; i <= 8; i++) {
                ctx.fillText(text, x + i, y + i);
            }
            ctx.fillStyle = color1;
            ctx.fillText(text, x, y);
            break;
        case 'glitch':
            ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta
            ctx.fillText(text, x - 4, y);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan
            ctx.fillText(text, x + 4, y);
            ctx.fillStyle = color1;
            ctx.fillText(text, x, y);
            break;
        case 'none':
        default:
            ctx.fillStyle = color1;
            ctx.fillText(text, x, y);
            break;
    }

    return canvas.toDataURL('image/png');
};


export const getRandomItem = <T,>(arr: readonly T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomHexColor = (): string => {
    // padStart ensures we always get a 6-digit hex code
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};