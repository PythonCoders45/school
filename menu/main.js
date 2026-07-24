import { MapRenderer } from './renderer/renderer.js';
import { ControlManager } from './controls/controls.js';
import { BaldiHUD } from './hud/hud.js';

// Game State Enum
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

class GameApp {
    constructor() {
        this.currentState = GAME_STATE.MENU;

        // Settings / Config State
        this.config = {
            seed: 'BALDI_PLUS_FLOOR',
            volume: 80,
            pixelated: true
        };

        this.container = null;
        this.canvas = null;
        this.menuOverlay = null;
        this.renderer = null;
        this.controls = null;
        this.hud = null;

        this.initDOM();
        this.initEngine();
        this.bindEvents();
        this.startLoop();
    }

    // 1. Full-Scale Styled UI Construction with Custom Background & Font Imports
    initDOM() {
        // Load custom Google Font dynamically
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap';
        document.head.appendChild(fontLink);

        const style = document.createElement('style');
        style.textContent = `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                user-select: none;
            }

            body {
                background-color: #0b0b0e;
                color: #ffffff;
                font-family: 'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                overflow: hidden;
            }

            .game-viewport {
                position: relative;
                width: 960px;
                height: 720px;
                border: 6px solid #222;
                background-color: #000;
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.9);
                overflow: hidden;
                border-radius: 8px;
            }

            #gameCanvas {
                width: 100%;
                height: 100%;
                display: block;
            }

            /* --- FULL MAIN MENU LAYOUT WITH BACKGROUND IMAGE --- */
            .main-menu {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                /* Background image with semi-transparent dark overlay */
                background: linear-gradient(rgba(10, 10, 15, 0.75), rgba(5, 5, 10, 0.85)),
                            url('http://googleusercontent.com/image_collection/image_retrieval/13097654725855478667_0') center/cover no-repeat;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                padding: 40px 20px;
                z-index: 2000;
            }

            .menu-header {
                text-align: center;
            }

            .menu-title {
                font-size: 48px;
                color: #55ff55;
                text-shadow: 4px 4px #000, 0 0 20px rgba(85, 255, 85, 0.6);
                letter-spacing: 2px;
                margin-bottom: 6px;
                font-weight: 700;
            }

            .menu-subtitle {
                font-size: 18px;
                color: #ffea00;
                text-shadow: 2px 2px #000;
            }

            .menu-body {
                display: flex;
                gap: 40px;
                width: 100%;
                max-width: 820px;
                justify-content: center;
                align-items: flex-start;
            }

            .menu-panel {
                background: rgba(0, 0, 0, 0.82);
                border: 3px solid #55ff55;
                box-shadow: 0 0 15px rgba(85, 255, 85, 0.2);
                border-radius: 8px;
                padding: 22px;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .panel-title {
                font-size: 22px;
                color: #55ff55;
                border-bottom: 2px solid #333;
                padding-bottom: 6px;
                text-shadow: 2px 2px #000;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .form-group label {
                font-size: 15px;
                color: #ddd;
                font-weight: bold;
            }

            .form-control {
                padding: 10px 12px;
                font-size: 16px;
                font-family: inherit;
                background: #000;
                border: 2px solid #55ff55;
                color: #fff;
                border-radius: 4px;
                outline: none;
            }

            .form-control:focus {
                box-shadow: 0 0 10px rgba(85, 255, 85, 0.8);
            }

            .control-list {
                list-style: none;
                font-size: 15px;
                color: #ccc;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .control-list span {
                color: #55ff55;
                font-weight: bold;
            }

            .menu-footer {
                display: flex;
                gap: 20px;
            }

            .menu-btn {
                padding: 14px 44px;
                font-size: 24px;
                font-family: inherit;
                font-weight: bold;
                background-color: #55ff55;
                color: #000;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s ease;
                box-shadow: 0 5px 0 #22aa22;
            }

            .menu-btn:hover {
                background-color: #77ff77;
                transform: translateY(-2px);
                box-shadow: 0 7px 0 #22aa22;
            }

            .menu-btn:active {
                transform: translateY(2px);
                box-shadow: 0 2px 0 #22aa22;
            }

            .menu-btn.secondary {
                background-color: #333;
                color: #fff;
                box-shadow: 0 4px 0 #111;
                border: 1px solid #55ff55;
            }

            .menu-btn.secondary:hover {
                background-color: #444;
                box-shadow: 0 6px 0 #111;
            }
        `;
        document.head.appendChild(style);

        // Viewport Wrapper
        this.container = document.createElement('div');
        this.container.className = 'game-viewport';

        // Main Map Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gameCanvas';
        this.canvas.width = 960;
        this.canvas.height = 720;

        // Expanded Main Menu DOM Structure
        this.menuOverlay = document.createElement('div');
        this.menuOverlay.className = 'main-menu';
        this.menuOverlay.innerHTML = `
            <div class="menu-header">
                <h1 class="menu-title">BALDI'S BASICS WEB ENGINE</h1>
                <p class="menu-subtitle">Seeded Floor Generator & Modular Framework</p>
            </div>

            <div class="menu-body">
                <div class="menu-panel">
                    <h2 class="panel-title">Level Options</h2>
                    <div class="form-group">
                        <label for="seedInput">Level Seed:</label>
                        <input type="text" id="seedInput" class="form-control" value="${this.config.seed}">
                    </div>
                    <button class="menu-btn secondary" id="randomSeedBtn" style="font-size: 14px; padding: 8px;">Randomize Seed</button>

                    <div class="form-group" style="margin-top: 10px;">
                        <label for="volumeRange">Sound Volume:</label>
                        <input type="range" id="volumeRange" min="0" max="100" value="${this.config.volume}">
                    </div>
                </div>

                <div class="menu-panel">
                    <h2 class="panel-title">Controls</h2>
                    <ul class="control-list">
                        <li><span>W / A / S / D</span> - Move Player</li>
                        <li><span>Shift</span> - Sprint (Uses Stamina)</li>
                        <li><span>1 / 2 / 3</span> - Select Inventory Item</li>
                        <li><span>E / Right Click</span> - Use Active Item</li>
                        <li><span>Left Click / Space</span> - Interact / Door</li>
                    </ul>
                </div>
            </div>

            <div class="menu-footer">
                <button class="menu-btn" id="startBtn">START GAME</button>
            </div>
        `;

        this.container.appendChild(this.canvas);
        this.container.appendChild(this.menuOverlay);
        document.body.appendChild(this.container);
    }

