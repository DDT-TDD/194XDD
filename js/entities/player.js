/* ----------------------------------------------------
   194XDD Player Entity - Fighter Controller & Upgrades
   ---------------------------------------------------- */

import { Assets } from '../assets.js';
import { Input } from '../input.js';
import { Projectile } from './projectile.js';

export class Player {
    constructor(x, y, type = 'p38') {
        this.x = x;
        this.y = y;
        this.type = type; // 'p38', 'pancake', 'mitchell'
        
        // Base sizes
        this.width = 64;
        this.height = 64;
        this.radius = 8; // Small collision radius for fair play
        
        // Upgrades (retrieved from main storage)
        this.upgrades = {
            weapon: 1,
            speed: 1,
            armor: 1,
            special: 0
        };

        // Live stats (re-calculated in updateStats)
        this.maxHealth = 100;
        this.health = 100;
        
        this.maxShield = 0;
        this.shield = 0;
        
        this.speed = 280;
        this.fireCooldown = 0.22;
        
        this.shootTimer = 0;

        // Bombs & Missiles secondary weapons
        this.bombsRemaining = 3;
        this.maxBombs = 5;
        this.missileCooldown = 0.7;
        this.missileTimer = 0.7;
        
        // Loop maneuver state
        this.isLooping = false;
        this.loopTimer = 0;
        this.loopDuration = 1.0; // 1 second
        this.loopMaxCount = 3;
        this.loopsRemaining = 3;
        this.angle = 0;
        this.scaleMultiplier = 1.0;
        
        // Props animation angle
        this.propAngle = 0;
        
        // Weapon pickup flash
        this.weaponFlashTimer = 0;

        // Magnet Powerup Active timer
        this.magnetTimer = 0;

        // Charge shot states
        this.chargeTimer = 0;
        this.isCharging = false;
        this.chargeDuration = 1.0; // 1.0 second to charge
        this.chargeProgress = 0;
        this.spacePressedLastFrame = false;

        this.updateStats();
    }

    _calcFireCooldown() {
        const lvl = this.upgrades.weapon;
        // Bigger gap between tiers so Lvl3 feels dramatically faster
        if (this.type === 'p38')      return Math.max(0.07, 0.24 - (lvl - 1) * 0.055);
        if (this.type === 'pancake')  return Math.max(0.06, 0.20 - (lvl - 1) * 0.050);
        if (this.type === 'mitchell') return Math.max(0.09, 0.32 - (lvl - 1) * 0.080);
        if (this.type === 'corsair')  return Math.max(0.07, 0.22 - (lvl - 1) * 0.055);
        if (this.type === 'zero')     return Math.max(0.05, 0.17 - (lvl - 1) * 0.050);
        return 0.22;
    }

    // Bullet speed scales with weapon upgrade level
    _calcBulletSpeed() {
        const lvl = this.upgrades.weapon;
        // Lvl1=650, Lvl2=820, Lvl3=1020
        return 650 + (lvl - 1) * 185;
    }

    // Missile cooldown shrinks with weapon level
    _calcMissileCooldown() {
        const lvl = this.upgrades.weapon;
        return Math.max(0.25, 0.75 - (lvl - 1) * 0.18);
    }

