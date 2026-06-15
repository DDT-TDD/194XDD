/* ----------------------------------------------------
   194XDD Assets - Procedural Graphics Cache Engine
   ---------------------------------------------------- */

// Exposes all pre-rendered image buffers to the game engine
export const Assets = {
    // Player aircrafts
    p38: null,
    pancake: null,
    mitchell: null,
    corsair: null,
    zero: null,
    wingman: null,

    // Enemies
    enemyScout: null,
    enemyBomber: null,
    bossFuselage: null,
    bossWingLeft: null,
    bossWingRight: null,
    bossTurret: null,

    // Environment
    islands: [], // Array of different pre-rendered islands
    clouds: [],  // Array of cloud canvases
    
    // Items / VFX
    powerups: {},
    star: null,
    explosionFrames: [],

    // Initialization trigger
    init() {
        console.log("Generating visual assets cache...");
        this.p38 = createPlayerP38();
        this.pancake = createPlayerPancake();
        this.mitchell = createPlayerMitchell();
        this.corsair = createPlayerCorsair();
        this.zero = createPlayerZero();
        this.wingman = createWingman();
        
        this.enemyScout = createEnemyScout();
        this.enemyBomber = createEnemyBomber();
        
        // Boss pieces (destructible parts)
        this.bossFuselage = createBossFuselage();
        this.bossWingLeft = createBossWing(true);
        this.bossWingRight = createBossWing(false);
        this.bossTurret = createBossTurret();

        // Environment
        this.islands.push(createIsland(150, 150, 0.4, 0.6));
        this.islands.push(createIsland(250, 220, 0.6, 0.3));
        this.islands.push(createIsland(180, 280, 0.3, 0.7));
        this.islands.push(createIsland(200, 200, 0.8, 0.5)); // volcanic atoll
        this.islands.push(createIsland(120, 160, 0.2, 0.9)); // lush jungle

        this.clouds.push(createCloud(180, 110, 0.85));
        this.clouds.push(createCloud(240, 140, 0.75));
        this.clouds.push(createCloud(300, 160, 0.95)); // large storm cloud
        this.clouds.push(createCloud(140, 90, 0.60));  // wispy cloud

        // Power-ups
        this.powerups.weapon = createPowerupIcon("W", "#00e5ff");
        this.powerups.speed = createPowerupIcon("S", "#00e676");
        this.powerups.armor = createPowerupIcon("H", "#ff3366");
        this.powerups.special = createPowerupIcon("X", "#ffd700");
        this.powerups.bomb = createPowerupIcon("B", "#ff6d00");
        this.powerups.shield = createPowerupIcon("D", "#00b0ff");
        this.powerups.magnet = createPowerupIcon("M", "#e040fb");
        this.star = createStarIcon();
        
        console.log("Visual assets generated successfully.");
    }
};

/* ----------------------------------------------------
   HELPER: Create Offscreen Canvas
   ---------------------------------------------------- */
function createBuffer(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
}

/* ----------------------------------------------------
   1. P-38 LIGHTNING (Classic interceptor)
   ---------------------------------------------------- */
