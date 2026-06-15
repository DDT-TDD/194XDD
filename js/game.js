/* ----------------------------------------------------
   194XDD Game Engine - Core Loop & Level Router
   ---------------------------------------------------- */

import { Player } from './entities/player.js';
import { EnemyScout, EnemyBomber, BossAyako, EnemyKamikaze, EnemyGunship, EnemyStealth, EnemyMine, EnemyGroundTarget, Civilian } from './entities/enemy.js';
import { Projectile } from './entities/projectile.js';
import { PowerUp } from './entities/powerup.js';
import { ParticleSystem } from './entities/particle.js';
import { EnvironmentManager } from './entities/environment.js';
import { AudioEngine } from './audio.js';
import { Assets } from './assets.js';

export class Game {
    constructor(canvas, onStateChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onStateChange = onStateChange;

        this.width = canvas.width;
        this.height = canvas.height;

        this.input = null;
        this.environment = new EnvironmentManager(this.width, this.height);
        this.particles = new ParticleSystem();
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.civilians = [];

        this.score = 0;
        this.starsCollected = 0;
        this.enemiesKilled = 0;
        this.bulletsFired = 0;
        this.bulletsHit = 0;
        this.totalEnemiesSpawned = 0;

        this.stage = 1;
        this.stageProgress = 0;
        this.stageCompleted = false;
        this.isGameOver = false;
        this.stageClearTransitionActive = false;

        this.spawnTimer = 0;
        this.bomberSpawnTimer = 0;
        this.groundSpawnTimer = 0;
        this.activeFormations = {};
        
        this.boss = null;
        this.bossWarningActive = false;
        this.bossWarningTimer = 0;
    }

    start(playerType, upgrades, input) {
        this.input = input;
        
        // Ensure upgrades has fallback options if profile upgrades are missing
        const fallbackUpgrades = upgrades || { weapon: 1, speed: 1, armor: 1, special: 0 };
        
        this.player = new Player(this.width / 2, this.height * 0.8, playerType);
        this.player.upgrades = JSON.parse(JSON.stringify(fallbackUpgrades));
        this.player.updateStats();

        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.civilians = [];
        this.spawnedCivilianCheckpoints = { p20: false, p50: false, p80: false };
        this.particles = new ParticleSystem();
        this.particles.width = this.width;
        this.particles.height = this.height;

        this.score = 0;
        this.starsCollected = 0;
        this.enemiesKilled = 0;
        this.bulletsFired = 0;
        this.bulletsHit = 0;
        this.totalEnemiesSpawned = 0;

        this.stage = 1;
        this.stageProgress = 0;
        this.stageCompleted = false;
        this.isGameOver = false;
        this.stageClearTransitionActive = false;
        this.boss = null;
        this.bossWarningActive = false;

        this.spawnTimer = 0;
        this.bomberSpawnTimer = 0;
        this.groundSpawnTimer = 0;
        this.activeFormations = {};

        this.environment.setStage(this.stage);

        AudioEngine.resetTempo();
        AudioEngine.setSong(0);
        AudioEngine.startMusic();
    }

