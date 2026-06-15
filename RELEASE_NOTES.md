# 194XDD - Arcade Shooter (Release v1.0)
Copyright (c) 2026. All Rights Reserved.

## 📖 Welcome Pilot!
**194XDD - Counter Attack Protocol** is a fast-paced, high-performance web-based arcade shoot 'em up (shmup) combining classical mechanics of legendary WWII titles with modern visual flourishes and secondary weapon upgrades inspired by *Sky Force Anniversary* and *Sky Force Reloaded*.

Serving pure dynamic procedural vector imagery, custom multi-channel synthesized retro tracks, and highly tuned collision physics, this product is designed for extremely fluid 60FPS vertical-scrolling arcade cabinet gameplay directly inside any modern web browser or windows native desktop wrapper app.

---

## 🎮 Game Features

### ✈️ Five Unique Fighter Aircraft hulls
Each fighter has calibrated armor, maneuver speed, firing rates, custom Hangar upgrade progressions, and unique super-charging weapon technologies:
1.  **P-38 LIGHTNING**: Classic all-rounder. Twin-exhaust props, auxiliary support wingmen, and the *Thunderbolt Lightning Orb* charge shell.
2.  **XF-5U FLYING PANCAKE**: Prototype disk jet. Regenerative kinetic energy shields, hyper laser beams, and concentrated heat ray weaponry.
3.  **B-25 MITCHELL**: Heavy medium bomber. Exploding heavy golden shells, targeted anti-submarine carpet bombs, and rear defense automated turret.
4.  **F4U CORSAIR**: Heavy Gull-wing. Broad .50 cal wing battery, high-impact heavy HVAR air-ground rockets, and massive split artillery barrages.
5.  **A6M ZERO**: Repurposed interceptor. Ultra-agile light hull, lightning-fast 20mm cannons, agile homing laser darts, and chain lightning charges.

### Major Subsystems
*   **Energy Deflector Shield ("D")**: Collect deflector pickups to coat your fighter in robust glow fields that block hostile projectiles.
*   **Star Magnet ("M")**: Magnetizes stars across the entire map, pulling them into your wallet.
*   **Loop Manoeuvre (Space / LeftShift / C)**: Perform a full 3D Loop-the-Loop rendering to enjoy temporary complete invulnerability!

---

## 🎹 Custom Soundtrack Soundtrack
Integrates a multi-channel synthesized tracker built directly on the HTML5 Web Audio API:
*   **Song 1: "Squadron March"** (Stages 1-2) — Driving-beat minor arpeggios.
*   **Song 2: "Midnight Recon"** (Stages 3-4) — Tense urban night groove.
*   **Song 3: "Frozen Twilight"** (Stages 5-6) — Cold ambient wave plucks.
*   **Song 4: "Beyond Orbit"** (Stages 7-8) — Soaring high-velocity deep space theme.

---

## ⌨️ Game Controls

| Control Action | Keyboard Binding | Mouse / Touch Mode |
|---|---|---|
| **Movement** | `W` / `A` / `S` / `D` or `Arrow Keys` | Drag cursor / Slide finger on screen |
| **Normal Weapon** | Hold `Space` | Firing is Automatic |
| **Super-Charge Shot**| Hold `Space` then release when ring is full | Fully automatic charging |
| **Secondary Weapon** | Press `F` or `V` | Click onscreen `MISSILE` / `HVAR` button |
| **Smart Bomb** | Press `B` or `X` | Right-click anywhere or click onscreen `BOMB` |
| **Loop Maneuver** | Press `LeftShift` or `C` | Click onscreen `LOOP` button |
| **Pause Game** | Press `P` or `Escape` | Tap pause corner |

---

## 🛠️ Compilation & Packaging Instructions
The client-server C# binary serves assets on high-performance HTTP listeners and maps unused network ports dynamically.

### Windows Native Compiler
No heavyweight compilers or standard libraries are required. Simply compile using standard pre-installed Windows .NET framework installations:
```powershell
# Compile base C# file securely into high performance 194XDD server launcher
& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /out:194XDD.exe Launcher.cs
```

### Deployment Release Layout
```
194XDD/
├── 194XDD.exe      <-- Compiled server executable launcher
├── Launcher.cs     <-- C# Source Code
├── index.html      <-- Main DOM Frame Layout 
├── css/
│   └── style.css   <-- CRT Scanlines & Cyberpunk UI Styling
└── js/             <-- JS Scripts folder
    ├── assets.js   <-- Prerendered Vectors Cache
    ├── audio.js    <-- Track Synthesizers & Soundcards
    ├── game.js     <-- Game Loop & Router
    ├── input.js    <-- Non-blocking Controllers
    └── main.js     <-- App State Handler
```