function createPlayerP38() {
    const { canvas, ctx } = createBuffer(128, 128);
    const cx = 64, cy = 64;

    // Set shadow for rendering depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // WINGS (Main sweep)
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy - 2);
    ctx.lineTo(cx + 56, cy - 2);
    ctx.lineTo(cx + 50, cy + 8);
    ctx.lineTo(cx - 50, cy + 8);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(cx - 50, 0, cx + 50, 0);
    wingGrad.addColorStop(0, '#546e7a');
    wingGrad.addColorStop(0.5, '#78909c');
    wingGrad.addColorStop(1, '#546e7a');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wing Panels / Details
    ctx.shadowColor = "transparent"; // disable shadows for inner details
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy); ctx.lineTo(cx - 40, cy + 6);
    ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 20, cy + 6);
    ctx.moveTo(cx + 20, cy); ctx.lineTo(cx + 20, cy + 6);
    ctx.moveTo(cx + 40, cy); ctx.lineTo(cx + 40, cy + 6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    // Red tips on wings
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy - 2);
    ctx.lineTo(cx - 48, cy - 2);
    ctx.lineTo(cx - 46, cy + 6);
    ctx.lineTo(cx - 50, cy + 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 56, cy - 2);
    ctx.lineTo(cx + 48, cy - 2);
    ctx.lineTo(cx + 46, cy + 6);
    ctx.lineTo(cx + 50, cy + 8);
    ctx.closePath();
    ctx.fill();

    // Twin Booms (Engine housings extending to tails)
    const drawBoom = (bx) => {
        // Boom Body
        ctx.fillStyle = '#607d8b';
        ctx.beginPath();
        ctx.moveTo(bx - 6, cy - 24);
        ctx.lineTo(bx + 6, cy - 24);
        ctx.lineTo(bx + 4, cy + 42);
        ctx.lineTo(bx - 4, cy + 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engine nose caps (yellow caps)
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.arc(bx, cy - 22, 5, Math.PI, 0);
        ctx.fill();

        // Horizontal Tailpiece
        ctx.fillStyle = '#546e7a';
        ctx.fillRect(bx - 4, cy + 34, 8, 4);
    };
    drawBoom(cx - 24);
    drawBoom(cx + 24);

    // Connecting Elevator Tail
    ctx.fillStyle = '#455a64';
    ctx.fillRect(cx - 24, cy + 38, 48, 4);
    ctx.strokeRect(cx - 24, cy + 38, 48, 4);

    // Twin Tail Fins
    ctx.fillStyle = '#37474f';
    ctx.fillRect(cx - 27, cy + 32, 4, 12);
    ctx.fillRect(cx + 23, cy + 32, 4, 12);

    // CENTRAL FUSELAGE POD
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6, 8, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nose guns
    ctx.fillStyle = '#111';
    ctx.fillRect(cx - 2, cy - 36, 1.5, 4);
    ctx.fillRect(cx + 0.5, cy - 36, 1.5, 4);

    // Canopy / Cockpit (Glass highlight)
    const glassGrad = ctx.createRadialGradient(cx - 2, cy - 12, 2, cx, cy - 10, 8);
    glassGrad.addColorStop(0, '#e0f7fa');
    glassGrad.addColorStop(0.4, '#00b0ff');
    glassGrad.addColorStop(1, '#006064');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 4, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy frames
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 10); ctx.lineTo(cx + 4, cy - 10);
    ctx.moveTo(cx - 3.5, cy - 16); ctx.lineTo(cx + 3.5, cy - 16);
    ctx.moveTo(cx - 3, cy - 4); ctx.lineTo(cx + 3, cy - 4);
    ctx.stroke();

    // Allied Star Decals on wings
    drawStarDecal(ctx, cx - 36, cy + 3, 4);
    drawStarDecal(ctx, cx + 36, cy + 3, 4);

    return canvas;
}

/* ----------------------------------------------------
   2. XF-5U FLYING PANCAKE (Circular agile jet)
   ---------------------------------------------------- */
function createPlayerPancake() {
    const { canvas, ctx } = createBuffer(128, 128);
    const cx = 64, cy = 64;

    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Body (Pancake Shape - Large circle slightly compressed)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 36, 30, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 36);
    bodyGrad.addColorStop(0, '#558b2f');
    bodyGrad.addColorStop(0.7, '#33691e');
    bodyGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#0e3a00';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Panel lines on the disk body
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 28); ctx.lineTo(cx, cy + 32);
    ctx.moveTo(cx - 36, cy + 2); ctx.lineTo(cx + 36, cy + 2);
    ctx.stroke();

    // Twin prop boom nacelles at the front edges
    const drawPancakeEngine = (ex) => {
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.ellipse(ex, cy - 18, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Prop hub
        ctx.fillStyle = '#f57f17';
        ctx.beginPath();
        ctx.arc(ex, cy - 30, 4, 0, Math.PI * 2);
        ctx.fill();
    };
    drawPancakeEngine(cx - 30);
    drawPancakeEngine(cx + 30);

    // Twin Vertical Tail Fins at the back
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 25);
    ctx.lineTo(cx - 20, cy + 42);
    ctx.lineTo(cx - 14, cy + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 18, cy + 25);
    ctx.lineTo(cx + 20, cy + 42);
    ctx.lineTo(cx + 14, cy + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Canopy (Center Front)
    const glassGrad = ctx.createRadialGradient(cx - 3, cy - 18, 2, cx, cy - 16, 7);
    glassGrad.addColorStop(0, '#e8f5e9');
    glassGrad.addColorStop(0.5, '#4caf50');
    glassGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 16, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gun ports
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 12, cy - 24, 2, 4);
    ctx.fillRect(cx + 10, cy - 24, 2, 4);

    // Decals
    drawStarDecal(ctx, cx - 18, cy, 3.5);
    drawStarDecal(ctx, cx + 18, cy, 3.5);

    return canvas;
}

