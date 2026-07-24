export class ControlManager {
    constructor(targetElement = window) {
        this.target = targetElement;

        // --- Controller States ---
        this.keys = {};
        this.movement = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprinting: false
        };

        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            isPointerLocked: false
        };

        // --- Action Callbacks ---
        this.onSelectSlot = null;  // Callback when pressing 1, 2, 3
        this.onUseItem = null;     // Callback when pressing E or Right-Click
        this.onInteract = null;    // Callback when pressing Space or Left-Click

        this.init();
    }

    init() {
        // Event Listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));

        // Optional Pointer Lock setup for 3D/Raycaster camera look
        if (this.target instanceof HTMLElement) {
            this.target.addEventListener('click', () => {
                if (!this.mouse.isPointerLocked && this.target.requestPointerLock) {
                    this.target.requestPointerLock();
                }
            });

            document.addEventListener('pointerlockchange', () => {
                this.mouse.isPointerLocked = (document.pointerLockElement === this.target);
            });
        }
    }

    handleKeyDown(event) {
        // Prevent default scrolling for game keys
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }

        this.keys[event.code] = true;
        this.updateMovementState();

        // Inventory Hotkeys (1, 2, 3)
        if (event.code === 'Digit1') this.triggerSelectSlot(0);
        if (event.code === 'Digit2') this.triggerSelectSlot(1);
        if (event.code === 'Digit3') this.triggerSelectSlot(2);

        // Action Keys
        if (event.code === 'KeyE') {
            if (this.onUseItem) this.onUseItem();
        }

        if (event.code === 'Space') {
            if (this.onInteract) this.onInteract();
        }
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
        this.updateMovementState();
    }

    handleMouseMove(event) {
        if (this.mouse.isPointerLocked) {
            this.mouse.deltaX = event.movementX || 0;
            this.mouse.deltaY = event.movementY || 0;
        } else {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }
    }

    handleMouseDown(event) {
        // Left Click = Interact (Door / Item pickup)
        if (event.button === 0) {
            if (this.onInteract) this.onInteract();
        }
        // Right Click = Use held item (BSODA, Zesty Bar, etc.)
        if (event.button === 2) {
            event.preventDefault();
            if (this.onUseItem) this.onUseItem();
        }
    }

    updateMovementState() {
        this.movement.forward = !!(this.keys['KeyW'] || this.keys['ArrowUp']);
        this.movement.backward = !!(this.keys['KeyS'] || this.keys['ArrowDown']);
        this.movement.left = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
        this.movement.right = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
        this.movement.sprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    }

    triggerSelectSlot(slotIndex) {
        if (this.onSelectSlot) {
            this.onSelectSlot(slotIndex);
        }
    }

    /**
     * Call this in your main game update loop to calculate movement vectors.
     * @param {number} moveSpeed Base movement speed
     * @param {number} sprintMultiplier Multiplier applied when holding Shift
     * @returns {{dx: number, dy: number, isSprinting: boolean}} Delta velocity
     */
    getVectorVelocity(moveSpeed = 1.0, sprintMultiplier = 1.75) {
        const speed = this.movement.sprinting ? moveSpeed * sprintMultiplier : moveSpeed;
        let dx = 0;
        let dy = 0;

        if (this.movement.forward) dy -= speed;
        if (this.movement.backward) dy += speed;
        if (this.movement.left) dx -= speed;
        if (this.movement.right) dx += speed;

        // Normalize diagonal movement speed
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        return {
            dx,
            dy,
            isSprinting: this.movement.sprinting && (dx !== 0 || dy !== 0)
        };
    }

    // Reset mouse deltas at the end of each frame
    resetFrameDeltas() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
}
