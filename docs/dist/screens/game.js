import { World } from '../world.js';
import { Player } from '../player.js';
import { InputManager } from '../input.js';
import { Camera } from '../camera.js';
import { UI } from '../ui.js';
// StorageManager removed - all data in database
import { DatabaseSync } from '../network/sync.js';
import { TileType } from '../utils/types.js';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';
import { DroppedItem } from '../entities/droppedItem.js';
import { ShopUI, SHOP_ITEMS } from '../ui/shopUI.js';
export class GameScreen {
    constructor(canvas, username, worldName, isNew, onExit) {
        this.lastTime = 0;
        this.breakingTile = null;
        this.breakDuration = 500;
        this.isPaused = false;
        this.pauseMenuSelected = 0;
        this.worldSyncTimer = null;
        this.droppedItems = [];
        this.isShopOpen = false;
        this.shopUI = new ShopUI();
        this.spawnY = 0; // Track spawn Y level for build limit
        this.redeemCodeInput = ''; // Code input from player
        this.isEditingSign = false; // Whether sign edit modal is open
        this.editingSignPos = null; // Position of sign being edited
        this.signTextInput = ''; // Text input for sign editing
        this.chatMessages = []; // Chat messages
        this.chatInput = ''; // Current chat input
        this.isChatOpen = false; // Whether chat input is active
        this.lastInventoryClick = null; // For double-click detection
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.username = username;
        this.worldName = worldName;
        this.onExit = onExit;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        this.input = new InputManager(canvas);
        this.camera = new Camera();
        this.ui = new UI(canvas);
        this.dbSync = DatabaseSync.getInstance();
        // Add keyboard listener for shop redeem code input
        window.addEventListener('keydown', (e) => {
            // Capture typing for shop redeem codes
            if (this.isShopOpen) {
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.redeemCodeInput = this.redeemCodeInput.slice(0, -1);
                }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleRedeemCode();
                }
                else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) { // Only letters, not numbers
                    e.preventDefault();
                    if (this.redeemCodeInput.length < 20) {
                        this.redeemCodeInput += e.key.toUpperCase();
                    }
                }
            }
            // Capture typing for sign editing (all characters, max 20)
            if (this.isEditingSign) {
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.signTextInput = this.signTextInput.slice(0, -1);
                }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    // Save and close on Enter
                    if (this.editingSignPos) {
                        this.world.setSignText(this.editingSignPos.x, this.editingSignPos.y, this.signTextInput);
                        this.saveWorld();
                    }
                    this.isEditingSign = false;
                    this.editingSignPos = null;
                    this.signTextInput = '';
                }
                else if (e.key.length === 1) { // All printable characters
                    e.preventDefault();
                    if (this.signTextInput.length < 20) {
                        this.signTextInput += e.key;
                    }
                }
            }
            // Capture typing for chat
            if (this.isChatOpen) {
                // CRITICAL: Stop all propagation to prevent page refresh
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'Backspace') {
                    this.chatInput = this.chatInput.slice(0, -1);
                }
                else if (e.key === 'Enter') {
                    // Send message
                    if (this.chatInput.trim()) {
                        this.addChatMessage(this.player.username, this.chatInput.trim());
                        this.chatInput = '';
                    }
                    this.isChatOpen = false;
                }
                else if (e.key === 'Escape') {
                    this.isChatOpen = false;
                    this.chatInput = '';
                }
                else if (e.key.length === 1) {
                    if (this.chatInput.length < 100) {
                        this.chatInput += e.key;
                    }
                }
            }
            else {
                // Open chat with Enter key (when not in other modals)
                if (e.key === 'Enter' && !this.isShopOpen && !this.isEditingSign && !this.isPaused) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.isChatOpen = true;
                    this.chatInput = '';
                }
            }
        }, true); // Use capture phase
        // Add click event handler for menu button, shop button, and shop modal
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Check shop button (top-left, below gems)
            if (x >= 10 && x <= 110 && y >= 60 && y <= 90) {
                this.isShopOpen = !this.isShopOpen;
                return;
            }
            // Handle shop modal clicks using new ShopUI
            if (this.isShopOpen) {
                // Check if tab clicked
                const clickedTab = this.shopUI.checkTabClick(x, y);
                if (clickedTab) {
                    this.shopUI.setActiveTab(clickedTab);
                    return;
                }
                // Check if buy button clicked
                const invExpansionCost = this.player.getInventoryExpansionCost();
                const clickedItem = this.shopUI.checkBuyClick(x, y, this.player.maxInventorySlots, invExpansionCost);
                if (clickedItem) {
                    // Handle inventory expansion
                    if (clickedItem === 'inventory_expansion') {
                        if (this.player.gems >= invExpansionCost) {
                            if (this.player.expandInventory()) {
                                alert(`✓ Inventory expanded to ${this.player.maxInventorySlots} slots!\n\nNext expansion: ${this.player.getInventoryExpansionCost()} gems`);
                            }
                            else {
                                alert('❌ Inventory is already at maximum size (50 slots)!');
                            }
                        }
                        else {
                            alert(`❌ Not enough gems!\n\nYou need ${invExpansionCost} gems.`);
                        }
                        return;
                    }
                    // Handle regular shop items
                    if (this.player.gems >= clickedItem.price) {
                        this.player.gems -= clickedItem.price;
                        this.player.addToInventory(clickedItem.tileType, 1);
                        if (clickedItem.isEquipment) {
                            alert(`✓ ${clickedItem.name} purchased!\n\nDouble-click in inventory to equip.`);
                        }
                        else {
                            alert(`✓ ${clickedItem.name} purchased!`);
                        }
                    }
                    else {
                        alert(`❌ Not enough gems!\n\nYou need ${clickedItem.price} gems.`);
                    }
                    return;
                }
                // Check if redeem button clicked
                if (this.shopUI.checkRedeemClick(x, y)) {
                    this.handleRedeemCode();
                    return;
                }
                // Check if close button clicked
                if (this.shopUI.checkCloseClick(x, y)) {
                    this.isShopOpen = false;
                    this.redeemCodeInput = '';
                    return;
                }
                return; // Ignore all other clicks when shop is open
            }
            // Handle sign edit modal clicks
            if (this.isEditingSign) {
                const modalX = CANVAS_WIDTH / 2 - 250;
                const modalY = CANVAS_HEIGHT / 2 - 150;
                // Save button
                const saveBtnX = CANVAS_WIDTH / 2 - 120;
                const saveBtnY = modalY + 210;
                if (x >= saveBtnX && x <= saveBtnX + 100 && y >= saveBtnY && y <= saveBtnY + 40) {
                    // Save sign text
                    if (this.editingSignPos) {
                        this.world.setSignText(this.editingSignPos.x, this.editingSignPos.y, this.signTextInput);
                        this.saveWorld();
                    }
                    this.isEditingSign = false;
                    this.editingSignPos = null;
                    this.signTextInput = '';
                    return;
                }
                // Cancel button
                const cancelBtnX = CANVAS_WIDTH / 2 + 20;
                const cancelBtnY = modalY + 210;
                if (x >= cancelBtnX && x <= cancelBtnX + 100 && y >= cancelBtnY && y <= cancelBtnY + 40) {
                    this.isEditingSign = false;
                    this.editingSignPos = null;
                    this.signTextInput = '';
                    return;
                }
                return; // Ignore all other clicks when sign editor is open
            }
            // Check if click is on menu button
            const menuButtonSize = 40;
            if (x >= CANVAS_WIDTH - menuButtonSize - 10 && x <= CANVAS_WIDTH - 10 &&
                y >= 10 && y <= 10 + menuButtonSize) {
                this.isPaused = !this.isPaused;
                if (!this.isPaused) {
                    this.pauseMenuSelected = 0;
                    this.canvas.style.cursor = 'crosshair';
                }
                else {
                    this.canvas.style.cursor = 'pointer';
                }
                return;
            }
            // Check if click is on pause menu options
            if (this.isPaused) {
                const centerX = CANVAS_WIDTH / 2;
                const centerY = CANVAS_HEIGHT / 2;
                const menuWidth = 300;
                const menuHeight = 200;
                const menuX = centerX - menuWidth / 2;
                const menuY = centerY - menuHeight / 2;
                if (x >= menuX && x <= menuX + menuWidth && y >= menuY && y <= menuY + menuHeight) {
                    const options = ['Resume Game', 'Exit World', 'Logout'];
                    const optionHeight = 40;
                    const startY = menuY + 60;
                    for (let i = 0; i < options.length; i++) {
                        const optionY = startY + i * optionHeight;
                        if (y >= optionY && y <= optionY + optionHeight - 10) {
                            this.pauseMenuSelected = i;
                            this.handlePauseMenuAction().catch(console.error);
                            return;
                        }
                    }
                }
            }
        });
        // Add wheel event for shop scrolling
        canvas.addEventListener('wheel', (e) => {
            if (this.isShopOpen) {
                e.preventDefault();
                this.shopUI.scroll(e.deltaY * 0.5); // Smooth scrolling
            }
        });
        // Initialize world and player (async loading happens in loadWorld)
        this.world = new World(WORLD_WIDTH, WORLD_HEIGHT);
        // Spawn player
        const spawnX = WORLD_WIDTH * TILE_SIZE / 2;
        this.player = new Player(spawnX, 0, username);
        // Load world asynchronously
        this.loadWorld(worldName, isNew).then(() => {
            // SPAWN AT DOOR LOCATION: Use world's spawn door coordinates
            const doorX = this.world.spawnX;
            const doorY = this.world.spawnY;
            // Player spawns at the door position
            this.player.x = doorX * TILE_SIZE;
            this.player.y = doorY * TILE_SIZE; // At door level
            // Store spawn Y for build limit (30 blocks above spawn)
            this.spawnY = doorY;
            // Reset physics state - start in mid-air, gravity will take over
            this.player.onGround = false;
            this.player.velocityY = 0;
            this.player.velocityX = 0;
            // IMPORTANT: Ensure game is NOT paused
            this.isPaused = false;
            // DEBUG: Log spawn details
            console.log(`[SPAWN] 🚪 Spawned at DOOR location (${doorX}, ${doorY})`);
            console.log(`[SPAWN] Player pixel position: (${this.player.x}, ${this.player.y})`);
            console.log(`[SPAWN] Physics reset: onGround=${this.player.onGround}, velocityY=${this.player.velocityY}`);
            console.log(`[SPAWN] Game paused: ${this.isPaused}`);
            // Set camera
            this.camera.setPosition(this.player.x, this.player.y);
        });
        // Initial camera position before world loads
        this.camera.setPosition(this.player.x, this.player.y);
        this.lastTime = performance.now();
    }
    async loadWorld(worldName, isNew) {
        if (isNew) {
            this.world = new World(WORLD_WIDTH, WORLD_HEIGHT);
            const worldData = this.world.getWorldData();
            await this.dbSync.createWorld(worldName, worldData);
            this.saveWorld();
        }
        else {
            // Try database first, then localStorage fallback
            const dbWorld = await this.dbSync.loadWorld(worldName);
            if (dbWorld && dbWorld.data) {
                this.world = new World(dbWorld.data.width || WORLD_WIDTH, dbWorld.data.height || WORLD_HEIGHT, dbWorld.data.seed);
                this.world.loadWorldData(dbWorld.data);
                // Debug: Log owner after loading
                const loadedOwner = this.world.getOwner();
                console.log(`[WORLD-LOAD] World "${worldName}" loaded. Owner: ${loadedOwner || 'none'}`);
            }
            else {
                // No world found in database - create new one
                this.world = new World(WORLD_WIDTH, WORLD_HEIGHT);
                this.saveWorld();
            }
        }
    }
    saveWorld() {
        const worldData = this.world.getWorldData();
        // Sync to database (debounced - every 3 seconds) - no localStorage needed
        this.dbSync.scheduleWorldSync(this.worldName, worldData);
    }
    update(deltaTime) {
        // Handle keyboard input for shop redeem code ONLY when shop is open
        // (Note: This is handled via event listener in constructor now, not here)
        // Handle pause menu
        if (this.input.wasKeyJustPressed('escape')) {
            this.isPaused = !this.isPaused;
            console.log('[GAME] Pause toggled:', this.isPaused);
            if (!this.isPaused) {
                this.pauseMenuSelected = 0;
                this.canvas.style.cursor = 'crosshair';
            }
            else {
                this.canvas.style.cursor = 'pointer';
            }
            return;
        }
        // If paused, only handle menu navigation - physics are paused
        if (this.isPaused) {
            this.updatePauseMenu();
            // Show cursor when paused
            this.canvas.style.cursor = 'pointer';
            return;
        }
        // If shop, sign editor, or chat is open, pause game and ignore all input
        if (this.isShopOpen || this.isEditingSign || this.isChatOpen) {
            this.canvas.style.cursor = 'pointer';
            return; // Don't process any game input
        }
        // Show cursor when playing (for block interaction)
        this.canvas.style.cursor = 'crosshair';
        // Ensure deltaTime is valid (minimum 1ms to prevent division issues)
        const validDeltaTime = Math.max(deltaTime, 1);
        // Inventory slot selection
        for (let i = 1; i <= 8; i++) {
            if (this.input.isKeyPressed(i.toString())) {
                this.player.selectedSlot = i - 1;
            }
        }
        // Player movement - check for key presses
        const moveLeft = this.input.isKeyPressed('a') || this.input.isKeyPressed('arrowleft');
        const moveRight = this.input.isKeyPressed('d') || this.input.isKeyPressed('arrowright');
        // jumpHeld is the current space key state (held / not held)
        const jumpHeld = this.input.isKeyPressed(' ');
        // DEBUG: Log input state every 60 frames
        if (Math.random() < 0.016) { // ~1 per second
            console.log('[INPUT] moveLeft:', moveLeft, 'moveRight:', moveRight, 'jump:', jumpHeld);
            console.log('[PLAYER] pos:', this.player.x.toFixed(1), this.player.y.toFixed(1), 'vel:', this.player.velocityX.toFixed(2), this.player.velocityY.toFixed(2), 'onGround:', this.player.onGround);
        }
        // Update player with movement
        this.player.update(this.world, moveLeft, moveRight, jumpHeld);
        // Camera follow
        this.camera.follow(this.player.x, this.player.y, this.player.width, this.player.height);
        // Update mouse world position
        this.input.updateMouseWorld(this.camera.x, this.camera.y);
        // Check for item pickup
        this.droppedItems = this.droppedItems.filter(item => {
            if (item.shouldPickup(this.player.x, this.player.y, this.player.width, this.player.height)) {
                if (item.tileType === TileType.GEM) {
                    // Gems add to player's gem count, not inventory
                    this.player.gems = Math.min(this.player.gems + item.gemValue, 1000000000);
                    console.log(`[GEM] Picked up ${item.gemValue} gem(s)! Total: ${this.player.gems}`);
                }
                else {
                    // Regular items go to inventory
                    this.player.addToInventory(item.tileType, 1);
                }
                return false; // remove
            }
            return true;
        });
        // Handle mouse clicks (check UI first, then world)
        // Check if mouse button was just pressed (not held)
        if (this.input.isMouseButtonPressed(0) || this.input.isMouseButtonPressed(2)) {
            // Check if click is on inventory or UI
            if (this.isClickOnUI(this.input.mouseX, this.input.mouseY)) {
                // Handle UI clicks (inventory, menu button)
                this.handleUIClick(this.input.mouseX, this.input.mouseY);
                // Don't return here - let block interaction happen if not clicking UI
            }
        }
        // Block interaction (only if not clicking UI)
        // Skip block interaction if clicking on UI
        if (this.isClickOnUI(this.input.mouseX, this.input.mouseY)) {
            return;
        }
        const mouseTile = this.input.getMouseTile(TILE_SIZE);
        const selectedItem = this.player.getSelectedItem();
        // Left click - break block (only if holding punch), edit sign (if holding wrench), or place block (if holding other item)
        if (this.input.isMouseButtonPressed(0)) {
            if (selectedItem && selectedItem.tileType === TileType.WRENCH) {
                // Wrench - edit signs (only if owner or world is unowned)
                const worldOwner = this.world.getOwner();
                if (worldOwner && worldOwner !== this.player.username) {
                    console.log('[WRENCH] ❌ Cannot edit signs - world owned by:', worldOwner);
                    return;
                }
                const tile = this.world.getTile(mouseTile.x, mouseTile.y);
                if (tile && tile.type === TileType.SIGN) {
                    // Open sign edit modal
                    this.isEditingSign = true;
                    this.editingSignPos = { x: mouseTile.x, y: mouseTile.y };
                    this.signTextInput = tile.signText || '';
                }
            }
            else if (selectedItem && selectedItem.tileType === TileType.PUNCH) {
                // Only break blocks when holding punch
                const tile = this.world.getTile(mouseTile.x, mouseTile.y);
                if (tile && tile.type !== TileType.AIR) {
                    // Check if world is owned by someone else
                    const worldOwner = this.world.getOwner();
                    if (worldOwner && worldOwner !== this.player.username) {
                        // World is owned by someone else - cannot break blocks (unless it's the gold lock)
                        if (tile.type !== TileType.GOLD_LOCK) {
                            console.log('[OWNERSHIP] Cannot break blocks - world owned by:', worldOwner);
                            this.breakingTile = null;
                            return;
                        }
                        // Allow breaking the gold lock to remove ownership and claim the world
                        console.log('[OWNERSHIP] Breaking gold lock to remove ownership');
                    }
                    if (!this.breakingTile ||
                        this.breakingTile.x !== mouseTile.x ||
                        this.breakingTile.y !== mouseTile.y) {
                        this.breakingTile = { x: mouseTile.x, y: mouseTile.y, startTime: Date.now() };
                    }
                    const breakTime = Date.now() - this.breakingTile.startTime;
                    if (breakTime >= this.breakDuration) {
                        // Save the tile type before breaking it
                        const brokenTileType = tile.type;
                        const broken = this.world.damageTile(mouseTile.x, mouseTile.y, tile.maxHealth);
                        if (broken) {
                            // If gold lock was broken, remove world ownership
                            if (brokenTileType === TileType.GOLD_LOCK) {
                                this.world.setOwner(null);
                                console.log('[OWNERSHIP] Gold lock broken, world is now unowned');
                                // Immediately sync to save ownership change
                                const worldData = this.world.getWorldData();
                                this.dbSync.syncWorldImmediately(this.worldName, worldData);
                            }
                            // Drop block item at the broken block location
                            const dropX = mouseTile.x * TILE_SIZE;
                            const dropY = mouseTile.y * TILE_SIZE;
                            this.droppedItems.push(new DroppedItem(dropX, dropY, brokenTileType));
                            // Drop 1-5 gems randomly when breaking any block
                            const gemCount = Math.floor(Math.random() * 5) + 1; // 1-5 gems
                            const gemX = dropX + (Math.random() - 0.5) * 20; // Slight random offset
                            const gemY = dropY + (Math.random() - 0.5) * 20;
                            this.droppedItems.push(new DroppedItem(gemX, gemY, TileType.GEM, gemCount));
                            this.breakingTile = null;
                            this.saveWorld();
                        }
                    }
                }
            }
            else if (selectedItem && selectedItem.tileType !== TileType.AIR && selectedItem.tileType !== TileType.PUNCH && selectedItem.tileType !== TileType.WRENCH && selectedItem.count > 0) {
                console.log(`[PLACE-DEBUG] Attempting placement with ${TileType[selectedItem.tileType]}, count: ${selectedItem.count}`);
                // Check if world is owned and player is not the owner
                const worldOwner = this.world.getOwner();
                if (worldOwner && worldOwner !== this.player.username) {
                    console.log('[PLACE-DEBUG] Blocked: world owned by another player');
                    return;
                }
                // Check build height limit (30 blocks above spawn)
                const buildLimit = this.spawnY - 30; // Negative Y = higher up
                if (mouseTile.y < buildLimit) {
                    console.log(`[PLACE-DEBUG] Blocked: too high (y=${mouseTile.y}, limit=${buildLimit})`);
                    return;
                }
                // Check if item is equipment (non-placeable)
                const isEquipment = SHOP_ITEMS.find(item => item.tileType === selectedItem.tileType)?.isEquipment;
                if (isEquipment) {
                    console.log('[PLACE] ❌ Cannot place equipment items! Double-click to equip.');
                    return;
                }
                // Place block with left click if holding a block item
                const tile = this.world.getTile(mouseTile.x, mouseTile.y);
                console.log(`[PLACE-DEBUG] Target tile at (${mouseTile.x}, ${mouseTile.y}) is ${tile ? TileType[tile.type] : 'null'}`);
                if (tile && tile.type === TileType.AIR) {
                    // Check if tile is within 3x3 range of player
                    const playerCenterX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
                    const playerCenterY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
                    const distanceX = Math.abs(mouseTile.x - playerCenterX);
                    const distanceY = Math.abs(mouseTile.y - playerCenterY);
                    const inRange = distanceX <= 1 && distanceY <= 1;
                    if (!inRange) {
                        console.log(`[PLACE] Out of range: distance (${distanceX}, ${distanceY}) from player center (${playerCenterX}, ${playerCenterY})`);
                        return;
                    }
                    // Check if placement is inside player hitbox (pixel-based collision)
                    const tileX = mouseTile.x * TILE_SIZE;
                    const tileY = mouseTile.y * TILE_SIZE;
                    const tileRight = tileX + TILE_SIZE;
                    const tileBottom = tileY + TILE_SIZE;
                    const playerRight = this.player.x + this.player.width;
                    const playerBottom = this.player.y + this.player.height;
                    // Check if tile overlaps with player (AABB collision)
                    const overlapsPlayer = !(tileRight <= this.player.x ||
                        tileX >= playerRight ||
                        tileBottom <= this.player.y ||
                        tileY >= playerBottom);
                    console.log(`[PLACE] Tile: (${mouseTile.x}, ${mouseTile.y}) at pixels (${tileX}, ${tileY}), Player: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}), Overlaps: ${overlapsPlayer}`);
                    if (!overlapsPlayer) {
                        console.log(`[PLACE] Attempting to place ${TileType[selectedItem.tileType]} at (${mouseTile.x}, ${mouseTile.y})`);
                        // Place block first
                        this.world.setTile(mouseTile.x, mouseTile.y, selectedItem.tileType);
                        // Verify it was actually placed by checking the tile
                        const placedTile = this.world.getTile(mouseTile.x, mouseTile.y);
                        if (placedTile && placedTile.type === selectedItem.tileType) {
                            // Block was successfully placed, now remove from inventory
                            this.player.useFromInventory(selectedItem.tileType);
                            // If gold lock was placed, set world ownership
                            if (selectedItem.tileType === TileType.GOLD_LOCK) {
                                this.world.setOwner(this.player.username);
                                console.log('[OWNERSHIP] ✅ World owned by:', this.player.username);
                                // Immediately sync world to save owner (don't wait for debounce)
                                const worldData = this.world.getWorldData();
                                this.dbSync.syncWorldImmediately(this.worldName, worldData);
                            }
                            console.log(`[PLACE] ✅ Successfully placed ${TileType[selectedItem.tileType]}`);
                            this.saveWorld();
                        }
                        else {
                            console.log('[PLACE] ❌ Failed to place - tile not set');
                        }
                    }
                    else {
                        console.log('[PLACE] ❌ Blocked: overlaps player hitbox');
                    }
                }
                else {
                    console.log('[PLACE-DEBUG] ❌ Target tile is not AIR or is null');
                }
            }
        }
        else {
            this.breakingTile = null;
        }
        // Right click - also place block (alternative to left click)
        if (this.input.isMouseButtonPressed(2)) {
            if (selectedItem && selectedItem.tileType !== TileType.AIR && selectedItem.tileType !== TileType.PUNCH && selectedItem.count > 0) {
                // Check if item is equipment (non-placeable)
                const isEquipment = SHOP_ITEMS.find(item => item.tileType === selectedItem.tileType)?.isEquipment;
                if (isEquipment) {
                    console.log('[PLACE] ❌ Cannot place equipment items! Double-click to equip.');
                    return;
                }
                // Check if world is owned and player is not the owner
                const worldOwner = this.world.getOwner();
                if (worldOwner && worldOwner !== this.player.username) {
                    return;
                }
                // Check build height limit
                const buildLimit = this.spawnY - 30;
                if (mouseTile.y < buildLimit) {
                    return;
                }
                const tile = this.world.getTile(mouseTile.x, mouseTile.y);
                if (tile && tile.type === TileType.AIR) {
                    // Check if tile is within 3x3 range of player
                    const playerCenterX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
                    const playerCenterY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
                    const distanceX = Math.abs(mouseTile.x - playerCenterX);
                    const distanceY = Math.abs(mouseTile.y - playerCenterY);
                    const inRange = distanceX <= 1 && distanceY <= 1;
                    if (!inRange) {
                        console.log(`[PLACE-RIGHT] Out of range`);
                        return;
                    }
                    // Check if placement is inside player hitbox (pixel-based collision)
                    const tileX = mouseTile.x * TILE_SIZE;
                    const tileY = mouseTile.y * TILE_SIZE;
                    const tileRight = tileX + TILE_SIZE;
                    const tileBottom = tileY + TILE_SIZE;
                    const playerRight = this.player.x + this.player.width;
                    const playerBottom = this.player.y + this.player.height;
                    // Check if tile overlaps with player (AABB collision)
                    const overlapsPlayer = !(tileRight <= this.player.x ||
                        tileX >= playerRight ||
                        tileBottom <= this.player.y ||
                        tileY >= playerBottom);
                    if (!overlapsPlayer) {
                        console.log(`[PLACE-RIGHT] Attempting to place ${TileType[selectedItem.tileType]}`);
                        // Place block first
                        this.world.setTile(mouseTile.x, mouseTile.y, selectedItem.tileType);
                        // Verify it was actually placed by checking the tile
                        const placedTile = this.world.getTile(mouseTile.x, mouseTile.y);
                        if (placedTile && placedTile.type === selectedItem.tileType) {
                            // Block was successfully placed, now remove from inventory
                            this.player.useFromInventory(selectedItem.tileType);
                            // If gold lock was placed, set world ownership
                            if (selectedItem.tileType === TileType.GOLD_LOCK) {
                                this.world.setOwner(this.player.username);
                                console.log('[OWNERSHIP] ✅ World owned by:', this.player.username);
                                // Immediately sync world to save owner (don't wait for debounce)
                                const worldData = this.world.getWorldData();
                                this.dbSync.syncWorldImmediately(this.worldName, worldData);
                            }
                            console.log(`[PLACE-RIGHT] ✅ Successfully placed`);
                            this.saveWorld();
                        }
                        else {
                            console.log('[PLACE-RIGHT] ❌ Failed to place - tile not set');
                        }
                    }
                }
            }
        }
    }
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Render sky background (always bright)
        this.ui.renderSky();
        // Render world and entities
        this.world.render(this.ctx, this.camera.x, this.camera.y, CANVAS_WIDTH, CANVAS_HEIGHT, this.player.x, this.player.y, this.player.width, this.player.height);
        // Render dropped items before the player so items appear behind character
        for (const item of this.droppedItems) {
            item.render(this.ctx, this.camera.x, this.camera.y);
        }
        // Render player last (in front) - username now rendered inside player.render()
        const worldOwner = this.world.getOwner();
        this.player.render(this.ctx, this.camera.x, this.camera.y, worldOwner);
        // Render most recent chat message above player for 5 seconds (like sign text)
        if (this.chatMessages.length > 0) {
            const lastMessage = this.chatMessages[this.chatMessages.length - 1];
            const messageAge = Date.now() - lastMessage.timestamp;
            const displayDuration = 5000; // 5 seconds
            if (messageAge < displayDuration && lastMessage.username === this.player.username) {
                const screenX = this.player.x - this.camera.x + this.player.width / 2;
                const screenY = this.player.y - this.camera.y - 25; // Above username
                // Fade out effect
                const alpha = 1 - (messageAge / displayDuration);
                // Text background
                const textWidth = this.ctx.measureText(lastMessage.text).width + 10;
                this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
                this.ctx.fillRect(screenX - textWidth / 2, screenY - 15, textWidth, 18);
                // Message text
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.font = '12px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(lastMessage.text, screenX, screenY - 13);
            }
        }
        // Update inventory animation (for smooth expand/collapse)
        this.ui.updateInventoryAnimation();
        // Render inventory
        const expansionCost = this.player.getInventoryExpansionCost();
        this.ui.renderInventory(this.player.inventory, this.player.selectedSlot, this.player.maxInventorySlots, this.player.gems, expansionCost);
        // Render HUD
        this.ui.renderHUD();
        // DEBUG: Draw test rectangle to verify rendering
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(200, 10, 50, 50);
        // Render all UI overlays LAST (on top of everything)
        // Gems counter (top-left corner)
        this.renderGems();
        // Shop button (top-left, below gems)
        this.renderShopButton();
        // Menu button (top-right corner)
        this.renderMenuButton();
        // Render shop modal if open
        if (this.isShopOpen) {
            this.renderShop();
        }
        // Render sign edit modal if open
        if (this.isEditingSign) {
            this.renderSignEditModal();
        }
        // Render pause menu if open
        if (this.isPaused) {
            this.renderPauseMenu();
        }
        // Render chat messages and input
        this.renderChat();
        // Render 3x3 placement range highlight (only when holding a placeable item - NOT equipment)
        const selectedItem = this.player.getSelectedItem();
        if (selectedItem && selectedItem.tileType !== TileType.AIR &&
            selectedItem.tileType !== TileType.PUNCH && selectedItem.tileType !== TileType.WRENCH &&
            selectedItem.count > 0) {
            // Check if item is equipment (non-placeable)
            const isEquipment = SHOP_ITEMS.find(item => item.tileType === selectedItem.tileType)?.isEquipment;
            if (!isEquipment) {
                // Calculate player's center tile
                const playerCenterX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
                const playerCenterY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
                // Draw 3x3 grid around player
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const tileX = playerCenterX + dx;
                        const tileY = playerCenterY + dy;
                        // Check if tile is in world bounds
                        if (tileX >= 0 && tileX < this.world.width && tileY >= 0 && tileY < this.world.height) {
                            const screenX = tileX * TILE_SIZE - this.camera.x;
                            const screenY = tileY * TILE_SIZE - this.camera.y;
                            // White outline for placeable tiles
                            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                            this.ctx.lineWidth = 2;
                            this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        }
        // Render breaking progress
        if (this.breakingTile) {
            const tile = this.world.getTile(this.breakingTile.x, this.breakingTile.y);
            if (tile && tile.type !== TileType.AIR) {
                const breakTime = Date.now() - this.breakingTile.startTime;
                const progress = Math.min(breakTime / this.breakDuration, 1);
                const screenX = this.breakingTile.x * TILE_SIZE - this.camera.x;
                const screenY = this.breakingTile.y * TILE_SIZE - this.camera.y;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fillRect(screenX, screenY - 8, TILE_SIZE, 4);
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(screenX, screenY - 8, TILE_SIZE * progress, 4);
            }
        }
    }
    renderUsername() {
        const screenX = this.player.x - this.camera.x + this.player.width / 2;
        const screenY = this.player.y - this.camera.y - 10;
        // If player is world owner, username is green, otherwise white
        const worldOwner = this.world.getOwner();
        const isOwner = worldOwner === this.player.username;
        // Debug log
        if (worldOwner) {
            console.log(`[OWNERSHIP] World owner: ${worldOwner}, Player: ${this.player.username}, Is owner: ${isOwner}`);
        }
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.username, screenX + 1, screenY + 1);
        // Username text (green if owner, white otherwise)
        this.ctx.fillStyle = isOwner ? '#00FF00' : '#FFFFFF';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.username, screenX, screenY);
    }
    isClickOnUI(x, y) {
        // Check if click is on inventory bar
        const inventoryY = CANVAS_HEIGHT - 80;
        const slotWidth = 60;
        const startX = (CANVAS_WIDTH - (8 * slotWidth)) / 2;
        if (y >= inventoryY && y <= inventoryY + 60) {
            if (x >= startX && x <= startX + (8 * slotWidth)) {
                return true;
            }
        }
        // Check if click is on menu button (top-right)
        const menuButtonSize = 40;
        if (x >= CANVAS_WIDTH - menuButtonSize - 10 && x <= CANVAS_WIDTH - 10 &&
            y >= 10 && y <= 10 + menuButtonSize) {
            return true;
        }
        // Check if pause menu is open
        if (this.isPaused) {
            return true;
        }
        return false;
    }
    handleUIClick(x, y) {
        // Handle menu button click
        const menuButtonSize = 40;
        if (x >= CANVAS_WIDTH - menuButtonSize - 10 && x <= CANVAS_WIDTH - 10 &&
            y >= 10 && y <= 10 + menuButtonSize) {
            this.isPaused = !this.isPaused;
            if (!this.isPaused) {
                this.pauseMenuSelected = 0;
                this.canvas.style.cursor = 'crosshair';
            }
            else {
                this.canvas.style.cursor = 'pointer';
            }
            return;
        }
        // Handle pause menu clicks (mouse interaction)
        if (this.isPaused) {
            const centerX = CANVAS_WIDTH / 2;
            const centerY = CANVAS_HEIGHT / 2;
            const menuWidth = 300;
            const menuHeight = 200;
            const menuX = centerX - menuWidth / 2;
            const menuY = centerY - menuHeight / 2;
            if (x >= menuX && x <= menuX + menuWidth && y >= menuY && y <= menuY + menuHeight) {
                const options = ['Resume Game', 'Exit World', 'Logout'];
                const optionHeight = 40;
                const startY = menuY + 60;
                for (let i = 0; i < options.length; i++) {
                    const optionY = startY + i * optionHeight;
                    if (y >= optionY && y <= optionY + optionHeight - 10) {
                        this.pauseMenuSelected = i;
                        // Handle click on menu option
                        this.handlePauseMenuAction().catch(console.error);
                        return;
                    }
                }
            }
        }
        // Inventory expansion moved to shop menu - no click handling here
        // Handle inventory slot clicks - clicking selects the item, double-clicking equips equipment
        const inventoryY = CANVAS_HEIGHT - 80;
        const slotWidth = 60;
        const slotsPerRow = 8;
        const startX = (CANVAS_WIDTH - (slotsPerRow * slotWidth)) / 2;
        const baseY = CANVAS_HEIGHT - 80;
        const expandedHeight = Math.ceil(this.player.maxInventorySlots / slotsPerRow) * 60;
        const expansion = this.ui.isInventoryExpanded() ? 1 : 0;
        const currentY = baseY - (expansion * expandedHeight);
        // Check if click is in inventory area
        const maxRows = Math.ceil(this.player.maxInventorySlots / slotsPerRow);
        const visibleRows = Math.max(1, Math.ceil(1 + expansion * (maxRows - 1)));
        const totalHeight = (visibleRows * 60) + 20;
        if (y >= currentY && y <= currentY + totalHeight) {
            const row = Math.floor((y - currentY) / 60);
            const col = Math.floor((x - startX) / slotWidth);
            if (col >= 0 && col < slotsPerRow && row >= 0 && row < visibleRows) {
                const slotIndex = row * slotsPerRow + col;
                if (slotIndex >= 0 && slotIndex < this.player.maxInventorySlots) {
                    const now = Date.now();
                    const item = this.player.inventory[slotIndex];
                    // Check for double-click (within 300ms of last click on same slot)
                    const isDoubleClick = this.lastInventoryClick &&
                        this.lastInventoryClick.slot === slotIndex &&
                        now - this.lastInventoryClick.time < 300;
                    if (isDoubleClick && item && item.count > 0) {
                        // Double-click detected! Try to equip/unequip
                        const shopItem = SHOP_ITEMS.find(i => i.tileType === item.tileType);
                        if (shopItem?.isEquipment) {
                            // Toggle equip/unequip based on item type
                            if (item.tileType === TileType.SUPER_STARS) {
                                if (this.player.equippedShoes === TileType.SUPER_STARS) {
                                    this.player.equippedShoes = null;
                                    console.log('[EQUIP] Unequipped Super Stars');
                                }
                                else {
                                    this.player.equippedShoes = TileType.SUPER_STARS;
                                    console.log('[EQUIP] Equipped Super Stars - Speed boost active!');
                                }
                            }
                            else if (item.tileType === TileType.FEDORA) {
                                if (this.player.equippedHat === TileType.FEDORA) {
                                    this.player.equippedHat = null;
                                    console.log('[EQUIP] Unequipped Fedora');
                                }
                                else {
                                    this.player.equippedHat = TileType.FEDORA;
                                    console.log('[EQUIP] Equipped Fedora - Looking stylish!');
                                }
                            }
                            else if (item.tileType === TileType.SUIT_PANTS) {
                                if (this.player.equippedPants === TileType.SUIT_PANTS) {
                                    this.player.equippedPants = null;
                                    console.log('[EQUIP] Unequipped Suit Pants');
                                }
                                else {
                                    this.player.equippedPants = TileType.SUIT_PANTS;
                                    console.log('[EQUIP] Equipped Suit Pants');
                                }
                            }
                            else if (item.tileType === TileType.SUIT_SHIRT) {
                                if (this.player.equippedShirt === TileType.SUIT_SHIRT) {
                                    this.player.equippedShirt = null;
                                    console.log('[EQUIP] Unequipped Suit Shirt');
                                }
                                else {
                                    this.player.equippedShirt = TileType.SUIT_SHIRT;
                                    console.log('[EQUIP] Equipped Suit Shirt');
                                }
                            }
                            else if (item.tileType === TileType.RAINBOW_WINGS) {
                                if (this.player.equippedWings === TileType.RAINBOW_WINGS) {
                                    this.player.equippedWings = null;
                                    console.log('[EQUIP] Unequipped Rainbow Wings');
                                }
                                else {
                                    this.player.equippedWings = TileType.RAINBOW_WINGS;
                                    console.log('[EQUIP] Equipped Rainbow Wings - Double jump enabled!');
                                }
                            }
                            // Reset click tracking after successful equip
                            this.lastInventoryClick = null;
                            return; // Don't select slot on double-click
                        }
                    }
                    // Single click - select the slot
                    this.player.selectedSlot = slotIndex;
                    // Update last click time for double-click detection
                    this.lastInventoryClick = { slot: slotIndex, time: now };
                }
            }
        }
    }
    updatePauseMenu() {
        const options = ['Resume Game', 'Exit World', 'Logout'];
        if (this.input.isKeyPressed('arrowdown') || this.input.isKeyPressed('s')) {
            this.pauseMenuSelected = (this.pauseMenuSelected + 1) % options.length;
        }
        if (this.input.isKeyPressed('arrowup') || this.input.isKeyPressed('w')) {
            this.pauseMenuSelected = (this.pauseMenuSelected - 1 + options.length) % options.length;
        }
        if (this.input.isKeyPressed('enter') || this.input.isKeyPressed(' ')) {
            this.handlePauseMenuAction().catch(console.error);
        }
    }
    async handlePauseMenuAction() {
        const options = ['Resume Game', 'Exit World', 'Logout'];
        if (options[this.pauseMenuSelected] === 'Resume Game') {
            this.isPaused = false;
            this.pauseMenuSelected = 0;
            this.canvas.style.cursor = 'none';
        }
        else if (options[this.pauseMenuSelected] === 'Exit World') {
            await this.cleanup();
            this.onExit();
        }
        else if (options[this.pauseMenuSelected] === 'Logout') {
            await this.cleanup();
            // Logout handled by database session - no localStorage needed
            window.location.reload();
        }
    }
    renderPauseMenu() {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const menuWidth = 300;
        const menuHeight = 200;
        const menuX = centerX - menuWidth / 2;
        const menuY = centerY - menuHeight / 2;
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Menu box
        this.ctx.fillStyle = '#2a2a3e';
        this.ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
        // Title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Menu', centerX, menuY + 30);
        // Options
        const options = ['Resume Game', 'Exit World', 'Logout'];
        const optionHeight = 40;
        const startY = menuY + 60;
        for (let i = 0; i < options.length; i++) {
            const y = startY + i * optionHeight;
            // Check if mouse is hovering over this option
            const isHovered = (this.input.mouseX >= menuX + 20 && this.input.mouseX <= menuX + menuWidth - 20 &&
                this.input.mouseY >= y - 5 && this.input.mouseY <= y + optionHeight - 15);
            if (i === this.pauseMenuSelected || isHovered) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(menuX + 20, y - 5, menuWidth - 40, optionHeight - 10);
            }
            this.ctx.fillStyle = (i === this.pauseMenuSelected || isHovered) ? '#000' : '#fff';
            this.ctx.font = '18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(options[i], centerX, y + 20);
        }
    }
    renderMenuButton() {
        const menuButtonSize = 40;
        const x = CANVAS_WIDTH - menuButtonSize - 10;
        const y = 10;
        // Button background
        this.ctx.fillStyle = '#4a4a6e';
        this.ctx.fillRect(x, y, menuButtonSize, menuButtonSize);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, menuButtonSize, menuButtonSize);
        // Menu icon (⚙️ or "Menu")
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚙', x + menuButtonSize / 2, y + menuButtonSize / 2 + 7);
    }
    renderGems() {
        // Save context state
        this.ctx.save();
        // Background box for visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 160, 40);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 10, 160, 40);
        // Gem icon (diamond shape)
        this.ctx.fillStyle = '#00CED1';
        this.ctx.beginPath();
        this.ctx.moveTo(30, 30);
        this.ctx.lineTo(40, 20);
        this.ctx.lineTo(50, 30);
        this.ctx.lineTo(40, 40);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        // Gem count text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 22px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`: ${this.player.gems.toLocaleString()}`, 55, 30);
        // Restore context
        this.ctx.restore();
    }
    renderShopButton() {
        // Save context state
        this.ctx.save();
        // Shop button background (with hover effect)
        const mouseX = this.input.mouseX;
        const mouseY = this.input.mouseY;
        const isHovering = mouseX >= 10 && mouseX <= 110 && mouseY >= 60 && mouseY <= 90;
        this.ctx.fillStyle = isHovering ? '#5a5a8e' : '#4a4a6e';
        this.ctx.fillRect(10, 60, 100, 30);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 60, 100, 30);
        // Shop text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🛒 SHOP', 60, 75);
        // Restore context
        this.ctx.restore();
    }
    renderShop() {
        // Delegate rendering to new ShopUI class
        const expansionCost = this.player.getInventoryExpansionCost();
        this.shopUI.render(this.ctx, this.input.mouseX, this.input.mouseY, this.player.gems, this.redeemCodeInput, this.player.maxInventorySlots, expansionCost);
    }
    // OLD SHOP CODE (BACKUP) - Can be deleted later
    renderShopOLD() {
        const modalX = CANVAS_WIDTH / 2 - 400;
        const modalY = 50;
        const modalW = 800;
        const modalH = CANVAS_HEIGHT - 100;
        const mouseX = this.input.mouseX;
        const mouseY = this.input.mouseY;
        let currentY = modalY + 100;
        // === SECTION 1: PLAYER CLOTHES ===
        this.ctx.fillStyle = '#E3F2FD';
        this.ctx.fillRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.strokeStyle = '#5C6BC0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.fillStyle = '#3F51B5';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('👕 PLAYER CLOTHES', modalX + 30, currentY + 21);
        currentY += 40;
        // Super Stars (Red Shoes - Speed Boost)
        const superStarsY = currentY;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(modalX + 30, superStarsY, modalW - 60, 70);
        this.ctx.strokeStyle = '#FF5252';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 30, superStarsY, modalW - 60, 70);
        // Shoe icon (red shoes)
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(modalX + 45, superStarsY + 15, 40, 40);
        this.ctx.strokeStyle = '#8B0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 45, superStarsY + 15, 40, 40);
        // Draw star on shoe
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⭐', modalX + 65, superStarsY + 43);
        // Item details
        this.ctx.fillStyle = '#212121';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Super Stars', modalX + 100, superStarsY + 28);
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#616161';
        this.ctx.fillText('Red shoes - 1.5x speed boost', modalX + 100, superStarsY + 48);
        this.ctx.fillStyle = '#5C6BC0';
        this.ctx.fillText('Price: 500 gems', modalX + 100, superStarsY + 64);
        // Buy button
        const superStarsBuyX = modalX + modalW - 140;
        const superStarsBuyY = superStarsY + 15;
        const canAffordShoes = this.player.gems >= 500;
        const isHoveringShoeBuy = mouseX >= superStarsBuyX && mouseX <= superStarsBuyX + 100 && mouseY >= superStarsBuyY && mouseY <= superStarsBuyY + 40;
        this.ctx.fillStyle = canAffordShoes ? (isHoveringShoeBuy ? '#7986CB' : '#5C6BC0') : '#BDBDBD';
        this.ctx.fillRect(superStarsBuyX, superStarsBuyY, 100, 40);
        this.ctx.strokeStyle = '#3F51B5';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(superStarsBuyX, superStarsBuyY, 100, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BUY', superStarsBuyX + 50, superStarsBuyY + 26);
        currentY += 80;
        // === SECTION 2: BLOCKS ===
        this.ctx.fillStyle = '#E8F5E9';
        this.ctx.fillRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.strokeStyle = '#66BB6A';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🧱 BLOCKS', modalX + 30, currentY + 21);
        currentY += 40;
        // Sign Block
        const signY = currentY;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(modalX + 30, signY, modalW - 60, 70);
        this.ctx.strokeStyle = '#D2691E';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 30, signY, modalW - 60, 70);
        // Sign icon
        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(modalX + 45, signY + 15, 40, 40);
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 45, signY + 15, 40, 40);
        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📝', modalX + 65, signY + 43);
        // Item details
        this.ctx.fillStyle = '#212121';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Sign', modalX + 100, signY + 28);
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#616161';
        this.ctx.fillText('Background block - write custom text', modalX + 100, signY + 48);
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.fillText('Price: 25 gems', modalX + 100, signY + 64);
        // Sign buy button
        const signBuyBtnX = modalX + modalW - 140;
        const signBuyBtnY = signY + 15;
        const canAffordSign = this.player.gems >= 25;
        const isHoveringSignBuy = mouseX >= signBuyBtnX && mouseX <= signBuyBtnX + 100 && mouseY >= signBuyBtnY && mouseY <= signBuyBtnY + 40;
        this.ctx.fillStyle = canAffordSign ? (isHoveringSignBuy ? '#81C784' : '#66BB6A') : '#BDBDBD';
        this.ctx.fillRect(signBuyBtnX, signBuyBtnY, 100, 40);
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(signBuyBtnX, signBuyBtnY, 100, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BUY', signBuyBtnX + 50, signBuyBtnY + 26);
        currentY += 80;
        // === SECTION 3: ESSENTIALS ===
        this.ctx.fillStyle = '#FFF9C4';
        this.ctx.fillRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.strokeStyle = '#FBC02D';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.fillStyle = '#F57F17';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('⚡ ESSENTIALS', modalX + 30, currentY + 21);
        currentY += 40;
        // Gold Lock
        const lockY = currentY;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(modalX + 30, lockY, modalW - 60, 70);
        this.ctx.strokeStyle = '#FBC02D';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 30, lockY, modalW - 60, 70);
        // Gold Lock icon
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(modalX + 45, lockY + 15, 40, 40);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 45, lockY + 15, 40, 40);
        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔒', modalX + 65, lockY + 43);
        // Item details
        this.ctx.fillStyle = '#212121';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Gold Lock', modalX + 100, lockY + 28);
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#616161';
        this.ctx.fillText('Protect your world from others', modalX + 100, lockY + 48);
        this.ctx.fillStyle = '#F57F17';
        this.ctx.fillText('Price: 100 gems', modalX + 100, lockY + 64);
        // Buy button
        const buyBtnX = modalX + modalW - 140;
        const buyBtnY = lockY + 15;
        const canAfford = this.player.gems >= 100;
        const isHoveringBuy = mouseX >= buyBtnX && mouseX <= buyBtnX + 100 && mouseY >= buyBtnY && mouseY <= buyBtnY + 40;
        this.ctx.fillStyle = canAfford ? (isHoveringBuy ? '#FFCA28' : '#FBC02D') : '#BDBDBD';
        this.ctx.fillRect(buyBtnX, buyBtnY, 100, 40);
        this.ctx.strokeStyle = '#F57F17';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buyBtnX, buyBtnY, 100, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BUY', buyBtnX + 50, buyBtnY + 26);
        currentY += 80;
        // === REDEEM CODES SECTION ===
        this.ctx.fillStyle = '#F3E5F5';
        this.ctx.fillRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.strokeStyle = '#AB47BC';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(modalX + 20, currentY, modalW - 40, 30);
        this.ctx.fillStyle = '#6A1B9A';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🎁 REDEEM CODES', modalX + 30, currentY + 21);
        currentY += 40;
        // Code input box
        const inputX = modalX + 30;
        const inputY = currentY;
        const inputW = modalW - 170;
        const inputH = 40;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(inputX, inputY, inputW, inputH);
        this.ctx.strokeStyle = '#AB47BC';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(inputX, inputY, inputW, inputH);
        // Code text or placeholder
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'left';
        const displayText = this.redeemCodeInput || 'Enter code...';
        this.ctx.fillStyle = this.redeemCodeInput ? '#212121' : '#9E9E9E';
        this.ctx.fillText(displayText, inputX + 10, inputY + 26);
        // Redeem button
        const redeemBtnX = inputX + inputW + 10;
        const redeemBtnY = inputY;
        const isHoveringRedeem = mouseX >= redeemBtnX && mouseX <= redeemBtnX + 110 && mouseY >= redeemBtnY && mouseY <= redeemBtnY + 40;
        this.ctx.fillStyle = isHoveringRedeem ? '#BA68C8' : '#AB47BC';
        this.ctx.fillRect(redeemBtnX, redeemBtnY, 110, 40);
        this.ctx.strokeStyle = '#6A1B9A';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(redeemBtnX, redeemBtnY, 110, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('REDEEM', redeemBtnX + 55, redeemBtnY + 26);
        // Available codes hint
        this.ctx.fillStyle = '#757575';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Try code: FREE (20,000 gems, one-time)', inputX, inputY + 58);
        // Close button at bottom
        const closeBtnX = modalX + modalW / 2 - 75;
        const closeBtnY = modalY + modalH - 50;
        const isHoveringClose = mouseX >= closeBtnX && mouseX <= closeBtnX + 150 && mouseY >= closeBtnY && mouseY <= closeBtnY + 40;
        this.ctx.fillStyle = isHoveringClose ? '#E57373' : '#EF5350';
        this.ctx.fillRect(closeBtnX, closeBtnY, 150, 40);
        this.ctx.strokeStyle = '#C62828';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(closeBtnX, closeBtnY, 150, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CLOSE SHOP', closeBtnX + 75, closeBtnY + 26);
    }
    async handleRedeemCode() {
        const code = this.redeemCodeInput.trim().toUpperCase();
        if (!code) {
            console.log('[REDEEM] No code entered');
            return;
        }
        // Check if code has already been redeemed
        if (this.player.redeemedCodes.includes(code)) {
            alert('❌ You have already redeemed this code!');
            console.log('[REDEEM] Code already redeemed:', code);
            return;
        }
        // Available codes
        const codes = {
            'FREE': { gems: 20000, description: 'Welcome bonus!' }
        };
        if (codes[code]) {
            // Valid code!
            const reward = codes[code];
            this.player.gems = Math.min(this.player.gems + reward.gems, 1000000000);
            this.player.redeemedCodes.push(code);
            // Save redeemed codes to database
            const userId = this.dbSync.getCurrentUserId();
            if (userId) {
                await this.dbSync.saveInventory(userId, this.player.inventory, this.player.gems, this.player.redeemedCodes);
            }
            alert(`✓ Code redeemed!\n\n+${reward.gems.toLocaleString()} gems\n${reward.description}`);
            console.log(`[REDEEM] Success! Code: ${code}, Gems: +${reward.gems}`);
            this.redeemCodeInput = '';
        }
        else {
            alert('❌ Invalid code!');
            console.log('[REDEEM] Invalid code:', code);
        }
    }
    renderSignEditModal() {
        // Overlay background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Edit modal
        const modalX = CANVAS_WIDTH / 2 - 250;
        const modalY = CANVAS_HEIGHT / 2 - 150;
        const modalW = 500;
        const modalH = 300;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(modalX, modalY, modalW, modalH);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(modalX, modalY, modalW, modalH);
        // Title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Edit Sign', CANVAS_WIDTH / 2, modalY + 50);
        // Instruction
        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('(Max 20 characters)', CANVAS_WIDTH / 2, modalY + 80);
        // Text input box
        const inputX = modalX + 50;
        const inputY = modalY + 110;
        const inputW = 400;
        const inputH = 50;
        this.ctx.fillStyle = '#2a2a3e';
        this.ctx.fillRect(inputX, inputY, inputW, inputH);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(inputX, inputY, inputW, inputH);
        // Text or placeholder
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'left';
        const displayText = this.signTextInput || 'Type here...';
        this.ctx.fillStyle = this.signTextInput ? '#fff' : '#666';
        this.ctx.fillText(displayText, inputX + 15, inputY + 33);
        // Character count
        this.ctx.fillStyle = '#888';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${this.signTextInput.length}/20`, inputX + inputW - 10, inputY + inputH + 20);
        // Save button
        const saveBtnX = CANVAS_WIDTH / 2 - 120;
        const saveBtnY = modalY + 210;
        const mouseX = this.input.mouseX;
        const mouseY = this.input.mouseY;
        const isHoveringSave = mouseX >= saveBtnX && mouseX <= saveBtnX + 100 && mouseY >= saveBtnY && mouseY <= saveBtnY + 40;
        this.ctx.fillStyle = isHoveringSave ? '#5a8e5a' : '#4a6e4a';
        this.ctx.fillRect(saveBtnX, saveBtnY, 100, 40);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(saveBtnX, saveBtnY, 100, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SAVE', saveBtnX + 50, saveBtnY + 26);
        // Cancel button
        const cancelBtnX = CANVAS_WIDTH / 2 + 20;
        const cancelBtnY = modalY + 210;
        const isHoveringCancel = mouseX >= cancelBtnX && mouseX <= cancelBtnX + 100 && mouseY >= cancelBtnY && mouseY <= cancelBtnY + 40;
        this.ctx.fillStyle = isHoveringCancel ? '#8e5a5a' : '#6e4a4a';
        this.ctx.fillRect(cancelBtnX, cancelBtnY, 100, 40);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cancelBtnX, cancelBtnY, 100, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('CANCEL', cancelBtnX + 50, cancelBtnY + 26);
    }
    addChatMessage(username, text) {
        this.chatMessages.push({
            username,
            text,
            timestamp: Date.now()
        });
        // Keep only last 10 messages
        if (this.chatMessages.length > 10) {
            this.chatMessages.shift();
        }
    }
    renderChat() {
        const startY = CANVAS_HEIGHT - 180; // Above inventory
        const messageHeight = 20;
        // Render recent messages (fade out older ones)
        const now = Date.now();
        for (let i = 0; i < this.chatMessages.length; i++) {
            const msg = this.chatMessages[i];
            const age = now - msg.timestamp;
            const fadeTime = 5000; // 5 seconds
            if (age < fadeTime || this.isChatOpen) {
                const alpha = this.isChatOpen ? 1 : Math.max(0, 1 - age / fadeTime);
                const y = startY - (this.chatMessages.length - i - 1) * messageHeight;
                // Background
                this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
                this.ctx.fillRect(10, y - 16, 400, 18);
                // Check if sender is world owner
                const isOwner = this.world.getOwner() === msg.username;
                const usernameColor = isOwner ? '#00FF00' : '#FFD700';
                // Username
                this.ctx.fillStyle = `rgba(${parseInt(usernameColor.slice(1, 3), 16)}, ${parseInt(usernameColor.slice(3, 5), 16)}, ${parseInt(usernameColor.slice(5, 7), 16)}, ${alpha})`;
                this.ctx.font = 'bold 12px monospace';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`${msg.username}:`, 15, y);
                // Message
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.font = '12px monospace';
                this.ctx.fillText(msg.text, 15 + this.ctx.measureText(`${msg.username}: `).width, y);
            }
        }
        // Render chat input if open
        if (this.isChatOpen) {
            const inputY = startY + 10;
            const inputHeight = 30;
            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(10, inputY, 500, inputHeight);
            // Border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(10, inputY, 500, inputHeight);
            // Input text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.chatInput + '|', 15, inputY + 20);
            // Hint
            this.ctx.fillStyle = '#888';
            this.ctx.font = '10px monospace';
            this.ctx.fillText('Press Enter to send, Esc to cancel', 15, inputY + inputHeight + 12);
        }
    }
    async cleanup() {
        // Force sync on exit
        const worldData = this.world.getWorldData();
        await this.dbSync.forceSync(this.worldName, worldData);
        // Save world on exit
        this.saveWorld();
        // Cleanup timers
        if (this.worldSyncTimer) {
            clearTimeout(this.worldSyncTimer);
        }
    }
}
//# sourceMappingURL=game.js.map