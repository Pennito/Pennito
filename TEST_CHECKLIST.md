# Game Testing Checklist

## Server Status
- ✅ Server running on http://localhost:8000
- ✅ TypeScript compilation successful

## Core Features to Test

### 1. Login & Account System
- [ ] Login screen displays correctly
- [ ] Can create new account with username/password
- [ ] Can login with existing account
- [ ] Username validation (1-20 characters, alphanumeric)
- [ ] Password field shows dots
- [ ] Input fields have yellow highlight when focused
- [ ] Tab key navigation works between fields
- [ ] Reset button visible and works (Shift+R)

### 2. World Selection
- [ ] World selector screen displays after login
- [ ] Can search for existing world
- [ ] Can create new world
- [ ] World name validation (1-8 alphanumeric characters, no spaces/special chars)
- [ ] Recent worlds show 2 random previously visited worlds
- [ ] Can enter world successfully

### 3. Player Movement & Physics
- [ ] Player spawns correctly (not stuck, not floating)
- [ ] Player spawns at y=24 (one block above terrain)
- [ ] A/D or ←/→ keys move player left/right
- [ ] Space or W key makes player jump
- [ ] Double jump works (can jump twice in air)
- [ ] Jump height is appropriate (2 blocks high)
- [ ] Gravity works (player falls when not on ground)
- [ ] Player doesn't phase through blocks
- [ ] Player doesn't clip through terrain
- [ ] Player can fit through single-block spaces (32x32 hitbox)
- [ ] Camera follows player smoothly

### 4. Block Interaction
- [ ] Can break blocks with PUNCH item selected
- [ ] Breaking blocks drops item at block position
- [ ] Dropped items can be picked up by walking over them
- [ ] Breaking blocks gives +1 gem
- [ ] Can place blocks (right-click or click after selecting in inventory)
- [ ] Block placement blocked if position has solid tile
- [ ] Cannot place blocks inside player hitbox
- [ ] Block placement consumes item from inventory
- [ ] Cannot place blocks if no item in inventory

### 5. Inventory System
- [ ] Inventory displays at bottom of screen
- [ ] Inventory shows proper graphics (not blocks) for:
  - [ ] Super Stars (red shoes icon)
  - [ ] Fedora (hat icon)
  - [ ] Suit Pants (pants icon)
  - [ ] Suit Shirt (shirt icon)
  - [ ] Punch (fist icon)
  - [ ] Wrench (wrench icon)
  - [ ] Sign (sign icon)
  - [ ] Gold Lock (lock icon)
  - [ ] Bedrock (bedrock icon)
  - [ ] Dirt (dirt block)
- [ ] Can select inventory slots (click to select)
- [ ] Selected slot is highlighted
- [ ] Double-click equips equipment items
- [ ] Equipped items show checkmark (✓)
- [ ] Can unequip by double-clicking again
- [ ] Inventory expansion button visible (if < 50 slots)
- [ ] Can expand inventory (costs gems, doubles each time)
- [ ] Inventory maxes out at 50 slots

### 6. Equipment System
- [ ] Super Stars: Equip/unequip works, shows red shoes on character, 1.5x speed boost
- [ ] Fedora: Equip/unequip works, shows hat on character head
- [ ] Suit Pants: Equip/unequip works, shows pants on character legs
- [ ] Suit Shirt: Equip/unequip works, shows shirt on character body
- [ ] Equipment items are unplaceable (no 3x3 grid when selected)
- [ ] Equipment graphics show correctly in inventory (not as blocks)

### 7. World Lock System
- [ ] Can buy Gold Lock from shop (100 gems)
- [ ] Can place Gold Lock in world
- [ ] World owner name turns green when world is locked
- [ ] Only owner can break blocks when world is locked
- [ ] Only owner can place blocks when world is locked
- [ ] Only owner can use wrench (edit signs) when world is locked
- [ ] Other players can move/jump but not interact when world is locked
- [ ] Other players' names stay white when world is locked

