class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Base virtual resolution (independent of screen size)
        this.virtualWidth = 800;
        this.virtualHeight = 600;
        
        // Scaling factors
        this.scale = 1;
        
        // Game Loop Variables
        this.lastTime = 0;
        this.fps = 0;

        // Initialize systems
        this.initResize();
        this.startLoop();
    }

    // Module 1A: Smart Scaling Engine
    initResize() {
        const resize = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calculate best fit ratio (maintains 4:3 aspect ratio)
            const scaleX = windowWidth / this.virtualWidth;
            const scaleY = windowHeight / this.virtualHeight;
            this.scale = Math.min(scaleX, scaleY);
            
            // Set actual screen dimensions
            this.canvas.width = this.virtualWidth * this.scale;
            this.canvas.height = this.virtualHeight * this.scale;
            
            // Turn off image smoothing for crisp retro/arcade pixel art
            this.ctx.imageSmoothingEnabled = false;
        };

        window.addEventListener('resize', resize);
        resize(); // Run immediately on load
    }

    // Module 1B: Delta-Time Game Loop (Stops 144Hz screen lag/speedups)
    startLoop() {
        const loop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            
            // Calculate delta time in seconds
            let dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            // Cap dt to prevent massive jumps during lag spikes
            if (dt > 0.1) dt = 0.1;

            // Calculate current FPS
            this.fps = Math.round(1 / dt);

            this.update(dt);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // Game logic goes here (to be overridden by your specific game)
    update(dt) {
        // Core systems update will plug in here
    }

    // Graphics drawing goes here
    render() {
        // 1. Clear screen
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Save canvas state and apply global scaling matrix
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        // --- DRAW YOUR VIRTUAL WORLD GAME OBJECTS HERE (0 to 800 width, 0 to 600 height) ---
        // Placeholder test square to prove scaling works:
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.fillRect(50, 50, 100, 100);

        // Draw Debug FPS text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 50, 180);
        // ---------------------------------------------------------------------------------

        // 3. Restore canvas scale for the next frame loop
        this.ctx.restore();
    }
}

// Instantiate the engine to run it
const game = new GameEngine();
