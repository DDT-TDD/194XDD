/* ----------------------------------------------------
   194XDD Entry Point & State Machine Controller
   ---------------------------------------------------- */

import { Assets } from './assets.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { Game } from './game.js';

const App = {
    state: 'MENU', // 'MENU', 'HANGAR', 'PLAYING', 'PAUSED', 'SETTINGS', 'LEADERBOARD', 'GAMEOVER', 'VICTORY'
    
    // UI elements
    screens: {},
    hud: null,
    canvas: null,
    game: null,

    // Planes database
    planes: [
        {
            type: 'p38',
            name: 'P-38 LIGHTNING',
            desc: 'Balanced WWII fighter. Equipped with wingmen support firing dual channels.',
            speed: 60,
            armor: 50,
            fire: 60
        },
        {
            type: 'pancake',
            name: 'XF-5U FLYING PANCAKE',
            desc: 'Prototype disk interceptor. Uses energy shields and high fire rate lasers.',
            speed: 90,
            armor: 40,
            fire: 80
        },
        {
            type: 'mitchell',
            name: 'B-25 MITCHELL',
            desc: 'Heavy medium bomber. Fires explosive rounds and has a rear defense gun.',
            speed: 40,
            armor: 90,
            fire: 95
        },
        {
            type: 'corsair',
            name: 'F4U CORSAIR',
            desc: 'Gull-wing Navy ace. Six-gun battery, heavy armor, and devastating firepower.',
            speed: 70,
            armor: 65,
            fire: 85
        },
        {
            type: 'zero',
            name: 'A6M ZERO',
            desc: 'Captured Imperial ace. Ultra-agile with lightning reflexes and rapid fire cannons.',
            speed: 95,
            armor: 30,
            fire: 75
        }
    ],
    selectedPlaneIdx: 0,

    // Progression Profile (Persists in LocalStorage)
    profile: {
        stars: 0,
        unlockedPlanes: ['p38', 'pancake', 'mitchell', 'corsair', 'zero'],
        upgrades: {
            p38: { weapon: 1, speed: 1, armor: 1, special: 0 },
            pancake: { weapon: 1, speed: 1, armor: 1, special: 0 },
            mitchell: { weapon: 1, speed: 1, armor: 1, special: 0 },
            corsair: { weapon: 1, speed: 1, armor: 1, special: 0 },
            zero:    { weapon: 1, speed: 1, armor: 1, special: 0 }
        },
        highscores: [
            { name: 'DD1', plane: 'P-38', stage: 1, score: 25000 },
            { name: 'ACE', plane: 'PANCAKE', stage: 1, score: 18000 },
            { name: 'FLY', plane: 'MITCHELL', stage: 1, score: 12000 }
        ]
    },

    // Upgrade costs template
    upgradeCosts: {
        weapon: [50, 100, 200], // cost to upgrade to level 2, 3
        speed: [40, 80, 150],
        armor: [40, 80, 150],
        special: [80, 160, 250] // level 1 (wingman 1), level 2 (wingman 2)
    },

    // Animation Loop frame handle
    lastTime: 0,
    animFrameId: null,
    previewAngle: 0,

    init() {
        console.log("Starting 194XDD app engine...");
        
        // Cache DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.hud = document.getElementById('hud-overlay');
        
        this.screens.menu = document.getElementById('menu-screen');
        this.screens.hangar = document.getElementById('hangar-screen');
        this.screens.settings = document.getElementById('settings-screen');
        this.screens.leaderboard = document.getElementById('leaderboard-screen');
        this.screens.gameover = document.getElementById('gameover-screen');
        this.screens.pause = document.getElementById('pause-screen');
        this.screens.help = document.getElementById('help-screen');

        // Load profile
        this.loadProfile();

        // Fixed virtual arcade resolution scaled via CSS aspect-ratio wrapper
        this.canvas.width = 768;
        this.canvas.height = 1024;
        
        // Resize handler
        window.addEventListener('resize', () => {
            // Sizing is managed by CSS wrapper. Internal game bounds remain 768x1024
            if (this.game) {
                this.game.width = 768;
                this.game.height = 1024;
                this.game.environment.width = 768;
                this.game.environment.height = 1024;
            }
        });

        // Init Assets procedurally
        Assets.init();

        // Bind Controls
        Input.init(this.canvas);
        this.bindEvents();

        // Initialize Core Game class
        this.game = new Game(this.canvas, (newState) => this.transitionTo(newState));

        // Start UI Preview draws
        this.startPreviewDraws();

        // Initial menu render
        this.updatePlanePreview();
        this.renderLeaderboard();

        // Initial volume sliders
        document.getElementById('vol-music').value = AudioEngine.musicEnabled ? 50 : 0;
        document.getElementById('vol-sfx').value = AudioEngine.sfxEnabled ? 70 : 0;
        
        console.log("App initialization complete.");
    },

    bindEvents() {
        // Audio opt-in hook
        const audioNag = document.getElementById('audio-nag');
        const engageAudio = () => {
            AudioEngine.resumeContext();
            audioNag.style.display = 'none';
            window.removeEventListener('click', engageAudio);
            window.removeEventListener('keydown', engageAudio);
        };
        window.addEventListener('click', engageAudio);
        window.addEventListener('keydown', engageAudio);

        // Menu Carousel Buttons
        document.getElementById('prev-plane').onclick = () => {
            this.selectedPlaneIdx = (this.selectedPlaneIdx - 1 + this.planes.length) % this.planes.length;
            this.updatePlanePreview();
        };
        document.getElementById('next-plane').onclick = () => {
            this.selectedPlaneIdx = (this.selectedPlaneIdx + 1) % this.planes.length;
            this.updatePlanePreview();
        };

        // Hangar Carousel Buttons
        document.getElementById('hangar-prev-plane').onclick = () => {
            this.selectedPlaneIdx = (this.selectedPlaneIdx - 1 + this.planes.length) % this.planes.length;
            this.renderHangarDetails();
        };
        document.getElementById('hangar-next-plane').onclick = () => {
            this.selectedPlaneIdx = (this.selectedPlaneIdx + 1) % this.planes.length;
            this.renderHangarDetails();
        };

        // Main Menu actions
        document.getElementById('btn-start').onclick = () => {
            this.transitionTo('PLAYING');
        };
        document.getElementById('btn-hangar').onclick = () => {
            this.transitionTo('HANGAR');
        };
        document.getElementById('btn-settings').onclick = () => {
            this.transitionTo('SETTINGS');
        };
        document.getElementById('btn-leaderboard').onclick = () => {
            this.transitionTo('LEADERBOARD');
        };

        // Back buttons
        document.getElementById('hangar-back').onclick = () => this.transitionTo('MENU');
        document.getElementById('settings-back').onclick = () => this.transitionTo('MENU');
        document.getElementById('leaderboard-back').onclick = () => this.transitionTo('MENU');
        document.getElementById('btn-gameover-menu').onclick = () => this.transitionTo('MENU');
        document.getElementById('btn-pause-menu').onclick = () => this.transitionTo('MENU');

        // Retry & Resume Actions
        document.getElementById('btn-retry').onclick = () => this.transitionTo('PLAYING');
        document.getElementById('btn-resume').onclick = () => this.transitionTo('PLAYING');

        // Help Actions
        document.getElementById('btn-help').onclick = () => this.transitionTo('HELP');
        document.getElementById('help-back').onclick = () => this.transitionTo('MENU');

        // HUD Virtual action button triggers (for mouse/touch control compatibility)
        document.getElementById('btn-hud-loop').onclick = (e) => {
            e.stopPropagation();
            Input.loopTriggered = true;
        };
        document.getElementById('btn-hud-bomb').onclick = (e) => {
            e.stopPropagation();
            Input.bombTriggered = true;
        };
        document.getElementById('btn-hud-missile').onclick = (e) => {
            e.stopPropagation();
            Input.missileTriggered = true;
        };

        // Leaderboard saving
        document.getElementById('btn-save-score').onclick = () => {
            const initials = document.getElementById('pilot-initials').value.toUpperCase() || 'PIL';
            this.saveHighScore(initials);
            document.getElementById('initials-entry-box').style.display = 'none';
        };

        // Upgrade Buttons
        const bindUpgradeBtn = (type) => {
            document.getElementById(`btn-up-${type}`).onclick = () => this.buyUpgrade(type);
        };
        bindUpgradeBtn('weapon');
        bindUpgradeBtn('speed');
        bindUpgradeBtn('armor');
        bindUpgradeBtn('special');

        // Settings Toggles
        const btnKeyboard = document.getElementById('ctrl-keyboard');
        const btnMouse = document.getElementById('ctrl-mouse');
        btnKeyboard.onclick = () => {
            Input.mode = 'keyboard';
            btnKeyboard.classList.add('active');
            btnMouse.classList.remove('active');
            document.getElementById('control-help-desc').innerText = "Move with WASD or Arrow Keys. Shoot with Space. Press Shift or C to execute a Loop-the-Loop maneuver.";
        };
        btnMouse.onclick = () => {
            Input.mode = 'mouse';
            btnMouse.classList.add('active');
            btnKeyboard.classList.remove('active');
            document.getElementById('control-help-desc').innerText = "Move aircraft by dragging your mouse/finger on screen. Firing is automatic. Press Shift or C on keyboard to loop.";
        };

        // Settings Sliders
        document.getElementById('vol-music').oninput = (e) => {
            AudioEngine.setMusicVolume(e.target.value);
        };
        document.getElementById('vol-sfx').oninput = (e) => {
            AudioEngine.setSFXVolume(e.target.value);
        };

        // Fullscreen Toggle
        const btnFullscreen = document.getElementById('btn-fullscreen');
        btnFullscreen.onclick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    btnFullscreen.innerText = "EXIT FULLSCREEN";
                    btnFullscreen.classList.add('active');
                }).catch(err => {
                    console.warn("Fullscreen request failed:", err);
                });
            } else {
                document.exitFullscreen().then(() => {
                    btnFullscreen.innerText = "GO FULLSCREEN";
                    btnFullscreen.classList.remove('active');
                });
            }
        };

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                btnFullscreen.innerText = "EXIT FULLSCREEN";
                btnFullscreen.classList.add('active');
            } else {
                btnFullscreen.innerText = "GO FULLSCREEN";
                btnFullscreen.classList.remove('active');
            }
        });
    },

    // Dynamic rotating preview canvases
    startPreviewDraws() {
        const pCanvas = document.getElementById('plane-preview-canvas');
        const pCtx = pCanvas.getContext('2d');

        const hCanvas = document.getElementById('hangar-plane-canvas');
        const hCtx = hCanvas.getContext('2d');

        const tickPreviews = () => {
            this.previewAngle += 0.016;

            // 1. Render Menu Carousel Preview
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            pCtx.save();
            pCtx.translate(pCanvas.width / 2, pCanvas.height / 2 + Math.sin(this.previewAngle * 2) * 6);
            
            const planeType = this.planes[this.selectedPlaneIdx].type;
            const img = Assets[planeType];
            if (img) {
                pCtx.drawImage(img, -img.width / 2, -img.height / 2);
            }
            pCtx.restore();

            // 2. Render Hangar preview
            if (this.state === 'HANGAR') {
                hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
                hCtx.save();
                hCtx.translate(hCanvas.width / 2, hCanvas.height / 2 + Math.sin(this.previewAngle * 2) * 6);
                
                const hangarImg = Assets[planeType];
                if (hangarImg) {
                    hCtx.drawImage(hangarImg, -hangarImg.width / 2, -hangarImg.height / 2);
                }
                hCtx.restore();
            }

            requestAnimationFrame(tickPreviews);
        };
        requestAnimationFrame(tickPreviews);
    },

    updatePlanePreview() {
        const p = this.planes[this.selectedPlaneIdx];
        document.getElementById('preview-plane-name').innerText = p.name;
        document.getElementById('preview-plane-desc').innerText = p.desc;
        
        document.getElementById('stat-bar-speed').style.width = p.speed + '%';
        document.getElementById('stat-bar-armor').style.width = p.armor + '%';
        document.getElementById('stat-bar-fire').style.width = p.fire + '%';
    },

    transitionTo(newState) {
        console.log(`Transitioning state: ${this.state} -> ${newState}`);
        
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens.menu.classList.remove('active'); // menu screen is sibling

        // Cancel playing ticks if moving away from playing
        if (this.state === 'PLAYING' && newState !== 'PAUSED') {
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
            }
            this.hud.className = 'hud-hidden';
            document.getElementById('virtual-controls').className = 'controls-hidden';
        }

        this.state = newState;

        // Show appropriate screen
        switch (newState) {
            case 'MENU':
                this.screens.menu.classList.add('active');
                this.updatePlanePreview();
                this.saveProfile();
                break;
            case 'HANGAR':
                this.screens.hangar.classList.add('active');
                this.renderHangarDetails();
                break;
            case 'HELP':
                this.screens.help.classList.add('active');
                break;
            case 'SETTINGS':
                this.screens.settings.classList.add('active');
                break;
            case 'LEADERBOARD':
                this.screens.leaderboard.classList.add('active');
                this.renderLeaderboard();
                break;
            case 'PLAYING':
                this.hud.className = ''; // show HUD
                document.getElementById('virtual-controls').className = ''; // show virtual controls
                
                if (!this.animFrameId) {
                    // Fresh game start
                    const currentType = this.planes[this.selectedPlaneIdx].type;
                    const ups = this.profile.upgrades[currentType];
                    this.game.start(currentType, ups, Input);
                }
                this.lastTime = performance.now();
                this.gameLoop();
                break;
            case 'PAUSED':
                this.screens.pause.classList.add('active');
                break;
            case 'GAMEOVER':
            case 'VICTORY':
                this.screens.gameover.classList.add('active');
                
                // Populate end game statistics dashboard
                const score = this.game.score;
                const stars = this.game.starsCollected;
                const kills = this.game.enemiesKilled;
                const accuracy = this.game.bulletsFired > 0 
                    ? Math.round(this.game.bulletsHit / this.game.bulletsFired * 100) 
                    : 0;

                // Accrue stars to persistent profile wallet
                this.profile.stars += stars;
                this.saveProfile();

                document.getElementById('gameover-title').innerText = (newState === 'VICTORY') ? "STAGE CLEAR" : "MISSION FAILED";
                document.getElementById('gameover-title').className = (newState === 'VICTORY') ? "glowing-text text-accent" : "glowing-text text-danger";
                document.getElementById('gameover-subtitle').innerText = (newState === 'VICTORY') ? "PILOT DEBRIEFING - DESTRUCT PROTOCOLS CONFIRMED" : "PILOT KIA - ACQUISITION PROTOCOL INCOMPLETE";
                
                document.getElementById('final-score').innerText = score.toLocaleString();
                document.getElementById('final-stars').innerText = `★ ${stars}`;
                document.getElementById('final-kills').innerText = kills;
                document.getElementById('final-accuracy').innerText = `${accuracy}%`;

                // Show highscore entry box
                document.getElementById('initials-entry-box').style.display = 'flex';
                document.getElementById('pilot-initials').value = 'PIL';
                break;
        }
    },

    gameLoop() {
        if (this.state !== 'PLAYING') return;

        const now = performance.now();
        let dt = (now - this.lastTime) / 1000;
        
        // Cap dt to prevent massive jumps when tab goes inactive
        if (dt > 0.1) dt = 0.1;
        this.lastTime = now;

        // Check Pause trigger hook
        if (Input.pauseTriggered) {
            Input.pauseTriggered = false;
            this.transitionTo('PAUSED');
            return;
        }

        // Ticks
        this.game.update(dt);
        this.game.draw();

        // Update HTML DOM HUD overlay
        this.updateHUDDisplay();

        this.animFrameId = requestAnimationFrame(() => this.gameLoop());
    },

    updateHUDDisplay() {
        document.getElementById('hud-score').innerText = this.game.score.toString().padStart(6, '0');
        document.getElementById('hud-stars').innerText = this.game.starsCollected;
        
        // Progress label stage update
        const progressLabel = document.querySelector('.hud-progress-label');
        if (progressLabel) {
            progressLabel.innerText = `STAGE ${this.game.stage} PROGRESS`;
        }

        // Progress bar
        document.getElementById('hud-stage-progress').style.width = this.game.stageProgress + '%';

        // Health Bar
        const hpPercent = Math.max(0, (this.game.player.health / this.game.player.maxHealth) * 100);
        document.getElementById('hud-health-bar').style.width = hpPercent + '%';

        // Shield Bar (Visible for pancake, otherwise collapsed)
        const shieldBox = document.getElementById('hud-shield-container');
        if (this.game.player.maxShield > 0) {
            shieldBox.style.display = 'flex';
            const shPercent = Math.max(0, (this.game.player.shield / this.game.player.maxShield) * 100);
            document.getElementById('hud-shield-bar').style.width = shPercent + '%';
        } else {
            shieldBox.style.display = 'none';
        }

        // Loop DOT indicators
        const loopsBox = document.getElementById('hud-loop-container');
        loopsBox.innerHTML = '';
        for (let i = 0; i < this.game.player.loopMaxCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'hud-loop-dot' + (i >= this.game.player.loopsRemaining ? ' used' : '');
            loopsBox.appendChild(dot);
        }

        // Bombs count update
        document.getElementById('hud-bombs').innerText = this.game.player.bombsRemaining;

        // Weapon tier indicator
        const wLvl = this.game.player.upgrades.weapon;
        const wTierEl = document.getElementById('hud-weapon-tier');
        if (wTierEl) {
            const tierLabels = ['', 'WPN I', 'WPN II', 'WPN III'];
            wTierEl.innerText = tierLabels[wLvl] || `WPN ${wLvl}`;
            // Flash effect when recently upgraded
            if (this.game.player.weaponFlashTimer > 0) {
                wTierEl.style.color = '#00e5ff';
                wTierEl.style.textShadow = '0 0 12px #00e5ff';
            } else {
                wTierEl.style.color = wLvl >= 3 ? '#ffd700' : '#00e676';
                wTierEl.style.textShadow = wLvl >= 3 ? '0 0 8px #ffd700' : '0 0 6px #00e676';
            }
        }

        // Missile status update
        const missileLabel = document.getElementById('hud-missiles');
        if (this.game.player.missileTimer >= this.game.player.missileCooldown) {
            missileLabel.innerText = "READY";
            missileLabel.className = "hud-value text-success";
        } else {
            const pct = Math.floor((this.game.player.missileTimer / this.game.player.missileCooldown) * 100);
            missileLabel.innerText = `${pct}%`;
            missileLabel.className = "hud-value text-muted";
        }

        // Update kills % HUD
        const killPct = this.game.totalEnemiesSpawned > 0 
            ? Math.round((this.game.enemiesKilled / this.game.totalEnemiesSpawned) * 100) 
            : 0;
        const hudKillsPct = document.getElementById('hud-kills-pct');
        if (hudKillsPct) {
            hudKillsPct.innerText = `${killPct}%`;
        }

        // Weapon label per plane type
        const wLabel = document.getElementById('hud-missile-label');
        const virtualMissileBtn = document.getElementById('btn-hud-missile');
        const ptype = this.game.player.type;
        if (ptype === 'p38') {
            if (wLabel) wLabel.innerText = "ROCKETS (F)";
            if (virtualMissileBtn) virtualMissileBtn.innerText = "ROCKETS";
        } else if (ptype === 'pancake') {
            if (wLabel) wLabel.innerText = "MISSILES (F)";
            if (virtualMissileBtn) virtualMissileBtn.innerText = "MISSILES";
        } else if (ptype === 'mitchell') {
            if (wLabel) wLabel.innerText = "C-BOMBS (F)";
            if (virtualMissileBtn) virtualMissileBtn.innerText = "C-BOMBS";
        } else if (ptype === 'corsair') {
            if (wLabel) wLabel.innerText = "HVAR (F)";
            if (virtualMissileBtn) virtualMissileBtn.innerText = "HVAR";
        } else if (ptype === 'zero') {
            if (wLabel) wLabel.innerText = "HOMING (F)";
            if (virtualMissileBtn) virtualMissileBtn.innerText = "HOMING";
        }
    },

    /* ----------------------------------------------------
       HANGAR & UPGRADE LOGIC
       ---------------------------------------------------- */
    renderHangarDetails() {
        const type = this.planes[this.selectedPlaneIdx].type;
        const ups = this.profile.upgrades[type];
        
        document.getElementById('hangar-stars').innerText = this.profile.stars;
        document.getElementById('hangar-plane-name').innerText = this.planes[this.selectedPlaneIdx].name;
        document.getElementById('hangar-plane-description').innerText = this.planes[this.selectedPlaneIdx].desc;

        // Custom Special labels based on plane type
        if (type === 'p38') {
            document.getElementById('up-title-special').innerText = "AUXILIARY SUPPORT";
            document.getElementById('up-desc-special').innerText = "Adds escort wingmen firing parallel streams.";
        } else if (type === 'pancake') {
            document.getElementById('up-title-special').innerText = "SHIELD BATTERY";
            document.getElementById('up-desc-special').innerText = "Increases emergency kinetic energy shield.";
        } else if (type === 'mitchell') {
            document.getElementById('up-title-special').innerText = "DEFENSE TURRET";
            document.getElementById('up-desc-special').innerText = "Upgrades automatic rear-firing defensive caliber.";
        } else if (type === 'corsair') {
            document.getElementById('up-title-special').innerText = "WING TANKS";
            document.getElementById('up-desc-special').innerText = "Adds long-range drop tanks – enables extra wingman escort.";
        } else if (type === 'zero') {
            document.getElementById('up-title-special').innerText = "AGILITY BOOST";
            document.getElementById('up-desc-special').innerText = "Upgrades Zero's legendary maneuverability and loop count.";
        }

        const setupCard = (upgradeType) => {
            const level = ups[upgradeType];
            const maxLvl = 3;
            
            document.getElementById(`up-level-${upgradeType}`).innerText = `LVL ${level}` + (level === maxLvl ? ' (MAX)' : '');
            
            const btn = document.getElementById(`btn-up-${upgradeType}`);
            const costLabel = document.getElementById(`cost-${upgradeType}`);

            if (level >= maxLvl) {
                btn.disabled = true;
                costLabel.innerText = "MAX";
            } else {
                const costIndex = upgradeType === 'special' ? level : level - 1;
                const cost = this.upgradeCosts[upgradeType][costIndex];
                costLabel.innerText = `★ ${cost}`;
                btn.disabled = this.profile.stars < cost;
            }
        };

        setupCard('weapon');
        setupCard('speed');
        setupCard('armor');
        setupCard('special');
    },

    buyUpgrade(upgradeType) {
        const type = this.planes[this.selectedPlaneIdx].type;
        const ups = this.profile.upgrades[type];
        const currentLvl = ups[upgradeType];
        
        const costIndex = upgradeType === 'special' ? currentLvl : currentLvl - 1;
        const cost = this.upgradeCosts[upgradeType][costIndex];
        if (this.profile.stars >= cost) {
            this.profile.stars -= cost;
            ups[upgradeType]++;
            
            // Play upgrade sound
            AudioEngine.playPowerUp();
            
            // Re-render
            this.renderHangarDetails();
            this.saveProfile();
        }
    },

    /* ----------------------------------------------------
       PERSISTENCE (LocalStorage)
       ---------------------------------------------------- */
    saveProfile() {
        localStorage.setItem('194xdd_profile', JSON.stringify(this.profile));
    },

    loadProfile() {
        const data = localStorage.getItem('194xdd_profile');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed) {
                    if (typeof parsed.stars === 'number') this.profile.stars = parsed.stars;
                    if (Array.isArray(parsed.unlockedPlanes)) {
                        this.profile.unlockedPlanes = parsed.unlockedPlanes;
                        // Auto-unlock newly released planes to ensure no regression from older saves
                        this.planes.forEach(p => {
                            if (!this.profile.unlockedPlanes.includes(p.type)) {
                                this.profile.unlockedPlanes.push(p.type);
                            }
                        });
                    }
                    if (parsed.upgrades) {
                        // Safely deep merge upgrades to support older version profile upgrades databases
                        for (let p in parsed.upgrades) {
                            if (this.profile.upgrades[p]) {
                                this.profile.upgrades[p] = { ...this.profile.upgrades[p], ...parsed.upgrades[p] };
                            }
                        }
                    }
                    if (Array.isArray(parsed.highscores)) this.profile.highscores = parsed.highscores;
                }
            } catch (e) {
                console.warn("Could not load high score save profile:", e);
            }
        }
    },

    saveHighScore(initials) {
        const currentType = this.planes[this.selectedPlaneIdx].name.split(' ')[0];
        
        this.profile.highscores.push({
            name: initials,
            plane: currentType,
            stage: this.game.stage,
            score: this.game.score
        });

        // Sort descending, limit to top 10
        this.profile.highscores.sort((a, b) => b.score - a.score);
        this.profile.highscores = this.profile.highscores.slice(0, 10);
        this.saveProfile();
        this.renderLeaderboard();
    },

    renderLeaderboard() {
        const tbody = document.getElementById('leaderboard-rows');
        tbody.innerHTML = '';

        this.profile.highscores.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            
            const tdRank = document.createElement('td');
            tdRank.innerText = idx + 1;
            
            const tdName = document.createElement('td');
            tdName.innerText = entry.name;
            
            const tdPlane = document.createElement('td');
            tdPlane.innerText = entry.plane;

            const tdStage = document.createElement('td');
            tdStage.innerText = entry.stage;

            const tdScore = document.createElement('td');
            tdScore.innerText = entry.score.toLocaleString();

            tr.appendChild(tdRank);
            tr.appendChild(tdName);
            tr.appendChild(tdPlane);
            tr.appendChild(tdStage);
            tr.appendChild(tdScore);
            
            tbody.appendChild(tr);
        });
    }
};

// Start application
window.onload = () => {
    App.init();
};
