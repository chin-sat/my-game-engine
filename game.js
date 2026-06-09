class HazardGame {
    constructor() {
        this.engine = null; // Will be mapped automatically by engine framework
        this.state = 'MENU';
        this.score = 0;
        this.player = { x: 350, y: 450, w: 60, h: 60, speed: 300 };
        this.hazards = [];
        this.spawnTimer = 0;
        this.startButton = { x: 300, y: 320, w: 200, h: 60 };
    }

    init() {
        // Run setup instructions if needed when the engine loads this game
    }

    isMouseOver(btn) {
        return this.engine.input.mouse.x >= btn.x && this.engine.input.mouse.x <= btn.x + btn.w &&
               this.engine.input.mouse.y >= btn.y && this.engine.input.mouse.y <= btn.y + btn.h;
    }

    update(dt) {
        if (this.state === 'MENU') {
            if (this.engine.input.mouse.clicked && this.isMouseOver(this.startButton)) {
                this.engine.audio.playBlip();
                this.engine.createExplosion(400, 350, '#00ffcc', 40);
                this.state = 'PLAYING';
                this.score = 0; this.hazards = [];
            }
        } 
        else if (this.state === 'PLAYING') {
            // Player Movement via engine inputs wrapper hook
            if (this.engine.input.isPressed('KeyA') || this.engine.input.isPressed('ArrowLeft')) this.player.x -= this.player.speed * dt;
            if (this.engine.input.isPressed('KeyD') || this.engine.input.isPressed('ArrowRight')) this.player.x += this.player.speed * dt;
            this.player.x = Math.max(0, Math.min(800 - this.player.w, this.player.x));

            // Hazard Spawn Mechanics
            this.spawnTimer += dt;
            if (this.spawnTimer >= 1.0) {
                this.hazards.push({ x: Math.random() * 750, y: -40, size: 40, speed: Math.random() * 200 + 150 });
                this.spawnTimer = 0;
            }

            // Loop through hazards
            for (let i = this.hazards.length - 1; i >= 0; i--) {
                let h = this.hazards[i];
                h.y += h.speed * dt;

                // Hitbox Collision Detection Checks
                if (this.player.x < h.x + h.size && this.player.x + this.player.w > h.x &&
                    this.player.y < h.y + h.size && this.player.y + this.player.h > h.y) {
                    this.engine.audio.playExplosion();
                    this.engine.createExplosion(this.player.x + 30, this.player.y + 30, '#ff0055', 50);
                    this.state = 'MENU'; // Crash, go back to menu
                }

                if (h.y > 600) { this.hazards.splice(i, 1); this.score += 50; }
            }
        }
    }

    render(ctx) {
        if (this.state === 'MENU') {
            ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('FALLING BLOCKS ARCADE', 400, 220);

            let hover = this.isMouseOver(this.startButton);
            ctx.fillStyle = hover ? '#00ffcc' : '#222230';
            ctx.fillRect(this.startButton.x, this.startButton.y, this.startButton.w, this.startButton.h);
            ctx.fillStyle = hover ? '#111116' : '#ffffff'; ctx.font = 'bold 20px sans-serif';
            ctx.fillText('START GAME', 400, 357);
        } 
        else if (this.state === 'PLAYING') {
            ctx.fillStyle = '#00ffcc'; ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
            ctx.fillStyle = '#ff0055';
            for (let h of this.hazards) ctx.fillRect(h.x, h.y, h.size, h.size);

            ctx.fillStyle = '#ffffff'; ctx.font = '24px sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(`SCORE: ${this.score}`, 40, 50);
        }
    }
}

// ============================================================================
// BOOTSTRAP INITIALIZATION: Hooks your game class up to the engine structure
// ============================================================================
const engine = new GameEngine();
engine.loadGame(new HazardGame());
