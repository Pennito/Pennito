import { DatabaseSync } from '../network/sync.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_VERSION } from '../utils/constants.js';
export class LoginScreen {
    constructor(canvas, onLoginSuccess) {
        this.username = '';
        this.password = '';
        this.isSignUp = false;
        this.errorMessage = '';
        this.selectedField = 'username';
        this.connectionStatus = 'idle';
        this.ping = 0;
        this.statusMessage = '';
        this.statusMessages = []; // Queue of status messages to show
        this.currentStatusIndex = 0;
        this.statusAnimationTimer = 0;
        this.usernameInput = null;
        this.passwordInput = null;
        this.isMobile = false;
        try {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Could not get 2d context from canvas');
            }
            this.onLoginSuccess = onLoginSuccess;
            // Detect mobile - improved iOS detection
            const ua = navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(ua);
            const isAndroid = /android/.test(ua);
            const isMobileDevice = isIOS || isAndroid || /webos|blackberry|iemobile|operamini/.test(ua);
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            this.isMobile = isMobileDevice || (hasTouch && isSmallScreen);
            // Special handling for iOS
            if (isIOS) {
                console.log('[MOBILE] iOS device detected - enabling iOS-specific fixes');
            }
            // No auto-login - user must login each session (for multiplayer sync)
            this.setupInput();
            if (this.isMobile) {
                this.createMobileInputs();
            }
        }
        catch (error) {
            console.error('Error initializing LoginScreen:', error);
            throw error;
        }
    }
    createMobileInputs() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
        // Username input - iOS optimized
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.placeholder = 'Username';
        this.usernameInput.autocomplete = 'username';
        this.usernameInput.inputMode = 'text';
        this.usernameInput.autocapitalize = 'none'; // iOS: prevent auto-capitalization
        this.usernameInput.autocorrect = 'off'; // iOS: disable autocorrect
        this.usernameInput.spellcheck = false; // Disable spellcheck
        this.usernameInput.style.cssText = `
      position: fixed;
      left: ${canvasRect.left + centerX - 200}px;
      top: ${canvasRect.top + centerY - 100}px;
      width: 400px;
      height: ${isIOS ? '44px' : '40px'};
      font-size: 20px;
      font-family: monospace;
      padding: ${isIOS ? '0 12px' : '0 10px'};
      border: 3px solid #5C6BC0;
      border-radius: 0;
      background: #FFFFFF;
      color: #212121;
      z-index: 10000;
      box-sizing: border-box;
      touch-action: manipulation;
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-user-select: text;
      user-select: text;
      font-size: 16px;
      line-height: ${isIOS ? '44px' : '40px'};
    `;
        // iOS-specific: Force focus on tap
        this.usernameInput.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            setTimeout(() => {
                this.usernameInput.focus();
                this.usernameInput.click();
            }, 0);
        }, { passive: true });
        this.usernameInput.addEventListener('input', (e) => {
            const target = e.target;
            // Only allow alphanumeric
            const value = target.value.replace(/[^a-zA-Z0-9]/g, '');
            if (value.length <= 12) {
                this.username = value;
                target.value = value;
            }
            else {
                target.value = this.username;
            }
        });
        this.usernameInput.addEventListener('focus', () => {
            this.selectedField = 'username';
            // iOS: Scroll input into view
            if (isIOS) {
                setTimeout(() => {
                    this.usernameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
        // iOS: Prevent zoom on focus
        this.usernameInput.addEventListener('focus', () => {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport && isIOS) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
        document.body.appendChild(this.usernameInput);
        // Password input - iOS optimized
        this.passwordInput = document.createElement('input');
        this.passwordInput.type = 'password';
        this.passwordInput.placeholder = 'Password';
        this.passwordInput.autocomplete = 'current-password';
        this.passwordInput.inputMode = 'text';
        this.passwordInput.autocapitalize = 'none'; // iOS: prevent auto-capitalization
        this.passwordInput.autocorrect = 'off'; // iOS: disable autocorrect
        this.passwordInput.spellcheck = false; // Disable spellcheck
        this.passwordInput.style.cssText = `
      position: fixed;
      left: ${canvasRect.left + centerX - 200}px;
      top: ${canvasRect.top + centerY - 40}px;
      width: 400px;
      height: ${isIOS ? '44px' : '40px'};
      font-size: 20px;
      font-family: monospace;
      padding: ${isIOS ? '0 12px' : '0 10px'};
      border: 3px solid #9E9E9E;
      border-radius: 0;
      background: #FFFFFF;
      color: #212121;
      z-index: 10000;
      box-sizing: border-box;
      touch-action: manipulation;
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-user-select: text;
      user-select: text;
      font-size: 16px;
      line-height: ${isIOS ? '44px' : '40px'};
    `;
        // iOS-specific: Force focus on tap
        this.passwordInput.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            setTimeout(() => {
                this.passwordInput.focus();
                this.passwordInput.click();
            }, 0);
        }, { passive: true });
        this.passwordInput.addEventListener('input', (e) => {
            const target = e.target;
            if (target.value.length <= 30) {
                this.password = target.value;
            }
            else {
                target.value = this.password;
            }
        });
        this.passwordInput.addEventListener('focus', () => {
            this.selectedField = 'password';
            // iOS: Scroll input into view
            if (isIOS) {
                setTimeout(() => {
                    this.passwordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
        // iOS: Prevent zoom on focus
        this.passwordInput.addEventListener('focus', () => {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport && isIOS) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
        this.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        document.body.appendChild(this.passwordInput);
        // Update input visibility based on selected field
        this.updateMobileInputs();
    }
    updateMobileInputPositions() {
        if (!this.isMobile || !this.usernameInput || !this.passwordInput)
            return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        this.usernameInput.style.left = `${canvasRect.left + centerX - 200}px`;
        this.usernameInput.style.top = `${canvasRect.top + centerY - 100}px`;
        this.passwordInput.style.left = `${canvasRect.left + centerX - 200}px`;
        this.passwordInput.style.top = `${canvasRect.top + centerY - 40}px`;
    }
    updateMobileInputs() {
        if (!this.isMobile || !this.usernameInput || !this.passwordInput)
            return;
        if (this.selectedField === 'username') {
            this.usernameInput.style.border = '3px solid #5C6BC0';
            this.passwordInput.style.border = '2px solid #9E9E9E';
        }
        else if (this.selectedField === 'password') {
            this.usernameInput.style.border = '2px solid #9E9E9E';
            this.passwordInput.style.border = '3px solid #5C6BC0';
        }
        // Sync values
        if (this.usernameInput.value !== this.username) {
            this.usernameInput.value = this.username;
        }
        // Don't sync password for security
    }
    setupInput() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    handleKeyDown(e) {
        // On mobile, let the HTML inputs handle input
        if (this.isMobile) {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.selectedField = this.selectedField === 'username' ? 'password' : 'username';
                if (this.selectedField === 'username' && this.usernameInput) {
                    this.usernameInput.focus();
                }
                else if (this.selectedField === 'password' && this.passwordInput) {
                    this.passwordInput.focus();
                }
                this.updateMobileInputs();
                this.errorMessage = '';
                return;
            }
            // Let HTML inputs handle other keys on mobile
            return;
        }
        // Desktop keyboard handling
        if (e.key === 'Tab') {
            e.preventDefault();
            this.selectedField = this.selectedField === 'username' ? 'password' : 'username';
            this.errorMessage = ''; // Clear error when switching fields
            return;
        }
        if (e.key === 'Enter') {
            this.submit();
            return;
        }
        if (e.key === 'Backspace') {
            if (this.selectedField === 'username') {
                this.username = this.username.slice(0, -1);
            }
            else {
                this.password = this.password.slice(0, -1);
            }
            this.errorMessage = ''; // Clear error when typing
            return;
        }
        // Only allow alphanumeric (no special chars) for username, 3-12 characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            this.errorMessage = ''; // Clear error when typing
            if (this.selectedField === 'username') {
                // Only allow letters and digits, 3-12 characters
                if (this.username.length < 12 && /^[a-zA-Z0-9]+$/.test(e.key)) {
                    this.username += e.key;
                }
            }
            else {
                if (this.password.length < 30) {
                    this.password += e.key;
                }
            }
        }
    }
    async submit() {
        try {
            this.errorMessage = '';
            this.currentStatusIndex = 0;
            this.statusAnimationTimer = 0;
            // Validation checks first (before showing status messages)
            if (!this.username.trim()) {
                this.errorMessage = 'Username is required';
                return { success: false, error: this.errorMessage };
            }
            // Username validation: 3-12 characters, alphanumeric only
            if (this.username.length < 3) {
                this.errorMessage = 'Username must be at least 3 characters';
                return { success: false, error: this.errorMessage };
            }
            if (this.username.length > 12) {
                this.errorMessage = 'Username must be 12 characters or less';
                return { success: false, error: this.errorMessage };
            }
            if (!/^[a-zA-Z0-9]+$/.test(this.username)) {
                this.errorMessage = 'Username can only contain letters and numbers';
                return { success: false, error: this.errorMessage };
            }
            if (!this.password.trim()) {
                this.errorMessage = 'Password is required';
                return { success: false, error: this.errorMessage };
            }
            if (this.password.length < 1) {
                this.errorMessage = 'Password must be at least 1 character';
                return { success: false, error: this.errorMessage };
            }
            // Start Growtopia-style login flow
            this.connectionStatus = 'connecting';
            this.statusMessages = [
                'Connecting to server...',
                'Establishing connection...',
                'Connected!',
                'Authenticating...',
                'Logging in...',
                'Loading player data...',
                'Success!'
            ];
            this.currentStatusIndex = 0;
            this.statusMessage = this.statusMessages[0];
            // Animate through status messages
            for (let i = 0; i < this.statusMessages.length - 1; i++) {
                await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));
                this.currentStatusIndex = i + 1;
                this.statusMessage = this.statusMessages[i + 1];
                // Measure ping during connection phase
                if (i === 2) {
                    const pingStart = Date.now();
                    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
                    this.ping = Date.now() - pingStart;
                    this.statusMessage = `${this.ping} ms away to login`;
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.statusMessage = this.statusMessages[i + 1];
                }
            }
            // Actually perform login/signup
            this.connectionStatus = 'logging_in';
            const dbSync = DatabaseSync.getInstance();
            if (this.isSignUp) {
                const user = await dbSync.createUser(this.username.trim(), this.password);
                if (!user) {
                    this.errorMessage = 'Username already exists';
                    this.connectionStatus = 'error';
                    this.statusMessage = 'Login failed';
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    this.connectionStatus = 'idle';
                    this.statusMessage = '';
                    return { success: false, error: this.errorMessage };
                }
                // User created successfully
                this.connectionStatus = 'success';
                this.statusMessage = 'Account created! Redirecting...';
                await new Promise(resolve => setTimeout(resolve, 600));
                this.onLoginSuccess(user.username);
                return { success: true, username: user.username };
            }
            else {
                const user = await dbSync.loginUser(this.username.trim(), this.password);
                if (user) {
                    // User logged in successfully
                    this.connectionStatus = 'success';
                    this.statusMessage = 'Login successful! Redirecting...';
                    await new Promise(resolve => setTimeout(resolve, 600));
                    this.onLoginSuccess(user.username);
                    return { success: true, username: user.username };
                }
                else {
                    this.errorMessage = 'Invalid username or password';
                    this.connectionStatus = 'error';
                    this.statusMessage = 'Login failed';
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    this.connectionStatus = 'idle';
                    this.statusMessage = '';
                    return { success: false, error: this.errorMessage };
                }
            }
        }
        catch (error) {
            console.error('Error in submit:', error);
            this.errorMessage = 'An error occurred. Please try again.';
            this.connectionStatus = 'error';
            this.statusMessage = 'Connection error';
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.connectionStatus = 'idle';
            this.statusMessage = '';
            return { success: false, error: this.errorMessage };
        }
    }
    handleClick(x, y) {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        // Username field
        if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 100 && y <= centerY - 60) {
            this.selectedField = 'username';
            if (this.isMobile && this.usernameInput) {
                this.usernameInput.focus();
            }
            this.updateMobileInputs();
            return;
        }
        // Password field
        if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 40 && y <= centerY) {
            this.selectedField = 'password';
            if (this.isMobile && this.passwordInput) {
                this.passwordInput.focus();
            }
            this.updateMobileInputs();
            return;
        }
        // Login button
        if (x >= centerX - 100 && x <= centerX + 100 && y >= centerY + 40 && y <= centerY + 80) {
            this.isSignUp = false;
            this.submit().catch(console.error);
            return;
        }
        // Sign up button
        if (x >= centerX - 100 && x <= centerX + 100 && y >= centerY + 100 && y <= centerY + 140) {
            this.isSignUp = true;
            this.submit().catch(console.error);
            return;
        }
        // Toggle sign up/login
        if (x >= centerX - 100 && x <= centerX + 100 && y >= centerY + 160 && y <= centerY + 190) {
            this.isSignUp = !this.isSignUp;
            this.errorMessage = '';
            return;
        }
    }
    render() {
        try {
            // Log version for debugging
            console.log(`[LOGIN-RENDER] Rendering login screen, version: ${GAME_VERSION}`);
            // Update mobile input positions if canvas moved
            if (this.isMobile) {
                this.updateMobileInputPositions();
            }
            // Clear canvas with light gradient background
            const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            gradient.addColorStop(0, '#E3F2FD'); // Very light blue
            gradient.addColorStop(1, '#BBDEFB'); // Soft blue
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            const centerX = CANVAS_WIDTH / 2;
            const centerY = CANVAS_HEIGHT / 2;
            // Title
            this.ctx.fillStyle = '#3F51B5';
            this.ctx.font = 'bold 48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('IPenno', centerX, centerY - 200);
            // Username field (only render on desktop, mobile uses HTML inputs)
            if (!this.isMobile) {
                const isUsernameFocused = this.selectedField === 'username';
                // Background with glow effect when focused
                if (isUsernameFocused) {
                    // Glow effect
                    this.ctx.fillStyle = 'rgba(92, 107, 192, 0.2)';
                    this.ctx.fillRect(centerX - 205, centerY - 105, 410, 50);
                }
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(centerX - 200, centerY - 100, 400, 40);
                // Border with indigo color when focused
                this.ctx.strokeStyle = isUsernameFocused ? '#5C6BC0' : '#9E9E9E';
                this.ctx.lineWidth = isUsernameFocused ? 3 : 2;
                this.ctx.strokeRect(centerX - 200, centerY - 100, 400, 40);
                // Text
                this.ctx.font = '20px monospace';
                this.ctx.textAlign = 'left';
                const usernameText = this.username || 'Username';
                this.ctx.fillStyle = this.username ? '#212121' : '#9E9E9E';
                this.ctx.fillText(usernameText, centerX - 190, centerY - 70);
            }
            // Password field (only render on desktop, mobile uses HTML inputs)
            if (!this.isMobile) {
                const isPasswordFocused = this.selectedField === 'password';
                // Background with glow effect when focused
                if (isPasswordFocused) {
                    // Glow effect
                    this.ctx.fillStyle = 'rgba(92, 107, 192, 0.2)';
                    this.ctx.fillRect(centerX - 205, centerY - 45, 410, 50);
                }
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(centerX - 200, centerY - 40, 400, 40);
                // Border with indigo color when focused
                this.ctx.strokeStyle = isPasswordFocused ? '#5C6BC0' : '#9E9E9E';
                this.ctx.lineWidth = isPasswordFocused ? 3 : 2;
                this.ctx.strokeRect(centerX - 200, centerY - 40, 400, 40);
                // Password text (dots)
                this.ctx.font = '20px monospace';
                this.ctx.textAlign = 'left';
                const passwordText = this.password ? '●'.repeat(this.password.length) : 'Password';
                this.ctx.fillStyle = this.password ? '#212121' : '#9E9E9E';
                this.ctx.fillText(passwordText, centerX - 190, centerY - 10);
            }
            // Connection status message (Growtopia-style) - Show in a chat-like box
            if (this.connectionStatus !== 'idle' && this.statusMessage) {
                // Chat box background
                const chatBoxWidth = 400;
                const chatBoxHeight = 60;
                const chatBoxX = centerX - chatBoxWidth / 2;
                const chatBoxY = centerY - 200;
                // Semi-transparent dark background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight);
                // Border
                this.ctx.strokeStyle = this.connectionStatus === 'success' ? '#66BB6A' :
                    this.connectionStatus === 'error' ? '#EF5350' : '#FFA726';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight);
                // Status text with blinking cursor effect
                const cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
                const displayText = this.statusMessage + (cursorVisible && this.connectionStatus !== 'success' && this.connectionStatus !== 'error' ? '|' : '');
                this.ctx.fillStyle = this.connectionStatus === 'success' ? '#66BB6A' :
                    this.connectionStatus === 'error' ? '#EF5350' : '#FFA726';
                this.ctx.font = 'bold 16px monospace';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(displayText, chatBoxX + 15, chatBoxY + 35);
                // Ping display (if available)
                if (this.ping > 0 && this.connectionStatus === 'connecting') {
                    this.ctx.fillStyle = '#B0BEC5';
                    this.ctx.font = '12px monospace';
                    this.ctx.textAlign = 'right';
                    this.ctx.fillText(`Ping: ${this.ping}ms`, chatBoxX + chatBoxWidth - 15, chatBoxY + chatBoxHeight - 10);
                }
            }
            // Error message
            if (this.errorMessage) {
                this.ctx.fillStyle = '#EF5350';
                this.ctx.font = '16px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.errorMessage, centerX, centerY + (this.connectionStatus !== 'idle' ? 50 : 20));
            }
            // Login button
            this.ctx.fillStyle = '#5C6BC0';
            this.ctx.fillRect(centerX - 100, centerY + 40, 200, 40);
            this.ctx.strokeStyle = '#3F51B5';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(centerX - 100, centerY + 40, 200, 40);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Login', centerX, centerY + 68);
            // Sign up button
            this.ctx.fillStyle = '#66BB6A';
            this.ctx.fillRect(centerX - 100, centerY + 100, 200, 40);
            this.ctx.strokeStyle = '#2E7D32';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(centerX - 100, centerY + 100, 200, 40);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Sign Up', centerX, centerY + 128);
            // Toggle text
            this.ctx.fillStyle = '#616161';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.isSignUp ? 'Already have an account? Click to login' : 'New user? Click to sign up', centerX, centerY + 180);
            // Instructions
            this.ctx.fillStyle = '#757575';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Tab: Switch field | Enter: Submit', centerX, CANVAS_HEIGHT - 50);
        }
        catch (error) {
            console.error('Error rendering login screen:', error);
            // Fallback rendering
            const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            gradient.addColorStop(0, '#E3F2FD');
            gradient.addColorStop(1, '#BBDEFB');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = '#EF5350';
            this.ctx.font = '20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Login Screen Error - Check Console', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
        // Version display (bottom right) - ALWAYS render last, outside try-catch
        const versionText = `v${GAME_VERSION}`;
        console.log(`[LOGIN] Rendering version: ${versionText} at (${CANVAS_WIDTH - 10}, ${CANVAS_HEIGHT - 10})`);
        // Background box for visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 25, 75, 18);
        // Version text
        this.ctx.fillStyle = '#FFFFFF'; // White for visibility
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'alphabetic'; // Use alphabetic instead of bottom
        this.ctx.fillText(versionText, CANVAS_WIDTH - 5, CANVAS_HEIGHT - 8);
    }
    // Reset function removed - only automatic reset on version updates
    cleanup() {
        // Remove mobile input elements
        if (this.usernameInput) {
            this.usernameInput.remove();
            this.usernameInput = null;
        }
        if (this.passwordInput) {
            this.passwordInput.remove();
            this.passwordInput = null;
        }
    }
}
//# sourceMappingURL=login.js.map