/* ----------------------------------------------------
   194XDD Input Controller - Keyboard, Mouse & Touch
   ---------------------------------------------------- */

export const Input = {
    mode: 'keyboard', // 'keyboard' or 'mouse' (touch maps to mouse mode)
    
    // Key states
    keys: {},
    
    // Position targets (for mouse and touch dragging)
    x: 0,
    y: 0,
    isMouseDown: false,
    
    // Action pulse triggers (set true on press, reset by game loop)
    loopTriggered: false,
    pauseTriggered: false,
    bombTriggered: false,
    missileTriggered: false,
    
    // Reference canvas to scale mouse/touch events
    canvas: null,

    init(canvas) {
        this.canvas = canvas;
        this.reset();

        // 1. Keyboard Listeners
        window.addEventListener('keydown', (e) => {
            const code = e.code;
            this.keys[code] = true;

            // Trigger single action flags
            if (code === 'ShiftLeft' || code === 'KeyC') {
                this.loopTriggered = true;
            }
            if (code === 'KeyP' || code === 'Escape') {
                this.pauseTriggered = true;
            }
            if (code === 'KeyB' || code === 'KeyX') {
                this.bombTriggered = true;
            }
            if (code === 'KeyF' || code === 'KeyV') {
                this.missileTriggered = true;
            }

            // Auto-switch to keyboard mode if WASD or Arrows pressed
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
                this.mode = 'keyboard';
            }

            // Prevent browser scroll or other default operations on game keys
            const blockedKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyB', 'KeyX', 'KeyF', 'KeyV', 'KeyC', 'ShiftLeft', 'ShiftRight'];
            if (blockedKeys.includes(code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Reset key states on blur to avoid stuck keys
        window.addEventListener('blur', () => {
            this.reset();
        });

        // 2. Mouse Listeners
        canvas.addEventListener('mousemove', (e) => {
            this.updateMouseCoords(e);
            // Only switch to mouse control mode if the user is actively dragging (holding click)
            if (this.isMouseDown) {
                this.mode = 'mouse';
            }
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.isMouseDown = true;
                this.updateMouseCoords(e);
                this.mode = 'mouse';
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Only release on left click
                this.isMouseDown = false;
            }
        });

        // Block canvas context menu to bind right click as Bomb button
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.mode === 'mouse') {
                this.bombTriggered = true;
            }
        });

        // 3. Touch Listeners (Mobile compatibility)
        canvas.addEventListener('touchstart', (e) => {
            this.isMouseDown = true;
            this.updateTouchCoords(e);
            this.mode = 'mouse';
            // prevent default scrolling gestures
            e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            this.updateTouchCoords(e);
            e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            this.isMouseDown = false;
            e.preventDefault();
        });
    },

    reset() {
        this.keys = {};
        this.x = this.canvas ? this.canvas.width / 2 : 384;
        this.y = this.canvas ? this.canvas.height * 0.8 : 819;
        this.isMouseDown = false;
        this.loopTriggered = false;
        this.pauseTriggered = false;
        this.bombTriggered = false;
        this.missileTriggered = false;
    },

    updateMouseCoords(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    },

    updateTouchCoords(e) {
        if (!this.canvas || e.touches.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        this.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
    },

    // Query helper for direction vectors in keyboard mode
    getKeyboardDirections() {
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        // Normalize if moving diagonally
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { dx, dy };
    }
};
