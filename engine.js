// ============================================================================
// CORE FRAMEWORK ENGINE: DO NOT ALTER FOR SPECIFIC GAMES
// ============================================================================

class InputHandler {
    constructor(engine) {
        this.engine = engine;
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false, clicked: false };
        this.initListeners();
    }
    initListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        window.addEventListener('mousemove', (e) => { this.updateMousePosition(e.clientX, e.clientY); });
        window.addEventListener('mousedown', () => { this.mouse.isDown = true; this.mouse.clicked = true; });
        window.addEventListener('mouseup', () => { this.mouse.isDown = false; });
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.mouse.isDown = true; this.mouse.clicked = true;
                this.updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) this.updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        window.addEventListener('touchend', () => { this.mouse.isDown = false; });
    }
    updateMousePosition(clientX, clientY) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const rawX = (clientX - rect.left) / this.engine.scale;
        const rawY = (clientY - rect.top) / this.engine.scale;
        this.mouse.x = Math.max(0, Math.min(this.engine.virtualWidth, rawX));
        this.mouse.y = Math.max(0, Math.min(this.engine.virtualHeight, rawY));
    }
    isPressed(keyCode) { return !!this.keys[keyCode]; }
    resetTicks() { this.mouse.clicked = false; }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 6 + 4;
        this.vx = (Math.random() - 0.5) * 300; this.vy = (Math.random() - 0.5) * 300;
        this.alpha = 1; this.decay = Math.random() * 0.8 + 0.6;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.alpha -= this.decay * dt; }
    render(ctx) {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.alpha); ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size); ctx.restore();
    }
}

class AudioManager {
    constructor() { this.ctx = null; }
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    playBlip() {
        this.init(); if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    playExplosion() {
        this.init(); if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.4);
    }
}

// Global Core Framework Instance
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.virtualWidth = 800; this.virtualHeight = 600;
        this.scale = 1; this.lastTime = 0; this.fps = 0;
        this.particles = [];
        this.input = new InputHandler(this);
        this.audio = new AudioManager();
        this.activeGame = null; // Container hook for runtime custom games
        this.initResize();
    }
    initResize() {
        const resize = () => {
            const scaleX = window.innerWidth / this.virtualWidth;
            const scaleY = window.innerHeight / this.virtualHeight;
            this.scale = Math.min(scaleX, scaleY);
            this.canvas.width = this.virtualWidth * this.scale; this.canvas.height = this.virtualHeight * this.scale;
            this.ctx.imageSmoothingEnabled = false;
        };
        window.addEventListener('resize', resize); resize();
    }
    loadGame(gameInstance) {
        this.activeGame = gameInstance;
        this.activeGame.engine = this; // Give the game a callback reference hook
        this.activeGame.init();
        this.startLoop();
    }
    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color));
    }
    startLoop() {
        const loop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            let dt = (timestamp - this.lastTime) / 1000; this.lastTime = timestamp;
            if (dt > 0.1) dt = 0.1; this.fps = Math.round(1 / dt);

            // Update Global particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update(dt); if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }

            // Route execution lifecycle parameters straight to active client game logic
            if (this.activeGame) this.activeGame.update(dt);
            
            // Core render pass pipelines
            this.ctx.fillStyle = '#0f0f13'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.save(); this.ctx.scale(this.scale, this.scale);
            
            for (let particle of this.particles) { particle.render(this.ctx); }
            if (this.activeGame) this.activeGame.render(this.ctx);

            this.ctx.restore();
            this.input.resetTicks();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