/* ----------------------------------------------------
   3. B-25 MITCHELL (Heavy medium bomber)
   ---------------------------------------------------- */
function createPlayerMitchell() {
    const { canvas, ctx } = createBuffer(144, 144);
    const cx = 72, cy = 72;

    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;

    // WINGS (Large, swept-back leading edge)
    ctx.beginPath();
    ctx.moveTo(cx - 68, cy + 2);
    ctx.lineTo(cx + 68, cy + 2);
    ctx.lineTo(cx + 64, cy + 18);
    ctx.lineTo(cx - 64, cy + 18);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(cx - 64, 0, cx + 64, 0);
    wingGrad.addColorStop(0, '#37474f');
    wingGrad.addColorStop(0.5, '#546e7a');
    wingGrad.addColorStop(1, '#37474f');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Engine Nacelles on wings
    const drawEngine = (ex) => {
        ctx.fillStyle = '#455a64';
        ctx.beginPath();
        ctx.ellipse(ex, cy + 4, 8, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cowl ring (bronze color)
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.ellipse(ex, cy - 18, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    };
    drawEngine(cx - 28);
    drawEngine(cx + 28);

    // Tail Plane
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 50);
    ctx.lineTo(cx + 24, cy + 50);
    ctx.lineTo(cx + 20, cy + 58);
    ctx.lineTo(cx - 20, cy + 58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Tail fins at extreme ends of stabilizer
    ctx.fillStyle = '#37474f';
    ctx.fillRect(cx - 25, cy + 46, 3, 16);
    ctx.fillRect(cx + 22, cy + 46, 3, 16);

    // FUSELAGE (Huge body)
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 11, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cockpit Window (Large greenhouse canopy)
    const glassGrad = ctx.createRadialGradient(cx - 3, cy - 20, 2, cx, cy - 18, 9);
    glassGrad.addColorStop(0, '#e0f7fa');
    glassGrad.addColorStop(0.5, '#00b0ff');
    glassGrad.addColorStop(1, '#006064');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nose Glass (Bombardier canopy)
    ctx.beginPath();
    ctx.ellipse(cx, cy - 44, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Panel grid on cockpit
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 6);
    ctx.moveTo(cx - 6, cy - 18); ctx.lineTo(cx + 6, cy - 18);
    ctx.stroke();

    // Wing Stars
    drawStarDecal(ctx, cx - 48, cy + 10, 5);
    drawStarDecal(ctx, cx + 48, cy + 10, 5);

    return canvas;
}

/* ----------------------------------------------------
   4. F4U CORSAIR (Gull-wing Navy heavy fighter)
   ---------------------------------------------------- */
function createPlayerCorsair() {
    const { canvas, ctx } = createBuffer(136, 136);
    const cx = 68, cy = 68;

    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Gull Wings – inverted W shape (left wing: goes down then up, right mirrors)
    // Left outer wing panel (angled upward)
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 2);       // inner gull bend
    ctx.lineTo(cx - 62, cy - 10);      // tip
    ctx.lineTo(cx - 58, cy + 2);       // tip trailing
    ctx.lineTo(cx - 20, cy + 10);      // inner trailing
    ctx.closePath();
    const lwGrad = ctx.createLinearGradient(cx - 62, 0, cx - 20, 0);
    lwGrad.addColorStop(0, '#1a237e');
    lwGrad.addColorStop(1, '#283593');
    ctx.fillStyle = lwGrad;
    ctx.fill();
    ctx.strokeStyle = '#0d1459';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left inner gull-bend (downward dip)
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 2);
    ctx.lineTo(cx - 20, cy + 2);
    ctx.lineTo(cx - 20, cy + 10);
    ctx.lineTo(cx - 6, cy + 8);
    ctx.closePath();
    ctx.fillStyle = '#283593';
    ctx.fill();
    ctx.stroke();

    // Right outer wing panel
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy + 2);
    ctx.lineTo(cx + 62, cy - 10);
    ctx.lineTo(cx + 58, cy + 2);
    ctx.lineTo(cx + 20, cy + 10);
    ctx.closePath();
    const rwGrad = ctx.createLinearGradient(cx + 20, 0, cx + 62, 0);
    rwGrad.addColorStop(0, '#283593');
    rwGrad.addColorStop(1, '#1a237e');
    ctx.fillStyle = rwGrad;
    ctx.fill();
    ctx.stroke();

    // Right inner gull-bend
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 2);
    ctx.lineTo(cx + 20, cy + 2);
    ctx.lineTo(cx + 20, cy + 10);
    ctx.lineTo(cx + 6, cy + 8);
    ctx.closePath();
    ctx.fillStyle = '#283593';
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Wing panel rivets / lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let ox = 28; ox <= 56; ox += 14) {
        ctx.beginPath();
        ctx.moveTo(cx - ox, cy - 3);
        ctx.lineTo(cx - ox, cy + 9);
        ctx.moveTo(cx + ox, cy - 3);
        ctx.lineTo(cx + ox, cy + 9);
        ctx.stroke();
    }

    // 6 gun ports (3 per wing) - iconic Corsair feature
    ctx.fillStyle = '#111';
    [[30,cy-1],[42,cy-2],[54,cy-4]].forEach(([ox, oy]) => {
        ctx.fillRect(cx - ox - 1, oy, 2, 5);
        ctx.fillRect(cx + ox - 1, oy, 2, 5);
    });

    // Fuselage – long tapered tube
    const fuseGrad = ctx.createLinearGradient(cx - 12, 0, cx + 12, 0);
    fuseGrad.addColorStop(0, '#1a237e');
    fuseGrad.addColorStop(0.4, '#303f9f');
    fuseGrad.addColorStop(0.6, '#3949ab');
    fuseGrad.addColorStop(1, '#1a237e');
    ctx.fillStyle = fuseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 11, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d1459';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Large radial engine cowl ring (distinctive Corsair feature)
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx, cy - 38, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cowl cooling vents
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        ctx.beginPath();
        ctx.arc(cx, cy - 38, 11, a, a + 0.28);
        ctx.stroke();
    }

    // Prop hub spinner (yellow)
    ctx.fillStyle = '#f9a825';
    ctx.beginPath();
    ctx.arc(cx, cy - 50, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit canopy (offset aft of engine)
    const cGrad = ctx.createRadialGradient(cx - 3, cy - 16, 1, cx, cy - 14, 9);
    cGrad.addColorStop(0, '#e3f2fd');
    cGrad.addColorStop(0.4, '#64b5f6');
    cGrad.addColorStop(1, '#1565c0');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 14, 7, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d1459';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Canopy frame bars
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 27); ctx.lineTo(cx, cy - 1);
    ctx.moveTo(cx - 7, cy - 14); ctx.lineTo(cx + 7, cy - 14);
    ctx.moveTo(cx - 6, cy - 22); ctx.lineTo(cx + 6, cy - 22);
    ctx.stroke();

    // Tail horizontal stabiliser
    ctx.fillStyle = '#1a237e';
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 32);
    ctx.lineTo(cx + 22, cy + 32);
    ctx.lineTo(cx + 18, cy + 42);
    ctx.lineTo(cx - 18, cy + 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail fins
    ctx.fillStyle = '#0d1459';
    ctx.fillRect(cx - 4, cy + 28, 3, 18);
    ctx.fillRect(cx + 1, cy + 28, 3, 18);

    // Allied star decals
    drawStarDecal(ctx, cx - 40, cy + 3, 4);
    drawStarDecal(ctx, cx + 40, cy + 3, 4);

    return canvas;
}

