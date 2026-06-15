/* ----------------------------------------------------
   194XDD Enemies - Scouts, Bombers & Multi-Part Boss
   ---------------------------------------------------- */

import { Assets } from '../assets.js';
import { Projectile } from './projectile.js';

class BaseEnemy {
    constructor(x, y, type, health, scoreVal) {
        this.x = x;
        this.y = y;
        this.type = type; // 'scout', 'bomber', 'boss_wing', 'boss_turret', 'boss_core'
        this.health = health;
        this.maxHealth = health;
        this.scoreVal = scoreVal;
        this.active = true;
        this.stage = 1; // Default stage
        
        // Hit flash animation
        this.hitFlashTimer = 0;
        
        this.width = 32;
        this.height = 32;
        this.radius = 16;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlashTimer = 0.08; // Flash white for 0.08 seconds
        if (this.health <= 0) {
            this.active = false;
            return true; // killed
        }
        return false;
    }

    updateFlash(dt) {
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
    }

    drawFlashOverlay(ctx, img, xOffset, yOffset) {
        ctx.drawImage(img, xOffset, yOffset);
        if (this.hitFlashTimer > 0) {
            // Double-draw with 'lighter' composite: brightens pixel colours
            // without any rectangular clip artifact
            const intensity = Math.min(1.0, this.hitFlashTimer * 14);
            ctx.save();
            ctx.globalAlpha = intensity * 0.65;
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(img, xOffset, yOffset);
            ctx.restore();
        }
    }
}

/* ----------------------------------------------------
   1. SCOUT ENEMY (Fast sweeping interceptor)
   ---------------------------------------------------- */
export class EnemyScout extends BaseEnemy {
    constructor(x, y, pathType = 'sine', speed = 160) {
        super(x, y, 'scout', 12, 100);
        this.pathType = pathType; // 'sine', 'straight'
        this.speed = speed;
        
        this.width = 48;
        this.height = 48;
        this.radius = 16;
        
        // Flight parameters
        this.startX = x;
        this.timeElapsed = 0;
        this.shootTimer = Math.random() * 1.5;
        this.shootInterval = 1.6; // fires occasionally
    }

    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.timeElapsed += dt;
        this.updateFlash(dt);

        // Movement flight path
        if (this.pathType === 'sine') {
            this.y += this.speed * dt;
            // Left-right sweeping wave
            this.x = this.startX + Math.sin(this.timeElapsed * 4) * 80;
        } else {
            // Straight dive
            this.y += this.speed * dt;
        }

        // Firing logic
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval && this.y < canvasHeight * 0.6) {
            this.shoot(projectiles, playerX, playerY);
            this.shootTimer = 0;
        }

        // Out of bounds recycle
        if (this.y > canvasHeight + 100) {
            this.active = false;
        }
    }

    shoot(projectiles, playerX, playerY) {
        // Aim shot at player coordinates
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        const bulletSpeed = 280 + (this.stage - 1) * 12;
        const vx = (dx / len) * bulletSpeed;
        const vy = (dy / len) * bulletSpeed;

        projectiles.push(new Projectile(this.x, this.y + 10, vx, vy, true, 'normal', 10));
        
        // Scouts with lower remaining health fire a wider spread (damaged/angry)
        if (this.health < this.maxHealth * 0.5) {
            projectiles.push(new Projectile(this.x, this.y + 10, vx - 60, vy, true, 'normal', 8));
            projectiles.push(new Projectile(this.x, this.y + 10, vx + 60, vy, true, 'normal', 8));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(1, 1); // Face down

        // Draw shadow offset
        if (Assets.enemyScout) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 12;

            this.drawFlashOverlay(ctx, Assets.enemyScout, -Assets.enemyScout.width/2, -Assets.enemyScout.height/2);
        }
        ctx.restore();
    }
}

/* ----------------------------------------------------
   2. BOMBER ENEMY (Heavy, vertical scroller)
   ---------------------------------------------------- */
export class EnemyBomber extends BaseEnemy {
    constructor(x, y, speed = 80) {
        super(x, y, 'bomber', 60, 400);
        this.speed = speed;
        this.width = 80;
        this.height = 80;
        this.radius = 32;

        this.shootTimer = 0.5 + Math.random() * 1.5;
        this.shootInterval = 2.0;
    }

    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.updateFlash(dt);
        this.y += this.speed * dt;

