/**
 * UIRenderer.js - Render giao diện game
 * Vẽ grass, water, timer, start/finish line, logo
 */

import { GAME_CONFIG, LAYOUT } from './config.js';
import { Duck } from './Duck.js';

export class UIRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    drawGrassArea() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(0, 0, this.canvas.width, LAYOUT.grassHeight);
        ctx.restore();
    }

    drawWaterArea(waterBg = null) {
        const ctx = this.ctx;
        ctx.save();
        
        // Solid blue background
        ctx.fillStyle = '#1E88E5';
        ctx.fillRect(0, LAYOUT.waterYStart, this.canvas.width, LAYOUT.waterHeight);
        
        // Scrolling water background if available
        if (waterBg && waterBg.imageLoaded) {
            const ratio = window.devicePixelRatio || 1;
            waterBg.draw(ctx, this.canvas.width / ratio, LAYOUT.waterHeight, LAYOUT.waterYStart);
        }
        
        ctx.restore();
    }

    drawStartLine() {
        const ctx = this.ctx;
        ctx.save();
        
        const x = LAYOUT.startLineX;
        const y = LAYOUT.waterYStart;
        const w = 20;
        const h = LAYOUT.waterHeight;
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        
        // Checkered pattern
        for (let i = 0; i < h; i += 20) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - w/2, y + i, w, 10);
            ctx.fillStyle = '#000';
            ctx.fillRect(x - w/2, y + i + 10, w, 10);
        }
        
        ctx.shadowBlur = 0;
        
        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - w/2, y, w, h);
        
        // Label
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.strokeText('START', x, y - 10);
        ctx.fillText('START', x, y - 10);
        
        ctx.restore();
    }

    drawTimer(timeString, isLowTime = false) {
        const ctx = this.ctx;
        ctx.save();
        
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 6;
        ctx.fillRect(LAYOUT.timerX, LAYOUT.timerY, 110, 44);
        ctx.strokeRect(LAYOUT.timerX, LAYOUT.timerY, 110, 44);
        ctx.shadowBlur = 0;
        
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = isLowTime ? '#D32F2F' : '#222';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeString, LAYOUT.timerX + 55, LAYOUT.timerY + 22);
        
        ctx.restore();
    }

    drawLogo() {
        Duck.loadLogoImage();
        const logo = Duck.logoImage;
        const ready = Duck.logoImageLoaded && logo && logo.complete;
        
        if (!ready) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        const logoHeight = 120;  // Tăng 20% từ 100
        const logoWidth = (logo.width / logo.height) * logoHeight;
        const logoX = 15;
        const logoY = 15;
        
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
        ctx.restore();
    }

    drawCountdown(number) {
        const ctx = this.ctx;
        const ratio = window.devicePixelRatio || 1;
        const centerX = (this.canvas.width / ratio) / 2;
        const centerY = (this.canvas.height / ratio) / 2;
        
        ctx.save();
        
        // Background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, LAYOUT.canvasWidth, LAYOUT.canvasHeight);
        
        // Countdown number
        ctx.font = 'bold 120px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = number > 0 ? number.toString() : 'GO!';
        ctx.strokeText(text, centerX, centerY);
        ctx.fillText(text, centerX, centerY);
        
        ctx.restore();
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        const ratio = window.devicePixelRatio || 1;
        const centerX = (this.canvas.width / ratio) / 2;
        const centerY = (this.canvas.height / ratio) / 2;
        
        ctx.save();        
        ctx.restore();
    }

    drawStartButton(isHovered = false) {
        const ctx = this.ctx;
        const ratio = window.devicePixelRatio || 1;
        const btnX = (this.canvas.width / ratio) / 2;
        const btnY = (this.canvas.height / ratio) / 2;
        const btnWidth = 200;
        const btnHeight = 60;

        ctx.save();
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = isHovered ? 25 : 20;
        ctx.shadowOffsetY = isHovered ? 6 : 4;

        // Button background
        ctx.fillStyle = isHovered ? '#2a8fd9' : '#1e73be';
        ctx.beginPath();
        ctx.roundRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 10);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#c48b3c';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BẮT ĐẦU', btnX, btnY);
        
        ctx.restore();

        return {
            x: btnX - btnWidth / 2,
            y: btnY - btnHeight / 2,
            width: btnWidth,
            height: btnHeight
        };
    }

    drawWinnersModal(winners) {
        const ctx = this.ctx;
        const ratio = window.devicePixelRatio || 1;
        const canvasWidth = this.canvas.width / ratio;
        const canvasHeight = this.canvas.height / ratio;
        
        ctx.save();
        
        // Background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Modal box
        const modalWidth = Math.min(canvasWidth * 0.9, 800);
        const modalHeight = Math.min(canvasHeight * 0.85, 600);
        const modalX = (canvasWidth - modalWidth) / 2;
        const modalY = (canvasHeight - modalHeight) / 2;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(modalX, modalY, modalX + modalWidth, modalY + modalHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 20);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Header
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 4;
        const headerY = modalY + 30;
        ctx.strokeText('🎉 CHÚC MỪNG NGƯỜI THẮNG CUỘC! 🎉', canvasWidth / 2, headerY);
        ctx.fillText('🎉 CHÚC MỪNG NGƯỜI THẮNG CUỘC! 🎉', canvasWidth / 2, headerY);
        
        // Subtitle
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText('Xin chúc mừng các bạn đã chiến thắng!', canvasWidth / 2, headerY + 50);
        
        // Winners grid
        const gridStartY = headerY + 90;
        const gridPadding = 15;
        const cols = 5;
        const rows = Math.ceil(winners.length / cols);
        const itemWidth = (modalWidth - gridPadding * (cols + 1)) / cols;
        const itemHeight = 80;
        
        for (let i = 0; i < winners.length; i++) {
            const winner = winners[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = modalX + gridPadding + col * (itemWidth + gridPadding);
            const y = gridStartY + row * (itemHeight + gridPadding);
            
            // Winner item background
            const itemGradient = ctx.createLinearGradient(x, y, x + itemWidth, y + itemHeight);
            itemGradient.addColorStop(0, '#f8f8f8ff');
            itemGradient.addColorStop(1, '#f9f9f9ff');
            ctx.fillStyle = itemGradient;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(x, y, itemWidth, itemHeight, 12);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Winner number
            ctx.fillStyle = '#000000ff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 3;
            
            ctx.fillText(winner.id.toString(), x + itemWidth / 2, y + itemHeight / 2 - 10);
            
            // Winner nam
        }
        
        // Close button
        const btnWidth = 200;
        const btnHeight = 50;
        const btnX = (canvasWidth - btnWidth) / 2;
        const btnY = modalY + modalHeight - 80;
        
        const btnGradient = ctx.createLinearGradient(btnX, btnY, btnX + btnWidth, btnY + btnHeight);
        btnGradient.addColorStop(0, '#FFD700');
        btnGradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = btnGradient;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 25);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Thoát', btnX + btnWidth / 2, btnY + btnHeight / 2);
        
        ctx.restore();
        
        // Return button bounds for click detection
        return {
            x: btnX,
            y: btnY,
            width: btnWidth,
            height: btnHeight
        };
    }
}
