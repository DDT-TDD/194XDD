/* ----------------------------------------------------
   194XDD Projectiles - Friendly and Hostile Bullets
   ---------------------------------------------------- */

export class Projectile {
    constructor(x, y, vx, vy, isEnemy, type = 'normal', damage = 10) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.type = type;
        this.damage = damage;
        this.active = true;

        // Bounding circle radius for collision check
        this.radius = 4;
        if (type === 'laser') {
            this.radius = 5;
            this.width = 4;
            this.height = 24;
        } else if (type === 'heavy') {
            this.radius = 8;
        } else if (type === 'boss') {
            this.radius = 6;
        } else if (type === 'missile' || type === 'missile_cluster' || type === 'missile_micro') {
            this.radius = type === 'missile_cluster' ? 8 : (type === 'missile_micro' ? 4 : 6);
            this.width = type === 'missile_cluster' ? 8 : (type === 'missile_micro' ? 3 : 6);
            this.height = type === 'missile_cluster' ? 20 : (type === 'missile_micro' ? 12 : 16);
            this.target = null;
        } else if (type === 'laser_missile' || type === 'laser_dart') {
            this.radius = type === 'laser_missile' ? 6 : 4;
            this.width = type === 'laser_missile' ? 6 : 3;
            this.height = type === 'laser_missile' ? 20 : 14;
            this.target = null;
        } else if (type === 'carpet_bomb') {
            this.radius = 12;
            this.width = 16;
            this.height = 24;
            this.detonationTimer = 1.2; // detonates after 1.2s or on impact
        }
    }

    update(dt, canvasWidth = 768, canvasHeight = 1024, enemies = [], particles = null) {
        // Homing Missile physics steering algorithm
        const isHoming = (this.type === 'missile' || this.type === 'missile_cluster' || this.type === 'missile_micro' || this.type === 'laser_missile' || this.type === 'laser_dart') && !this.isEnemy;
        if (isHoming) {
            // Locate nearest active enemy if no target is locked
            if (!this.target || !this.target.active || this.target.health <= 0 || this.target.isDestroyed) {
                this.target = this.findNearestEnemy(enemies);
            }

            // Adjust steering and velocity settings based on type
            let steerFactor = 10;
            let targetSpeed = 550;
            if (this.type === 'missile_cluster') {
                steerFactor = 6;      // slower steering
                targetSpeed = 400;    // heavy, slow rocket
            } else if (this.type === 'missile_micro') {
                steerFactor = 16;     // extremely agile micro-missile
                targetSpeed = 750;    // high velocity darts
            } else if (this.type === 'laser_missile') {
                steerFactor = 12;
                targetSpeed = 650;
            } else if (this.type === 'laser_dart') {
                steerFactor = 20;
                targetSpeed = 850;
            }

            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    const targetVx = (dx / dist) * targetSpeed;
                    const targetVy = (dy / dist) * targetSpeed;
                    
                    // Steer current velocity smoothly toward target
                    this.vx += (targetVx - this.vx) * steerFactor * dt;
                    this.vy += (targetVy - this.vy) * steerFactor * dt;
                }
            } else {
                // If no enemies on screen, drift straight up
                this.vx += (0 - this.vx) * 6 * dt;
                this.vy += (-targetSpeed - this.vy) * 6 * dt;
            }

            // Keep speed vector clamped to its target speed
            const speed = Math.hypot(this.vx, this.vy);
            if (speed > targetSpeed) {
                this.vx = (this.vx / speed) * targetSpeed;
                this.vy = (this.vy / speed) * targetSpeed;
            }

            // Spawn smoke/laser particle trail
            if (particles) {
                const angle = Math.atan2(this.vy, this.vx);
                const backX = this.x - Math.cos(angle) * (this.height / 2);
                const backY = this.y - Math.sin(angle) * (this.height / 2);
                
                let trailColor = 'rgba(120, 144, 156, 0.4)';
                if (this.type === 'missile_cluster') {
                    trailColor = 'rgba(255, 87, 34, 0.3)';
                } else if (this.type === 'missile_micro') {
                    trailColor = 'rgba(0, 229, 255, 0.3)';
                } else if (this.type === 'laser_missile') {
                    trailColor = 'rgba(0, 229, 255, 0.45)';
                } else if (this.type === 'laser_dart') {
                    trailColor = 'rgba(0, 176, 255, 0.3)';
                }
                
                particles.spawnMissileSmoke(backX, backY, trailColor);
            }
        }

        if (this.type === 'carpet_bomb' || this.type === 'artillery_shell') {
            this.detonationTimer -= dt;
            if (particles) {
                const smokeColor = this.type === 'carpet_bomb' ? 'rgba(255, 235, 59, 0.25)' : 'rgba(255, 152, 0, 0.3)';
                particles.spawnMissileSmoke(this.x, this.y + (this.type === 'carpet_bomb' ? 12 : 16), smokeColor);
            }
        }

        if (this.type === 'lightning_orb') {
            this.zapTimer = (this.zapTimer || 0) + dt;
            this.zaps = this.zaps || [];
            if (this.zapTimer >= 0.12) {
                this.zapTimer = 0;
                this.zaps = []; // reset zaps
                let count = 0;
                enemies.forEach(e => {
                    if (e.active && !e.isDestroyed && count < 3) {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < 250) {
                            e.takeDamage(20);
                            this.zaps.push({ x: e.x, y: e.y });
                            count++;
                        }
                    }
                });
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check if out of bounds (recycle)
        const wLimit = (canvasWidth || 768) + 50;
        const hLimit = (canvasHeight || 1024) + 50;
        if (this.x < -50 || this.x > wLimit ||
            this.y < -50 || this.y > hLimit) {
            this.active = false;
        }
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let minDist = Infinity;
        enemies.forEach(e => {
            if (e.active && e.y > -30) {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            }
        });
        return nearest;
    }

    draw(ctx) {
        ctx.save();

        if (this.isEnemy) {
            // Hostile bullets: elongated teardrop/beam with inner glow
            const speed = Math.hypot(this.vx, this.vy);
            const angle = Math.atan2(this.vy, this.vx);
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle - Math.PI / 2);

            if (this.type === 'laser') {
                // Enemy Laser: Purple/Violet electric streak
                const tailLen = Math.min(32, speed * 0.045);
                ctx.shadowColor = '#d500f9';
                ctx.shadowBlur = 12;

                // Outer beam glow
                const beamGrad = ctx.createLinearGradient(0, -tailLen, 0, this.radius);
                beamGrad.addColorStop(0, 'rgba(213,0,249,0)');
                beamGrad.addColorStop(0.5, 'rgba(213,0,249,0.5)');
                beamGrad.addColorStop(1, 'rgba(255,255,255,0.9)');
                ctx.fillStyle = beamGrad;
                ctx.fillRect(-this.radius * 0.6, -tailLen, this.radius * 1.2, tailLen + this.radius);

                // Inner bright white core line
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(0, -tailLen);
                ctx.lineTo(0, this.radius);
                ctx.stroke();

            } else if (this.type === 'boss') {
                // Enemy Boss plasma: heavy yellow/orange fireballs
                const tailLen = Math.min(26, speed * 0.038);
                ctx.shadowColor = '#ff6d00';
                ctx.shadowBlur = 14;

                const tailGrad = ctx.createLinearGradient(0, -tailLen, 0, this.radius);
                tailGrad.addColorStop(0, 'rgba(255,61,0,0)');
                tailGrad.addColorStop(0.5, 'rgba(255,109,0,0.6)');
                tailGrad.addColorStop(1, '#ffea00');
                ctx.fillStyle = tailGrad;
                ctx.beginPath();
                ctx.ellipse(0, (-tailLen + this.radius) / 2, this.radius * 0.75, (tailLen + this.radius) / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Core orange-red ball
                ctx.fillStyle = '#ffab00';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright yellow/white core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();

            } else {
                // Normal hostile bullets: red/pink glowing teardrop
                const tailLen = Math.min(22, speed * 0.032);
                ctx.shadowColor = '#ff3366';
                ctx.shadowBlur = 10;

                const tailGrad = ctx.createLinearGradient(0, -tailLen, 0, this.radius);
                tailGrad.addColorStop(0, 'rgba(255,51,102,0)');
                tailGrad.addColorStop(0.6, 'rgba(255,100,140,0.55)');
                tailGrad.addColorStop(1, '#ffffff');
                ctx.fillStyle = tailGrad;
                ctx.beginPath();
                ctx.ellipse(0, (-tailLen + this.radius) / 2, this.radius * 0.6, (tailLen + this.radius) / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Core ball
                ctx.fillStyle = '#ff6688';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

        } else {
            // Player bullets
            if (this.type === 'normal') {
                // Elongated streak — length scales with vy (faster = longer)
                const tailLen = Math.min(28, Math.abs(this.vy) * 0.032);
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 8;

                const g = ctx.createLinearGradient(this.x, this.y + tailLen, this.x, this.y - this.radius);
                g.addColorStop(0, 'rgba(0,229,255,0)');
                g.addColorStop(0.6, 'rgba(0,229,255,0.5)');
                g.addColorStop(1, '#ffffff');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y - tailLen / 2 + this.radius / 2, this.radius, (tailLen / 2) + this.radius, 0, 0, Math.PI * 2);
                ctx.fill();

                // Bright tip
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#00b0ff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
                ctx.stroke();

            } else if (this.type === 'laser') {
                // Neon laser: bright elongated rect with glowing edge lines
                const h = this.height + Math.min(20, Math.abs(this.vy) * 0.022);
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 14;

                // Outer glow rectangle
                ctx.fillStyle = 'rgba(0,180,255,0.35)';
                ctx.fillRect(this.x - this.width - 1, this.y - h / 2, this.width * 2 + 2, h);

                // Inner bright core
                ctx.shadowBlur = 6;
                ctx.fillStyle = '#e0f7fa';
                ctx.fillRect(this.x - this.width / 2, this.y - h / 2, this.width, h);

                // Hot centre line
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - h / 2);
                ctx.lineTo(this.x, this.y + h / 2);
                ctx.stroke();

            } else if (this.type === 'heavy') {
                // Heavy shell: big molten ball with long fire tail
                const tailLen = Math.min(32, Math.abs(this.vy) * 0.038);
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 14;

                const tailGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + tailLen);
                tailGrad.addColorStop(0, '#fff');
                tailGrad.addColorStop(0.25, '#ffd700');
                tailGrad.addColorStop(0.7, '#ff6600');
                tailGrad.addColorStop(1, 'rgba(255,51,0,0)');
                ctx.fillStyle = tailGrad;

                ctx.beginPath();
                ctx.moveTo(this.x - 3, this.y);
                ctx.lineTo(this.x + 3, this.y);
                ctx.lineTo(this.x + 1, this.y + 16);
                ctx.lineTo(this.x - 1, this.y + 16);
                ctx.closePath();
                ctx.fill();

                // Core shell
                ctx.fillStyle = '#ffe082';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'missile' || this.type === 'missile_cluster' || this.type === 'missile_micro') {
                // Homing rocket drawing
                ctx.translate(this.x, this.y);
                const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
                ctx.rotate(angle);
                
                // Style based on tier
                let glowColor = '#00e676';
                let bodyColor = '#cfd8dc';
                let noseColor = '#ff1744';
                let flameColor = '#ff9100';

                if (this.type === 'missile_cluster') {
                    glowColor = '#ff6d00';
                    bodyColor = '#78909c';
                    noseColor = '#ff3d00';
                    flameColor = '#ff5722';
                } else if (this.type === 'missile_micro') {
                    glowColor = '#00e5ff';
                    bodyColor = '#ffffff';
                    noseColor = '#00b0ff';
                    flameColor = '#00e5ff';
                }

                ctx.shadowColor = glowColor;
                ctx.shadowBlur = this.type === 'missile_cluster' ? 10 : (this.type === 'missile_micro' ? 5 : 8);
                
                // Rocket metal body
                ctx.fillStyle = bodyColor;
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                
                // Nose cone
                ctx.fillStyle = noseColor;
                ctx.beginPath();
                ctx.moveTo(-this.width/2, -this.height/2);
                ctx.lineTo(0, -this.height/2 - (this.type === 'missile_cluster' ? 7 : (this.type === 'missile_micro' ? 4 : 5)));
                ctx.lineTo(this.width/2, -this.height/2);
                ctx.closePath();
                ctx.fill();

                // Tail wings
                ctx.fillStyle = '#37474f';
                ctx.fillRect(-this.width/2 - 2, this.height/2 - 4, 2, 4);
                ctx.fillRect(this.width/2, this.height/2 - 4, 2, 4);

                // Propulsion flame
                ctx.fillStyle = flameColor;
                ctx.fillRect(-this.width/4, this.height/2, this.width/2, this.type === 'missile_cluster' ? 10 : 6);
            } else if (this.type === 'laser_missile' || this.type === 'laser_dart') {
                // Drawing advanced energy projectiles for Pancake
                ctx.translate(this.x, this.y);
                const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
                ctx.rotate(angle);
                
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = this.type === 'laser_missile' ? 10 : 6;
                
                // Energy body
                ctx.fillStyle = '#e0f7fa';
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                
                // Outer glow
                ctx.strokeStyle = '#00b0ff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-this.width/2 - 1, -this.height/2 - 1, this.width + 2, this.height + 2);
                
                // Tip flare
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(-this.width/2, -this.height/2);
                ctx.lineTo(0, -this.height/2 - 4);
                ctx.lineTo(this.width/2, -this.height/2);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'carpet_bomb') {
                // Draw a heavy bomb for Mitchell
                ctx.translate(this.x, this.y);
                const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
                ctx.rotate(angle);
                
                ctx.shadowColor = '#d4e157';
                ctx.shadowBlur = 8;
                
                // Bomb body
                ctx.fillStyle = '#5d4037'; // brown/olive
                ctx.beginPath();
                ctx.ellipse(0, 0, 8, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Yellow stripes
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-7, -4);
                ctx.lineTo(7, -4);
                ctx.moveTo(-8, 2);
                ctx.lineTo(8, 2);
                ctx.stroke();
                
                // Fins
                ctx.fillStyle = '#2d1500';
                ctx.fillRect(-10, 8, 4, 6);
                ctx.fillRect(6, 8, 4, 6);
                ctx.fillRect(-4, 12, 8, 3);
            } else if (this.type === 'lightning_orb') {
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 14 + Math.sin(Date.now() * 0.025) * 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#00b0ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 18 + Math.sin(Date.now() * 0.025) * 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw zaps if any
                if (this.zaps && this.zaps.length > 0) {
                    this.zaps.forEach(z => {
                        ctx.save();
                        ctx.strokeStyle = '#00e5ff';
                        ctx.shadowColor = '#00e5ff';
                        ctx.shadowBlur = 12;
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        let cx = this.x;
                        let cy = this.y;
                        const steps = 6;
                        for (let k = 1; k <= steps; k++) {
                            const t = k / steps;
                            const tx = this.x + (z.x - this.x) * t;
                            const ty = this.y + (z.y - this.y) * t;
                            if (k < steps) {
                                cx = tx + (Math.random() - 0.5) * 12;
                                cy = ty + (Math.random() - 0.5) * 12;
                            } else {
                                cx = z.x;
                                cy = z.y;
                            }
                            ctx.lineTo(cx, cy);
                        }
                        ctx.stroke();
                        ctx.restore();
                    });
                }
            } else if (this.type === 'mega_laser') {
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 20;
                
                // Outer laser beam
                ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
                ctx.fillRect(this.x - 40, this.y - 450, 80, 900);
                
                // Inner hot core
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x - 16, this.y - 450, 32, 900);
                
                // Side sparks/energy waves
                ctx.strokeStyle = '#00b0ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x - 40, this.y - 450, 80, 900);
            } else if (this.type === 'artillery_shell') {
                ctx.translate(this.x, this.y);
                ctx.shadowColor = '#ff5722';
                ctx.shadowBlur = 12;
                
                // Fire tail
                const grad = ctx.createLinearGradient(0, 0, 0, 24);
                grad.addColorStop(0, '#fff');
                grad.addColorStop(0.3, '#ffeb3b');
                grad.addColorStop(0.7, '#ff5722');
                grad.addColorStop(1, 'rgba(255,87,34,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(-6, 0);
                ctx.lineTo(6, 0);
                ctx.lineTo(2, 24);
                ctx.lineTo(-2, 24);
                ctx.closePath();
                ctx.fill();
                
                // Shell body
                ctx.fillStyle = '#ff9800';
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}