        // Firing logic
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval && this.y < canvasHeight * 0.7) {
            this.shoot(projectiles, playerX, playerY);
            this.shootTimer = 0;
        }

        if (this.y > canvasHeight + 150) {
            this.active = false;
        }
    }

    shoot(projectiles, playerX, playerY) {
        // Dual targeted bullet spray
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        const bulletSpeed = 260 + (this.stage - 1) * 12;
        const vx = (dx / len) * bulletSpeed;
        const vy = (dy / len) * bulletSpeed;

        // Spread bullets slightly
        projectiles.push(new Projectile(this.x - 16, this.y + 15, vx - 30, vy, true, 'normal', 10));
        projectiles.push(new Projectile(this.x + 16, this.y + 15, vx + 30, vy, true, 'normal', 10));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (Assets.enemyBomber) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 12;
            ctx.shadowOffsetY = 16;

            this.drawFlashOverlay(ctx, Assets.enemyBomber, -Assets.enemyBomber.width/2, -Assets.enemyBomber.height/2);
        }
        ctx.restore();
    }
}

/* ----------------------------------------------------
   3. GIANT BOSS BOMBER (Ayako Superfortress)
   ---------------------------------------------------- */
export class BossAyako {
    constructor(x, y, stage = 1) {
        this.x = x;
        this.y = y;
        this.stage = stage;
        this.targetY = 180; // hovers near top
        this.speed = 40;
        this.isBoss = true;
        
        this.active = true;
        this.isDead = false;

        this.timeElapsed = 0;
        this.floatRange = 60; // hovers left/right
        this.floatSpeed = 0.5;

        // 1. Setup multi-component structural sections
        this.core = new BaseEnemy(x, y, 'boss_core', 350, 5000);
        this.core.radius = 45;
        this.core.width = 90;
        this.core.height = 160;

        this.wingLeft = new BaseEnemy(x - 90, y - 20, 'boss_wing', 180, 2000);
        this.wingLeft.radius = 40;
        this.wingLeft.width = 110;
        this.wingLeft.height = 50;

        this.wingRight = new BaseEnemy(x + 90, y - 20, 'boss_wing', 180, 2000);
        this.wingRight.radius = 40;
        this.wingRight.width = 110;
        this.wingRight.height = 50;

        // Destructible auxiliary turrets
        this.turrets = [
            { id: 0, xOffset: -35, yOffset: -30, active: true, obj: new BaseEnemy(x - 35, y - 30, 'boss_turret', 80, 800), shootTimer: 0 },
            { id: 1, xOffset: 35, yOffset: -30, active: true, obj: new BaseEnemy(x + 35, y - 30, 'boss_turret', 80, 800), shootTimer: 0.8 },
            { id: 2, xOffset: 0, yOffset: 40, active: true, obj: new BaseEnemy(x, y + 40, 'boss_turret', 100, 1000), shootTimer: 0.4 }
        ];
        this.turrets.forEach(t => t.obj.radius = 15);

        // Attack patterns
        this.attackPatternIndex = 0;
        this.attackTimer = 0;
        this.phase = 1;
    }

    getScore() {
        return this.core.scoreVal + 
               (!this.wingLeft.active ? this.wingLeft.scoreVal : 0) + 
               (!this.wingRight.active ? this.wingRight.scoreVal : 0);
    }