/* ----------------------------------------------------
   5. A6M ZERO (Captured Imperial ace – repurposed)
   ---------------------------------------------------- */
function createPlayerZero() {
    const { canvas, ctx } = createBuffer(132, 132);
    const cx = 66, cy = 66;

    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Long straight tapered wings (distinctive Zero silhouette)
    const drawZeroWing = (dir) => {
        const sign = dir; // 1 = right, -1 = left
        ctx.beginPath();
        ctx.moveTo(cx, cy + 2);
        ctx.lineTo(cx + sign * 64, cy - 6);
        ctx.lineTo(cx + sign * 62, cy + 4);
        ctx.lineTo(cx, cy + 12);
        ctx.closePath();
        const wg = ctx.createLinearGradient(cx, 0, cx + sign * 64, 0);
        wg.addColorStop(0, '#4e6b2e');
        wg.addColorStop(0.6, '#5d7a36');
        wg.addColorStop(1, '#3b5220');
        ctx.fillStyle = wg;
        ctx.fill();
        ctx.strokeStyle = '#2a3b17';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    };
    drawZeroWing(-1);
    drawZeroWing(1);

    ctx.shadowColor = "transparent";

    // Wing rivet lines
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    for (let ox = 18; ox <= 54; ox += 18) {
        ctx.beginPath();
        ctx.moveTo(cx - ox, cy - 1); ctx.lineTo(cx - ox, cy + 10);
        ctx.moveTo(cx + ox, cy - 1); ctx.lineTo(cx + ox, cy + 10);
        ctx.stroke();
    }

    // Wing folding tip detail (distinctive)
    ctx.fillStyle = '#3b5220';
    ctx.fillRect(cx - 66, cy - 6, 4, 10);
    ctx.fillRect(cx + 62, cy - 6, 4, 10);

    // Long slender fuselage
    const fGrad = ctx.createLinearGradient(cx - 9, 0, cx + 9, 0);
    fGrad.addColorStop(0, '#3b5220');
    fGrad.addColorStop(0.4, '#5d7a36');
    fGrad.addColorStop(0.6, '#6b8c3e');
    fGrad.addColorStop(1, '#3b5220');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 9, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a3b17';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Large round radial cowl (Mitsubishi Sakae engine)
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(cx, cy - 38, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Radial cylinder fins pattern
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        const ix = cx + Math.cos(a) * 9;
        const iy = (cy - 38) + Math.sin(a) * 9;
        const ox2 = cx + Math.cos(a) * 12;
        const oy2 = (cy - 38) + Math.sin(a) * 12;
        ctx.moveTo(ix, iy);
        ctx.lineTo(ox2, oy2);
        ctx.stroke();
    }

    // Prop spinner
    ctx.fillStyle = '#ffcc02';
    ctx.beginPath();
    ctx.arc(cx, cy - 50, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Canopy bubble (long greenhouse style)
    const cgGrad = ctx.createRadialGradient(cx - 2, cy - 20, 1, cx, cy - 18, 8);
    cgGrad.addColorStop(0, '#f0ffe0');
    cgGrad.addColorStop(0.4, '#aed581');
    cgGrad.addColorStop(1, '#33691e');
    ctx.fillStyle = cgGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 6, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a3b17';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit frame
    ctx.strokeStyle = '#2a3b17';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 29); ctx.lineTo(cx, cy - 7);
    ctx.moveTo(cx - 6, cy - 18); ctx.lineTo(cx + 6, cy - 18);
    ctx.moveTo(cx - 5, cy - 24); ctx.lineTo(cx + 5, cy - 24);
    ctx.stroke();

    // Twin 20mm cannon ports
    ctx.fillStyle = '#111';
    ctx.fillRect(cx - 10, cy - 28, 2, 6);
    ctx.fillRect(cx + 8, cy - 28, 2, 6);

    // Cruciform tail
    ctx.fillStyle = '#3b5220';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 34);
    ctx.lineTo(cx + 20, cy + 34);
    ctx.lineTo(cx + 16, cy + 44);
    ctx.lineTo(cx - 16, cy + 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillRect(cx - 3, cy + 30, 3, 18);
    ctx.fillRect(cx, cy + 30, 3, 18);

    // Allied roundel marking (painted over original - slightly off-center)
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.arc(cx - 36, cy + 4, 5, 0, Math.PI * 2);
    ctx.arc(cx + 36, cy + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 36, cy + 4, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 36, cy + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx - 36, cy + 4, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 36, cy + 4, 2.2, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
}

/* ----------------------------------------------------
   6. WINGMAN (Small helper plane)
   ---------------------------------------------------- */
function createWingman() {
    const { canvas, ctx } = createBuffer(48, 48);
    const cx = 24, cy = 24;

    ctx.fillStyle = '#90a4ae';
    // Wings
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.lineTo(cx + 16, cy + 4);
    ctx.lineTo(cx - 16, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fuselage
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 4, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#80d8ff';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
}

/* ----------------------------------------------------
   7. ENEMY SCOUT (Sharp interceptor, red camo)
   ---------------------------------------------------- */
function createEnemyScout() {
    const { canvas, ctx } = createBuffer(64, 64);
    const cx = 32, cy = 32;

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;

    // Swept forward delta wings with double-edge detail
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 2);
    ctx.lineTo(cx, cy - 20);    // front apex
    ctx.lineTo(cx + 30, cy + 2);
    ctx.lineTo(cx + 22, cy + 8);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx - 22, cy + 8);
    ctx.closePath();
    const wg = ctx.createLinearGradient(cx - 30, 0, cx + 30, 0);
    wg.addColorStop(0, '#b71c1c');
    wg.addColorStop(0.5, '#e53935');
    wg.addColorStop(1, '#b71c1c');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = '#7f0000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Wing stripe highlights
    ctx.strokeStyle = 'rgba(255,200,0,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 2); ctx.lineTo(cx - 18, cy + 7);
    ctx.moveTo(cx + 18, cy + 2); ctx.lineTo(cx + 18, cy + 7);
    ctx.stroke();

    // Fuselage, sleek pointed body
    const fGrad = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
    fGrad.addColorStop(0, '#880e4f');
    fGrad.addColorStop(0.5, '#c62828');
    fGrad.addColorStop(1, '#880e4f');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 5, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#560000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Engine cowl
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit (bright amber tint)
    const cGrad = ctx.createRadialGradient(cx - 1, cy - 4, 1, cx, cy - 2, 6);
    cGrad.addColorStop(0, '#ffe082');
    cGrad.addColorStop(0.5, '#fb8c00');
    cGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 3.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f0000';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Rising sun insignia on wings (enemy markings)
    [[cx - 24, cy + 1], [cx + 24, cy + 1]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(wx, wy, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(wx, wy, 2.4, 0, Math.PI * 2);
        ctx.fill();
        // Sun rays
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 0.8;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(wx + Math.cos(a) * 2.4, wy + Math.sin(a) * 2.4);
            ctx.lineTo(wx + Math.cos(a) * 3.8, wy + Math.sin(a) * 3.8);
            ctx.stroke();
        }
    });

    // Tail fins
    ctx.fillStyle = '#880e4f';
    ctx.fillRect(cx - 2, cy + 20, 4, 6);

    return canvas;
}

