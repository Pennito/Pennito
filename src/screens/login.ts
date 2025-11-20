import { StorageManager } from '../utils/storage.js';
import { DatabaseSync } from '../network/sync.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants.js';

export type LoginResult = {
  success: boolean;
  username?: string;
  error?: string;
};

export class LoginScreen {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private username: string = '';
  private password: string = '';
  private isSignUp: boolean = false;
  private errorMessage: string = '';
  private selectedField: 'username' | 'password' | null = 'username';
  private onLoginSuccess: (username: string) => void;
  private connectionStatus: 'idle' | 'connecting' | 'logging_in' | 'loading_world' | 'success' | 'error' = 'idle';
  private ping: number = 0;
  private statusMessage: string = '';
  private statusMessages: string[] = []; // Queue of status messages to show
  private currentStatusIndex: number = 0;
  private statusAnimationTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, onLoginSuccess: (username: string) => void) {
    try {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;
      if (!this.ctx) {
        throw new Error('Could not get 2d context from canvas');
      }
      this.onLoginSuccess = onLoginSuccess;

      // No auto-login - user must login each session (for multiplayer sync)

      this.setupInput();
    } catch (error) {
      console.error('Error initializing LoginScreen:', error);
      throw error;
    }
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
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
      } else {
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
      } else {
        if (this.password.length < 30) {
          this.password += e.key;
        }
      }
    }
  }

  private async submit(): Promise<LoginResult> {
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
      } else {
        const user = await dbSync.loginUser(this.username.trim(), this.password);
        if (user) {
          // User logged in successfully
          this.connectionStatus = 'success';
          this.statusMessage = 'Login successful! Redirecting...';
          await new Promise(resolve => setTimeout(resolve, 600));
          this.onLoginSuccess(user.username);
          return { success: true, username: user.username };
        } else {
          this.errorMessage = 'Invalid username or password';
          this.connectionStatus = 'error';
          this.statusMessage = 'Login failed';
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.connectionStatus = 'idle';
          this.statusMessage = '';
          return { success: false, error: this.errorMessage };
        }
      }
    } catch (error) {
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

  public handleClick(x: number, y: number): void {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Username field
    if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 100 && y <= centerY - 60) {
      this.selectedField = 'username';
      return;
    }

    // Password field
    if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 40 && y <= centerY) {
      this.selectedField = 'password';
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

  public render(): void {
    try {
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

    // Username field
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

    // Password field
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
    this.ctx.fillText(
      this.isSignUp ? 'Already have an account? Click to login' : 'New user? Click to sign up',
      centerX,
      centerY + 180
    );

    // Instructions
    this.ctx.fillStyle = '#757575';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Tab: Switch field | Enter: Submit', centerX, CANVAS_HEIGHT - 30);
    
    } catch (error) {
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
  }

  // Reset function removed - only automatic reset on version updates

  public cleanup(): void {
    // Remove event listeners if needed
  }
}