    update(dt, playerX, playerY, projectiles, particles, audio) {
        this.timeElapsed += dt;

        // Entry sweep intro
        if (this.y < this.targetY) {
            this.y += this.speed * dt;
        } else {
            // Hover side to side
            this.y = this.targetY + Math.sin(this.timeElapsed * 0.8) * 15;
            this.x = (particles.width / 2) + Math.cos(this.timeElapsed * this.floatSpeed) * this.floatRange;
        }

        // Align coordinates of components based on current boss position
        this.core.x = this.x;
        this.core.y = this.y;
        this.core.updateFlash(dt);

        this.wingLeft.x = this.x - 90;
        this.wingLeft.y = this.y - 12;
        this.wingLeft.updateFlash(dt);

        this.wingRight.x = this.x + 90;
        this.wingRight.y = this.y - 12;
        this.wingRight.updateFlash(dt);

        // Update active turrets
        this.turrets.forEach(t => {
            if (t.active) {
                t.obj.x = this.x + t.xOffset;
                t.obj.y = this.y + t.yOffset;
                t.obj.updateFlash(dt);
                
                // Turret fire controller (faster shots in later stages)
                t.shootTimer += dt;
                let baseCooldown = (this.phase === 2) ? 1.0 : 1.6;
                let shootCooldown = Math.max(0.4, baseCooldown - (this.stage - 1) * 0.15);
                if (t.shootTimer >= shootCooldown) {
                    this.fireTurret(t, projectiles, playerX, playerY);
                    t.shootTimer = 0;
                }
            }
        });

        // Phase controller
        if (this.phase === 1 && (!this.wingLeft.active || !this.wingRight.active)) {
            this.phase = 2; // Wing broken, accelerate fires
            audio.setBossTempo();
        }

        // Core core loop attack (ring blast)
        this.attackTimer += dt;
        let coreBlastInterval = Math.max(1.2, 3.0 - (this.stage - 1) * 0.25);
        if (this.attackTimer >= coreBlastInterval && this.core.active) {
            this.fireCoreBlast(projectiles);
            this.attackTimer = 0;
        }

        // Destroy sequence validation
        if (!this.core.active && !this.isDead) {
            this.isDead = true;
            this.active = false; // complete death
        }
    }

    fireTurret(turret, projectiles, playerX, playerY) {
        // Target player
        const dx = playerX - turret.obj.x;
        const dy = playerY - turret.obj.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        const bulletSpeed = 230 + (this.stage - 1) * 20;
        const vx = (dx / len) * bulletSpeed;
        const vy = (dy / len) * bulletSpeed;

        if (turret.id === 2) {
            // Center tail gun fires a triple fan sweep downwards
            projectiles.push(new Projectile(turret.obj.x, turret.obj.y, vx, vy, true, 'normal', 12));
            projectiles.push(new Projectile(turret.obj.x, turret.obj.y, vx - 50, vy, true, 'normal', 10));
            projectiles.push(new Projectile(turret.obj.x, turret.obj.y, vx + 50, vy, true, 'normal', 10));

            // Stage 6+ fires warning targeted bursts from the center tail turret
            if (this.stage >= 6 && Math.random() < 0.4) {
                projectiles.push(new Projectile(turret.obj.x, turret.obj.y, vx * 0.5, vy * 0.5, true, 'normal', 15));
            }
        } else {
            // Wings gun fire single precise heavy plasma bullets
            // Stage 5+ wing turrets fire tracking laser beam projectiles
            if (this.stage >= 5) {
                projectiles.push(new Projectile(turret.obj.x, turret.obj.y, vx * 1.2, vy * 1.2, true, 'laser', 14));
            } else {
                projectiles.push(new Projectile(turret.obj.x, turret.obj.y, vx, vy, true, 'boss', 15));
            }
        }
    }

