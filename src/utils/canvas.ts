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

const drawText = (ctx: CanvasRenderingContext2D, config: TextBlock, position?: 'center' | 'corner') => {
    if (!config.text.trim()) return;

    const { text, fontId, effectIds, color1, color2, fontSize, x, y } = config;
    const fontObject = fonts.find(f => f.id === fontId);
    if (!fontObject) return;

    const effects = new Set(effectIds || []);

    // Reset any lingering shadow effects from previous renders
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Font settings: apply bold if selected
    const fontWeight = effects.has('bold') ? '900' : fontObject.weight;
    ctx.font = `${fontWeight} ${fontSize}px "${fontObject.family}"`;
    
    let textX, textY;
    
    // 使用新的座標系統
    if (x !== undefined && y !== undefined) {
        textX = x;
        textY = y;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    } else if (position === 'center') {
        textX = ctx.canvas.width / 2;
        textY = ctx.canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
    } else { // corner
        const PADDING_X = ctx.canvas.width * 0.05;
        const PADDING_Y = ctx.canvas.height * 0.05;
        textX = PADDING_X;
        textY = ctx.canvas.height - PADDING_Y;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
    }

    // --- Rendering Pipeline ---

    // 1. Faux 3D (drawn first, in the back)
    if (effects.has('faux-3d')) {
        const depth = Math.max(1, Math.floor(fontSize / 30));
        ctx.fillStyle = color2;
        for (let i = 1; i <= depth; i++) {
            ctx.fillText(text, textX + i, textY + i);
        }
    }

    // 2. Fill Style setup
    if (effects.has('neon')) {
        ctx.fillStyle = '#FFFFFF'; // Neon text is typically white on a glow
    } else {
        ctx.fillStyle = color1;
    }

    // 3. Shadow setup (applied before fill to affect the whole object including stroke)
    if (effects.has('neon')) {
        ctx.shadowColor = color1; // Glow color
        ctx.shadowBlur = 15;
    } else if (effects.has('shadow')) {
        ctx.shadowColor = color2;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
    }

    // 4. Stroke
    if (effects.has('outline')) {
        ctx.strokeStyle = color2;
        ctx.lineWidth = Math.max(2, fontSize / 20);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, textX, textY);
    }
    
    // 5. Main text fill
    ctx.fillText(text, textX, textY);

    // 5.1. Extra Neon pass for more intensity
    if (effects.has('neon')) {
        ctx.shadowBlur = 30; // Stronger glow
        ctx.fillText(text, textX, textY);
    }
    
    // Reset shadow before glitch effect
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 6. Glitch effect (drawn last, on top)
    if (effects.has('glitch')) {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta
        ctx.fillText(text, textX - 5, textY);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan
        ctx.fillText(text, textX + 5, textY);
        // We draw the original text one more time if there's no solid fill, to ensure it's visible
        if (effects.has('neon')) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(text, textX, textY);
        } else {
             ctx.fillStyle = color1;
             ctx.fillText(text, textX, textY);
        }
    }
    
     // Final reset for the next text block
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

export const renderComposition = (
    backgroundImage: string | null,
    textBlocks: TextBlock[],
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
            textBlocks.forEach(textBlock => {
                drawText(ctx, textBlock);
            });
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