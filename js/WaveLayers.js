/**
 * WaveLayers.js - Hiệu ứng sóng nước cho game
 * Bao gồm ScrollingWaterBackground và WaveLayers
 */

// Scrolling Water Background
export class ScrollingWaterBackground {
    constructor(imagePath = 'img/wave.png') {
        this.image = new window.Image();
        this.image.src = imagePath;
        this.imageLoaded = false;
        this.offset = 0;
        this.scrollSpeed = 150;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Failed to load water background image:', imagePath);
        };
    }

    update(deltaTime) {
        if (!this.imageLoaded) return;
        
        this.offset -= this.scrollSpeed * deltaTime;
        
        if (this.offset <= -this.image.width) {
            this.offset = 0;
        }
    }

    draw(ctx, canvasWidth, canvasHeight, y = 0, height = null) {
        if (!this.imageLoaded) return;
        
        const drawHeight = height || canvasHeight - y;
        const imageWidth = this.image.width;
        
        ctx.save();
        
        ctx.drawImage(
            this.image,
            Math.floor(this.offset),
            Math.floor(y),
            imageWidth,
            Math.ceil(drawHeight)
        );
        
        ctx.drawImage(
            this.image,
            Math.floor(this.offset + imageWidth),
            Math.floor(y),
            imageWidth,
            Math.ceil(drawHeight)
        );
        
        ctx.restore();
    }

    reset() {
        this.offset = 0;
    }
}

// Wave Layers - 3 animated wave layers
export class WaveLayers {
    constructor(imagePath = 'img/wave.png') {
        this.image = new window.Image();
        this.image.src = imagePath;
        this.imageLoaded = false;
        
        this.waves = [
            { offset: 0, scrollSpeed: 120, yRatio: -0.3, scale: 0.5 },
            { offset: 0, scrollSpeed: 100, yRatio: 0, scale: 1.0 },
            { offset: 0, scrollSpeed: 120, yRatio: 0.85, scale: 0.9 }
        ];

        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Failed to load wave image:', imagePath);
        };
    }

    update(deltaTime) {
        if (!this.imageLoaded) return;
        
        for (const wave of this.waves) {
            wave.offset -= wave.scrollSpeed * deltaTime;
            
            const waveWidth = this.image.width * wave.scale;
            
            if (wave.offset <= -waveWidth) {
                wave.offset += waveWidth;
            }
        }
    }

    draw(ctx, canvasWidth, waterYStart, waterHeight) {
        if (!this.imageLoaded || !this.image.width || !this.image.height) return;
        
        const originalWidth = this.image.width;
        const originalHeight = this.image.height;

        ctx.save();

        for (let waveIndex = 0; waveIndex < this.waves.length; waveIndex++) {
            const wave = this.waves[waveIndex];
            
            const waveHeight = originalHeight * wave.scale;
            const waveWidth = originalWidth * wave.scale;
            
            const y = waterYStart + waterHeight * wave.yRatio;
            
            const alphas = [0.7, 0.85, 0.6];
            ctx.globalAlpha = alphas[waveIndex];
            
            const repeatCount = Math.ceil(canvasWidth / waveWidth) + 2;
            
            for (let i = 0; i < repeatCount; i++) {
                const x = wave.offset + i * waveWidth;
                
                if (x + waveWidth >= 0 && x <= canvasWidth) {
                    ctx.drawImage(
                        this.image, 
                        x, 
                        y, 
                        waveWidth, 
                        waveHeight
                    );
                }
            }
        }

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    reset() {
        for (const wave of this.waves) {
            wave.offset = 0;
        }
    }
}