    fireCoreBlast(projectiles) {
        // Fires rotating ring of radial plasma bullets - bullet count scales with stage
        const count = 8 + (this.stage * 2);
        const speed = 200 + (this.stage * 15);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (this.timeElapsed * 0.6);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            projectiles.push(new Projectile(this.x, this.y, vx, vy, true, 'boss', 12));
        }
    }

    checkCollision(bulletX, bulletY, bulletRad, bulletDmg, particles, audio) {
        // Check structural components one by one (turrets -> wings -> core)
        
        // 1. Turrets first (shields core)
        for (let i = 0; i < this.turrets.length; i++) {
            const t = this.turrets[i];
            if (t.active) {
                const dist = Math.hypot(bulletX - t.obj.x, bulletY - t.obj.y);
                if (dist < bulletRad + t.obj.radius) {
                    particles.spawnSparks(bulletX, bulletY, '#ff3366');
                    const killed = t.obj.takeDamage(bulletDmg);
                    if (killed) {
                        t.active = false;
                        particles.spawnExplosionScout(t.obj.x, t.obj.y);
                        audio.playExplosionBomber();
                    }
                    return true; // hit consumed
                }
            }
        }

        // 2. Wings check
        if (this.wingLeft.active) {
            const dist = Math.hypot(bulletX - this.wingLeft.x, bulletY - this.wingLeft.y);
            if (dist < bulletRad + this.wingLeft.radius) {
                particles.spawnSparks(bulletX, bulletY, '#ffca28');
                const killed = this.wingLeft.takeDamage(bulletDmg);
                if (killed) {
                    particles.spawnExplosionBomber(this.wingLeft.x, this.wingLeft.y);
                    audio.playExplosionBomber();
                }
                return true;
            }
        }

        if (this.wingRight.active) {
            const dist = Math.hypot(bulletX - this.wingRight.x, bulletY - this.wingRight.y);
            if (dist < bulletRad + this.wingRight.radius) {
                particles.shadowColor = 'transparent';
                particles.spawnSparks(bulletX, bulletY, '#ffca28');
                const killed = this.wingRight.takeDamage(bulletDmg);
                if (killed) {
                    particles.spawnExplosionBomber(this.wingRight.x, this.wingRight.y);
                    audio.playExplosionBomber();
                }
                return true;
            }
        }

        // 3. Central Core pod
        const dist = Math.hypot(bulletX - this.core.x, bulletY - this.core.y);
        if (dist < bulletRad + this.core.radius) {
            particles.spawnSparks(bulletX, bulletY, '#ffffff');
            const killed = this.core.takeDamage(bulletDmg);
            if (killed) {
                particles.spawnExplosionBomber(this.core.x, this.core.y);
            }
            return true;
        }

        return false; // missed boss completely
    }

    draw(ctx) {
        ctx.save();
        
        // Procedural color shift filter for each stage boss flagship
        if (this.stage > 1) {
            const shift = (this.stage - 1) * 45;
            ctx.filter = `hue-rotate(${shift}deg) saturate(1.3)`;
        }

        // Render Drop Shadows for Boss (3D elevation offset)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 24;
        ctx.shadowOffsetY = 36;

        // 1. Draw Wings (if alive, otherwise draw broken pieces with smoking fires)
        if (this.wingLeft.active) {
            ctx.save();
            ctx.translate(this.x - 90, this.y - 12);
            this.wingLeft.drawFlashOverlay(ctx, Assets.bossWingLeft, -Assets.bossWingLeft.width, -Assets.bossWingLeft.height/2);
            ctx.restore();
        } else {
            // Draw broken left wing stub with sparks/smoke details
            ctx.save();
            ctx.fillStyle = '#102027';
            ctx.beginPath();
            ctx.ellipse(this.x - 36, this.y - 10, 8, 12, Math.PI / 6, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        if (this.wingRight.active) {
            ctx.save();
            ctx.translate(this.x + 90, this.y - 12);
            this.wingRight.drawFlashOverlay(ctx, Assets.bossWingRight, 0, -Assets.bossWingRight.height/2);
            ctx.restore();
        } else {
            // Draw broken right wing stub
            ctx.save();
            ctx.fillStyle = '#102027';
            ctx.beginPath();
            ctx.ellipse(this.x + 36, this.y - 10, 8, 12, -Math.PI / 6, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Draw Main Fuselage Core
        ctx.save();
        ctx.translate(this.x, this.y);
        this.core.drawFlashOverlay(ctx, Assets.bossFuselage, -Assets.bossFuselage.width/2, -Assets.bossFuselage.height/2);
        ctx.restore();

        // Remove shadow blurring for small turrets on top
        ctx.shadowColor = 'transparent';

        // 3. Draw active Turrets on top
        this.turrets.forEach(t => {
            if (t.active) {
                ctx.save();
                ctx.translate(this.x + t.xOffset, this.y + t.yOffset);
                t.obj.drawFlashOverlay(ctx, Assets.bossTurret, -Assets.bossTurret.width/2, -Assets.bossTurret.height/2);
                ctx.restore();
            }
        });

        ctx.restore();
    }
}

/* ----------------------------------------------------
   4. KAMIKAZE ENEMY (Fast diving rammer)
   ---------------------------------------------------- */
export class EnemyKamikaze extends BaseEnemy {
    constructor(x, y, speed = 260) {
        super(x, y, 'kamikaze', 15, 200);
        this.speed = speed;
        this.width = 40;
        this.height = 40;
        this.radius = 14;
        this.targetAcquired = false;
        this.tx = 0;
        this.ty = 0;
        this.vx = 0;
        this.vy = 0;
    }

    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.updateFlash(dt);

        // Lock target coordinate once when close
        if (!this.targetAcquired) {
            this.tx = playerX;
            this.ty = playerY;
            if (this.y > 150) {
                this.targetAcquired = true;
                // accelerate towards locked point
                const dx = this.tx - this.x;
                const dy = this.ty - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    this.vx = (dx / dist) * this.speed * 1.5;
                    this.vy = (dy / dist) * this.speed * 1.5;
                }
            } else {
                this.y += this.speed * dt;
                this.x += Math.sin(this.y * 0.05) * 50 * dt; // gentle sway before lock
            }
        } else {
            // charge forward with locked velocity
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        if (this.y > canvasHeight + 80 || this.x < -80 || this.x > canvasWidth + 80) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.targetAcquired) {
            const angle = Math.atan2(this.vy, this.vx) + Math.PI/2;
            ctx.rotate(angle);
        }

        // Hit flash logic
        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        } else {
            ctx.fillStyle = '#ff1744'; // Bright red body
        }

        // Draw Delta wing fighter
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = this.targetAcquired ? 12 : 4;

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-20, 15);
        ctx.lineTo(-6, 8);
        ctx.lineTo(6, 8);
        ctx.lineTo(20, 15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#880e4f';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing Thruster
        ctx.fillStyle = '#ff9100';
        ctx.fillRect(-4, 8, 8, 8);

        ctx.restore();
    }
}

