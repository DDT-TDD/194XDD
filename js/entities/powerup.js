/* ----------------------------------------------------
   194XDD Powerups - Collectibles (Weapons, Repairs, Stars)
   ---------------------------------------------------- */

import { Assets } from '../assets.js';

export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'weapon', 'speed', 'armor', 'special', 'bomb', 'star'
        this.active = true;
        
        this.width = 30;
        this.height = 30;
        this.radius = 16;

        // Floating movement velocities
        this.vy = 120; // Drifts down
        this.timeElapsed = Math.random() * 5;
    }

    update(dt, canvasHeight, player) {
        this.timeElapsed += dt;
        
        if (this.type === 'star' && player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            const isMagnetActive = player.magnetTimer > 0;
            const magnetRadius = isMagnetActive ? 1000 : 200;
            if (dist < magnetRadius) {
                // Pull towards player
                const pullSpeed = isMagnetActive ? 750 : 450;
                this.x += (dx / dist) * pullSpeed * dt;
                this.y += (dy / dist) * pullSpeed * dt;
            } else {
                // Normal wobble & fall
                this.x += Math.sin(this.timeElapsed * 2.5) * 45 * dt;
                this.y += this.vy * dt;
            }
        } else {
            // Normal wobble & fall
            this.x += Math.sin(this.timeElapsed * 2.5) * 45 * dt;
            this.y += this.vy * dt;
        }

        // Recycle if goes offscreen
        if (this.y > canvasHeight + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Bounce scale slightly for animated effect
        const scale = 1.0 + Math.sin(this.timeElapsed * 5) * 0.15;
        ctx.scale(scale, scale);

        let icon = null;
        if (this.type === 'star') {
            icon = Assets.star;
        } else {
            icon = Assets.powerups[this.type];
        }

        if (icon) {
            ctx.drawImage(icon, -icon.width/2, -icon.height/2);
        }

        ctx.restore();
    }

    apply(player, audio) {
        // Play pickup sound
        if (audio) audio.playPowerUp();

        switch (this.type) {
            case 'weapon':
                if (player.upgrades.weapon < 3) {
                    player.upgrades.weapon++;
                    player.fireCooldown = player._calcFireCooldown();
                    player.missileCooldown = player._calcMissileCooldown();
                    player.weaponFlashTimer = 1.5;
                }
                break;
            case 'speed':
                // Adds a loop back
                if (player.loopsRemaining < player.loopMaxCount) {
                    player.loopsRemaining++;
                }
                break;
            case 'armor':
                // Refills 35 HP
                player.health = Math.min(player.maxHealth, player.health + 35);
                break;
            case 'bomb':
                // Refills one smart bomb
                player.bombsRemaining = Math.min(player.maxBombs || 5, player.bombsRemaining + 1);
                break;
            case 'special':
                // Restores shields for Pancake
                if (player.type === 'pancake') {
                    player.shield = player.maxShield;
                } else {
                    // Refills loops for others
                    player.loopsRemaining = player.loopMaxCount;
                }
                break;
            case 'shield':
                // Grants robust kinetic deflector shield to any plane
                player.maxShield = Math.max(player.maxShield || 0, 75);
                player.shield = player.maxShield;
                break;
            case 'magnet':
                // Activates intense full-screen magnet pull for stars for 10.0 seconds
                player.magnetTimer = 10.0;
                break;
            case 'star':
                // Handled in game.js star score counter
                break;
        }
    }
}
