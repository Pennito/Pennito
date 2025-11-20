export class InputManager {
    constructor(canvas) {
        this.keys = new Set();
        this.mouseButtons = new Set();
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseWorldX = 0;
        this.mouseWorldY = 0;
        this.keyPresses = new Set(); // Track key presses (not held)
        this.lastJumpPress = 0;
        this.spacePressed = false;
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys.add(key);
            // Also handle arrow keys
            if (e.key === 'ArrowLeft')
                this.keys.add('arrowleft');
            if (e.key === 'ArrowRight')
                this.keys.add('arrowright');
            if (e.key === 'ArrowUp')
                this.keys.add('arrowup');
            if (e.key === 'ArrowDown')
                this.keys.add('arrowdown');
            if (e.key === ' ') {
                e.preventDefault();
                this.keys.add(' ');
                // Track space press for jump (only trigger once per press)
                const now = Date.now();
                if (!this.spacePressed && now - this.lastJumpPress > 150) { // Debounce jump - 150ms
                    this.keyPresses.add(' ');
                    this.lastJumpPress = now;
                    this.spacePressed = true;
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys.delete(key);
            // Also handle arrow keys
            if (e.key === 'ArrowLeft')
                this.keys.delete('arrowleft');
            if (e.key === 'ArrowRight')
                this.keys.delete('arrowright');
            if (e.key === 'ArrowUp')
                this.keys.delete('arrowup');
            if (e.key === 'ArrowDown')
                this.keys.delete('arrowdown');
            if (e.key === ' ') {
                this.keys.delete(' ');
                this.spacePressed = false; // Reset space pressed flag
            }
        });
        canvas.addEventListener('mousedown', (e) => {
            this.mouseButtons.add(e.button);
            this.updateMousePosition(e, canvas);
        });
        canvas.addEventListener('mouseup', (e) => {
            this.mouseButtons.delete(e.button);
        });
        canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e, canvas);
        });
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    updateMousePosition(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }
    updateMouseWorld(cameraX, cameraY) {
        this.mouseWorldX = this.mouseX + cameraX;
        this.mouseWorldY = this.mouseY + cameraY;
    }
    isKeyPressed(key) {
        return this.keys.has(key.toLowerCase());
    }
    wasKeyJustPressed(key) {
        const pressed = this.keyPresses.has(key.toLowerCase());
        if (pressed) {
            this.keyPresses.delete(key.toLowerCase()); // Consume the press
        }
        return pressed;
    }
    isMouseButtonPressed(button) {
        return this.mouseButtons.has(button);
    }
    getMouseTile(tileSize) {
        return {
            x: Math.floor(this.mouseWorldX / tileSize),
            y: Math.floor(this.mouseWorldY / tileSize)
        };
    }
}
//# sourceMappingURL=input.js.map