/* ----------------------------------------------------
   5. DEFENSIVE GUNSHIP (Heavy armored stationary turret)
   ---------------------------------------------------- */
export class EnemyGunship extends BaseEnemy {
    constructor(x, y, speed = 50) {
        super(x, y, 'gunship', 90, 600);
        this.speed = speed;
        this.width = 72;
        this.height = 64;
        this.radius = 28;
        
        this.shootTimer = 0.5 + Math.random() * 1.0;
        this.shootInterval = 2.4;
        this.hoverY = 120 + Math.random() * 100;
        this.dirX = Math.random() < 0.5 ? -1 : 1;
    }

    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.updateFlash(dt);

        // Move down to hover height, then drift side-to-side
        if (this.y < this.hoverY) {
            this.y += this.speed * dt;
        } else {
            this.x += 40 * this.dirX * dt;
            if (this.x < 60) {
                this.x = 60;
                this.dirX = 1;
            } else if (this.x > canvasWidth - 60) {
                this.x = canvasWidth - 60;
                this.dirX = -1;
            }
        }

        // Circular spray fire
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval && this.y > 0) {
            this.shoot(projectiles);
            this.shootTimer = 0;
        }

        if (this.y > canvasHeight + 100) {
            this.active = false;
        }
    }

    shoot(projectiles) {
        // Fires a circular pattern of 8 bullets when at full health
        // At low health, fires a spiraling 12-bullet burst (angry phase)
        const isAngry = this.health < this.maxHealth * 0.4;
        const count = isAngry ? 12 : 8;
        const speed = isAngry ? 240 : 200;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (isAngry ? this.shootTimer * 0.5 : 0);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            projectiles.push(new Projectile(this.x, this.y + 10, vx, vy, true, 'normal', isAngry ? 12 : 10));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 8;

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        } else {
            ctx.fillStyle = '#37474f'; // Dark steel hull
        }

        // Armored hull block shape
        ctx.beginPath();
        ctx.moveTo(-36, -10);
        ctx.lineTo(36, -10);
        ctx.lineTo(24, 24);
        ctx.lineTo(-24, 24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd54f'; // gold lining
        ctx.lineWidth = 2;
        ctx.stroke();

        // Heavy guns sticking out
        ctx.fillStyle = '#102027';
        ctx.fillRect(-20, 16, 6, 16);
        ctx.fillRect(14, 16, 6, 16);

        // Core glow
        ctx.fillStyle = '#ff3d00';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/* ----------------------------------------------------
   6. STEALTH FIGHTER (Flanking entry)
   ---------------------------------------------------- */
export class EnemyStealth extends BaseEnemy {
    constructor(x, y, side = 'left', speed = 180) {
        super(x, y, 'stealth', 25, 300);
        this.speed = speed;
        this.width = 48;
        this.height = 40;
        this.radius = 18;
        this.side = side; // 'left' or 'right'
        
        // set diagonal velocities
        this.vx = side === 'left' ? speed * 1.1 : -speed * 1.1;
        this.vy = speed * 0.7;

        this.shootTimer = 0.3;
        this.shotsFired = 0;
    }

    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.updateFlash(dt);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Fires a burst of 3 tracking shots
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.shotsFired < 3 && this.y > 40 && this.x > 30 && this.x < canvasWidth - 30) {
            this.shoot(projectiles, playerX, playerY);
            this.shootTimer = 0.28; // delay between burst shots
            this.shotsFired++;
        }

        if (this.y > canvasHeight + 100 || this.x < -100 || this.x > canvasWidth + 100) {
            this.active = false;
        }
    }

    shoot(projectiles, playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            const speed = 320 + (this.stage - 1) * 15;
            const vx = (dx / dist) * speed;
            const vy = (dy / dist) * speed;
            // Stealth fires a tight spread of 3 bullets
            projectiles.push(new Projectile(this.x, this.y, vx, vy, true, 'normal', 12));
            projectiles.push(new Projectile(this.x, this.y, vx - 50, vy, true, 'normal', 8));
            projectiles.push(new Projectile(this.x, this.y, vx + 50, vy, true, 'normal', 8));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        ctx.rotate(angle);

        ctx.shadowColor = '#d500f9'; // Purple plasma glow
        ctx.shadowBlur = 6;

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
        } else {
            ctx.fillStyle = '#212121'; // matte black
        }

        // Diamond arrowhead shape
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(-24, 12);
        ctx.lineTo(0, 2);
        ctx.lineTo(24, 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d500f9';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
    }
}