    updateStats(preserveHealth = false) {
        // Core scaling formulas based on plane type & Hangar upgrade levels
        const prevHealth = this.health;
        const prevShield = this.shield;
        const prevMaxHealth = this.maxHealth;

        if (this.type === 'p38') {
            this.maxHealth = 100 + (this.upgrades.armor - 1) * 20;
            this.speed = 260 + (this.upgrades.speed - 1) * 30;
            this.maxShield = 0;
        } else if (this.type === 'pancake') {
            this.maxHealth = 80 + (this.upgrades.armor - 1) * 15;
            this.speed = 310 + (this.upgrades.speed - 1) * 35;
            // Pancake has dynamic energy shield
            this.maxShield = 50 + (this.upgrades.special) * 25;
        } else if (this.type === 'mitchell') {
            this.maxHealth = 150 + (this.upgrades.armor - 1) * 35;
            this.speed = 210 + (this.upgrades.speed - 1) * 25;
            this.maxShield = 0;
        } else if (this.type === 'corsair') {
            this.maxHealth = 130 + (this.upgrades.armor - 1) * 30;
            this.speed = 240 + (this.upgrades.speed - 1) * 30;
            this.maxShield = 0;
        } else if (this.type === 'zero') {
            this.maxHealth = 65 + (this.upgrades.armor - 1) * 14;
            // Agility Boost: scales base speed and maximum loop maneuver capacity
            this.speed = 330 + (this.upgrades.speed - 1) * 40 + (this.upgrades.special) * 15;
            this.maxShield = 0;
            this.loopMaxCount = 3 + this.upgrades.special;
        }

        // Recalculate fire cooldown and missile cooldown
        this.fireCooldown = this._calcFireCooldown();
        this.missileCooldown = this._calcMissileCooldown();

        if (preserveHealth) {
            // Keep current HP scaled proportionally when armour changes
            this.health = Math.min(this.maxHealth, prevHealth * (this.maxHealth / Math.max(1, prevMaxHealth)));
            // Shield: keep current or reset to new max if higher
            this.shield = (this.maxShield > 0) ? Math.min(this.maxShield, prevShield) : 0;
        } else {
            // Full reset (start of game)
            this.health = this.maxHealth;
            this.shield = this.maxShield;
            this.loopsRemaining = this.loopMaxCount;
        }
    }

    takeDamage(amount, audio) {
        if (this.isLooping) return false;

        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.health += this.shield; // overflow damage to health
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }

