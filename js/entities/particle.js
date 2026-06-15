/* ----------------------------------------------------
   194XDD Particle Engine - Explosions, Sparks & Trails
   ---------------------------------------------------- */

class Particle {
    constructor(x, y, vx, vy, size, color, maxLife, type = 'spark', text = '') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.maxLife = maxLife;
        this.life = maxLife;
        this.type = type; // 'spark', 'smoke', 'fire', 'shockwave', 'text'
        this.text = text;
        this.active = true;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 4;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Apply velocities with a bit of friction/air resistance
        if (this.type === 'smoke') {
            this.vx *= 0.96;
            this.vy *= 0.96;
            this.y -= 15 * dt; // smoke rises slowly
            this.size += 15 * dt; // expand smoke puff
        } else if (this.type === 'fire') {
            this.vx *= 0.94;
            this.vy *= 0.94;
            this.size -= 4 * dt; // fire burns down
        } else if (this.type === 'text') {
            this.vx *= 0.96;
            this.vy *= 0.96;
        } else { // sparks
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.y += 10 * dt; // drift downwards slightly with gravity
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;

        if (this.type === 'spark') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#fff';
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'fire') {
            ctx.shadowColor = '#ff5722';
            ctx.shadowBlur = 8;
            
            // Draw fire diamond/sparkle
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.size);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.3, '#ffeb3b');
            grad.addColorStop(0.7, '#ff5722');
            grad.addColorStop(1, 'rgba(244,67,54,0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'smoke') {
            // Soft smoke clouds using custom color or fallback
            const baseColor = this.color || 'rgba(120, 144, 156, 0.4)';
            const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.size);
            grad.addColorStop(0, baseColor);
            grad.addColorStop(0.6, baseColor.replace(/[\d\.]+\)$/, '0.25)'));
            grad.addColorStop(1, 'rgba(55, 71, 79, 0)');
            ctx.fillStyle = grad;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'text') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            ctx.fillStyle = this.color;
            ctx.font = 'bold 15px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
        }

        ctx.restore();
    }
}

// Expanding Ring Shockwave
class Shockwave {
    constructor(x, y, maxRadius, duration, color = '#00e5ff') {
        this.x = x;
        this.y = y;
        this.radius = 2;
        this.maxRadius = maxRadius;
        this.duration = duration;
        this.life = duration;
        this.color = color;
        this.active = true;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        
        // Linear expansion
        const progress = 1 - (this.life / this.duration);
        this.radius = progress * this.maxRadius;
    }