/* ----------------------------------------------------
   7. FLOATING MINE (Exploding hazard)
   ---------------------------------------------------- */
export class EnemyMine extends BaseEnemy {
    constructor(x, y, speed = 80) {
        super(x, y, 'mine', 35, 150);
        this.speed = speed;
        this.width = 44;
        this.height = 44;
        this.radius = 16;
        this.angle = Math.random() * Math.PI;
        this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
    }

    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.updateFlash(dt);
        
        this.y += this.speed * dt;
        this.angle += this.rotSpeed * dt;

        if (this.y > canvasHeight + 80) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 8;

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#fff';
        } else {
            ctx.fillStyle = '#263238';
            ctx.strokeStyle = '#ffb300'; // glowing spikes
        }

        // Draw spiked core ball
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -22);
            ctx.stroke();
        }

        // center core ball
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

export class EnemyGroundTarget extends BaseEnemy {
    constructor(x, y, targetType = 'aa_turret', stage = 1) {
        // base health and score
        let hp = 40 + (stage - 1) * 15;
        let score = 250;
        if (targetType === 'ship') {
            hp = 80 + (stage - 1) * 25;
            score = 500;
        }
        
        super(x, y, 'ground_target', hp, score);
        this.targetType = targetType; // 'aa_turret', 'tank', 'ship', 'space_turret'
        this.stage = stage;
        this.isGroundTarget = true;
        this.isDestroyed = false;
        
        // Dimensions
        if (targetType === 'ship') {
            this.width = 48;
            this.height = 96;
            this.radius = 24;
        } else {
            this.width = 40;
            this.height = 40;
            this.radius = 16;
        }
        
        this.shootTimer = Math.random() * 2.0;
        this.shootInterval = 2.5 + Math.random() * 1.5;
        this.turretAngle = 0;
    }
    
