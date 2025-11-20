// Mobile detection utility
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window);
}
// Mobile touch controls and virtual keyboard
export class MobileControls {
    constructor(canvas) {
        this.leftButton = null;
        this.rightButton = null;
        this.jumpButton = null;
        this.isLeftPressed = false;
        this.isRightPressed = false;
        this.isJumpPressed = false;
        this.virtualKeyboard = null;
        this.chatInput = null;
        this.isMobile = false;
        this.canvas = canvas;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768 && 'ontouchstart' in window);
        if (this.isMobile) {
            this.createTouchControls();
            this.createVirtualKeyboard();
            this.preventZoom();
        }
    }
    preventZoom() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        // Prevent pinch zoom
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    createTouchControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls';
        controlsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 1000;
      pointer-events: none;
    `;
        // Left/Right movement buttons
        const movementContainer = document.createElement('div');
        movementContainer.style.cssText = `
      display: flex;
      gap: 10px;
      pointer-events: auto;
    `;
        this.leftButton = document.createElement('button');
        this.leftButton.textContent = '←';
        this.leftButton.style.cssText = `
      width: 60px;
      height: 60px;
      font-size: 24px;
      border: 3px solid #fff;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      touch-action: manipulation;
      user-select: none;
    `;
        this.leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isLeftPressed = true;
            this.leftButton.style.background = 'rgba(100, 100, 100, 0.9)';
        });
        this.leftButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isLeftPressed = false;
            this.leftButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        this.leftButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isLeftPressed = false;
            this.leftButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        this.rightButton = document.createElement('button');
        this.rightButton.textContent = '→';
        this.rightButton.style.cssText = `
      width: 60px;
      height: 60px;
      font-size: 24px;
      border: 3px solid #fff;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      touch-action: manipulation;
      user-select: none;
    `;
        this.rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isRightPressed = true;
            this.rightButton.style.background = 'rgba(100, 100, 100, 0.9)';
        });
        this.rightButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isRightPressed = false;
            this.rightButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        this.rightButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isRightPressed = false;
            this.rightButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        movementContainer.appendChild(this.leftButton);
        movementContainer.appendChild(this.rightButton);
        // Jump button
        this.jumpButton = document.createElement('button');
        this.jumpButton.textContent = '↑';
        this.jumpButton.style.cssText = `
      width: 60px;
      height: 60px;
      font-size: 24px;
      border: 3px solid #fff;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      touch-action: manipulation;
      user-select: none;
      pointer-events: auto;
    `;
        this.jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isJumpPressed = true;
            this.jumpButton.style.background = 'rgba(100, 100, 100, 0.9)';
        });
        this.jumpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isJumpPressed = false;
            this.jumpButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        this.jumpButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isJumpPressed = false;
            this.jumpButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        controlsContainer.appendChild(movementContainer);
        controlsContainer.appendChild(this.jumpButton);
        document.body.appendChild(controlsContainer);
    }
    createVirtualKeyboard() {
        this.virtualKeyboard = document.createElement('div');
        this.virtualKeyboard.id = 'virtual-keyboard';
        this.virtualKeyboard.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      padding: 10px;
      display: none;
      z-index: 2000;
    `;
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.placeholder = 'Type message...';
        this.chatInput.style.cssText = `
      width: 100%;
      padding: 15px;
      font-size: 16px;
      border: 2px solid #fff;
      border-radius: 5px;
      background: #000;
      color: #fff;
      font-family: monospace;
    `;
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.style.cssText = `
      width: 100%;
      margin-top: 10px;
      padding: 15px;
      font-size: 16px;
      border: 2px solid #fff;
      border-radius: 5px;
      background: #5C6BC0;
      color: #fff;
      font-family: monospace;
    `;
        this.virtualKeyboard.appendChild(this.chatInput);
        this.virtualKeyboard.appendChild(sendButton);
        document.body.appendChild(this.virtualKeyboard);
    }
    showKeyboard(onSend) {
        if (!this.virtualKeyboard || !this.chatInput)
            return;
        this.virtualKeyboard.style.display = 'block';
        this.chatInput.focus();
        const sendButton = this.virtualKeyboard.querySelector('button');
        if (sendButton) {
            sendButton.onclick = () => {
                const text = this.chatInput.value.trim();
                if (text) {
                    onSend(text);
                    this.chatInput.value = '';
                }
                this.hideKeyboard();
            };
        }
        this.chatInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const text = this.chatInput.value.trim();
                if (text) {
                    onSend(text);
                    this.chatInput.value = '';
                }
                this.hideKeyboard();
            }
            else if (e.key === 'Escape') {
                this.hideKeyboard();
            }
        };
    }
    hideKeyboard() {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.style.display = 'none';
        }
        if (this.chatInput) {
            this.chatInput.value = '';
            this.chatInput.blur();
        }
    }
    isLeftHeld() {
        return this.isLeftPressed;
    }
    isRightHeld() {
        return this.isRightPressed;
    }
    isJumpHeld() {
        return this.isJumpPressed;
    }
    isMobileDevice() {
        return this.isMobile;
    }
    cleanup() {
        const controls = document.getElementById('mobile-controls');
        if (controls)
            controls.remove();
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard)
            keyboard.remove();
    }
}
//# sourceMappingURL=mobile.js.map