        if (audio) audio.playPlayerDamage();
        return true;
    }

    triggerLoop(audio) {
        if (this.isLooping || this.loopsRemaining <= 0) return;
        this.isLooping = true;
        this.loopTimer = 0;
        this.loopsRemaining--;
        if (audio) {
            audio.playLoopSwoosh();
            audio.stopChargeUp();
        }
        this.isCharging = false;
        this.chargeProgress = 0;
        this.chargeTimer = 0;
    }

    update(dt, input, projectiles, particles, audio, canvasWidth, canvasHeight) {
        // Propeller spin calculation
        this.propAngle = (this.propAngle + 50 * dt) % (Math.PI * 2);

        // 1. Handle Loop maneuver animation
        if (this.isLooping) {
            this.loopTimer += dt;
            const progress = this.loopTimer / this.loopDuration;
            
            if (progress >= 1.0) {
                this.isLooping = false;
                this.angle = 0;
                this.scaleMultiplier = 1.0;
            } else {
                // Loop simulation: Plane rotates 360deg and scales up then down to resemble 3D depth
                this.angle = progress * Math.PI * 2;
                
                // Scale peaks in the middle of loop (looping high)
                this.scaleMultiplier = 1.0 + Math.sin(progress * Math.PI) * 0.7;
            }
            
            // Constrain player position to screen boundary even when looping
            this.clampPosition(canvasWidth, canvasHeight);
            return;
        }

        // 2. Handle active Player movement
        let moveX = 0;
        let moveY = 0;

        if (input.mode === 'keyboard') {
            const { dx, dy } = input.getKeyboardDirections();
            moveX = dx * this.speed * dt;
            moveY = dy * this.speed * dt;
            this.x += moveX;
            this.y += moveY;
        } else {
            // Mouse / Touch Follow (smooth slide with interpolation)
            const targetX = input.x;
            const targetY = input.y;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            
            // Follow speed factor (smooth inertia)
            const lerpFactor = 12 * dt;
            this.x += dx * Math.min(1.0, lerpFactor);
            this.y += dy * Math.min(1.0, lerpFactor);
        }

        this.clampPosition(canvasWidth, canvasHeight);

        // Pancake Shield regen
        if (this.shield < this.maxShield && !this.isLooping) {
            this.shield = Math.min(this.maxShield, this.shield + 4 * dt); // slow passive recharge
        }

        // Magnet timer decay
        if (this.magnetTimer > 0) {
            this.magnetTimer -= dt;
        }

        // 3. Thruster Trails spawning
        this.spawnThrusters(particles);

        // 4. Loop maneuver trigger check
        if (input.loopTriggered) {
            this.triggerLoop(audio);
            input.loopTriggered = false;
        }

        // 5. Fire Weapon systems & Charge shot
        this.shootTimer += dt;
        this.missileTimer += dt;
        if (this.weaponFlashTimer > 0) this.weaponFlashTimer -= dt;
        
        if (input.keys['Space']) {
            if (!this.spacePressedLastFrame) {
                this.isCharging = true;
                this.chargeTimer = 0;
                this.chargeProgress = 0;
                if (audio) audio.playChargeUp();
            }
            this.spacePressedLastFrame = true;
            this.chargeTimer += dt;
            
            // Continuous normal fire even while charging (never get stuck!)
            if (this.shootTimer >= this.fireCooldown) {
                this.fireWeapons(projectiles, audio);
                this.shootTimer = 0;
            }
            
            // Accumulate charge progress in parallel
            this.chargeProgress = Math.min(1.0, this.chargeTimer / this.chargeDuration);
            if (particles && this.chargeProgress > 0.15) {
                particles.spawnChargeEffect(this.x, this.y, this.chargeProgress, this.type);
            }
        } else {
            // Space is not pressed: check if it was just released
            if (this.spacePressedLastFrame) {
                this.spacePressedLastFrame = false;
                if (audio) audio.stopChargeUp();
                if (this.isCharging && this.chargeProgress >= 1.0) {
                    this.fireChargeShot(projectiles, audio, particles);
                }
                this.isCharging = false;
                this.chargeProgress = 0;
                this.chargeTimer = 0;
            }
            
            // Normal auto-shoot for mouse/touch mode (or when tapping Space)
            if (input.mode === 'mouse' && input.isMouseDown) {
                if (this.shootTimer >= this.fireCooldown) {
                    this.fireWeapons(projectiles, audio);
                    this.shootTimer = 0;
                }
            }
        }

        // Firing homing missiles
        const wantMissile = input.keys['KeyF'] || input.keys['KeyV'] || input.missileTriggered;
        if (wantMissile && this.missileTimer >= this.missileCooldown) {
            this.fireMissiles(projectiles, audio);
            this.missileTimer = 0;
            input.missileTriggered = false;
        }
    }

    clampPosition(canvasWidth, canvasHeight) {
        // Boundary containment
        const boundX = this.width / 2;
        const boundY = this.height / 2;
        
        if (this.x < boundX) this.x = boundX;
        if (this.x > canvasWidth - boundX) this.x = canvasWidth - boundX;
        if (this.y < boundY) this.y = boundY;
        if (this.y > canvasHeight - boundY) this.y = canvasHeight - boundY;
    }

    spawnThrusters(particles) {
        if (this.type === 'p38') {
            particles.spawnThrusterTrail(this.x - 24, this.y + 20, 0, 100);
            particles.spawnThrusterTrail(this.x + 24, this.y + 20, 0, 100);
        } else if (this.type === 'pancake') {
            particles.spawnThrusterTrail(this.x - 30, this.y + 12, 0, 100, '#00e5ff');
            particles.spawnThrusterTrail(this.x + 30, this.y + 12, 0, 100, '#00e5ff');
        } else if (this.type === 'mitchell') {
            particles.spawnThrusterTrail(this.x - 28, this.y + 24, 0, 90);
            particles.spawnThrusterTrail(this.x + 28, this.y + 24, 0, 90);
            particles.spawnThrusterTrail(this.x, this.y + 44, 0, 90);
        } else if (this.type === 'corsair') {
            // Single radial exhaust stack
            particles.spawnThrusterTrail(this.x - 5, this.y + 16, 0, 100, '#ff9500');
            particles.spawnThrusterTrail(this.x + 5, this.y + 16, 0, 100, '#ff9500');
        } else if (this.type === 'zero') {
            // Tight single-engine trail
            particles.spawnThrusterTrail(this.x, this.y + 18, 0, 110, '#ffd54f');
        }
    }

    fireMissiles(projectiles, audio) {
        const lvl = this.upgrades.weapon;
        if (this.type === 'p38') {
            if (audio) audio.playShootHeavy();
            if (lvl === 1) {
                // Tier 1: Twin standard homing rockets (targetSpeed=550, launch at -500)
                projectiles.push(new Projectile(this.x - 24, this.y, -80, -500, false, 'missile', 40));
                projectiles.push(new Projectile(this.x + 24, this.y, 80, -500, false, 'missile', 40));
            } else if (lvl === 2) {
                // Tier 2: Quad cluster rockets (targetSpeed=400, launch at -350 to -380)
                projectiles.push(new Projectile(this.x - 32, this.y, -140, -350, false, 'missile_cluster', 50));
                projectiles.push(new Projectile(this.x - 12, this.y, -40, -380, false, 'missile_cluster', 50));
                projectiles.push(new Projectile(this.x + 12, this.y, 40, -380, false, 'missile_cluster', 50));
                projectiles.push(new Projectile(this.x + 32, this.y, 140, -350, false, 'missile_cluster', 50));
            } else {
                // Tier 3: Hex-burst micro-missiles (targetSpeed=750, launch at -650 to -700)
                projectiles.push(new Projectile(this.x - 30, this.y, -180, -650, false, 'missile_micro', 22));
                projectiles.push(new Projectile(this.x - 18, this.y, -100, -680, false, 'missile_micro', 22));
                projectiles.push(new Projectile(this.x - 6, this.y, -30, -700, false, 'missile_micro', 22));
                projectiles.push(new Projectile(this.x + 6, this.y, 30, -700, false, 'missile_micro', 22));
                projectiles.push(new Projectile(this.x + 18, this.y, 100, -680, false, 'missile_micro', 22));
                projectiles.push(new Projectile(this.x + 30, this.y, 180, -650, false, 'missile_micro', 22));
            }
        } else if (this.type === 'pancake') {
            if (audio) audio.playShootLaser();
            if (lvl === 1) {
                // Tier 1: Twin narrow laser-guided tracking missiles (targetSpeed=650, launch at -580)
                projectiles.push(new Projectile(this.x - 20, this.y, -100, -580, false, 'laser_missile', 35));
                projectiles.push(new Projectile(this.x + 20, this.y, 100, -580, false, 'laser_missile', 35));
            } else if (lvl === 2) {
                // Tier 2: Dual tracking laser missiles (targetSpeed=650, launch at -580)
                projectiles.push(new Projectile(this.x - 24, this.y, -150, -580, false, 'laser_missile', 65));
                projectiles.push(new Projectile(this.x + 24, this.y, 150, -580, false, 'laser_missile', 65));
            } else {
                // Tier 3: Triple rapid laser darts (targetSpeed=850, launch at -750 to -800)
                projectiles.push(new Projectile(this.x - 18, this.y, -220, -750, false, 'laser_dart', 30));
                projectiles.push(new Projectile(this.x, this.y, 0, -800, false, 'laser_dart', 35));
                projectiles.push(new Projectile(this.x + 18, this.y, 220, -750, false, 'laser_dart', 30));
            }
        } else if (this.type === 'mitchell') {
            if (audio) audio.playShootHeavy();
            if (lvl === 1) {
                // Tier 1: 1 carpet bomb
                projectiles.push(new Projectile(this.x, this.y, 0, -180, false, 'carpet_bomb', 75));
            } else if (lvl === 2) {
                // Tier 2: 2 carpet bombs
                projectiles.push(new Projectile(this.x - 20, this.y, -40, -180, false, 'carpet_bomb', 75));
                projectiles.push(new Projectile(this.x + 20, this.y, 40, -180, false, 'carpet_bomb', 75));
            } else {
                // Tier 3: 3 carpet bombs (full sweep)
                projectiles.push(new Projectile(this.x - 30, this.y, -100, -160, false, 'carpet_bomb', 75));
                projectiles.push(new Projectile(this.x, this.y, 0, -180, false, 'carpet_bomb', 75));
                projectiles.push(new Projectile(this.x + 30, this.y, 100, -160, false, 'carpet_bomb', 75));
            }
        } else if (this.type === 'corsair') {
            // Corsair: Heavy Air-Ground HVAR rockets
            if (audio) audio.playShootHeavy();
            if (lvl === 1) {
                // targetSpeed=400, launch at -380
                projectiles.push(new Projectile(this.x - 30, this.y, -60, -380, false, 'missile_cluster', 55));
                projectiles.push(new Projectile(this.x + 30, this.y, 60, -380, false, 'missile_cluster', 55));
            } else if (lvl === 2) {
                // targetSpeed=400, launch at -350 to -380
                projectiles.push(new Projectile(this.x - 40, this.y, -80, -350, false, 'missile_cluster', 60));
                projectiles.push(new Projectile(this.x, this.y, 0, -380, false, 'missile_cluster', 60));
                projectiles.push(new Projectile(this.x + 40, this.y, 80, -350, false, 'missile_cluster', 60));
            } else {
                // Tier 3: Full ripple salvo of 5 cluster rockets
                for (let i = 0; i < 5; i++) {
                    const vx = (i - 2) * 55;
                    projectiles.push(new Projectile(this.x + (i - 2) * 14, this.y, vx, -380, false, 'missile_cluster', 55));
                }
            }
        } else if (this.type === 'zero') {
            // Zero: Agile homing missiles (fast, precise)
            if (audio) audio.playShootLaser();
            if (lvl === 1) {
                // targetSpeed=650, launch at -580
                projectiles.push(new Projectile(this.x - 16, this.y, -60, -580, false, 'laser_missile', 38));
                projectiles.push(new Projectile(this.x + 16, this.y, 60, -580, false, 'laser_missile', 38));
            } else if (lvl === 2) {
                // targetSpeed=650/850
                projectiles.push(new Projectile(this.x - 20, this.y, -90, -580, false, 'laser_missile', 45));
                projectiles.push(new Projectile(this.x, this.y, 0, -750, false, 'laser_dart', 40));
                projectiles.push(new Projectile(this.x + 20, this.y, 90, -580, false, 'laser_missile', 45));
            } else {
                // Tier 3: Six laser darts burst – ultra agile (targetSpeed=850, launch at -780)
                for (let i = 0; i < 6; i++) {
                    const vx = (i - 2.5) * 70;
                    projectiles.push(new Projectile(this.x, this.y, vx, -780, false, 'laser_dart', 30));
                }
            }
        }
    }

    fireChargeShot(projectiles, audio, particles) {
        if (audio) audio.playChargeFire();
        if (particles) particles.triggerShake(0.4, 12);

        if (this.type === 'p38') {
            projectiles.push(new Projectile(this.x, this.y, 0, -450, false, 'lightning_orb', 100));
        } else if (this.type === 'pancake') {
            projectiles.push(new Projectile(this.x, this.y, 0, -800, false, 'mega_laser', 6));
        } else if (this.type === 'mitchell') {
            const shell = new Projectile(this.x, this.y, 0, -350, false, 'artillery_shell', 180);
            shell.detonationTimer = 0.8;
            projectiles.push(shell);
        } else if (this.type === 'corsair') {
            // Corsair: spread artillery barrage (3 heavy shells)
            [-80, 0, 80].forEach(vx => {
                const shell = new Projectile(this.x, this.y, vx, -380, false, 'artillery_shell', 140);
                shell.detonationTimer = 0.65;
                projectiles.push(shell);
            });
        } else if (this.type === 'zero') {
            // Zero: lightning chain orb (agile charge)
            projectiles.push(new Projectile(this.x, this.y, 0, -500, false, 'lightning_orb', 80));
        }
    }

    fireWeapons(projectiles, audio) {
        const lvl = this.upgrades.weapon;
        // Bullet speed scales with weapon upgrade: Lvl1=650, Lvl2=820, Lvl3=1020
        const bulletSpeed = -this._calcBulletSpeed();

        if (this.type === 'p38') {
            audio.playShootNormal();
            if (lvl === 1) {
                projectiles.push(new Projectile(this.x - 6, this.y - 20, 0, bulletSpeed, false, 'normal', 10));
                projectiles.push(new Projectile(this.x + 6, this.y - 20, 0, bulletSpeed, false, 'normal', 10));
            } else if (lvl === 2) {
                projectiles.push(new Projectile(this.x - 10, this.y - 20, 0, bulletSpeed, false, 'normal', 10));
                projectiles.push(new Projectile(this.x, this.y - 25, 0, bulletSpeed, false, 'normal', 12));
                projectiles.push(new Projectile(this.x + 10, this.y - 20, 0, bulletSpeed, false, 'normal', 10));
            } else {
                projectiles.push(new Projectile(this.x - 14, this.y - 18, -40, bulletSpeed, false, 'normal', 10));
                projectiles.push(new Projectile(this.x - 5, this.y - 22, 0, bulletSpeed, false, 'normal', 12));
                projectiles.push(new Projectile(this.x + 5, this.y - 22, 0, bulletSpeed, false, 'normal', 12));
                projectiles.push(new Projectile(this.x + 14, this.y - 18, 40, bulletSpeed, false, 'normal', 10));
            }
        } else if (this.type === 'pancake') {
            if (lvl === 1) {
                audio.playShootLaser();
                projectiles.push(new Projectile(this.x - 22, this.y - 15, 0, bulletSpeed, false, 'laser', 12));
                projectiles.push(new Projectile(this.x + 22, this.y - 15, 0, bulletSpeed, false, 'laser', 12));
            } else if (lvl === 2) {
                audio.playShootLaser();
                projectiles.push(new Projectile(this.x - 24, this.y - 15, -60, bulletSpeed, false, 'laser', 12));
                projectiles.push(new Projectile(this.x - 10, this.y - 20, 0, bulletSpeed, false, 'laser', 14));
                projectiles.push(new Projectile(this.x + 10, this.y - 20, 0, bulletSpeed, false, 'laser', 14));
                projectiles.push(new Projectile(this.x + 24, this.y - 15, 60, bulletSpeed, false, 'laser', 12));
            } else {
                audio.playShootLaser();
                projectiles.push(new Projectile(this.x - 28, this.y - 15, -120, bulletSpeed, false, 'laser', 12));
                projectiles.push(new Projectile(this.x - 16, this.y - 18, -40, bulletSpeed, false, 'laser', 14));
                projectiles.push(new Projectile(this.x, this.y - 25, 0, bulletSpeed, false, 'laser', 16));
                projectiles.push(new Projectile(this.x + 16, this.y - 18, 40, bulletSpeed, false, 'laser', 14));
                projectiles.push(new Projectile(this.x + 28, this.y - 15, 120, bulletSpeed, false, 'laser', 12));
            }
        } else if (this.type === 'mitchell') {
            audio.playShootHeavy();
            if (lvl === 1) {
                projectiles.push(new Projectile(this.x, this.y - 30, 0, bulletSpeed * 0.9, false, 'heavy', 25));
            } else if (lvl === 2) {
                projectiles.push(new Projectile(this.x - 12, this.y - 25, 0, bulletSpeed * 0.9, false, 'heavy', 25));
                projectiles.push(new Projectile(this.x + 12, this.y - 25, 0, bulletSpeed * 0.9, false, 'heavy', 25));
            } else {
                projectiles.push(new Projectile(this.x - 16, this.y - 25, -50, bulletSpeed * 0.9, false, 'heavy', 22));
                projectiles.push(new Projectile(this.x, this.y - 35, 0, bulletSpeed * 0.9, false, 'heavy', 30));
                projectiles.push(new Projectile(this.x + 16, this.y - 25, 50, bulletSpeed * 0.9, false, 'heavy', 22));
                projectiles.push(new Projectile(this.x - 24, this.y - 10, -320, -350, false, 'normal', 10));
                projectiles.push(new Projectile(this.x + 24, this.y - 10, 320, -350, false, 'normal', 10));
            }
            // Mitchell rear defense turret
            const turretLvl = this.upgrades.special;
            if (this.upgrades.weapon >= 2 || turretLvl > 0) {
                const dmg = 8 + turretLvl * 6; // caliber (damage) scales with special upgrade
                const bulletType = turretLvl >= 2 ? 'heavy' : 'normal';
                
                if (turretLvl === 3) {
                    // Level 3: Triple rear fire spread
                    projectiles.push(new Projectile(this.x - 10, this.y + 24, -40, 450, false, bulletType, dmg));
                    projectiles.push(new Projectile(this.x, this.y + 24, 0, 470, false, bulletType, dmg + 2));
                    projectiles.push(new Projectile(this.x + 10, this.y + 24, 40, 450, false, bulletType, dmg));
                } else if (turretLvl === 2) {
                    // Level 2: Twin rear fire
                    projectiles.push(new Projectile(this.x - 8, this.y + 24, -15, 450, false, bulletType, dmg));
                    projectiles.push(new Projectile(this.x + 8, this.y + 24, 15, 450, false, bulletType, dmg));
                } else {
                    // Level 0 or 1: Single rear fire
                    projectiles.push(new Projectile(this.x, this.y + 24, (Math.random() - 0.5) * 40, 450, false, bulletType, dmg));
                }
            }
        } else if (this.type === 'corsair') {
            // F4U Corsair: 6x .50cal wing-mounted guns (3 per wing)
            audio.playShootNormal();
            if (lvl === 1) {
                // 4 guns
                projectiles.push(new Projectile(this.x - 28, this.y - 8, 0, bulletSpeed, false, 'normal', 12));
                projectiles.push(new Projectile(this.x - 14, this.y - 12, 0, bulletSpeed, false, 'normal', 12));
                projectiles.push(new Projectile(this.x + 14, this.y - 12, 0, bulletSpeed, false, 'normal', 12));
                projectiles.push(new Projectile(this.x + 28, this.y - 8, 0, bulletSpeed, false, 'normal', 12));
            } else if (lvl === 2) {
                // 5 guns + slight spread
                projectiles.push(new Projectile(this.x - 40, this.y - 6, -20, bulletSpeed, false, 'heavy', 14));
                projectiles.push(new Projectile(this.x - 22, this.y - 10, 0, bulletSpeed, false, 'normal', 13));
                projectiles.push(new Projectile(this.x, this.y - 14, 0, bulletSpeed, false, 'normal', 14));
                projectiles.push(new Projectile(this.x + 22, this.y - 10, 0, bulletSpeed, false, 'normal', 13));
                projectiles.push(new Projectile(this.x + 40, this.y - 6, 20, bulletSpeed, false, 'heavy', 14));
            } else {
                // All 6 guns + flak spread
                projectiles.push(new Projectile(this.x - 46, this.y - 5, -45, bulletSpeed * 0.95, false, 'heavy', 14));
                projectiles.push(new Projectile(this.x - 30, this.y - 9, -15, bulletSpeed, false, 'normal', 13));
                projectiles.push(new Projectile(this.x - 14, this.y - 13, 0, bulletSpeed, false, 'normal', 13));
                projectiles.push(new Projectile(this.x + 14, this.y - 13, 0, bulletSpeed, false, 'normal', 13));
                projectiles.push(new Projectile(this.x + 30, this.y - 9, 15, bulletSpeed, false, 'normal', 13));
                projectiles.push(new Projectile(this.x + 46, this.y - 5, 45, bulletSpeed * 0.95, false, 'heavy', 14));
            }
        } else if (this.type === 'zero') {
            // A6M Zero: rapid twin 20mm cannons, high fire rate
            audio.playShootLaser();
            if (lvl === 1) {
                projectiles.push(new Projectile(this.x - 9, this.y - 22, 0, bulletSpeed * 1.05, false, 'laser', 11));
                projectiles.push(new Projectile(this.x + 9, this.y - 22, 0, bulletSpeed * 1.05, false, 'laser', 11));
            } else if (lvl === 2) {
                projectiles.push(new Projectile(this.x - 12, this.y - 22, -25, bulletSpeed * 1.05, false, 'laser', 12));
                projectiles.push(new Projectile(this.x, this.y - 26, 0, bulletSpeed * 1.05, false, 'laser', 13));
                projectiles.push(new Projectile(this.x + 12, this.y - 22, 25, bulletSpeed * 1.05, false, 'laser', 12));
            } else {
                // Full 4-gun burst with converging fire
                projectiles.push(new Projectile(this.x - 20, this.y - 20, -15, bulletSpeed * 1.05, false, 'laser', 12));
                projectiles.push(new Projectile(this.x - 8, this.y - 24, 0, bulletSpeed * 1.08, false, 'laser', 13));
                projectiles.push(new Projectile(this.x + 8, this.y - 24, 0, bulletSpeed * 1.08, false, 'laser', 13));
                projectiles.push(new Projectile(this.x + 20, this.y - 20, 15, bulletSpeed * 1.05, false, 'laser', 12));
            }
        }

        // Auxiliary Wingmen support fire (P-38 and Corsair only)
        if ((this.type === 'p38' || this.type === 'corsair') && this.upgrades.special > 0) {
            const numWingmen = this.upgrades.special;
            if (numWingmen >= 1) {
                projectiles.push(new Projectile(this.x - 42, this.y + 10, 0, bulletSpeed * 0.95, false, 'normal', 8));
            }
            if (numWingmen >= 2) {
                projectiles.push(new Projectile(this.x + 42, this.y + 10, 0, bulletSpeed * 0.95, false, 'normal', 8));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Scale aircraft dynamically for Loop maneuver (creates depth projection)
        const renderScale = this.scaleMultiplier;
        ctx.scale(renderScale, renderScale);

        // Fetch plane cached image from Assets
        let planeImg = Assets.p38;
        if (this.type === 'pancake') planeImg = Assets.pancake;
        if (this.type === 'mitchell') planeImg = Assets.mitchell;
        if (this.type === 'corsair') planeImg = Assets.corsair;
        if (this.type === 'zero') planeImg = Assets.zero;

        // Draw the core plane centered
        if (planeImg) {
            ctx.drawImage(planeImg, -planeImg.width/2, -planeImg.height/2);
        }

        // Draw animated rotating propellers (visual detail)
        this.drawPropellers(ctx);

        // Shield Ring Indicator (active shield ripple for any plane)
        if (this.shield > 0) {
            const maxSh = this.maxShield > 0 ? this.maxShield : 60;
            ctx.strokeStyle = `rgba(0, 176, 255, ${0.1 + (this.shield / maxSh) * 0.35})`;
            ctx.shadowColor = '#00b0ff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 42, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Weapon Upgrade Flash Ring - pulses when weapon is collected
        if (this.weaponFlashTimer > 0) {
            const flashIntensity = Math.sin(this.weaponFlashTimer * 20) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(0, 229, 255, ${flashIntensity * 0.8})`;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 20 * flashIntensity;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 52 + flashIntensity * 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Charge Progress Ring
        if (this.isCharging && this.chargeProgress > 0) {
            const ringColor = this.type === 'p38' ? '#ffd700' : (this.type === 'pancake' ? '#00e5ff' : '#ff5722');
            ctx.save();
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            
            // Draw background ring track
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.arc(0, 0, 46, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw filled progress track
            ctx.strokeStyle = ringColor;
            ctx.shadowColor = ringColor;
            ctx.shadowBlur = this.chargeProgress >= 1.0 ? 12 : 5;
            ctx.beginPath();
            ctx.arc(0, 0, 46, -Math.PI / 2, -Math.PI / 2 + this.chargeProgress * Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
 
        ctx.restore();

        // Draw helper Wingmen beside player (P-38 and Corsair only)
        if ((this.type === 'p38' || this.type === 'corsair') && this.upgrades.special > 0 && !this.isLooping) {
            const numWingmen = this.upgrades.special;
            const wImg = Assets.wingman;
            if (wImg) {
                ctx.save();
                if (numWingmen >= 1) {
                    ctx.drawImage(wImg, this.x - 42 - wImg.width/2, this.y + 10 - wImg.height/2);
                }
                if (numWingmen >= 2) {
                    ctx.drawImage(wImg, this.x + 42 - wImg.width/2, this.y + 10 - wImg.height/2);
                }
                ctx.restore();
            }
        }
    }

    drawPropellers(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;

        const renderProp = (px, py, r) => {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(this.propAngle);
            
            // Draw revolving blur oval disk
            ctx.fillStyle = 'rgba(230, 240, 255, 0.15)';
            ctx.beginPath();
            ctx.ellipse(0, 0, r, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw two actual spinning blades
            ctx.beginPath();
            ctx.moveTo(0, -r); ctx.lineTo(0, r);
            ctx.stroke();
            ctx.restore();
        };

        if (this.type === 'p38') {
            renderProp(-24, -22, 12);
            renderProp(24, -22, 12);
        } else if (this.type === 'pancake') {
            renderProp(-30, -28, 10);
            renderProp(30, -28, 10);
        } else if (this.type === 'mitchell') {
            renderProp(-28, -18, 16);
            renderProp(28, -18, 16);
        } else if (this.type === 'corsair') {
            renderProp(0, -38, 14);
        } else if (this.type === 'zero') {
            renderProp(0, -38, 12);
        }
        ctx.restore();
    }
}