### 8. Sign System
- [ ] Can buy Sign from shop (25 gems)
- [ ] Can place Sign as background block
- [ ] Can edit Sign with wrench tool
- [ ] Sign text shows above block when walking over it
- [ ] Sign text fades after 5 seconds
- [ ] Sign text is readable by all players
- [ ] Sign text limited to 20 characters

### 9. Shop System
- [ ] Shop button visible in top-left
- [ ] Can open shop menu
- [ ] Shop has 3 sections: Player Clothes, Blocks, Essentials
- [ ] Can switch between sections (click tabs)
- [ ] Can scroll shop items
- [ ] Can purchase items with gems
- [ ] Purchased items go to inventory
- [ ] Shop items show correct graphics
- [ ] Shop UI doesn't interfere with block placement

### 10. Gem System
- [ ] Gem count displays in top-left
- [ ] Breaking blocks gives +1 gem
- [ ] Gem count updates correctly
- [ ] Gem count maxes at 1 billion
- [ ] Can spend gems in shop

### 11. Chat System
- [ ] Chat input visible in bottom-left
- [ ] Can type messages
- [ ] Press Enter to send message
- [ ] Messages display in chat log
- [ ] Messages display above player for 5 seconds
- [ ] Chat messages fade out
- [ ] Enter key doesn't refresh page or cause issues

### 12. Menu System
- [ ] Menu button (⚙️) visible in top-right
- [ ] Can open menu with mouse click (not keyboard)
- [ ] Menu shows: Resume Game, Exit World, Logout
- [ ] Game physics pause when menu is open
- [ ] Can click menu buttons with mouse
- [ ] Menu doesn't auto-close
- [ ] Resume Game closes menu and resumes physics
- [ ] Exit World returns to world selector
- [ ] Logout returns to login screen

### 13. World Generation
- [ ] World is 50x50 blocks
- [ ] Bedrock floor at y=49 (unbreakable)
- [ ] Invisible borders on sides and top
- [ ] Generated blocks start at y=25 and below
- [ ] Player spawns at y=24
- [ ] Spawn door visible at spawn point
- [ ] Unbreakable block under spawn door
- [ ] Can place blocks in air above spawn (up to +30 blocks)

### 14. Character Rendering
- [ ] Character looks like Growtopia character
- [ ] Character is naked (skin color, bald) by default
- [ ] Character has 2-frame walk animation
- [ ] Username displays above character
- [ ] Owner name is green, others are white
- [ ] Equipped items show on character:
  - [ ] Super Stars (red shoes on feet)
  - [ ] Fedora (hat on head)
  - [ ] Suit Pants (pants on legs)
  - [ ] Suit Shirt (shirt on body with tie)

### 15. Data Persistence
- [ ] Account data saves to Supabase
- [ ] World data saves to Supabase
- [ ] Inventory data saves to Supabase
- [ ] Can rejoin world after logout
- [ ] Player data persists (gems, inventory, equipment)
- [ ] World changes persist (blocks, signs)

### 16. Error Handling
- [ ] No console errors on load
- [ ] No console errors during gameplay
- [ ] Player respawns if stuck in block
- [ ] Game doesn't crash on invalid input
- [ ] Network errors handled gracefully

## Known Issues to Verify Fixed
- [ ] Player doesn't freeze on spawn
- [ ] Jumping doesn't auto-trigger
- [ ] Jumping doesn't move player down
- [ ] Fedora equip doesn't bug out (double-click works)
- [ ] Block placement works consistently
- [ ] Inventory graphics show correctly (not blocks)
- [ ] Shop UI scrolls correctly
- [ ] Chat doesn't cause page refresh
- [ ] Menu button works with mouse only
- [ ] World lock permissions work correctly

## Performance
- [ ] Game runs at smooth framerate
- [ ] No lag when breaking/placing blocks
- [ ] No lag when scrolling shop
- [ ] No memory leaks (check over time)