/* ----------------------------------------------------
   8. ENEMY BOMBER (Multi-engine heavy, dark green camo)
   ---------------------------------------------------- */
function createEnemyBomber() {
    const { canvas, ctx } = createBuffer(112, 112);
    const cx = 56, cy = 56;

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 5;

    // Wide swept wings with camo pattern layers
    ctx.beginPath();
    ctx.moveTo(cx - 52, cy + 2);
    ctx.lineTo(cx + 52, cy + 2);
    ctx.lineTo(cx + 46, cy + 15);
    ctx.lineTo(cx - 46, cy + 15);
    ctx.closePath();
    const wg = ctx.createLinearGradient(cx - 46, 0, cx + 46, 0);
    wg.addColorStop(0, '#1b5e20');
    wg.addColorStop(0.3, '#33691e');
    wg.addColorStop(0.5, '#4caf50');
    wg.addColorStop(0.7, '#33691e');
    wg.addColorStop(1, '#1b5e20');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = '#0a2e0a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Camo dapple spots on wings
    ctx.fillStyle = 'rgba(0,50,0,0.35)';
    [[cx - 30, cy + 8, 10, 5], [cx - 10, cy + 6, 8, 4], [cx + 22, cy + 9, 12, 5]].forEach(([x,y,rw,rh]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, rw, rh, 0.3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Twin engine nacelles with radial detail
    const drawBomberEngine = (ex) => {
        ctx.fillStyle = '#0a3d0a';
        ctx.beginPath();
        ctx.ellipse(ex, cy + 6, 8, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a2e0a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cowl ring highlight
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.ellipse(ex, cy - 12, 7.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Prop spinner
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(ex, cy - 15, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Exhaust stacks
        ctx.fillStyle = '#111';
        ctx.fillRect(ex - 3, cy - 8, 2, 5);
        ctx.fillRect(ex + 1, cy - 8, 2, 5);
    };
    drawBomberEngine(cx - 24);
    drawBomberEngine(cx + 24);

    // Wide fuselage body
    const fGrad = ctx.createLinearGradient(cx - 11, 0, cx + 11, 0);
    fGrad.addColorStop(0, '#1b5e20');
    fGrad.addColorStop(0.4, '#388e3c');
    fGrad.addColorStop(0.6, '#43a047');
    fGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a2e0a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glazed nose/cockpit
    const cgGrad = ctx.createRadialGradient(cx - 2, cy - 18, 1, cx, cy - 15, 8);
    cgGrad.addColorStop(0, '#fff9c4');
    cgGrad.addColorStop(0.5, '#fbc02d');
    cgGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = cgGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 15, 5.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a2e0a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Frame lines on canopy
    ctx.strokeStyle = '#0a2e0a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 23); ctx.lineTo(cx, cy - 7);
    ctx.moveTo(cx - 5, cy - 15); ctx.lineTo(cx + 5, cy - 15);
    ctx.stroke();

    // Tail gunner position
    ctx.fillStyle = '#fbc02d';
    ctx.beginPath();
    ctx.arc(cx, cy + 26, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Tail stabiliser
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 28);
    ctx.lineTo(cx + 24, cy + 28);
    ctx.lineTo(cx + 20, cy + 40);
    ctx.lineTo(cx - 20, cy + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(cx - 3, cy + 24, 3, 18);
    ctx.fillRect(cx, cy + 24, 3, 18);

    // Enemy insignia (red circles)
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx - 38, cy + 8, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + 38, cy + 8, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 38, cy + 8, 3, 0, Math.PI * 2);
    ctx.arc(cx + 38, cy + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx - 38, cy + 8, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 38, cy + 8, 1.8, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
}

/* ----------------------------------------------------
   9. GIANT BOSS PARTS (Modular assembly)
   ---------------------------------------------------- */
function createBossFuselage() {
    const { canvas, ctx } = createBuffer(160, 220);
    const cx = 80, cy = 110;

    // Heavy main fuselage armored pod
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#102027';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Canopy (Massive multi-window command deck)
    const glassGrad = ctx.createLinearGradient(cx, cy - 60, cx, cy - 30);
    glassGrad.addColorStop(0, '#ffe082');
    glassGrad.addColorStop(0.5, '#ff8f00');
    glassGrad.addColorStop(1, '#ff6f00');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 48, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Window lines
    ctx.strokeStyle = '#102027';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 66); ctx.lineTo(cx, cy - 30);
    ctx.moveTo(cx - 14, cy - 48); ctx.lineTo(cx + 14, cy - 48);
    ctx.stroke();

    // Armored panel layers
    ctx.fillStyle = '#455a64';
    ctx.fillRect(cx - 18, cy - 10, 36, 12);
    ctx.strokeRect(cx - 18, cy - 10, 36, 12);
    ctx.fillRect(cx - 20, cy + 15, 40, 15);
    ctx.strokeRect(cx - 20, cy + 15, 40, 15);

    // Glowing engines on tail
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(cx - 10, cy + 86, 6, 4);
    ctx.fillRect(cx + 4, cy + 86, 6, 4);

    return canvas;
}

function createBossWing(isLeft) {
    const { canvas, ctx } = createBuffer(240, 120);
    const w = 240, h = 120;
    
    // Draw wing structure anchored at one side
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    if (isLeft) {
        ctx.moveTo(w, 20);
        ctx.lineTo(10, 40);
        ctx.lineTo(25, 90);
        ctx.lineTo(w, 75);
    } else {
        ctx.moveTo(0, 20);
        ctx.lineTo(w - 10, 40);
        ctx.lineTo(w - 25, 90);
        ctx.lineTo(0, 75);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#102027';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Engine housings on wing
    const drawWingEngine = (ex) => {
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.ellipse(ex, 48, 12, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Prop caps
        ctx.fillStyle = '#f57f17';
        ctx.beginPath();
        ctx.ellipse(ex, 20, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    if (isLeft) {
        drawWingEngine(80);
        drawWingEngine(160);
    } else {
        drawWingEngine(w - 80);
        drawWingEngine(w - 160);
    }

    return canvas;
}

function createBossTurret() {
    const { canvas, ctx } = createBuffer(48, 48);
    const cx = 24, cy = 24;

    // Turret base ring
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#102027';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Rotating dome
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dual gun barrels
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 4, cy - 20, 2.5, 12);
    ctx.fillRect(cx + 1.5, cy - 20, 2.5, 12);

    return canvas;
}

/* ----------------------------------------------------
   8. ENVIRONMENTAL OBJECTS (Islands & Clouds)
   ---------------------------------------------------- */
function createIsland(width, height, roughX, roughY) {
    const { canvas, ctx } = createBuffer(width, height);
    const cx = width / 2;
    const cy = height / 2;
    const rx = width * 0.45;
    const ry = height * 0.4;

    // Generate procedural sandy beach shape
    ctx.beginPath();
    const numPoints = 16;
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Apply sine-based roughness
        const factor = 1 + Math.sin(angle * 3) * 0.15 + Math.cos(angle * 7) * 0.1 * roughX;
        const x = cx + Math.cos(angle) * rx * factor;
        const y = cy + Math.sin(angle) * ry * factor;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffe082'; // Sandy beach color
    ctx.fill();

    // Inner reef border shadow
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Generate inner jungle (green forest core)
    ctx.beginPath();
    const irx = rx * 0.78;
    const iry = ry * 0.72;
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const factor = 1 + Math.cos(angle * 3) * 0.12 + Math.sin(angle * 5) * 0.08 * roughY;
        const x = cx + Math.cos(angle) * irx * factor;
        const y = cy + Math.sin(angle) * iry * factor;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const jungleGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, irx);
    jungleGrad.addColorStop(0, '#33691e'); // Dark green jungle center
    jungleGrad.addColorStop(0.7, '#558b2f');
    jungleGrad.addColorStop(1, '#689f38');  // Light green edges
    ctx.fillStyle = jungleGrad;
    ctx.fill();

    // Draw detail trees (little green circles inside the jungle)
    ctx.fillStyle = 'rgba(27, 94, 32, 0.4)'; // tree shadow
    for (let i = 0; i < 6; i++) {
        const tx = cx + (Math.random() - 0.5) * irx * 0.8;
        const ty = cy + (Math.random() - 0.5) * iry * 0.8;
        const tr = 6 + Math.random() * 8;
        
        ctx.beginPath();
        ctx.arc(tx + 2, ty + 2, tr, 0, Math.PI*2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI*2);
        const treeGrad = ctx.createRadialGradient(tx - 2, ty - 2, 1, tx, ty, tr);
        treeGrad.addColorStop(0, '#81c784');
        treeGrad.addColorStop(1, '#2e7d32');
        ctx.fillStyle = treeGrad;
        ctx.fill();
    }

    return canvas;
}

function createCloud(width, height, density) {
    const { canvas, ctx } = createBuffer(width, height);
    const cx = width / 2;
    const cy = height / 2;

    // A cloud is built by stacking circles with transparent gradients
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    const numPuffs = 8 + Math.floor(density * 10);
    const puffs = [];

    // Define puff coordinate positions
    for (let i = 0; i < numPuffs; i++) {
        const t = i / numPuffs * Math.PI * 2;
        const radius = (width * 0.22) + Math.random() * (width * 0.15);
        const px = cx + Math.cos(t) * (width * 0.25) * (0.6 + Math.random() * 0.4);
        const py = cy + Math.sin(t) * (height * 0.2) * (0.6 + Math.random() * 0.4);
        puffs.push({ x: px, y: py, r: radius });
    }

    // Paint cloud shadows first (offset)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    puffs.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x + 10, p.y + 16, p.r, 0, Math.PI*2);
        ctx.fill();
    });

    // Paint core puff glows
    puffs.forEach(p => {
        ctx.beginPath();
        const puffGrad = ctx.createRadialGradient(p.x - p.r*0.2, p.y - p.r*0.2, p.r*0.1, p.x, p.y, p.r);
        puffGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
        puffGrad.addColorStop(0.6, 'rgba(240, 248, 255, 0.55)');
        puffGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = puffGrad;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
    });

    return canvas;
}

/* ----------------------------------------------------
   9. INTERACTIVE ICONS & POWERUPS
   ---------------------------------------------------- */
function createPowerupIcon(letter, color) {
    const { canvas, ctx } = createBuffer(36, 36);
    const cx = 18, cy = 18;

    // Glowing border outer ring
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0; // disable shadow for interior

    // Inner background circle (Glassmorphism filled)
    ctx.fillStyle = "rgba(10, 18, 30, 0.85)";
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();

    // Lettering
    ctx.fillStyle = color;
    ctx.font = "bold 13px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, cx, cy);

    return canvas;
}

function createStarIcon() {
    const { canvas, ctx } = createBuffer(24, 24);
    const cx = 12, cy = 12;

    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#ffd700";

    ctx.beginPath();
    const spikes = 5;
    const outerRadius = 9;
    const innerRadius = 4;
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();

    return canvas;
}

/* ----------------------------------------------------
   UTILITIES
   ---------------------------------------------------- */
function drawStarDecal(ctx, x, y, size) {
    ctx.save();
    // Blue circular backing
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // White horizontal wings stripes
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - size * 1.5, y - size * 0.2, size * 3, size * 0.4);

    // Re-fill blue core
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Small white star in center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    const spikes = 5;
    const outer = size * 0.65;
    const inner = size * 0.25;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.moveTo(x, y - outer);
    for (let i = 0; i < spikes; i++) {
        let sx = x + Math.cos(rot) * outer;
        let sy = y + Math.sin(rot) * outer;
        ctx.lineTo(sx, sy);
        rot += step;

        sx = x + Math.cos(rot) * inner;
        sy = y + Math.sin(rot) * inner;
        ctx.lineTo(sx, sy);
        rot += step;
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