    initEngine() {
        this.renderer = new MapRenderer('gameCanvas', 12);
        this.controls = new ControlManager(this.container);
        this.hud = new BaldiHUD(this.container);

        // Hide HUD overlay while on Main Menu
        if (this.hud.overlay) {
            this.hud.overlay.style.display = 'none';
        }
    }

    bindEvents() {
        const startBtn = this.menuOverlay.querySelector('#startBtn');
        const randomSeedBtn = this.menuOverlay.querySelector('#randomSeedBtn');
        const seedInput = this.menuOverlay.querySelector('#seedInput');

        // Start Game Trigger
        startBtn.onclick = () => {
            this.config.seed = seedInput.value || 'BALDI_PLUS_FLOOR';
            this.startGame();
        };

        // Random Seed Generator
        randomSeedBtn.onclick = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let res = '';
            for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
            seedInput.value = res;
        };

        // Connect In-Game Key Actions
        this.controls.onSelectSlot = (slotIndex) => {
            if (this.currentState === GAME_STATE.PLAYING) {
                this.hud.selectSlot(slotIndex);
            }
        };

        this.controls.onUseItem = () => {
            if (this.currentState === GAME_STATE.PLAYING) {
                this.hud.useSelectedItem();
            }
        };
    }

    startGame() {
        this.currentState = GAME_STATE.PLAYING;
        this.menuOverlay.style.display = 'none';

        if (this.hud.overlay) {
            this.hud.overlay.style.display = 'flex';
        }

        console.log(`Starting Floor Generation with Seed: ${this.config.seed}`);
    }

    startLoop() {
        const update = () => {
            if (this.currentState === GAME_STATE.PLAYING) {
                const velocity = this.controls.getVectorVelocity(2.0, 1.8);
                this.hud.state.isSprinting = velocity.isSprinting;

                // Render In-Game Engine Canvas
                this.renderer.ctx.fillStyle = '#d4a373';
                this.renderer.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else if (this.currentState === GAME_STATE.MENU) {
                // Clear Background for Main Menu
                this.renderer.ctx.fillStyle = '#0b0b0e';
                this.renderer.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            this.controls.resetFrameDeltas();
            requestAnimationFrame(update);
        };

        update();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