    update(dt, playerX, playerY, projectiles, canvasWidth, canvasHeight) {
        this.updateFlash(dt);
        
        // Ground target scrolling speed (matches background speed with stage scale)
        let scrollSpeed = 30;
        if (this.stage === 3) scrollSpeed = 35;
        else if (this.stage === 4) scrollSpeed = 25;
        else if (this.stage === 8) scrollSpeed = 40;
        
        // Apply the 40% background speedup
        scrollSpeed *= 1.4;
        
        this.y += scrollSpeed * dt;
        
        if (this.isDestroyed) {
            // Out of bounds cleanup
            if (this.y > canvasHeight + 120) {
                this.active = false;
            }
            return;
        }
        
        // Point turret at player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        this.turretAngle = Math.atan2(dy, dx);
        
        // Shoot logic
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval && this.y > 0 && this.y < canvasHeight * 0.75) {
            this.shoot(projectiles, playerX, playerY);
            this.shootTimer = 0;
        }
        
        if (this.y > canvasHeight + 120) {
            this.active = false;
        }
    }
    
    takeDamage(amount) {
        if (this.isDestroyed) return false;
        this.health -= amount;
        this.hitFlashTimer = 0.08;
        if (this.health <= 0) {
            this.isDestroyed = true;
            // Return true for killed so score and stats update!
            return true;
        }
        return false;
    }
    
    shoot(projectiles, playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            const bulletSpeed = 220 + (this.stage - 1) * 15;
            const vx = (dx / dist) * bulletSpeed;
            const vy = (dy / dist) * bulletSpeed;
            
            if (this.targetType === 'ship') {
                // Ships fire a twin shot
                projectiles.push(new Projectile(this.x - 10, this.y, vx, vy, true, 'normal', 10));
                projectiles.push(new Projectile(this.x + 10, this.y, vx, vy, true, 'normal', 10));
            } else {
                // Turrets/Tanks fire a single targeted shot
                projectiles.push(new Projectile(this.x, this.y, vx, vy, true, 'normal', 10));
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isDestroyed) {
            // Draw charred crater/wreckage
            ctx.fillStyle = '#111111';
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw internal burn details
            ctx.fillStyle = '#050505';
            ctx.beginPath();
            ctx.arc(-3, -2, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Glowing embers
            if (Math.random() < 0.15) {
                ctx.fillStyle = '#ff5722';
                ctx.beginPath();
                ctx.arc(2, 3, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }
        
        // Drawing active ground targets
        const isFlashing = this.hitFlashTimer > 0;
        
        if (this.targetType === 'ship') {
            // Draw ship wake trails
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-this.width/4, this.height/2);
            ctx.lineTo(-this.width, this.height/2 + 25);
            ctx.moveTo(this.width/4, this.height/2);
            ctx.lineTo(this.width, this.height/2 + 25);
            ctx.stroke();
            ctx.restore();
            
            // Ship Hull (facing down, scrolls with background)
            ctx.fillStyle = isFlashing ? '#ffffff' : '#455a64';
            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2); // Bow
            ctx.lineTo(this.width/2, -this.height/4);
            ctx.lineTo(this.width/2, this.height/2);
            ctx.lineTo(-this.width/2, this.height/2);
            ctx.lineTo(-this.width/2, -this.height/4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Deck details
            ctx.fillStyle = '#37474f';
            ctx.fillRect(-this.width/4, -this.height/8, this.width/2, this.height/4);
            
            // Gun turret (points at player)
            ctx.save();
            ctx.translate(0, -this.height/6);
            ctx.rotate(this.turretAngle);
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#102027';
            ctx.fillRect(0, -3, 18, 6);
            ctx.restore();
            
        } else if (this.targetType === 'tank') {
            // Tank chassis
            ctx.fillStyle = isFlashing ? '#ffffff' : '#2e7d32'; // dark green
            ctx.strokeStyle = '#1b5e20';
            ctx.lineWidth = 2;
            ctx.fillRect(-16, -16, 32, 32);
            ctx.strokeRect(-16, -16, 32, 32);
            
            // Treads
            ctx.fillStyle = '#37474f';
            ctx.fillRect(-20, -18, 6, 36);
            ctx.fillRect(14, -18, 6, 36);
            
            // Rotatable Turret
            ctx.save();
            ctx.rotate(this.turretAngle);
            ctx.fillStyle = isFlashing ? '#ffffff' : '#1b5e20';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#102027';
            ctx.fillRect(0, -2.5, 16, 5); // barrel
            ctx.restore();
            
        } else if (this.targetType === 'aa_turret') {
            // Metallic circular base
            ctx.fillStyle = isFlashing ? '#ffffff' : '#546e7a';
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Rotating gun
            ctx.save();
            ctx.rotate(this.turretAngle);
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#102027';
            ctx.fillRect(0, -4, 18, 3); // twin barrels
            ctx.fillRect(0, 1, 18, 3);
            ctx.restore();
            
        } else if (this.targetType === 'space_turret') {
            // Sci-fi floating platform
            ctx.fillStyle = isFlashing ? '#ffffff' : '#4a148c'; // dark purple
            ctx.strokeStyle = '#d500f9';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-16, -6);
            ctx.lineTo(0, -16);
            ctx.lineTo(16, -6);
            ctx.lineTo(10, 12);
            ctx.lineTo(-10, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Rotating heavy energy weapon
            ctx.save();
            ctx.rotate(this.turretAngle);
            ctx.fillStyle = '#d500f9';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -2, 16, 4); // energy barrel
            ctx.restore();
        }
        
        ctx.restore();
    }
}