    update(dt) {
        if (this.isGameOver || this.stageCompleted || this.stageClearTransitionActive) return;

        // Handle Bomb trigger
        if (this.input && this.input.bombTriggered) {
            this.input.bombTriggered = false;
            if (this.player && this.player.bombsRemaining > 0 && !this.player.isLooping) {
                this.player.bombsRemaining--;
                this.triggerBomb();
            }
        }

        this.environment.update(dt);

        const oldProjectilesLen = this.projectiles.length;
        this.player.update(dt, this.input, this.projectiles, this.particles, AudioEngine, this.width, this.height);
        
        if (this.projectiles.length > oldProjectilesLen) {
            let friendlyAdded = 0;
            for (let i = oldProjectilesLen; i < this.projectiles.length; i++) {
                if (!this.projectiles[i].isEnemy) friendlyAdded++;
            }
            this.bulletsFired += friendlyAdded;
        }

        this.updateSpawners(dt);

        if (this.boss) {
            this.boss.update(dt, this.player.x, this.player.y, this.projectiles, this.particles, AudioEngine);
            
            if (this.boss.isDead) {
                this.score += this.boss.getScore();
                this.particles.spawnExplosionBoss(this.boss.x, this.boss.y);
                AudioEngine.playExplosionBoss();
                this.boss = null;
                
                // Stage clear transition or final victory
                setTimeout(() => {
                    if (this.stage < 8) {
                        this.showStageClearScreen();
                    } else {
                        this.stageCompleted = true;
                        AudioEngine.stopMusic();
                        this.onStateChange('VICTORY');
                    }
                }, 2500);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.player.x, this.player.y, this.projectiles, this.width, this.height);
            if (!enemy.active) {
                this.enemies.splice(i, 1);
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, this.width, this.height, this.enemies, this.particles);
            
            // Check if carpet bomb timed out
            if (proj.type === 'carpet_bomb' && proj.detonationTimer <= 0) {
                proj.active = false;
                this.triggerCarpetBombExplosion(proj);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            if (!proj.active) {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update(dt, this.height, this.player);
            if (!p.active) {
                this.powerups.splice(i, 1);
            }
        }

        for (let i = this.civilians.length - 1; i >= 0; i--) {
            const civ = this.civilians[i];
            civ.update(dt, this.player.x, this.player.y, this.player.radius, this.height, AudioEngine);
            
            if (civ.isRescued) {
                this.score += 1000;
                this.starsCollected += 25;
                
                this.particles.spawnCivilianRescue(civ.x, civ.y);
                
                this.particles.spawnText(civ.x, civ.y - 15, "RESCUED! +1000", "#ffeb3b");
                AudioEngine.playPowerUp();
                
                civ.active = false;
            }

            if (!civ.active) {
                this.civilians.splice(i, 1);
            }
        }

        this.particles.update(dt);

        this.checkCollisions();

        if (this.player.health <= 0) {
            this.isGameOver = true;
            this.particles.spawnExplosionBomber(this.player.x, this.player.y);
            AudioEngine.playExplosionBoss();
            AudioEngine.stopMusic();
            
            setTimeout(() => {
                this.onStateChange('GAMEOVER');
            }, 1800);
        }

        if (this.bossWarningActive) {
            this.bossWarningTimer -= dt;
            if (this.bossWarningTimer <= 0) {
                this.bossWarningActive = false;
                document.getElementById('warning-overlay').className = 'warning-hidden';
            }
        }
    }

    triggerBomb() {
        // Play explosion sound
        AudioEngine.playExplosionBoss();
        
        // Spawn visual bomb effect in the center of the screen
        this.particles.spawnExplosionBomb(this.width / 2, this.height / 2);
        
        // Deactivate all enemy projectiles
        this.projectiles.forEach(p => {
            if (p.isEnemy) {
                p.active = false;
                this.particles.spawnSparks(p.x, p.y, '#ff3366');
            }
        });

        // Damage all active enemies on screen
        this.enemies.forEach(enemy => {
            if (enemy.active && enemy.y > -50) {
                const killed = enemy.takeDamage(120); // deal massive damage
                if (killed) {
                    this.enemiesKilled++;
                    this.score += enemy.scoreVal;
                    if (enemy.type === 'bomber') {
                        this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                        AudioEngine.playExplosionBomber();
                        this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                    } else {
                        this.particles.spawnExplosionScout(enemy.x, enemy.y);
                        AudioEngine.playExplosionScout();
                    }
                } else {
                    this.particles.spawnSparks(enemy.x, enemy.y, '#ff9100');
                }
            }
        });

        // Damage Boss components if present
        if (this.boss && this.boss.active) {
            if (this.boss.wingLeft.active) {
                const killed = this.boss.wingLeft.takeDamage(100);
                if (killed) {
                    this.particles.spawnExplosionBomber(this.boss.wingLeft.x, this.boss.wingLeft.y);
                    AudioEngine.playExplosionBomber();
                }
            }
            if (this.boss.wingRight.active) {
                const killed = this.boss.wingRight.takeDamage(100);
                if (killed) {
                    this.particles.spawnExplosionBomber(this.boss.wingRight.x, this.boss.wingRight.y);
                    AudioEngine.playExplosionBomber();
                }
            }
            this.boss.turrets.forEach(t => {
                if (t.active) {
                    const killed = t.obj.takeDamage(100);
                    if (killed) {
                        t.active = false;
                        this.particles.spawnExplosionScout(t.obj.x, t.obj.y);
                        AudioEngine.playExplosionBomber();
                    }
                }
            });
            if (this.boss.core.active) {
                const killed = this.boss.core.takeDamage(100);
                if (killed) {
                    this.particles.spawnExplosionBomber(this.boss.core.x, this.boss.core.y);
                }
            }
        }
    }

    progressToNextStage() {
        this.stage++;
        this.stageProgress = 0;
        this.environment.setStage(this.stage);

        // Update song theme per stage pair (stages 1-2=song0, 3-4=song1, 5-6=song2, 7-8=song3)
        const songIdx = Math.min(Math.floor((this.stage - 1) / 2), 3);
        AudioEngine.setSong(songIdx);
        AudioEngine.resetTempo();
        this.player.health = Math.min(this.player.maxHealth, this.player.health + (this.player.maxHealth * 0.5));
        if (this.player.type === 'pancake') {
            this.player.shield = this.player.maxShield;
        }

        // Refill bombs to 3
        this.player.bombsRemaining = 3;

        // Clear battlefield
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.civilians = [];
        this.spawnedCivilianCheckpoints = { p20: false, p50: false, p80: false };
        
        // Visual overlay flash for next stage start
        this.bossWarningActive = true;
        this.bossWarningTimer = 4.0;
        const warningBox = document.getElementById('warning-overlay');
        const warningText = warningBox.querySelector('.warning-text');
        
        const zoneNames = [
            "CORAL REEFS",
            "VOLCANIC TRENCH",
            "MIDNIGHT METROPOLIS",
            "SKY ARMADA FORTRESS",
            "FROZEN TUNDRA",
            "DESERT CANYON",
            "ORBIT BOUNDARY",
            "DIMENSIONAL CORE"
        ];
        
        warningText.innerText = `STAGE ${this.stage}: ${zoneNames[this.stage - 1]}`;
        warningBox.className = '';
        
        // (setSong is already called in progressToNextStage before this function)
        
        // Spawn warp stars particles
        for (let i = 0; i < 30; i++) {
            this.particles.spawnThrusterTrail(
                this.width/2 + (Math.random()-0.5)*300, 
                this.height/2 + (Math.random()-0.5)*400, 
                0, 
                -500, 
                '#00e5ff'
            );
        }
    }

    updateSpawners(dt) {
        if (this.stageProgress >= 100 || this.boss) {
            return;
        }

        // Advance stage progress (slower rate for longer, richer play sessions)
        // ~120s per stage at 60fps with base 0.85
        this.stageProgress = Math.min(100, this.stageProgress + 0.72 * dt);

        // Spawn civilians at progress milestones (20%, 50%, 80%)
        if (!this.spawnedCivilianCheckpoints.p20 && this.stageProgress >= 20) {
            this.spawnedCivilianCheckpoints.p20 = true;
            this.spawnCivilian();
        }
        if (!this.spawnedCivilianCheckpoints.p50 && this.stageProgress >= 50) {
            this.spawnedCivilianCheckpoints.p50 = true;
            this.spawnCivilian();
        }
        if (!this.spawnedCivilianCheckpoints.p80 && this.stageProgress >= 80) {
            this.spawnedCivilianCheckpoints.p80 = true;
            this.spawnCivilian();
        }

        if (this.stageProgress >= 100) {
            this.triggerBossBattle();
            return;
        }

        // Spawner controllers
        this.spawnTimer += dt;

        // Spawn cooldown: Stage1=4.5s → Stage8=1.4s (much more aggressive)
        let spawnCooldown = Math.max(1.4, 4.5 - (this.stage - 1) * 0.44);

        if (this.spawnTimer >= spawnCooldown) {
            this.spawnTimer = 0;

            // At higher stages spawn TWO formations simultaneously
            const extraSpawn = this.stage >= 5 && Math.random() < 0.35;

            const dice = Math.random();
            
            if (this.stage === 1) {
                if (dice < 0.35) this.spawnScoutVFormation();
                else if (dice < 0.65) this.spawnDiagonalSweep();
                else if (dice < 0.85) this.spawnKamikazes();
                else this.spawnSideFlank();
            } 
            else if (this.stage === 2) {
                if (dice < 0.35) this.spawnScoutVFormation();
                else if (dice < 0.6) this.spawnDiagonalSweep();
                else if (dice < 0.8) this.spawnKamikazes();
                else this.spawnSideFlank();
            } 
            else if (this.stage === 3) {
                if (dice < 0.3) this.spawnDiagonalSweep();
                else if (dice < 0.6) this.spawnSideFlank();
                else if (dice < 0.8) this.spawnScoutVFormation();
                else this.spawnGunshipBarricade();
            } 
            else if (this.stage === 4) {
                if (dice < 0.3) this.spawnScoutVFormation();
                else if (dice < 0.55) this.spawnDiagonalSweep();
                else if (dice < 0.75) this.spawnGunshipBarricade();
                else this.spawnKamikazes();
            } 
            else if (this.stage === 5) {
                if (dice < 0.25) this.spawnMinefield();
                else if (dice < 0.5) this.spawnKamikazes();
                else if (dice < 0.75) this.spawnScoutVFormation();
                else this.spawnGunshipBarricade();
            } 
            else if (this.stage === 6) {
                if (dice < 0.25) this.spawnSideFlank();
                else if (dice < 0.5) this.spawnGunshipBarricade();
                else if (dice < 0.75) this.spawnDiagonalSweep();
                else this.spawnMinefield();
            } 
            else if (this.stage === 7) {
                if (dice < 0.2) this.spawnMinefield();
                else if (dice < 0.4) this.spawnSideFlank();
                else if (dice < 0.6) this.spawnKamikazes();
                else if (dice < 0.8) this.spawnScoutVFormation();
                else this.spawnGunshipBarricade();
            }
            else {
                if (dice < 0.15) this.spawnMinefield();
                else if (dice < 0.3) this.spawnSideFlank();
                else if (dice < 0.45) this.spawnGunshipBarricade();
                else if (dice < 0.6) this.spawnKamikazes();
                else if (dice < 0.8) this.spawnScoutVFormation();
                else this.spawnDiagonalSweep();
            }

            // Extra simultaneous formation on Stage 5+
            if (extraSpawn) {
                const dice2 = Math.random();
                if (dice2 < 0.4) this.spawnKamikazes();
                else if (dice2 < 0.7) this.spawnDiagonalSweep();
                else this.spawnMinefield();
            }
        }

        // Spawning Heavy Bombers — frequency increases with stage
        this.bomberSpawnTimer += dt;
        let bomberCooldown = Math.max(4.5, 12.0 - (this.stage - 1) * 1.1);
        if (this.bomberSpawnTimer >= bomberCooldown && this.stageProgress > 10) {
            const spawnX = 50 + Math.random() * (this.width - 100);
            const bomberSpeed = 80 + Math.random() * 40 + (this.stage - 1) * 12;
            const bomber = new EnemyBomber(spawnX, -50, bomberSpeed);
            
            const bomberHealth = 70 + (this.stage - 1) * 28;
            bomber.maxHealth = bomberHealth;
            bomber.health = bomberHealth;

            this.addEnemy(bomber);
            this.bomberSpawnTimer = 0;
        }

        // Spawn Ground Targets — faster at higher stages
        this.groundSpawnTimer += dt;
        let groundSpawnCooldown = Math.max(1.8, 4.0 - (this.stage - 1) * 0.25);
        if (this.groundSpawnTimer >= groundSpawnCooldown) {
            this.spawnGroundTarget();
            this.groundSpawnTimer = 0;
        }
    }

    addEnemy(enemy) {
        enemy.stage = this.stage;
        this.enemies.push(enemy);
        this.totalEnemiesSpawned++;
    }

    spawnGroundTarget() {
        if (this.stageProgress >= 100 || this.boss) return;
        
        let type = 'aa_turret';
        if (this.stage === 1 || this.stage === 5) {
            type = 'ship';
        } else if (this.stage === 2 || this.stage === 3 || this.stage === 6) {
            type = Math.random() < 0.5 ? 'tank' : 'aa_turret';
        } else if (this.stage === 7 || this.stage === 8) {
            type = 'space_turret';
        }
        
        const x = 60 + Math.random() * (this.width - 120);
        const y = -80; // spawn offscreen
        const enemy = new EnemyGroundTarget(x, y, type, this.stage);
        this.addEnemy(enemy);
    }

    spawnCivilian() {
        if (this.stageProgress >= 100 || this.boss) return;
        const x = 80 + Math.random() * (this.width - 160);
        const y = -60;
        this.civilians.push(new Civilian(x, y, this.stage));
    }

    spawnScoutVFormation() {
        const center = 100 + Math.random() * (this.width - 200);
        // Speed and health scale more steeply now
        const scoutSpeed = 165 + (this.stage - 1) * 22;
        const scoutHealth = 12 + (this.stage - 1) * 7;
        // Formation grows from 5 to 7 members at stage 5+
        const count = this.stage >= 5 ? 7 : 5;

        const formationId = 'vform_' + Date.now();
        this.activeFormations[formationId] = { total: count, killed: 0 };

        for (let i = 0; i < count; i++) {
            const xOff = (i - Math.floor(count / 2)) * 45;
            const yOff = Math.abs(i - Math.floor(count / 2)) * -40;
            const e = new EnemyScout(center + xOff, -40 + yOff, 'straight', scoutSpeed);
            e.maxHealth = scoutHealth;
            e.health = scoutHealth;
            e.formationId = formationId;
            this.addEnemy(e);
        }
    }

    spawnDiagonalSweep() {
        const leftToRight = Math.random() < 0.5;
        const scoutSpeed = 185 + (this.stage - 1) * 22;
        const scoutHealth = 12 + (this.stage - 1) * 7;
        
        const formationId = 'dsweep_' + Date.now();
        this.activeFormations[formationId] = {
            total: 5,
            killed: 0
        };
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.isGameOver || this.stageProgress >= 100 || this.boss) return;
                const x = leftToRight ? (80 + i * 120) : (this.width - 80 - i * 120);
                const scout = new EnemyScout(x, -40, 'straight', scoutSpeed);
                scout.maxHealth = scoutHealth;
                scout.health = scoutHealth;
                scout.formationId = formationId;
                this.addEnemy(scout);
            }, i * 250);
        }
    }

    spawnSideFlank() {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const startX = side === 'left' ? -40 : this.width + 40;
        const startY = 80 + Math.random() * 100;
        const speed = 180 + (this.stage - 1) * 15;
        const health = 25 + (this.stage - 1) * 8;
        
        const formationId = 'flank_' + Date.now();
        this.activeFormations[formationId] = {
            total: 2,
            killed: 0
        };
        
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                if (this.isGameOver || this.stageProgress >= 100 || this.boss) return;
                const sx = side === 'left' ? startX - i * 50 : startX + i * 50;
                const sy = startY - i * 30;
                const stealth = new EnemyStealth(sx, sy, side, speed);
                stealth.maxHealth = health;
                stealth.health = health;
                stealth.formationId = formationId;
                this.addEnemy(stealth);
            }, i * 400);
        }
    }

    spawnMinefield() {
        // More mines at higher stages
        const count = 3 + Math.floor(Math.random() * 3) + Math.floor(this.stage / 3);
        for (let i = 0; i < count; i++) {
            const x = 50 + Math.random() * (this.width - 100);
            const y = -45 - Math.random() * 120;
            const speed = 65 + Math.random() * 50 + (this.stage - 1) * 8;
            const health = 35 + (this.stage - 1) * 14;

            const mine = new EnemyMine(x, y, speed);
            mine.maxHealth = health;
            mine.health = health;
            this.addEnemy(mine);
        }
    }

    spawnGunshipBarricade() {
        const count = this.stage >= 5 ? 2 : 1;
        const speed = 52 + (this.stage - 1) * 7;
        const health = 95 + (this.stage - 1) * 32;

        for (let i = 0; i < count; i++) {
            const x = count === 1 ? this.width / 2 : (this.width / 3 + i * (this.width / 3));
            const gunship = new EnemyGunship(x, -60, speed);
            gunship.maxHealth = health;
            gunship.health = health;
            this.addEnemy(gunship);
        }
    }

    spawnKamikazes() {
        // More kamikazes and faster at higher stages
        const count = 2 + Math.floor(Math.random() * 2) + Math.floor(this.stage / 3);
        const speed = 260 + (this.stage - 1) * 28;
        const health = 15 + (this.stage - 1) * 7;

        for (let i = 0; i < count; i++) {
            const x = 80 + Math.random() * (this.width - 160);
            const y = -40 - i * 60;
            const kam = new EnemyKamikaze(x, y, speed);
            kam.maxHealth = health;
            kam.health = health;
            this.addEnemy(kam);
        }
    }

    triggerBossBattle() {
        this.bossWarningActive = true;
        this.bossWarningTimer = 4.0;
        const warningBox = document.getElementById('warning-overlay');
        const warningText = warningBox.querySelector('.warning-text');
        warningText.innerText = "WARNING: INCOMING FLAGSHIP BOSS";
        warningBox.className = '';
        AudioEngine.playPlayerDamage();

        setTimeout(() => {
            if (this.isGameOver) return;
            
            // Critical fix: Pass this.stage to enable stage-appropriate bosses
            this.boss = new BossAyako(this.width / 2, -100, this.stage);
            
            // Scale Boss Health by Stage difficulty
            const bossHealthScale = 1.0 + (this.stage - 1) * 0.45;
            
            this.boss.core.maxHealth = Math.round(this.boss.core.maxHealth * bossHealthScale);
            this.boss.core.health = this.boss.core.maxHealth;
            
            this.boss.wingLeft.maxHealth = Math.round(this.boss.wingLeft.maxHealth * bossHealthScale);
            this.boss.wingLeft.health = this.boss.wingLeft.maxHealth;
            
            this.boss.wingRight.maxHealth = Math.round(this.boss.wingRight.maxHealth * bossHealthScale);
            this.boss.wingRight.health = this.boss.wingRight.maxHealth;
            
            this.boss.turrets.forEach(t => {
                t.obj.maxHealth = Math.round(t.obj.maxHealth * bossHealthScale);
                t.obj.health = t.obj.maxHealth;
            });
        }, 3000);
    }

    checkCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const b = this.projectiles[i];
            if (b.isEnemy) continue;

            if (this.boss) {
                if (b.type === 'mega_laser') {
                    // Wing Left
                    if (this.boss.wingLeft.active && Math.abs(b.x - this.boss.wingLeft.x) < (40 + this.boss.wingLeft.radius) && Math.abs(b.y - this.boss.wingLeft.y) < (450 + this.boss.wingLeft.radius)) {
                        this.bulletsHit++;
                        const wk = this.boss.wingLeft.takeDamage(b.damage);
                        if (wk) this.particles.spawnExplosionBomber(this.boss.wingLeft.x, this.boss.wingLeft.y);
                    }
                    // Wing Right
                    if (this.boss.wingRight.active && Math.abs(b.x - this.boss.wingRight.x) < (40 + this.boss.wingRight.radius) && Math.abs(b.y - this.boss.wingRight.y) < (450 + this.boss.wingRight.radius)) {
                        this.bulletsHit++;
                        const wk = this.boss.wingRight.takeDamage(b.damage);
                        if (wk) this.particles.spawnExplosionBomber(this.boss.wingRight.x, this.boss.wingRight.y);
                    }
                    // Turrets
                    this.boss.turrets.forEach(t => {
                        if (t.active && Math.abs(b.x - t.obj.x) < (40 + t.obj.radius) && Math.abs(b.y - t.obj.y) < (450 + t.obj.radius)) {
                            this.bulletsHit++;
                            const tk = t.obj.takeDamage(b.damage);
                            if (tk) {
                                t.active = false;
                                this.particles.spawnExplosionScout(t.obj.x, t.obj.y);
                            }
                        }
                    });
                    // Core
                    if (this.boss.core.active && Math.abs(b.x - this.boss.core.x) < (40 + this.boss.core.radius) && Math.abs(b.y - this.boss.core.y) < (450 + this.boss.core.radius)) {
                        this.bulletsHit++;
                        this.boss.core.takeDamage(b.damage);
                    }
                } else {
                    const hit = this.boss.checkCollision(b.x, b.y, b.radius, b.damage, this.particles, AudioEngine);
                    if (hit) {
                        this.bulletsHit++;
                        
                        if (b.type === 'artillery_shell') {
                            this.triggerArtilleryExplosion(b);
                            this.projectiles.splice(i, 1);
                            continue;
                        }
                        
                        b.active = false;
                        
                        if (b.type === 'carpet_bomb') {
                            this.triggerCarpetBombExplosion(b);
                            this.projectiles.splice(i, 1);
                            continue;
                        }
                        
                        // Cluster missile splash damage on boss hit
                        if (b.type === 'missile_cluster') {
                            const splashRadius = 120;
                            const splashDamage = 25;
                            this.particles.spawnExplosionScout(b.x, b.y);
                            
                            if (this.boss.wingLeft.active && Math.hypot(b.x - this.boss.wingLeft.x, b.y - this.boss.wingLeft.y) < splashRadius) {
                                const wk = this.boss.wingLeft.takeDamage(splashDamage);
                                if (wk) this.particles.spawnExplosionBomber(this.boss.wingLeft.x, this.boss.wingLeft.y);
                            }
                            if (this.boss.wingRight.active && Math.hypot(b.x - this.boss.wingRight.x, b.y - this.boss.wingRight.y) < splashRadius) {
                                const wk = this.boss.wingRight.takeDamage(splashDamage);
                                if (wk) this.particles.spawnExplosionBomber(this.boss.wingRight.x, this.boss.wingRight.y);
                            }
                            this.boss.turrets.forEach(t => {
                                if (t.active && Math.hypot(b.x - t.obj.x, b.y - t.obj.y) < splashRadius) {
                                    const tk = t.obj.takeDamage(splashDamage);
                                    if (tk) {
                                        t.active = false;
                                        this.particles.spawnExplosionScout(t.obj.x, t.obj.y);
                                    }
                                }
                            });
                            if (this.boss.core.active && Math.hypot(b.x - this.boss.core.x, b.y - this.boss.core.y) < splashRadius) {
                                const ck = this.boss.core.takeDamage(splashDamage);
                                if (ck) this.particles.spawnExplosionBomber(this.boss.core.x, this.boss.core.y);
                            }

                            // damage nearby enemies too
                            this.enemies.forEach(otherEnemy => {
                                if (otherEnemy.active) {
                                    const otherDist = Math.hypot(b.x - otherEnemy.x, b.y - otherEnemy.y);
                                    if (otherDist < splashRadius) {
                                        this.particles.spawnSparks(otherEnemy.x, otherEnemy.y, '#ff9100');
                                        const otherKilled = otherEnemy.takeDamage(splashDamage);
                                        if (otherKilled) {
                                            this.enemiesKilled++;
                                            this.score += otherEnemy.scoreVal;
                                            if (otherEnemy.type === 'mine') {
                                                this.particles.spawnExplosionBomber(otherEnemy.x, otherEnemy.y);
                                                AudioEngine.playExplosionBomber();
                                                // Spawning 6 circular shrapnel bullets
                                                const count = 6;
                                                const speed = 200;
                                                for (let k = 0; k < count; k++) {
                                                    const angle = (k / count) * Math.PI * 2;
                                                    const vx = Math.cos(angle) * speed;
                                                    const vy = Math.sin(angle) * speed;
                                                    this.projectiles.push(new Projectile(otherEnemy.x, otherEnemy.y, vx, vy, true, 'normal', 10));
                                                }
                                            } else if (otherEnemy.type === 'bomber') {
                                                this.particles.spawnExplosionBomber(otherEnemy.x, otherEnemy.y);
                                                AudioEngine.playExplosionBomber();
                                                this.powerups.push(new PowerUp(otherEnemy.x, otherEnemy.y, 'star'));
                                            } else {
                                                this.particles.spawnExplosionScout(otherEnemy.x, otherEnemy.y);
                                                AudioEngine.playExplosionScout();
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (enemy.isDestroyed) continue;
                
                let isHit = false;
                if (b.type === 'mega_laser') {
                    isHit = Math.abs(b.x - enemy.x) < (40 + enemy.radius) && Math.abs(b.y - enemy.y) < (450 + enemy.radius);
                } else {
                    const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
                    isHit = dist < b.radius + enemy.radius;
                }
                
                if (isHit) {
                    this.bulletsHit++;
                    
                    if (b.type === 'artillery_shell') {
                        this.triggerArtilleryExplosion(b);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                    
                    if (b.type !== 'mega_laser') {
                        b.active = false;
                    }
                    
                    if (b.type === 'carpet_bomb') {
                        this.triggerCarpetBombExplosion(b);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                    
                    const killed = enemy.takeDamage(b.damage);
                    
                    // Cluster missile splash damage on enemy hit
                    if (b.type === 'missile_cluster') {
                        const splashRadius = 120;
                        const splashDamage = 25;
                        this.particles.spawnExplosionScout(b.x, b.y);
                        
                        this.enemies.forEach(otherEnemy => {
                            if (otherEnemy !== enemy && otherEnemy.active) {
                                const otherDist = Math.hypot(b.x - otherEnemy.x, b.y - otherEnemy.y);
                                if (otherDist < splashRadius) {
                                    this.particles.spawnSparks(otherEnemy.x, otherEnemy.y, '#ff9100');
                                    const otherKilled = otherEnemy.takeDamage(splashDamage);
                                    if (otherKilled) {
                                        this.enemiesKilled++;
                                        this.score += otherEnemy.scoreVal;
                                        if (otherEnemy.type === 'mine') {
                                            this.particles.spawnExplosionBomber(otherEnemy.x, otherEnemy.y);
                                            AudioEngine.playExplosionBomber();
                                            const count = 6;
                                            const speed = 200;
                                            for (let k = 0; k < count; k++) {
                                                const angle = (k / count) * Math.PI * 2;
                                                const vx = Math.cos(angle) * speed;
                                                const vy = Math.sin(angle) * speed;
                                                this.projectiles.push(new Projectile(otherEnemy.x, otherEnemy.y, vx, vy, true, 'normal', 10));
                                            }
                                        } else if (otherEnemy.type === 'bomber') {
                                            this.particles.spawnExplosionBomber(otherEnemy.x, otherEnemy.y);
                                            AudioEngine.playExplosionBomber();
                                            this.powerups.push(new PowerUp(otherEnemy.x, otherEnemy.y, 'star'));
                                        } else {
                                            this.particles.spawnExplosionScout(otherEnemy.x, otherEnemy.y);
                                            AudioEngine.playExplosionScout();
                                        }
                                    }
                                }
                            }
                        });
                        
                        if (this.boss && this.boss.active) {
                            if (this.boss.wingLeft.active && Math.hypot(b.x - this.boss.wingLeft.x, b.y - this.boss.wingLeft.y) < splashRadius) {
                                const wk = this.boss.wingLeft.takeDamage(splashDamage);
                                if (wk) this.particles.spawnExplosionBomber(this.boss.wingLeft.x, this.boss.wingLeft.y);
                            }
                            if (this.boss.wingRight.active && Math.hypot(b.x - this.boss.wingRight.x, b.y - this.boss.wingRight.y) < splashRadius) {
                                const wk = this.boss.wingRight.takeDamage(splashDamage);
                                if (wk) this.particles.spawnExplosionBomber(this.boss.wingRight.x, this.boss.wingRight.y);
                            }
                            this.boss.turrets.forEach(t => {
                                if (t.active && Math.hypot(b.x - t.obj.x, b.y - t.obj.y) < splashRadius) {
                                    const tk = t.obj.takeDamage(splashDamage);
                                    if (tk) {
                                        t.active = false;
                                        this.particles.spawnExplosionScout(t.obj.x, t.obj.y);
                                    }
                                }
                            });
                            if (this.boss.core.active && Math.hypot(b.x - this.boss.core.x, b.y - this.boss.core.y) < splashRadius) {
                                    const ck = this.boss.core.takeDamage(splashDamage);
                                    if (ck) this.particles.spawnExplosionBomber(this.boss.core.x, this.boss.core.y);
                            }
                        }
                    }

                    if (killed) {
                        this.enemiesKilled++;
                        this.score += enemy.scoreVal;

                        if (enemy.type === 'mine') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const count = 6;
                            const speed = 200;
                            for (let k = 0; k < count; k++) {
                                const angle = (k / count) * Math.PI * 2;
                                const vx = Math.cos(angle) * speed;
                                const vy = Math.sin(angle) * speed;
                                this.projectiles.push(new Projectile(enemy.x, enemy.y, vx, vy, true, 'normal', 10));
                            }
                            // Mines sometimes drop bomb refill
                            if (Math.random() < 0.3) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'bomb'));
                            }
                        } else if (enemy.type === 'bomber') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            // Bombers drop varied rewards based on stage
                            const roll = Math.random();
                            if (roll < 0.35) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
                            } else if (roll < 0.55) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'armor'));
                            } else {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                            }
                        } else if (enemy.type === 'gunship') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            // Gunships always drop weapon or special
                            const gRoll = Math.random();
                            if (gRoll < 0.4) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
                            } else if (gRoll < 0.7) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'special'));
                            } else {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'armor'));
                            }
                        } else if (enemy.type === 'kamikaze') {
                            this.particles.spawnExplosionScout(enemy.x, enemy.y);
                            AudioEngine.playExplosionScout();
                            // Kamikazes occasionally drop speed (loop refill)
                            if (Math.random() < 0.25) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'speed'));
                            } else if (Math.random() < 0.1) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                            }
                        } else {
                            this.particles.spawnExplosionScout(enemy.x, enemy.y);
                            AudioEngine.playExplosionScout();
                            
                            if (enemy.formationId && this.activeFormations[enemy.formationId]) {
                                const form = this.activeFormations[enemy.formationId];
                                form.killed++;
                                if (form.killed === form.total) {
                                    const items = ['weapon', 'weapon', 'speed', 'armor', 'special', 'bomb', 'shield', 'magnet'];
                                    const randomItem = items[Math.floor(Math.random() * items.length)];
                                    this.powerups.push(new PowerUp(enemy.x, enemy.y, randomItem));
                                    delete this.activeFormations[enemy.formationId];
                                }
                            } else {
                                if (Math.random() < 0.12) {
                                    this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                                }
                            }
                        }
                        this.enemies.splice(j, 1);
                    } else {
                        this.particles.spawnSparks(b.x, b.y, '#ffd700');
                    }

                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }

        if (!this.player.isLooping) {
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const b = this.projectiles[i];
                if (!b.isEnemy) continue;

                const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                if (dist < b.radius + this.player.radius) {
                    const shieldActive = this.player.shield > 0;
                    this.particles.spawnSparks(b.x, b.y, shieldActive ? '#00b0ff' : '#ff3366');
                    
                    this.player.takeDamage(b.damage, AudioEngine);
                    b.active = false;
                    this.projectiles.splice(i, 1);
                }
            }

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (enemy.isDestroyed) continue;
                const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                if (dist < enemy.radius + this.player.radius) {
                    this.particles.spawnExplosionScout(enemy.x, enemy.y);
                    AudioEngine.playExplosionBomber();
                    this.player.takeDamage(enemy.type === 'bomber' ? 45 : 25, AudioEngine);
                    this.enemies.splice(i, 1);
                }
            }
        }

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist < p.radius + this.player.radius) {
                if (p.type === 'star') {
                    this.starsCollected += 10;
                    this.score += 50;
                    AudioEngine.playPowerUp();
                } else {
                    p.apply(this.player, AudioEngine);
                }
                p.active = false;
                this.powerups.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const shake = this.particles.getShakeOffset();
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        this.environment.drawSea(this.ctx);
        this.environment.drawDeepLayer(this.ctx);
        this.environment.drawGroundLayer(this.ctx);

        // Draw ground targets under powerups/players
        this.enemies.forEach(e => {
            if (e.isGroundTarget) e.draw(this.ctx);
        });

        // Draw civilians on the ground layer
        this.civilians.forEach(c => c.draw(this.ctx));

        this.powerups.forEach(p => p.draw(this.ctx));

        if (!this.player.isLooping && !this.isGameOver) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.18;
            let shadowImg = Assets[this.player.type];
            if (shadowImg) {
                this.ctx.drawImage(
                    shadowImg,
                    this.player.x + 20 - shadowImg.width * 0.42, 
                    this.player.y + 28 - shadowImg.height * 0.42, 
                    shadowImg.width * 0.85, 
                    shadowImg.height * 0.85
                );
            }
            this.ctx.restore();
        }

        this.player.draw(this.ctx);

        if (this.boss) {
            this.boss.draw(this.ctx);
        }

        // Draw flying enemies above players
        this.enemies.forEach(e => {
            if (!e.isGroundTarget) e.draw(this.ctx);
        });

        this.particles.draw(this.ctx);
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.environment.drawSkyLayer(this.ctx);

        this.ctx.restore();
    }

    triggerCarpetBombExplosion(b) {
        this.particles.triggerShake(0.35, 12);
        this.particles.spawnExplosionBomber(b.x, b.y);
        AudioEngine.playExplosionBomber();
        
        const splashRadius = 150;
        const splashDamage = 75; // heavy damage!
        
        this.enemies.forEach(enemy => {
            if (enemy.active && !enemy.isDestroyed) {
                const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
                if (dist < splashRadius) {
                    this.particles.spawnSparks(enemy.x, enemy.y, '#ffd700');
                    const killed = enemy.takeDamage(splashDamage);
                    if (killed) {
                        this.enemiesKilled++;
                        this.score += enemy.scoreVal;
                        
                        if (enemy.type === 'mine') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const count = 6;
                            const speed = 200;
                            for (let k = 0; k < count; k++) {
                                const angle = (k / count) * Math.PI * 2;
                                const vx = Math.cos(angle) * speed;
                                const vy = Math.sin(angle) * speed;
                                this.projectiles.push(new Projectile(enemy.x, enemy.y, vx, vy, true, 'normal', 10));
                            }
                            if (Math.random() < 0.3) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'bomb'));
                            }
                        } else if (enemy.type === 'bomber') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const roll = Math.random();
                            if (roll < 0.35) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
                            else if (roll < 0.55) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'armor'));
                            else this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                        } else if (enemy.type === 'gunship') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const gRoll = Math.random();
                            if (gRoll < 0.4) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
                            else if (gRoll < 0.7) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'special'));
                            else this.powerups.push(new PowerUp(enemy.x, enemy.y, 'armor'));
                        } else if (enemy.type === 'kamikaze') {
                            this.particles.spawnExplosionScout(enemy.x, enemy.y);
                            AudioEngine.playExplosionScout();
                            if (Math.random() < 0.25) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'speed'));
                            else if (Math.random() < 0.1) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                        } else {
                            this.particles.spawnExplosionScout(enemy.x, enemy.y);
                            AudioEngine.playExplosionScout();
                            if (enemy.formationId && this.activeFormations[enemy.formationId]) {
                                const form = this.activeFormations[enemy.formationId];
                                form.killed++;
                                if (form.killed === form.total) {
                                    const items = ['weapon', 'weapon', 'speed', 'armor', 'special', 'bomb', 'shield', 'magnet'];
                                    const randomItem = items[Math.floor(Math.random() * items.length)];
                                    this.powerups.push(new PowerUp(enemy.x, enemy.y, randomItem));
                                    delete this.activeFormations[enemy.formationId];
                                }
                            } else {
                                if (Math.random() < 0.12) {
                                    this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                                }
                            }
                        }
                    }
                }
            }
        });
        
        if (this.boss && this.boss.active) {
            if (this.boss.wingLeft.active && Math.hypot(b.x - this.boss.wingLeft.x, b.y - this.boss.wingLeft.y) < splashRadius) {
                const wk = this.boss.wingLeft.takeDamage(splashDamage);
                if (wk) this.particles.spawnExplosionBomber(this.boss.wingLeft.x, this.boss.wingLeft.y);
            }
            if (this.boss.wingRight.active && Math.hypot(b.x - this.boss.wingRight.x, b.y - this.boss.wingRight.y) < splashRadius) {
                const wk = this.boss.wingRight.takeDamage(splashDamage);
                if (wk) this.particles.spawnExplosionBomber(this.boss.wingRight.x, this.boss.wingRight.y);
            }
            this.boss.turrets.forEach(t => {
                if (t.active && Math.hypot(b.x - t.obj.x, b.y - t.obj.y) < splashRadius) {
                    const tk = t.obj.takeDamage(splashDamage);
                    if (tk) {
                        t.active = false;
                        this.particles.spawnExplosionScout(t.obj.x, t.obj.y);
                    }
                }
            });
            if (this.boss.core.active && Math.hypot(b.x - this.boss.core.x, b.y - this.boss.core.y) < splashRadius) {
                const ck = this.boss.core.takeDamage(splashDamage);
                if (ck) this.particles.spawnExplosionBomber(this.boss.core.x, this.boss.core.y);
            }
        }
    }

    triggerArtilleryExplosion(b) {
        this.particles.triggerShake(0.55, 20);
        this.particles.spawnExplosionBomb(b.x, b.y);
        AudioEngine.playExplosionBomber();
        
        const splashRadius = 220;
        const splashDamage = 180; // massive shell damage!
        
        // Deactivate enemy projectiles in blast radius (tactical shield)
        this.projectiles.forEach(p => {
            if (p.isEnemy && Math.hypot(b.x - p.x, b.y - p.y) < 180) {
                p.active = false;
                this.particles.spawnSparks(p.x, p.y, '#ffd700');
            }
        });

        this.enemies.forEach(enemy => {
            if (enemy.active && !enemy.isDestroyed) {
                const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
                if (dist < splashRadius) {
                    this.particles.spawnSparks(enemy.x, enemy.y, '#ffd700');
                    const killed = enemy.takeDamage(splashDamage);
                    if (killed) {
                        this.enemiesKilled++;
                        this.score += enemy.scoreVal;
                        
                        if (enemy.type === 'mine') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const count = 6;
                            const speed = 200;
                            for (let k = 0; k < count; k++) {
                                const angle = (k / count) * Math.PI * 2;
                                const vx = Math.cos(angle) * speed;
                                const vy = Math.sin(angle) * speed;
                                this.projectiles.push(new Projectile(enemy.x, enemy.y, vx, vy, true, 'normal', 10));
                            }
                            if (Math.random() < 0.3) {
                                this.powerups.push(new PowerUp(enemy.x, enemy.y, 'bomb'));
                            }
                        } else if (enemy.type === 'bomber') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const roll = Math.random();
                            if (roll < 0.35) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
                            else if (roll < 0.55) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'armor'));
                            else this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                        } else if (enemy.type === 'gunship') {
                            this.particles.spawnExplosionBomber(enemy.x, enemy.y);
                            AudioEngine.playExplosionBomber();
                            const gRoll = Math.random();
                            if (gRoll < 0.4) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'weapon'));
                            else if (gRoll < 0.7) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'special'));
                            else this.powerups.push(new PowerUp(enemy.x, enemy.y, 'armor'));
                        } else if (enemy.type === 'kamikaze') {
                            this.particles.spawnExplosionScout(enemy.x, enemy.y);
                            AudioEngine.playExplosionScout();
                            if (Math.random() < 0.25) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'speed'));
                            else if (Math.random() < 0.1) this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                        } else {
                            this.particles.spawnExplosionScout(enemy.x, enemy.y);
                            AudioEngine.playExplosionScout();
                            if (enemy.formationId && this.activeFormations[enemy.formationId]) {
                                const form = this.activeFormations[enemy.formationId];
                                form.killed++;
                                if (form.killed === form.total) {
                                    const items = ['weapon', 'weapon', 'speed', 'armor', 'special', 'bomb', 'shield', 'magnet'];
                                    const randomItem = items[Math.floor(Math.random() * items.length)];
                                    this.powerups.push(new PowerUp(enemy.x, enemy.y, randomItem));
                                    delete this.activeFormations[enemy.formationId];
                                }
                            } else {
                                if (Math.random() < 0.12) {
                                    this.powerups.push(new PowerUp(enemy.x, enemy.y, 'star'));
                                }
                            }
                        }
                    }
                }
            }
        });
        
        if (this.boss && this.boss.active) {
            if (this.boss.wingLeft.active && Math.hypot(b.x - this.boss.wingLeft.x, b.y - this.boss.wingLeft.y) < splashRadius) {
                const wk = this.boss.wingLeft.takeDamage(splashDamage);
                if (wk) this.particles.spawnExplosionBomber(this.boss.wingLeft.x, this.boss.wingLeft.y);
            }
            if (this.boss.wingRight.active && Math.hypot(b.x - this.boss.wingRight.x, b.y - this.boss.wingRight.y) < splashRadius) {
                const wk = this.boss.wingRight.takeDamage(splashDamage);
                if (wk) this.particles.spawnExplosionBomber(this.boss.wingRight.x, this.boss.wingRight.y);
            }
            this.boss.turrets.forEach(t => {
                if (t.active && Math.hypot(b.x - t.obj.x, b.y - t.obj.y) < splashRadius) {
                    const tk = t.obj.takeDamage(splashDamage);
                    if (tk) {
                        t.active = false;
                        this.particles.spawnExplosionScout(t.obj.x, t.obj.y);
                    }
                }
            });
            if (this.boss.core.active && Math.hypot(b.x - this.boss.core.x, b.y - this.boss.core.y) < splashRadius) {
                const ck = this.boss.core.takeDamage(splashDamage);
                if (ck) this.particles.spawnExplosionBomber(this.boss.core.x, this.boss.core.y);
            }
        }
    }

    showStageClearScreen() {
        this.stageClearTransitionActive = true;
        
        // Calculate stats
        const kills = this.enemiesKilled;
        const spawned = this.totalEnemiesSpawned;
        const pct = spawned > 0 ? Math.round((kills / spawned) * 100) : 100;
        
        let medal = "CLEAR";
        let medalClass = "medal-clear";
        if (pct === 100) {
            medal = "PERFECT MEDAL";
            medalClass = "medal-perfect";
        } else if (pct >= 90) {
            medal = "GOLD MEDAL";
            medalClass = "medal-gold";
        } else if (pct >= 75) {
            medal = "SILVER MEDAL";
            medalClass = "medal-silver";
        } else if (pct >= 50) {
            medal = "BRONZE MEDAL";
            medalClass = "medal-bronze";
        }
        
        // Update DOM
        document.getElementById('stage-clear-medal').innerText = medal;
        document.getElementById('stage-clear-medal').className = medalClass;
        document.getElementById('stage-clear-kills').innerText = `${kills}/${spawned}`;
        document.getElementById('stage-clear-kills-pct').innerText = `${pct}%`;
        
        const overlay = document.getElementById('stage-clear-overlay');
        if (overlay) {
            overlay.className = 'stage-clear-visible';
        }
        
        // Bind button
        const btn = document.getElementById('btn-next-stage');
        if (btn) {
            btn.onclick = () => {
                overlay.className = 'stage-clear-hidden';
                this.progressToNextStage();
                this.stageClearTransitionActive = false;
            };
        }
    }
}
