class HUD {
    constructor(container = document.body) {
        this.container = container;
        
        // --- Real Game Logic State ---
        this.state = {
            notebooks: 0,
            maxNotebooks: 7,
            stamina: 100,
            maxStamina: 100,
            sprintSpeedMultiplier: 2.0,
            selectedSlot: 0,
            isSprinting: false,
            inventory: [
                { id: 'bsoda', name: 'BSODA', icon: '🥤', action: () => this.useBsoda() },
                { id: 'zesty', name: 'Zesty Bar', icon: '🍫', action: () => this.useZestyBar() },
                { id: 'keys', name: 'Principal Keys', icon: '🔑', action: () => this.useKeys() }
            ]
        };

        this.init();
    }

    init() {
        this.injectStyles();
        this.render();
        this.bindEvents();
        this.startLoop();
    }

    // 1. Inject Styles directly via JS
    injectStyles() {
        if (document.getElementById('hud-styles')) return;

        const style = document.createElement('style');
        style.id = 'hud-styles';
        style.textContent = `
            .hud-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                padding: 16px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
                font-family: 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif;
                user-select: none;
                z-index: 1000;
            }

            .hud-top {
                display: flex;
                justify-content: flex-start;
            }

            .notebook-counter {
                background: rgba(0, 0, 0, 0.85);
                border: 3px solid #55ff55;
                color: #55ff55;
                padding: 8px 16px;
                font-size: 20px;
                font-weight: bold;
                border-radius: 6px;
                text-shadow: 2px 2px #000;
                pointer-events: auto;
            }

            .hud-bottom {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }

            .stamina-container {
                width: 200px;
                background: rgba(0, 0, 0, 0.85);
                border: 3px solid #ffffff;
                padding: 6px;
                border-radius: 6px;
                pointer-events: auto;
            }

            .stamina-label {
                color: #ffffff;
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 4px;
                text-transform: uppercase;
            }

            .stamina-bar-bg {
                width: 100%;
                height: 16px;
                background: #333;
                border-radius: 3px;
                overflow: hidden;
            }

            .stamina-bar-fill {
                width: 100%;
                height: 100%;
                background: #55ff55;
                transition: width 0.05s linear;
            }

            .inventory-container {
                display: flex;
                gap: 8px;
                pointer-events: auto;
            }

            .item-slot {
                width: 56px;
                height: 56px;
                background: rgba(0, 0, 0, 0.85);
                border: 3px solid #777;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                transition: border-color 0.1s ease, transform 0.1s ease;
            }

            .item-slot.active {
                border-color: #55ff55;
                box-shadow: 0 0 10px rgba(85, 255, 85, 0.6);
                transform: scale(1.05);
            }

            .item-keyhint {
                position: absolute;
                top: 2px;
                left: 4px;
                color: #aaa;
                font-size: 10px;
                font-weight: bold;
            }

            .item-icon {
                font-size: 26px;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Render HUD DOM Structure
    render() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'hud-overlay';

        this.overlay.innerHTML = `
            <div class="hud-top">
                <div class="notebook-counter" id="hudNotebooks">
                    Notebooks: ${this.state.notebooks} / ${this.state.maxNotebooks}
                </div>
            </div>

            <div class="hud-bottom">
                <div class="stamina-container">
                    <div class="stamina-label">Stamina</div>
                    <div class="stamina-bar-bg">
                        <div class="stamina-bar-fill" id="hudStamina"></div>
                    </div>
                </div>

                <div class="inventory-container" id="hudInventory"></div>
            </div>
        `;

        this.container.appendChild(this.overlay);

        this.notebookElem = this.overlay.querySelector('#hudNotebooks');
        this.staminaElem = this.overlay.querySelector('#hudStamina');
        this.inventoryElem = this.overlay.querySelector('#hudInventory');

        this.updateInventoryUI();
    }

    // 3. Real Inventory Updating & Clicking
    updateInventoryUI() {
        this.inventoryElem.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const item = this.state.inventory[i];
            const slot = document.createElement('div');
            slot.className = `item-slot ${i === this.state.selectedSlot ? 'active' : ''}`;
            
            slot.innerHTML = `
                <span class="item-keyhint">${i + 1}</span>
                <span class="item-icon">${item ? item.icon : ''}</span>
            `;

            slot.onclick = () => {
                this.selectSlot(i);
                this.useSelectedItem();
            };

            this.inventoryElem.appendChild(slot);
        }
    }

    // --- Real Gameplay Functions ---

    selectSlot(index) {
        if (index >= 0 && index < 3) {
            this.selectedSlot = index;
            this.state.selectedSlot = index;
            this.updateInventoryUI();
        }
    }

    useSelectedItem() {
        const item = this.state.inventory[this.state.selectedSlot];
        if (item && typeof item.action === 'function') {
            item.action();
            // Remove item from slot after use
            this.state.inventory[this.state.selectedSlot] = null;
            this.updateInventoryUI();
        }
    }

    addNotebook() {
        if (this.state.notebooks < this.state.maxNotebooks) {
            this.state.notebooks++;
            this.notebookElem.textContent = `Notebooks: ${this.state.notebooks} / ${this.state.maxNotebooks}`;
        }
    }

    useBsoda() {
        console.log("Real Logic: Fired BSODA spray forward!");
        // Connect this to your player/projectile physics engine!
    }

    useZestyBar() {
        console.log("Real Logic: Ate Zesty Bar! Restoring full stamina.");
        this.setStamina(100);
    }

    useKeys() {
        console.log("Real Logic: Used Principal Keys to unlock yellow door!");
    }

    setStamina(value) {
        this.state.stamina = Math.max(0, Math.min(this.state.maxStamina, value));
        this.staminaElem.style.width = `${this.state.stamina}%`;

        if (this.state.stamina > 50) {
            this.staminaElem.style.backgroundColor = '#55ff55';
        } else if (this.state.stamina > 20) {
            this.staminaElem.style.backgroundColor = '#eab308';
        } else {
            this.staminaElem.style.backgroundColor = '#ef4444';
        }
    }

    // 4. Bind Keyboard Controls
    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.key === '1') this.selectSlot(0);
            if (e.key === '2') this.selectSlot(1);
            if (e.key === '3') this.selectSlot(2);
            if (e.key === 'e' || e.key === 'E') this.useSelectedItem();
            if (e.key === 'Shift') this.state.isSprinting = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.state.isSprinting = false;
        });
    }

    // 5. Active Game Loop (Stamina Drain/Recharge)
    startLoop() {
        const tick = () => {
            if (this.state.isSprinting && this.state.stamina > 0) {
                this.setStamina(this.state.stamina - 0.5);
            } else if (!this.state.isSprinting && this.state.stamina < this.state.maxStamina) {
                this.setStamina(this.state.stamina + 0.25);
            }

            requestAnimationFrame(tick);
        };
        tick();
    }
}
