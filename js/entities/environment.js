/* ----------------------------------------------------
   194XDD Environment Engine - Stage-Aware Multi-Scenery
   ---------------------------------------------------- */

import { Assets } from '../assets.js';

export class EnvironmentManager {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        this.stage = 1; // Stage index (1 to 8)
        
        // Sea waves properties
        this.seaYOffset = 0;
        this.seaSpeed = 35; // Pixels per second (40% speedup)
        this.waves = [];
        this.initWaves();

        // Deep background scrolling layer for parallax depth
        this.deepObjects = [];
        this.deepSpawnTimer = 0;

        // Lists of scenery
        this.islands = [];
        this.clouds = [];
        this.cityBlocks = [];
        this.searchlights = [];

        // Spawn timers
        this.islandSpawnTimer = 0;
        this.cloudSpawnTimer = 0;

        // Initialize searchlights for Stage 3 (Midnight Metropolis)
        this.initSearchlights();

        // Seed initial objects
        this.seedEnvironment();

        // Stage 5 Snowflakes
        this.snowflakes = [];
        for (let i = 0; i < 40; i++) {
            this.snowflakes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 1.5 + Math.random() * 2.5,
                speed: (100 + Math.random() * 80) * 1.4,
                drift: (Math.random() - 0.5) * 30
            });
        }

        // Stage 6 Canyons and Sand Particles
        this.canyons = [];
        for (let i = 0; i < 4; i++) {
            this.canyons.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                w: 80 + Math.random() * 120,
                h: 120 + Math.random() * 180,
                speed: 49 // 35 * 1.4
            });
        }
        this.sandParticles = [];
        for (let i = 0; i < 30; i++) {
            this.sandParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                w: 4 + Math.random() * 8,
                h: 2 + Math.random() * 4,
                speedX: (150 + Math.random() * 100) * 1.4,
                speedY: (200 + Math.random() * 100) * 1.4,
                alpha: 0.15 + Math.random() * 0.2
            });
        }

        // Stage 7 Parallax Stars and Satellites
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 0.6 + Math.random() * 2.0,
                speed: (15 + Math.random() * 40) * 1.4,
                alpha: 0.2 + Math.random() * 0.8,
                twinkle: Math.random() * Math.PI * 2 // twinkle phase offset
            });
        }
        // Shooting stars (Stages 7-8)
        this.shootingStars = [];

        this.satellites = [];
        for (let i = 0; i < 2; i++) {
            this.satellites.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                scale: 0.6 + Math.random() * 0.4,
                speed: 28,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: 0.1 + Math.random() * 0.2
            });
        }

        // Stage 5 Aurora Borealis bands
        this.auroraTime = 0;
        this.auroraBands = [];
        for (let i = 0; i < 5; i++) {
            this.auroraBands.push({
                xBase: (this.width / 5) * i + Math.random() * 60,
                width: 80 + Math.random() * 120,
                phase: Math.random() * Math.PI * 2,
                speed: 0.25 + Math.random() * 0.25,
                hue: 140 + Math.floor(Math.random() * 80) // green-teal-blue
            });
        }

        // Stage 2 Volcanic ash particles
        this.ashParticles = [];
        for (let i = 0; i < 50; i++) {
            this.ashParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 1.5 + Math.random() * 3,
                speedY: (40 + Math.random() * 60) * 1.4,
                speedX: (Math.random() - 0.5) * 40,
                alpha: 0.12 + Math.random() * 0.2
            });
        }

        // Stage 8 Digital Coordinates
        this.coordinates = [];
        const hexCodes = ["0x7F41", "SYS_RUN", "CORE_LOAD", "DIM_V8", "194X_DD", "NET_SYNC", "CPU_LOAD", "MEM_ALLOC"];
        for (let i = 0; i < 6; i++) {
            this.coordinates.push({
                x: 40 + Math.random() * (this.width - 120),
                y: Math.random() * this.height,
                text: hexCodes[i % hexCodes.length],
                speed: (40 + Math.random() * 30) * 1.4,
                alpha: 0.15 + Math.random() * 0.2
            });
        }
    }

    initWaves() {
        for (let i = 0; i < 12; i++) {
            this.waves.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                length: 15 + Math.random() * 25,
                alpha: 0.1 + Math.random() * 0.25,
                speedMultiplier: 0.8 + Math.random() * 0.4
            });
        }
    }

    initSearchlights() {
        // 3 sweeping searchlights
        this.searchlights = [
            { x: this.width * 0.2, y: this.height + 20, angle: -Math.PI / 3, targetAngle: -Math.PI / 3, dir: 1, speed: 0.6, radius: 450 },
            { x: this.width * 0.8, y: this.height + 20, angle: -Math.PI * 0.6, targetAngle: -Math.PI * 0.6, dir: -1, speed: 0.4, radius: 500 },
            { x: this.width * 0.5, y: this.height + 50, angle: -Math.PI / 2, targetAngle: -Math.PI / 2, dir: 1, speed: 0.8, radius: 600 }
        ];
    }

    seedEnvironment() {
        // Pre-populate elements
        for (let i = 0; i < 3; i++) {
            const y = Math.random() * this.height;
            const sizeIdx = Math.floor(Math.random() * Assets.islands.length);
            this.islands.push({
                x: 80 + Math.random() * (this.width - 160),
                y: y,
                canvas: Assets.islands[sizeIdx],
                speed: 42, // 30 * 1.4
                scale: 0.8 + Math.random() * 0.4,
                angle: Math.random() * Math.PI * 2
            });
        }

        // City blocks for Stage 3
        for (let i = 0; i < 6; i++) {
            this.cityBlocks.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                w: 60 + Math.random() * 80,
                h: 80 + Math.random() * 120,
                speed: 49, // 35 * 1.4
                windows: this.generateCityWindows()
            });
        }

        // Cloud layers
        for (let i = 0; i < 4; i++) {
            const y = Math.random() * this.height;
            const cloudCanvas = Assets.clouds[Math.floor(Math.random() * Assets.clouds.length)];
            this.clouds.push({
                x: Math.random() * this.width - 100,
                y: y,
                canvas: cloudCanvas,
                speed: (80 + Math.random() * 40) * 1.4,
                scale: 0.8 + Math.random() * 0.6
            });
        }

        // Deep parallax objects
        this.deepObjects = [];
        this.deepSpawnTimer = 0;
        for (let i = 0; i < 5; i++) {
            this.spawnDeepObject(Math.random() * this.height);
        }
    }

    generateCityWindows() {
        // Generate coordinates for glowing building windows
        const cols = 3 + Math.floor(Math.random() * 4);
        const rows = 4 + Math.floor(Math.random() * 6);
        const list = [];
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (Math.random() < 0.6) { // 60% windows turned on
                    list.push({ col: c, row: r });
                }
            }
        }
        return { cols, rows, list };
    }

    setStage(stage) {
        if (this.stage !== stage) {
            this.stage = stage;
            console.log(`Environment loading scenery configuration for Stage ${stage}...`);
        }
    }

    update(dt) {
        // Adjust speed based on stage (Stage 4 & 8 scroll faster)
        const speedScale = (this.stage === 4) ? 2.5 : (this.stage === 8 ? 1.5 : 1.0);
        
        // 1. Update sea offset
        this.seaYOffset = (this.seaYOffset + this.seaSpeed * speedScale * dt) % this.height;
        this.waves.forEach(w => {
            w.y += this.seaSpeed * w.speedMultiplier * speedScale * dt;
            if (w.y > this.height) {
                w.y = -20;
                w.x = Math.random() * this.width;
            }
        });

        // 2. Update islands (Stage 1, 2 & 5 only)
        if (this.stage === 1 || this.stage === 2 || this.stage === 5) {
            for (let i = this.islands.length - 1; i >= 0; i--) {
                const isl = this.islands[i];
                isl.y += isl.speed * dt;
                if (isl.y > this.height + 250) {
                    this.islands.splice(i, 1);
                }
            }
            
            this.islandSpawnTimer += dt;
            if (this.islandSpawnTimer > 15) {
                const sizeIdx = Math.floor(Math.random() * Assets.islands.length);
                this.islands.push({
                    x: 80 + Math.random() * (this.width - 160),
                    y: -300,
                    canvas: Assets.islands[sizeIdx],
                    speed: 30,
                    scale: 0.7 + Math.random() * 0.6,
                    angle: Math.random() * Math.PI * 2
                });
                this.islandSpawnTimer = 0;
            }
        }

        // 3. Update City Blocks (Stage 3 Midnight Metropolis)
        if (this.stage === 3) {
            for (let i = this.cityBlocks.length - 1; i >= 0; i--) {
                const b = this.cityBlocks[i];
                b.y += b.speed * dt;
                if (b.y > this.height + 150) {
                    this.cityBlocks.splice(i, 1);
                }
            }

            this.islandSpawnTimer += dt; // reuse timer
            if (this.islandSpawnTimer > 4.0) { // spawn city block more frequently
                this.cityBlocks.push({
                    x: Math.random() * (this.width - 40),
                    y: -150,
                    w: 60 + Math.random() * 80,
                    h: 80 + Math.random() * 120,
                    speed: 35,
                    windows: this.generateCityWindows()
                });
                this.islandSpawnTimer = 0;
            }

            // Update searchlight sweep angles
            this.searchlights.forEach(s => {
                s.angle += s.speed * s.dir * dt;
                // Sweep limits between -25deg and -155deg
                if (s.angle > -Math.PI * 0.15) {
                    s.dir = -1;
                } else if (s.angle < -Math.PI * 0.85) {
                    s.dir = 1;
                }
            });
        }

        // 4. Update Clouds (All stages except space/dimensional, double speed for Stage 4)
        if (this.stage !== 7 && this.stage !== 8) {
            const cloudSpeedMultiplier = (this.stage === 4) ? 2.5 : 1.0;
            for (let i = this.clouds.length - 1; i >= 0; i--) {
                const c = this.clouds[i];
                c.y += c.speed * cloudSpeedMultiplier * dt;
                if (c.y > this.height + 200) {
                    this.clouds.splice(i, 1);
                }
            }

            this.cloudSpawnTimer += dt;
            let spawnTime = (this.stage === 4) ? 2.5 : 6.0; // spawn clouds rapidly in sky fortress
            if (this.cloudSpawnTimer > spawnTime) {
                const cloudCanvas = Assets.clouds[Math.floor(Math.random() * Assets.clouds.length)];
                this.clouds.push({
                    x: Math.random() * this.width - 100,
                    y: -250,
                    speed: (70 + Math.random() * 30),
                    canvas: cloudCanvas,
                    scale: 0.7 + Math.random() * 0.7
                });
                this.cloudSpawnTimer = 0;
            }
        }

        // 5. Update Snowflakes (Stage 5 Frozen Tundra)
        if (this.stage === 5) {
            this.snowflakes.forEach(s => {
                s.y += s.speed * dt;
                s.x += s.drift * dt;
                if (s.y > this.height) {
                    s.y = -10;
                    s.x = Math.random() * this.width;
                }
                if (s.x < 0 || s.x > this.width) {
                    s.x = Math.random() * this.width;
                }
            });
        }

        // 6. Update Canyons & Sandstorms (Stage 6 Desert Canyon)
        if (this.stage === 6) {
            for (let i = this.canyons.length - 1; i >= 0; i--) {
                const c = this.canyons[i];
                c.y += c.speed * dt;
                if (c.y > this.height + 200) {
                    this.canyons.splice(i, 1);
                }
            }
            this.islandSpawnTimer += dt; // reuse timer
            if (this.islandSpawnTimer > 10.0) {
                this.canyons.push({
                    x: Math.random() * this.width,
                    y: -250,
                    w: 80 + Math.random() * 120,
                    h: 120 + Math.random() * 180,
                    speed: 35
                });
                this.islandSpawnTimer = 0;
            }

            this.sandParticles.forEach(p => {
                p.x += p.speedX * dt;
                p.y += p.speedY * dt;
                if (p.y > this.height || p.x > this.width) {
                    p.y = -20;
                    p.x = Math.random() * this.width - 200;
                }
            });
        }

        // 7. Update Parallax Stars (Stage 7 & 8)
        if (this.stage === 7 || this.stage === 8) {
            this.stars.forEach(s => {
                s.y += s.speed * dt;
                if (s.y > this.height) {
                    s.y = 0;
                    s.x = Math.random() * this.width;
                }
            });
        }

        // 8. Update Satellites (Stage 7 Orbit Boundary)
        if (this.stage === 7) {
            for (let i = this.satellites.length - 1; i >= 0; i--) {
                const sat = this.satellites[i];
                sat.y += sat.speed * dt;
                sat.angle += sat.rotSpeed * dt;
                if (sat.y > this.height + 150) {
                    this.satellites.splice(i, 1);
                }
            }
            if (this.satellites.length < 2 && Math.random() < 0.005) {
                this.satellites.push({
                    x: Math.random() * this.width,
                    y: -100,
                    scale: 0.6 + Math.random() * 0.4,
                    speed: 20,
                    angle: Math.random() * Math.PI * 2,
                    rotSpeed: 0.1 + Math.random() * 0.2
                });
            }
        }

        // 9. Update Digital Coordinates (Stage 8 Dimensional Core)
        if (this.stage === 8) {
            const hexCodes = ["0x7F41", "SYS_RUN", "CORE_LOAD", "DIM_V8", "194X_DD", "NET_SYNC", "CPU_LOAD", "MEM_ALLOC"];
            this.coordinates.forEach(c => {
                c.y += c.speed * dt;
                if (c.y > this.height + 30) {
                    c.y = -30;
                    c.x = 40 + Math.random() * (this.width - 120);
                    c.text = hexCodes[Math.floor(Math.random() * hexCodes.length)];
                }
            });
        }

        // 11. Update Aurora Borealis (Stage 5)
        if (this.stage === 5) {
            this.auroraTime += dt;
        }

        // 12. Update Volcanic Ash (Stage 2)
        if (this.stage === 2) {
            this.ashParticles.forEach(p => {
                p.y += p.speedY * dt;
                p.x += p.speedX * dt;
                if (p.y > this.height + 10) {
                    p.y = -10;
                    p.x = Math.random() * this.width;
                }
                if (p.x < -5 || p.x > this.width + 5) {
                    p.x = Math.random() * this.width;
                }
            });
        }

        // 13. Update Shooting Stars (Stages 7-8)
        if (this.stage === 7 || this.stage === 8) {
            // Randomly spawn shooting stars
            if (Math.random() < 0.015) {
                this.shootingStars.push({
                    x: Math.random() * this.width,
                    y: -10,
                    vx: (Math.random() - 0.5) * 400,
                    vy: 600 + Math.random() * 400,
                    life: 0.4 + Math.random() * 0.3,
                    maxLife: 0.5,
                    len: 60 + Math.random() * 80
                });
            }
            for (let i = this.shootingStars.length - 1; i >= 0; i--) {
                const s = this.shootingStars[i];
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.life -= dt;
                if (s.life <= 0) this.shootingStars.splice(i, 1);
            }
        }

        // 10. Update Deep Parallax objects (0.4x background speed)
        for (let i = this.deepObjects.length - 1; i >= 0; i--) {
            const obj = this.deepObjects[i];
            const speedScale = (this.stage === 4) ? 2.5 : (this.stage === 8 ? 1.5 : 1.0);
            obj.y += obj.speed * speedScale * dt;
            if (obj.y > this.height + 250) {
                this.deepObjects.splice(i, 1);
            }
        }

        this.deepSpawnTimer += dt;
        let deepSpawnCooldown = (this.stage === 4) ? 3.0 : 8.0;
        if (this.deepSpawnTimer >= deepSpawnCooldown) {
            this.spawnDeepObject();
            this.deepSpawnTimer = 0;
        }
    }

    drawSea(ctx) {
        // Stage-based color styles
        if (this.stage === 1) {
            // Stage 1: Cyan/Navy Blue ocean
            const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 50, this.width / 2, this.height / 2, this.height * 0.7);
            grad.addColorStop(0, '#0d2547');
            grad.addColorStop(1, '#051122');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);

            // Cyan waves
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
            this.drawWavesHelper(ctx);

        } else if (this.stage === 2) {
            // Stage 2: Ash-grey / dark green toxic ocean
            const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 50, this.width / 2, this.height / 2, this.height * 0.7);
            grad.addColorStop(0, '#1c2420');
            grad.addColorStop(1, '#0b0f0d');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);

            // Orange lava ember waves
            ctx.strokeStyle = 'rgba(255, 87, 34, 0.05)';
            this.drawWavesHelper(ctx);

        } else if (this.stage === 3) {
            // Stage 3: Midnight sky grid
            ctx.fillStyle = '#020408';
            ctx.fillRect(0, 0, this.width, this.height);

            // Draw grid lines representing city grid coordinate mappings
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.02)';
            ctx.lineWidth = 1;
            for (let x = 0; x < this.width; x += 60) {
                ctx.beginPath();
                ctx.moveTo(x, 0); ctx.lineTo(x, this.height);
                ctx.stroke();
            }
            for (let y = 0; y < this.height; y += 60) {
                ctx.beginPath();
                ctx.moveTo(0, y); ctx.lineTo(this.width, y);
                ctx.stroke();
            }

        } else if (this.stage === 4) {
            // Stage 4: Atmospheric Sky background
            const grad = ctx.createLinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0, '#111e2e');
            grad.addColorStop(1, '#070b12');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);

        } else if (this.stage === 5) {
            // Stage 5: Light blue/glacial cyan waters
            const grad = ctx.createLinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0, '#1a365d');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);

            // cyan-white waves
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.09)';
            this.drawWavesHelper(ctx);

        } else if (this.stage === 6) {
            // Stage 6: Terracotta sand desert
            const grad = ctx.createLinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0, '#8c4f2b');
            grad.addColorStop(0.5, '#703c1e');
            grad.addColorStop(1, '#522b14');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);

        } else if (this.stage === 7 || this.stage === 8) {
            // Stage 7 & 8: Deep space starfield with twinkling
            ctx.fillStyle = '#020205';
            ctx.fillRect(0, 0, this.width, this.height);
            
            ctx.save();
            const now = Date.now() * 0.001;
            this.stars.forEach(s => {
                const twinkle = 0.5 + Math.sin(now * 2 + s.twinkle) * 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * twinkle})`;
                const size = s.size * (0.8 + twinkle * 0.4);
                ctx.fillRect(s.x, s.y, size, size);
            });
            ctx.restore();

            if (this.stage === 8) {
                // Neon purple vertical grid lines on top of stars
                ctx.save();
                ctx.strokeStyle = 'rgba(213, 0, 249, 0.12)';
                ctx.lineWidth = 1.5;
                for (let x = 0; x < this.width; x += 48) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, this.height);
                    ctx.stroke();
                }
                
                // Scrolling horizontal grid lines
                const yScroll = (this.seaYOffset * 1.5) % 48;
                for (let y = yScroll - 48; y < this.height + 48; y += 48) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(this.width, y);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    }

    drawWavesHelper(ctx) {
        ctx.lineWidth = 1;
        this.waves.forEach(w => {
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.quadraticCurveTo(w.x + w.length/2, w.y + 4 * Math.sin(this.seaYOffset * 0.02 + w.x), w.x + w.length, w.y);
            ctx.stroke();
        });
    }

    drawGroundLayer(ctx) {
        if (this.stage === 1 || this.stage === 2 || this.stage === 5) {
            // Render islands
            this.islands.forEach(isl => {
                const w = isl.canvas.width * isl.scale;
                const h = isl.canvas.height * isl.scale;

                ctx.save();
                ctx.translate(isl.x, isl.y);
                ctx.rotate(isl.angle);

                ctx.shadowColor = 'rgba(0, 3, 10, 0.45)';
                ctx.shadowBlur = 12;
                ctx.shadowOffsetX = 18 * isl.scale;
                ctx.shadowOffsetY = 24 * isl.scale;

                ctx.drawImage(isl.canvas, -w/2, -h/2, w, h);

                // Stage 2 Volcanic details: Overlay a glowing lava center crater
                if (this.stage === 2) {
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    const rad = 14 * isl.scale;
                    ctx.fillStyle = '#ff3300';
                    ctx.shadowColor = '#ff5722';
                    ctx.shadowBlur = 10;
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, rad, 0, Math.PI * 2);
                    ctx.fill();

                    // Hot core
                    ctx.fillStyle = '#ffca28';
                    ctx.beginPath();
                    ctx.arc(0, 0, rad * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Stage 5 Snow/Glacier caps: Overlay a white/cyan snowcap
                if (this.stage === 5) {
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#e0f2fe';
                    ctx.lineWidth = 1;
                    
                    ctx.beginPath();
                    ctx.arc(-5 * isl.scale, -8 * isl.scale, 16 * isl.scale, 0, Math.PI * 2);
                    ctx.arc(8 * isl.scale, 5 * isl.scale, 12 * isl.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.restore();
            });
        }

        // Draw City Buildings for Stage 3
        if (this.stage === 3) {
            this.cityBlocks.forEach(b => {
                ctx.save();
                
                // Draw drop shadow for buildings
                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 15;

                // Base block
                ctx.fillStyle = '#0a101d';
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
                ctx.lineWidth = 1.5;
                ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
                ctx.strokeRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);

                // Disable shadows for interior windows
                ctx.shadowColor = 'transparent';

                // Draw windows grid
                const winW = 4;
                const winH = 6;
                const padX = (b.w - (b.windows.cols * 10)) / 2;
                const padY = (b.h - (b.windows.rows * 14)) / 2;

                ctx.fillStyle = '#ffd54f';
                ctx.shadowColor = '#ffd54f';
                ctx.shadowBlur = 4;
                b.windows.list.forEach(w => {
                    const wx = b.x - b.w/2 + padX + w.col * 10;
                    const wy = b.y - b.h/2 + padY + w.row * 14;
                    ctx.fillRect(wx, wy, winW, winH);
                });

                ctx.restore();
            });
        }

        // Draw Scrolling Sky Battleship Deck (Stage 4 Sky Fortress)
        if (this.stage === 4) {
            ctx.save();
            // Slow vertical steel plating scroll
            const yScroll = (this.seaYOffset * 0.4) % 180;
            
            ctx.fillStyle = '#1c2833';
            ctx.fillRect(0, 0, this.width, this.height);

            // Plating panel lines
            ctx.strokeStyle = '#111b22';
            ctx.lineWidth = 3;
            for (let y = yScroll - 180; y < this.height + 180; y += 180) {
                // Horizontal panel borders
                ctx.beginPath();
                ctx.moveTo(0, y); ctx.lineTo(this.width, y);
                ctx.stroke();

                // Rivet markings along the panels
                ctx.fillStyle = '#0f171e';
                for (let x = 15; x < this.width; x += 40) {
                    ctx.beginPath();
                    ctx.arc(x, y - 6, 2, 0, Math.PI*2);
                    ctx.arc(x, y + 6, 2, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            // Draw large metal exhaust vents or reactor overlays on the deck
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(this.width * 0.1, yScroll - 40, this.width * 0.8, 80);
            ctx.strokeStyle = '#273746';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.width * 0.1, yScroll - 40, this.width * 0.8, 80);

            // Draw red warnings line on deck
            ctx.fillStyle = '#922b21';
            ctx.fillRect(this.width * 0.08, yScroll - 38, 6, 76);
            ctx.fillRect(this.width * 0.9, yScroll - 38, 6, 76);

            ctx.restore();
        }

        // Draw Canyon Rocks for Stage 6
        if (this.stage === 6) {
            this.canyons.forEach(c => {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 12;
                ctx.shadowOffsetY = 15;
                
                // Terracotta red canyon rocks
                ctx.fillStyle = '#a0522d';
                ctx.strokeStyle = '#8b4513';
                ctx.lineWidth = 3;
                
                ctx.beginPath();
                ctx.moveTo(c.x - c.w/2, c.y - c.h/2);
                ctx.lineTo(c.x + c.w/2, c.y - c.h/2 + 20);
                ctx.lineTo(c.x + c.w/3, c.y + c.h/2);
                ctx.lineTo(c.x - c.w/2, c.y + c.h/2 - 10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Top highlight layer for 3D canyon step
                ctx.fillStyle = '#cd853f';
                ctx.beginPath();
                ctx.moveTo(c.x - c.w/3, c.y - c.h/3);
                ctx.lineTo(c.x + c.w/3, c.y - c.h/3 + 10);
                ctx.lineTo(c.x + c.w/4, c.y + c.h/4);
                ctx.lineTo(c.x - c.w/3, c.y + c.h/4 - 5);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            });
        }

        // Draw metallic satellites and platforms for Stage 7
        if (this.stage === 7) {
            this.satellites.forEach(sat => {
                ctx.save();
                ctx.translate(sat.x, sat.y);
                ctx.rotate(sat.angle);
                ctx.scale(sat.scale, sat.scale);
                
                ctx.shadowColor = 'rgba(0, 229, 255, 0.3)';
                ctx.shadowBlur = 8;
                
                // Solar wings
                ctx.fillStyle = '#0288d1';
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 1.5;
                ctx.fillRect(-60, -8, 40, 16);
                ctx.fillRect(20, -8, 40, 16);
                
                // Solar grid lines
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 0.5;
                for (let ox = -55; ox <= -25; ox += 10) {
                    ctx.beginPath(); ctx.moveTo(ox, -8); ctx.lineTo(ox, 8); ctx.stroke();
                }
                for (let ox = 25; ox <= 55; ox += 10) {
                    ctx.beginPath(); ctx.moveTo(ox, -8); ctx.lineTo(ox, 8); ctx.stroke();
                }
                
                // Rods
                ctx.strokeStyle = '#b0bec5';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-60, 0); ctx.lineTo(60, 0);
                ctx.stroke();
                
                // Body
                ctx.fillStyle = '#ffe082';
                ctx.strokeStyle = '#ffb300';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Dish antenna
                ctx.fillStyle = '#cfd8dc';
                ctx.strokeStyle = '#90a4ae';
                ctx.beginPath();
                ctx.arc(0, -14, 8, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -12); ctx.lineTo(0, -18);
                ctx.stroke();
                
                ctx.restore();
            });
        }
    }

    drawSkyLayer(ctx) {
        // Draw cloud shadows and cloud sprites (except space stages)
        if (this.stage !== 7 && this.stage !== 8) {
            this.clouds.forEach(c => {
                const w = c.canvas.width * c.scale;
                const h = c.canvas.height * c.scale;

                ctx.save();
                
                // Draw shadow offset down-left (3D float effect)
                ctx.globalAlpha = (this.stage === 3) ? 0.08 : 0.16; // lighter shadow at night
                ctx.drawImage(c.canvas, c.x - 30, c.y + 60, w * 0.95, h * 0.95);
                
                ctx.globalAlpha = 0.75;
                ctx.drawImage(c.canvas, c.x, c.y, w, h);
                ctx.restore();
            });
        }

        // Draw Aurora Borealis (Stage 5 Frozen Tundra)
        if (this.stage === 5) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            this.auroraBands.forEach(b => {
                const wave = Math.sin(this.auroraTime * b.speed + b.phase) * 60;
                const x = b.xBase + wave;
                const h = 180 + Math.sin(this.auroraTime * b.speed * 0.7 + b.phase) * 60;
                const alpha = 0.12 + Math.abs(Math.sin(this.auroraTime * b.speed * 0.5 + b.phase)) * 0.18;
                const grad = ctx.createLinearGradient(x, 0, x, h);
                grad.addColorStop(0, `hsla(${b.hue}, 100%, 65%, ${alpha * 1.5})`);
                grad.addColorStop(0.4, `hsla(${b.hue + 30}, 100%, 55%, ${alpha})`);
                grad.addColorStop(1, `hsla(${b.hue}, 100%, 50%, 0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(x - b.width / 2, 0, b.width, h);
            });
            ctx.restore();
        }

        // Draw Snowflakes (Stage 5 Frozen Tundra)
        if (this.stage === 5) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#e0f7fa';
            ctx.shadowBlur = 3;
            this.snowflakes.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // Draw Volcanic Ash (Stage 2)
        if (this.stage === 2) {
            ctx.save();
            this.ashParticles.forEach(p => {
                ctx.fillStyle = `rgba(60, 60, 60, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // Draw Shooting Stars (Stages 7-8)
        if ((this.stage === 7 || this.stage === 8) && this.shootingStars.length > 0) {
            ctx.save();
            this.shootingStars.forEach(s => {
                const alpha = s.life / 0.5;
                const angle = Math.atan2(s.vy, s.vx);
                ctx.save();
                ctx.globalAlpha = alpha * 0.85;
                ctx.strokeStyle = '#ffffff';
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 8;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - Math.cos(angle) * s.len * alpha, s.y - Math.sin(angle) * s.len * alpha);
                ctx.stroke();
                // Head flash
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.beginPath();
                ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            ctx.restore();
        }

        // Draw Sandstorm particles (Stage 6 Desert Canyon)
        if (this.stage === 6) {
            ctx.save();
            this.sandParticles.forEach(p => {
                ctx.fillStyle = `rgba(222, 184, 135, ${p.alpha})`;
                ctx.fillRect(p.x, p.y, p.w, p.h);
            });
            ctx.restore();
        }

        // Draw searchlights (Stage 3)
        if (this.stage === 3) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            this.searchlights.forEach(s => {
                const grad = ctx.createRadialGradient(s.x, s.y, 10, s.x + Math.cos(s.angle) * s.radius, s.y + Math.sin(s.angle) * s.radius, s.radius * 0.35);
                grad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
                grad.addColorStop(0.3, 'rgba(0, 229, 255, 0.25)');
                grad.addColorStop(0.7, 'rgba(0, 229, 255, 0.08)');
                grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.arc(s.x, s.y, s.radius, s.angle - 0.14, s.angle + 0.14);
                ctx.closePath();
                ctx.fill();
            });
            ctx.restore();
        }

        // Draw digital hex codes (Stage 8 Dimensional Core)
        if (this.stage === 8) {
            ctx.save();
            ctx.font = 'bold 12px "Orbitron", monospace';
            this.coordinates.forEach(c => {
                ctx.fillStyle = `rgba(213, 0, 249, ${c.alpha})`;
                ctx.fillText(c.text, c.x, c.y);
            });
            ctx.restore();
        }
    }

    spawnDeepObject(initialSeedY = null) {
        let speed = 12; // slow parallax speed (0.4x)
        const y = initialSeedY !== null ? initialSeedY : -200;
        const x = Math.random() * this.width;
        
        let type = 'generic';
        if (this.stage === 1) type = 'reef';
        else if (this.stage === 2) type = 'lava_fissure';
        else if (this.stage === 3) type = 'city_silhouette';
        else if (this.stage === 4) type = 'framework';
        else if (this.stage === 5) type = 'ice_shelf';
        else if (this.stage === 6) type = 'dune';
        else if (this.stage === 7) type = 'nebula';
        else if (this.stage === 8) type = 'matrix';
        
        this.deepObjects.push({
            x,
            y,
            type,
            speed,
            scale: 0.6 + Math.random() * 0.8,
            angle: Math.random() * Math.PI * 2,
            w: 120 + Math.random() * 150,
            h: 80 + Math.random() * 120,
            alpha: 0.15 + Math.random() * 0.15,
            pulseTimer: Math.random() * 5
        });
    }

    drawDeepLayer(ctx) {
        this.deepObjects.forEach(obj => {
            ctx.save();
            ctx.globalAlpha = obj.alpha;
            
            if (obj.type === 'reef') {
                // Faint dark cyan reef under the ocean
                ctx.fillStyle = '#061328';
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle);
                ctx.beginPath();
                ctx.ellipse(0, 0, obj.w * 0.6, obj.h * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                
            } else if (obj.type === 'lava_fissure') {
                // Faint glowing red volcanic fissure under the sea
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle);
                const pulse = 0.7 + Math.sin(Date.now() * 0.002 + obj.pulseTimer) * 0.3;
                ctx.fillStyle = `rgba(255, 34, 0, ${pulse})`;
                ctx.strokeStyle = `rgba(255, 110, 0, ${pulse * 0.5})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-obj.w/2, 0);
                ctx.lineTo(-obj.w/4, -10);
                ctx.lineTo(0, 5);
                ctx.lineTo(obj.w/4, -5);
                ctx.lineTo(obj.w/2, 0);
                ctx.stroke();
                
            } else if (obj.type === 'city_silhouette') {
                // Distant dark blue skyscraper silhouettes
                ctx.fillStyle = '#030712';
                ctx.fillRect(obj.x - obj.w/2, obj.y - obj.h/2, obj.w, obj.h);
                // Draw some tiny vertical window lines
                ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
                for (let wx = obj.x - obj.w/2 + 10; wx < obj.x + obj.w/2 - 10; wx += 25) {
                    ctx.fillRect(wx, obj.y - obj.h/2 + 10, 3, obj.h - 20);
                }
                
            } else if (obj.type === 'framework') {
                // Under-deck girder framework
                ctx.strokeStyle = '#0b121a';
                ctx.lineWidth = 6;
                ctx.strokeRect(obj.x - obj.w/2, obj.y - obj.h/2, obj.w, obj.h);
                ctx.beginPath();
                ctx.moveTo(obj.x - obj.w/2, obj.y - obj.h/2);
                ctx.lineTo(obj.x + obj.w/2, obj.y + obj.h/2);
                ctx.moveTo(obj.x + obj.w/2, obj.y - obj.h/2);
                ctx.lineTo(obj.x - obj.w/2, obj.y + obj.h/2);
                ctx.stroke();
                
            } else if (obj.type === 'ice_shelf') {
                // Frozen chasm/shelf lines
                ctx.strokeStyle = '#0e2343';
                ctx.lineWidth = 3;
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle);
                ctx.beginPath();
                ctx.arc(0, 0, obj.w * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                
            } else if (obj.type === 'dune') {
                // Sandy ridges outlines
                ctx.fillStyle = '#4c250e'; // darker desert shade
                ctx.beginPath();
                ctx.moveTo(obj.x - obj.w, obj.y + 40);
                ctx.quadraticCurveTo(obj.x, obj.y - 20, obj.x + obj.w, obj.y + 40);
                ctx.lineTo(obj.x + obj.w, obj.y + 120);
                ctx.lineTo(obj.x - obj.w, obj.y + 120);
                ctx.closePath();
                ctx.fill();
                
            } else if (obj.type === 'nebula') {
                // Scrolling nebula cloud
                const grad = ctx.createRadialGradient(obj.x, obj.y, 10, obj.x, obj.y, obj.w);
                grad.addColorStop(0, 'rgba(124, 77, 255, 0.25)'); // purple center
                grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.15)'); // cyan glow
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.w, 0, Math.PI * 2);
                ctx.fill();
                
            } else if (obj.type === 'matrix') {
                // Rotating digital coordinate grids
                ctx.strokeStyle = 'rgba(213, 0, 249, 0.1)';
                ctx.lineWidth = 1.5;
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle);
                ctx.strokeRect(-obj.w/2, -obj.h/2, obj.w, obj.h);
            }
            
            ctx.restore();
        });
    }
}
