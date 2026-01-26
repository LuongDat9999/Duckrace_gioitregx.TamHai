/**
 * AudioManager.js - Quản lý âm thanh cho game
 */

export class AudioManager {
    constructor() {
        this.sounds = {
            countdown: null,
            hitTarget: null,
            clap: null,
            bgMusic: null
        };
        
        this.enabled = true;
        this.loadSounds();
    }

    loadSounds() {
        // Countdown 3-2-1
        this.sounds.countdown = new Audio('audio/3-2-1-countdown.mp3');
        this.sounds.countdown.preload = 'auto';
        
        // Hit target khi vịt chạm đích
        this.sounds.hitTarget = new Audio('audio/hit_target.mp3');
        this.sounds.hitTarget.preload = 'auto';
        this.sounds.hitTarget.volume = 0.5; // Giảm volume vì sẽ play nhiều lần
        
        // Clap for winners
        this.sounds.clap = new Audio('audio/clap_for_winers.mp3');
        this.sounds.clap.preload = 'auto';
        
        // Background music
        this.sounds.bgMusic = new Audio('audio/plays_music.mp3');
        this.sounds.bgMusic.preload = 'auto';
        this.sounds.bgMusic.loop = true; // Loop nhạc nền
        this.sounds.bgMusic.volume = 0.3; // Nhạc nền nhỏ hơn
    }

    playCountdown() {
        if (!this.enabled) return;
        
        this.sounds.countdown.currentTime = 0;
        this.sounds.countdown.play().catch(e => {
            console.log('Không thể play countdown:', e);
        });
    }

    playHitTarget() {
        if (!this.enabled) return;
        
        // Clone audio để có thể play nhiều lần đồng thời
        const sound = this.sounds.hitTarget.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(e => {
            console.log('Không thể play hit target:', e);
        });
    }

    playClap() {
        if (!this.enabled) return;
        
        this.sounds.clap.currentTime = 0;
        this.sounds.clap.play().catch(e => {
            console.log('Không thể play clap:', e);
        });
    }

    playBackgroundMusic() {
        if (!this.enabled) return;
        
        this.sounds.bgMusic.currentTime = 0;
        this.sounds.bgMusic.play().catch(e => {
            console.log('Không thể play background music:', e);
        });
    }

    stopBackgroundMusic() {
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.pause();
            this.sounds.bgMusic.currentTime = 0;
        }
    }

    pauseBackgroundMusic() {
        if (this.sounds.bgMusic && !this.sounds.bgMusic.paused) {
            this.sounds.bgMusic.pause();
        }
    }

    resumeBackgroundMusic() {
        if (this.sounds.bgMusic && this.sounds.bgMusic.paused) {
            this.sounds.bgMusic.play().catch(e => {
                console.log('Không thể resume background music:', e);
            });
        }
    }

    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAll();
        }
    }
}