export class Civilian {
    constructor(x, y, stage = 1) {
        this.x = x;
        this.y = y;
        this.stage = stage;
        this.active = true;
        this.width = 32;
        this.height = 32;
        this.radius = 20;
        this.rescueProgress = 0; // 0 to 1.0
        this.isRescued = false;
        
        // Animation/visual state
        this.animTimer = Math.random() * 5;
    }

    update(dt, playerX, playerY, playerRadius, canvasHeight, audio) {
        // Scroll with background
        let scrollSpeed = 30;
        if (this.stage === 3) scrollSpeed = 35;
        else if (this.stage === 4) scrollSpeed = 25;
        else if (this.stage === 8) scrollSpeed = 40;
        scrollSpeed *= 1.4; // match speedup
        
        this.y += scrollSpeed * dt;

        // Out of bounds cleanup
        if (this.y > canvasHeight + 80) {
            this.active = false;
            return;
        }

        if (this.isRescued) return;

        // Check if player is hover-rescuing (player within proximity radius)
        const dist = Math.hypot(this.x - playerX, this.y - playerY);
        const rescueRange = 75; // stay within 75px
        if (dist < rescueRange) {
            // Rescue rate: fills in 1.5 seconds
            this.rescueProgress = Math.min(1.0, this.rescueProgress + dt / 1.5);
            if (this.rescueProgress >= 1.0) {
                this.isRescued = true;
            }
        } else {
            // Proximity lost, rescue progress decays slowly
            this.rescueProgress = Math.max(0, this.rescueProgress - dt / 2.0);
        }
        
        this.animTimer += dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isRescued) {
            ctx.restore();
            return;
        }

        // Draw a flashing rescue zone circle
        const radius = 50;
        const flash = Math.sin(this.animTimer * 8) * 0.2 + 0.3;
        ctx.strokeStyle = `rgba(255, 235, 59, ${flash + 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw progress arc
        if (this.rescueProgress > 0) {
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 4;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + this.rescueProgress * Math.PI * 2);
            ctx.stroke();
        }

        // Draw civilian figure waving hands on the ground
        const wave = Math.sin(this.animTimer * 12) * 6;
        
        // Draw person shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(6, 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#ffcc80'; // skin color
        ctx.beginPath();
        ctx.arc(0, -6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Torso (shirt color)
        ctx.fillStyle = '#ff1744'; // Red shirt
        ctx.fillRect(-5, -1, 10, 12);

        // Waving arms
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Left arm waving
        ctx.moveTo(-5, 2);
        ctx.lineTo(-11, -2 + wave);
        // Right arm waving
        ctx.moveTo(5, 2);
        ctx.lineTo(11, -2 - wave);
        ctx.stroke();

        // Draw Help bubble text above civilian
        const bubbleFlash = Math.sin(this.animTimer * 4) > 0;
        ctx.fillStyle = bubbleFlash ? '#ffeb3b' : '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("HELP!", 0, -15);

        ctx.restore();
    }
}