    draw(ctx) {
        const alpha = this.life / this.duration;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = 'screen';
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 * alpha;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.shockwaves = [];
        
        // Screen Shake parameters
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (!p.active) this.particles.splice(i, 1);
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i];
            s.update(dt);
            if (!s.active) this.shockwaves.splice(i, 1);
        }

        // Decay screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeMagnitude = 0;
            }
        }
    }

    draw(ctx) {
        // Draw smoke first
        this.particles.forEach(p => {
            if (p.type === 'smoke') p.draw(ctx);
        });
        
        // Draw fire/sparks
        this.particles.forEach(p => {
            if (p.type !== 'smoke') p.draw(ctx);
        });

        // Draw shockwaves
        this.shockwaves.forEach(s => s.draw(ctx));
    }

    // Trigger screen shake
    triggerShake(duration, magnitude) {
        this.shakeTime = duration;
        this.shakeMagnitude = magnitude;
    }

    // Returns camera offset {x, y} to apply to context
    getShakeOffset() {
        if (this.shakeTime <= 0) return { x: 0, y: 0 };
        // Random displacement multiplied by remaining time factor
        const factor = this.shakeTime / 0.5; // normalized over base
        const dx = (Math.random() - 0.5) * this.shakeMagnitude * Math.min(1.0, factor);
        const dy = (Math.random() - 0.5) * this.shakeMagnitude * Math.min(1.0, factor);
        return { x: dx, y: dy };
    }

    /* ----------------------------------------------------
       SPAWN EXPLOSION PRESETS
       ---------------------------------------------------- */
    
    // Engine fire particles
    spawnThrusterTrail(x, y, dx, dy, color = '#ffd700') {
        const vx = dx + (Math.random() - 0.5) * 15;
        const vy = dy + Math.random() * 20;
        this.particles.push(new Particle(
            x, y, vx, vy, 
            2 + Math.random() * 2.5, 
            color, 
            0.15 + Math.random() * 0.15, 
            'fire'
        ));
    }

    // Bullet sparks
    spawnSparks(x, y, color = '#00e5ff') {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                1.5 + Math.random() * 2,
                color,
                0.2 + Math.random() * 0.2,
                'spark'
            ));
        }
    }

    spawnExplosionBomb(x, y) {
        this.triggerShake(0.55, 16);
        this.shockwaves.push(new Shockwave(x, y, 350, 0.75, '#00e5ff'));
        this.shockwaves.push(new Shockwave(x, y, 220, 0.5, '#ffd700'));

        // Fireballs spreading from center
        for (let i = 0; i < 36; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 220;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                12 + Math.random() * 16,
                '#00e5ff',
                0.4 + Math.random() * 0.45,
                'fire'
            ));
        }

        // Smoke puffs
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 80;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                20 + Math.random() * 15,
                '#37474f',
                0.6 + Math.random() * 0.6,
                'smoke'
            ));
        }
    }

    // Small Scout death explosion
    spawnExplosionScout(x, y) {
        this.triggerShake(0.18, 6);
        this.shockwaves.push(new Shockwave(x, y, 40, 0.35, '#ffca28'));

        // Fireballs
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 70;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                8 + Math.random() * 10,
                '#ff3300',
                0.3 + Math.random() * 0.3,
                'fire'
            ));
        }
        
        // Smoke puffs
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 10 + Math.random() * 20;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                14 + Math.random() * 8,
                '#78909c',
                0.4 + Math.random() * 0.4,
                'smoke'
            ));
        }
    }

    // Heavy Bomber explosion
    spawnExplosionBomber(x, y) {
        this.triggerShake(0.35, 12);
        this.shockwaves.push(new Shockwave(x, y, 75, 0.55, '#ff5722'));

        // Fireballs
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 110;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                12 + Math.random() * 14,
                '#ff3300',
                0.45 + Math.random() * 0.4,
                'fire'
            ));
        }
        
        // Smoke puffs
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 15 + Math.random() * 45;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                20 + Math.random() * 12,
                '#546e7a',
                0.6 + Math.random() * 0.5,
                'smoke'
            ));
        }

        // Metal shrapnel sparks
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                2 + Math.random() * 3,
                '#ffd700',
                0.3 + Math.random() * 0.4,
                'spark'
            ));
        }
    }

    // Boss death mega-explosion
    spawnExplosionBoss(x, y) {
        this.triggerShake(0.6, 20);
        this.shockwaves.push(new Shockwave(x, y, 120, 0.8, '#ffd700'));
        this.shockwaves.push(new Shockwave(x, y, 80, 0.5, '#ff5722'));

        // Massive fireball shower
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                14 + Math.random() * 18,
                '#ff3300',
                0.5 + Math.random() * 0.6,
                'fire'
            ));
        }
        
        // Dense smoke clouds
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 15 + Math.random() * 50;
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 30,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                25 + Math.random() * 15,
                '#546e7a',
                0.8 + Math.random() * 0.6,
                'smoke'
            ));
        }

        // Metal shrapnel sparks
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 180;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                2 + Math.random() * 3,
                '#ffd700',
                0.4 + Math.random() * 0.5,
                'spark'
            ));
        }
    }

    spawnMissileSmoke(x, y, color = 'rgba(120, 144, 156, 0.4)') {
        const vx = (Math.random() - 0.5) * 15;
        const vy = 30 + Math.random() * 30; // drifts backwards
        this.particles.push(new Particle(
            x, y, vx, vy,
            3 + Math.random() * 3,
            color,
            0.25 + Math.random() * 0.15,
            'smoke'
        ));
    }

    spawnText(x, y, text, color = '#ffeb3b') {
        this.particles.push(new Particle(x, y, 0, -50, 1, color, 1.2, 'text', text));
    }

    spawnCivilianRescue(x, y) {
        for (let k = 0; k < 12; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 80;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                2 + Math.random() * 3,
                '#ffeb3b',
                0.4 + Math.random() * 0.4,
                'spark'
            ));
        }
    }

    spawnChargeEffect(px, py, progress, planeType) {
        const count = Math.random() < progress ? 2 : 1;
        const color = planeType === 'p38' ? '#ffd700' : (planeType === 'pancake' ? '#00e5ff' : '#ff5722');
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 30;
            const sx = px + Math.cos(angle) * distance;
            const sy = py + Math.sin(angle) * distance;
            const speed = 120 + progress * 80;
            const vx = -Math.cos(angle) * speed;
            const vy = -Math.sin(angle) * speed;
            this.particles.push(new Particle(
                sx, sy,
                vx, vy,
                1.5 + Math.random() * 2,
                color,
                0.25 + Math.random() * 0.15,
                'spark'
            ));
        }
    }
}
