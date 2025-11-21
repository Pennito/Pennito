import { DatabaseSync } from '../network/sync.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants.js';
import { isMobile } from '../utils/mobile.js';
export class WorldSelectScreen {
    constructor(canvas, username, onWorldSelected) {
        this.worldName = '';
        this.errorMessage = '';
        this.recentWorlds = [];
        this.worldNameInput = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.username = username;
        this.onWorldSelected = onWorldSelected;
        this.dbSync = DatabaseSync.getInstance();
        this.loadRecentWorlds();
        this.setupInput();
        if (isMobile()) {
            this.createMobileInput();
        }
    }
    createMobileInput() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
        this.worldNameInput = document.createElement('input');
        this.worldNameInput.type = 'text';
        this.worldNameInput.placeholder = 'Enter world name (letters/numbers only)...';
        this.worldNameInput.autocomplete = 'off';
        this.worldNameInput.inputMode = 'text';
        this.worldNameInput.autocapitalize = 'none';
        this.worldNameInput.autocorrect = 'off';
        this.worldNameInput.spellcheck = false;
        this.worldNameInput.maxLength = 8;
        this.worldNameInput.style.cssText = `
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
      opacity: 0;
      pointer-events: auto;
    `;
        this.worldNameInput.addEventListener('input', (e) => {
            const target = e.target;
            const value = target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
            this.worldName = value;
            target.value = value;
        });
        this.worldNameInput.addEventListener('focus', () => {
            this.worldNameInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        this.worldNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        document.body.appendChild(this.worldNameInput);
        // Sync canvas click to focus input
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = CANVAS_WIDTH / 2;
            const centerY = CANVAS_HEIGHT / 2;
            // If clicking on world name input area, focus the hidden input
            if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 100 && y <= centerY - 60) {
                this.worldNameInput?.focus();
            }
        });
    }
    async loadRecentWorlds() {
        // Load recent worlds from database
        const allWorlds = await this.dbSync.getRecentWorlds(10);
        // Randomly select 2 worlds from the list
        if (allWorlds.length > 0) {
            const shuffled = [...allWorlds].sort(() => Math.random() - 0.5);
            this.recentWorlds = shuffled.slice(0, 2);
        }
        else {
            this.recentWorlds = [];
        }
    }
    setupInput() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.submit();
            return;
        }
        if (e.key === 'Backspace') {
            this.worldName = this.worldName.slice(0, -1);
            this.errorMessage = ''; // Clear error when typing
            return;
        }
        // Only allow letters and numbers (no spaces, underscores, hyphens, or special characters)
        // Check if key is a single character and is alphanumeric
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Only allow a-z, A-Z, 0-9 (max 8 characters)
            const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);
            if (isAlphanumeric && this.worldName.length < 8) {
                this.worldName += e.key;
                this.errorMessage = ''; // Clear error when typing valid characters
            }
        }
    }
    async submit() {
        this.errorMessage = '';
        // Remove any invalid characters that might have been entered
        const cleanedName = this.worldName.replace(/[^a-zA-Z0-9]/g, '');
        if (!cleanedName) {
            this.errorMessage = 'World name is required';
            return;
        }
        if (cleanedName.length < 1) {
            this.errorMessage = 'World name is required';
            return;
        }
        if (cleanedName.length > 8) {
            this.errorMessage = 'World name must be 1-8 characters';
            return;
        }
        // Validate that world name contains only letters and numbers (strict check)
        if (!/^[a-zA-Z0-9]+$/.test(cleanedName)) {
            this.errorMessage = 'World name can only contain letters and numbers (no spaces or special characters)';
            return;
        }
        // Update worldName to cleaned version
        this.worldName = cleanedName;
        const dbSync = DatabaseSync.getInstance();
        const world = await dbSync.loadWorld(cleanedName);
        const exists = world !== null;
        this.onWorldSelected(cleanedName, !exists);
    }
    handleClick(x, y) {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        // World name input field
        if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 100 && y <= centerY - 60) {
            // Focus on input (handled by keyboard)
            return;
        }
        // Join/Create button
        if (x >= centerX - 100 && x <= centerX + 100 && y >= centerY + 40 && y <= centerY + 80) {
            this.submit().catch(console.error);
            return;
        }
        // Recent worlds
        const recentStartY = centerY + 120;
        for (let i = 0; i < this.recentWorlds.length; i++) {
            const worldY = recentStartY + i * 40;
            if (x >= centerX - 200 && x <= centerX + 200 && y >= worldY && y <= worldY + 35) {
                this.worldName = this.recentWorlds[i];
                this.submit();
                return;
            }
        }
        // Logout button
        if (x >= 20 && x <= 120 && y >= 20 && y <= 50) {
            // Logout handled by database session
            window.location.reload();
            return;
        }
    }
    render() {
        // Clear canvas with light gradient background (matching login screen)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#E3F2FD');
        gradient.addColorStop(1, '#BBDEFB');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        // Title
        this.ctx.fillStyle = '#3F51B5';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Select World', centerX, centerY - 200);
        // Username display
        this.ctx.fillStyle = '#5C6BC0';
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Logged in as: ${this.username}`, centerX, centerY - 160);
        // World name input - improved styling
        const inputWidth = 450;
        const inputHeight = 50;
        const inputX = centerX - inputWidth / 2;
        const inputY = centerY - 100;
        // Input background with shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(inputX + 3, inputY + 3, inputWidth, inputHeight);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(inputX, inputY, inputWidth, inputHeight);
        // Border with glow
        this.ctx.strokeStyle = '#5C6BC0';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);
        // Inner highlight
        this.ctx.strokeStyle = '#7986CB';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(inputX + 2, inputY + 2, inputWidth - 4, inputHeight - 4);
        // Text with proper clipping
        this.ctx.font = '22px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        const placeholderText = 'Enter world name (1-8 letters/numbers)...';
        const displayText = this.worldName || placeholderText;
        const textColor = this.worldName ? '#212121' : '#9E9E9E';
        // Clip text to fit in box
        const maxTextWidth = inputWidth - 30;
        let finalText = displayText;
        const textMetrics = this.ctx.measureText(finalText);
        if (textMetrics.width > maxTextWidth) {
            // Truncate with ellipsis
            while (this.ctx.measureText(finalText + '...').width > maxTextWidth && finalText.length > 0) {
                finalText = finalText.slice(0, -1);
            }
            finalText += '...';
        }
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(finalText, inputX + 15, inputY + inputHeight / 2);
        // Error message
        if (this.errorMessage) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.errorMessage, centerX, centerY - 20);
        }
        // Join/Create button - improved styling
        const buttonText = this.worldName.trim() ? 'Join/Create World' : 'Enter World Name';
        const buttonWidth = 220;
        const buttonHeight = 45;
        const buttonX = centerX - buttonWidth / 2;
        const buttonY = centerY + 40;
        // Button shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(buttonX + 3, buttonY + 3, buttonWidth, buttonHeight);
        // Button background
        this.ctx.fillStyle = '#5C6BC0';
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        // Button border
        this.ctx.strokeStyle = '#3F51B5';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        // Button text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(buttonText, centerX, buttonY + buttonHeight / 2);
        // Recent worlds
        if (this.recentWorlds.length > 0) {
            this.ctx.fillStyle = '#5C6BC0';
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Recent Worlds:', centerX, centerY + 100);
            const recentStartY = centerY + 120;
            const recentWidth = 420;
            const recentHeight = 40;
            for (let i = 0; i < this.recentWorlds.length; i++) {
                const worldY = recentStartY + i * 45;
                const recentX = centerX - recentWidth / 2;
                // Shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.fillRect(recentX + 2, worldY + 2, recentWidth, recentHeight);
                // Background
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(recentX, worldY, recentWidth, recentHeight);
                // Border
                this.ctx.strokeStyle = '#5C6BC0';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(recentX, worldY, recentWidth, recentHeight);
                // Text
                this.ctx.fillStyle = '#3F51B5';
                this.ctx.font = 'bold 18px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(this.recentWorlds[i], centerX, worldY + recentHeight / 2);
            }
        }
        // Logout button - improved styling
        const logoutWidth = 110;
        const logoutHeight = 35;
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(23, 23, logoutWidth, logoutHeight);
        // Background
        this.ctx.fillStyle = '#E57373';
        this.ctx.fillRect(20, 20, logoutWidth, logoutHeight);
        // Border
        this.ctx.strokeStyle = '#C62828';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(20, 20, logoutWidth, logoutHeight);
        // Text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 15px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Log Out', 20 + logoutWidth / 2, 20 + logoutHeight / 2);
        // Instructions
        this.ctx.fillStyle = '#7986CB';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Enter: Join/Create World', centerX, CANVAS_HEIGHT - 30);
    }
    cleanup() {
        // Remove mobile input if it exists
        if (this.worldNameInput) {
            this.worldNameInput.remove();
            this.worldNameInput = null;
        }
    }
}
//# sourceMappingURL=worldSelect.js.map