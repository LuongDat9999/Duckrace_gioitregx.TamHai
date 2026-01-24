/**
 * main.js - Entry point
 * Khởi tạo game và xử lý UI controls
 */

import { GameEngine } from './js/GameEngine.js';
import { LAYOUT } from './js/config.js';

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const totalRaceTimeInput = document.getElementById('totalRaceTime');
const totalDucksInput = document.getElementById('totalDucks');
const winnersPerZoneInput = document.getElementById('winnersPerZone');
const finishZonesInput = document.getElementById('finishZones');

// Initialize Game Engine
const game = new GameEngine(canvas, ctx);

// Canvas resize handler
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    canvas.width = containerWidth * scale;
    canvas.height = containerHeight * scale;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    return { width: containerWidth, height: containerHeight, scale };
}

// Parse input helper
function parseInputInt(el, fallback, min, max) {
    const val = parseInt(el?.value, 10);
    if (Number.isNaN(val)) return fallback;
    return Math.min(max, Math.max(min, val));
}

// Start race from UI
function startRaceFromUI() {
    const totalRaceTime = parseInputInt(totalRaceTimeInput, 120, 10, 300);
    const totalDucks = parseInputInt(totalDucksInput, 180, 1, 300);
    const winnersPerZone = parseInputInt(winnersPerZoneInput, 5, 1, 10);
    const finishZones = parseInputInt(finishZonesInput, 4, 1, 5);

    // Configure game
    game.configure({
        totalDucks,
        totalCheckpoints: finishZones,
        winnersPerCheckpoint: winnersPerZone,
        totalRaceTime
    });

    // Reset and initialize
    game.reset();
    game.initDucks(totalDucks);
    game.start();
}

// Reset race UI
function resetRaceUI() {
    game.reset();
}

// Fullscreen management
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen?.() || canvas.webkitRequestFullscreen?.();
        document.body.classList.add('fullscreen');
    } else {
        document.exitFullscreen?.();
        document.body.classList.remove('fullscreen');
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen');
    }
});

// Event listeners
startBtn?.addEventListener('click', startRaceFromUI);
resetBtn?.addEventListener('click', resetRaceUI);
fullscreenBtn?.addEventListener('click', toggleFullscreen);

// Initialize on load
window.addEventListener('load', () => {
    const dims = resizeCanvas();
    game.resize(dims.width, dims.height, dims.scale);
    
    const totalDucks = parseInputInt(totalDucksInput, 180, 1, 300);
    game.initDucks(totalDucks);
    game.render();
});

// Resize handler
window.addEventListener('resize', () => {
    const dims = resizeCanvas();
    game.resize(dims.width, dims.height, dims.scale);
    
    // Re-render if not running
    if (!game.running) {
        game.render();
    }
});

console.log('🦆 Duck Racing Game initialized!');
