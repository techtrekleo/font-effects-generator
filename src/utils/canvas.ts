import type { TextBlock } from '../types';
import { fonts } from '../constants';

const drawImageToCanvas = (ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
    const canvas = ctx.canvas;
    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = image.width / image.height;
    let sx, sy, sWidth, sHeight;

    // This logic performs a "center crop" on the source image to fit the canvas dimensions.
    if (imageAspect > canvasAspect) { // Image is wider than canvas aspect ratio
        sHeight = image.height;
        sWidth = sHeight * canvasAspect;
        sx = (image.width - sWidth) / 2;
        sy = 0;
    } else { // Image is taller or same aspect ratio
        sWidth = image.width;
        sHeight = sWidth / canvasAspect;
        sx = 0;
        sy = (image.height - sHeight) / 2;
    }
    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
}

const drawText = (ctx: CanvasRenderingContext2D, config: TextBlock, position: 'center' | 'corner') => {
    if (!config.text.trim()) return;

    const { text, fontId, effectId, color1, color2, fontSize } = config;
    const fontObject = fonts.find(f => f.id === fontId);
    if (!fontObject) return;

    // Reset any lingering shadow effects from previous renders
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Common text settings
    ctx.font = `${fontObject.weight} ${fontSize}px "${fontObject.family}"`;
    
    let x, y;
    const PADDING_X = ctx.canvas.width * 0.05; // 5% horizontal padding
    const PADDING_Y = ctx.canvas.height * 0.05; // 5% vertical padding

    if (position === 'center') {
        x = ctx.canvas.width / 2;
        y = ctx.canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
    } else { // corner
        x = PADDING_X;
        y = ctx.canvas.height - PADDING_Y;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
    }

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
            ctx.shadowBlur = 30; // Stronger glow
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
            ctx.lineWidth = Math.max(2, fontSize / 20); // Scale line width with font size
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(text, x, y);
            ctx.fillStyle = color1;
            ctx.fillText(text, x, y);
            break;
        case 'faux-3d':
            const depth = Math.max(1, Math.floor(fontSize / 20));
            ctx.fillStyle = color2;
            for (let i = 1; i <= depth; i++) {
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
     // Reset shadow for the next text block
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

export const renderComposition = (
    backgroundImage: string | null,
    centerConfig: TextBlock,
    cornerConfig: TextBlock,
    width: number,
    height: number
): Promise<string> => {
    return new Promise(async (resolve) => {
        await document.fonts.ready;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawAllText = () => {
            drawText(ctx, centerConfig, 'center');
            drawText(ctx, cornerConfig, 'corner');
            resolve(canvas.toDataURL('image/png'));
        };

        if (backgroundImage) {
            const img = new Image();
            img.onload = () => {
                drawImageToCanvas(ctx, img);
                drawAllText();
            };
            img.onerror = () => {
                // if image fails to load, draw text on a transparent background
                drawAllText();
            };
            img.src = backgroundImage;
        } else {
            drawAllText();
        }
    });
};

export const getRandomItem = <T,>(arr: readonly T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomHexColor = (): string => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};