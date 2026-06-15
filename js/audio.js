/* ----------------------------------------------------
   194XDD Audio Engine - Web Audio API Sound Synthesizer
   ---------------------------------------------------- */

export const AudioEngine = {
    ctx: null,
    sfxVolumeNode: null,
    musicVolumeNode: null,
    musicEnabled: true,
    sfxEnabled: true,
    
    // Music Sequencer state
    musicIntervalId: null,
    tempo: 125, // BPM
    currentBeat: 0,
    bassSynthType: 'sawtooth',
    melodySynthType: 'triangle',
    
    // ---- Multi-song stage-aware music system ----
    // 4 fully-layered songs: bass + arpeggio + pad chords + melody + percussion
    songs: [
        { // Song 0: "Squadron March" – A-Minor heroic military, Stages 1-2
            name: 'Squadron March', tempo: 120, bossTempo: 148,
            bassType: 'sawtooth', arpType: 'square', melType: 'triangle',
            bars: [
                {
                    bass: ['A2',null,'A2','C3','A2',null,'E2',null],
                    arp:  ['A3','C4','E4','A4','E4','C4','A3','E3'],
                    mel:  ['A4',null,'E4',null,'C4','B3','A3',null],
                    pads: [['A2','E3','C3'],null,null,null,['A2','E3','C3'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [1,0,1,0,1,0,1,0]
                },
                {
                    bass: ['D2',null,'D2','F2','D2',null,'A2',null],
                    arp:  ['D3','F3','A3','D4','A3','F3','D3','A2'],
                    mel:  ['D4',null,'A3',null,'F3','E3','D3',null],
                    pads: [['D2','A2','F2'],null,null,null,['D2','A2','F2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [1,0,1,0,1,0,1,0]
                },
                {
                    bass: ['C2',null,'C2','E2','C2',null,'G2',null],
                    arp:  ['C3','E3','G3','C4','G3','E3','C3','G2'],
                    mel:  ['C4',null,'G3',null,'E3','D3','C3',null],
                    pads: [['C2','G2','E2'],null,null,null,['C2','G2','E2'],null,null,null],
                    kick: [1,0,0,1,1,0,0,0], hat: [1,0,1,0,1,0,1,0]
                },
                {
                    bass: ['E2',null,'E2','G#2','E2',null,'B1',null],
                    arp:  ['E3','G#3','B3','E4','B3','G#3','E3','B2'],
                    mel:  ['E4',null,'B3',null,'G#3',null,'E3',null],
                    pads: [['E2','B2','G#2'],null,null,null,['E2','B2','G#2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,1], hat: [1,0,1,0,1,0,1,0]
                }
            ]
        },
        { // Song 1: "Midnight Recon" – D-Dorian urban/tense, Stages 3-4
            name: 'Midnight Recon', tempo: 128, bossTempo: 156,
            bassType: 'triangle', arpType: 'sawtooth', melType: 'square',
            bars: [
                {
                    bass: ['D2',null,'D2','F2','A2',null,'D2',null],
                    arp:  ['D3','F3','A3','D4','A3','F3','D3','A2'],
                    mel:  ['D4',null,'A3','F3','D3',null,'A3',null],
                    pads: [['D2','A2','F2','C3'],null,null,null,['D2','A2','F2','C3'],null,null,null],
                    kick: [1,0,0,1,0,0,1,0], hat: [0,1,0,1,0,1,0,1]
                },
                {
                    bass: ['G2',null,'G2','B2','D3',null,'G2',null],
                    arp:  ['G2','B2','D3','G3','D3','B2','G2','D2'],
                    mel:  ['G3',null,'D4','B3','G3',null,'D3',null],
                    pads: [['G2','D3','B2'],null,null,null,['G2','D3','B2'],null,null,null],
                    kick: [1,0,0,0,0,1,0,0], hat: [0,1,0,1,0,1,0,1]
                },
                {
                    bass: ['C2',null,'C2','E2','G2',null,'C2',null],
                    arp:  ['C3','E3','G3','C4','G3','E3','C3','G2'],
                    mel:  ['C4',null,'G3','E3','C3',null,'G3',null],
                    pads: [['C2','G2','E2','B2'],null,null,null,['C2','G2','E2'],null,null,null],
                    kick: [1,0,0,1,0,0,0,1], hat: [0,1,0,1,0,1,0,1]
                },
                {
                    bass: ['A2',null,'A2','C3','E3',null,'A2',null],
                    arp:  ['A2','C3','E3','A3','E3','C3','A2','E2'],
                    mel:  ['A3',null,'E4','C4','A3',null,'E3',null],
                    pads: [['A2','E3','C3'],null,null,null,['A2','E3','C3','G3'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [0,1,0,1,0,1,0,1]
                }
            ]
        },
        { // Song 2: "Frozen Twilight" – E-Phrygian haunting tundra, Stages 5-6
            name: 'Frozen Twilight', tempo: 108, bossTempo: 132,
            bassType: 'sine', arpType: 'triangle', melType: 'sine',
            bars: [
                {
                    bass: ['E2',null,'E2',null,'F2',null,'E2',null],
                    arp:  ['E3','B3','G3','E4','G3','B3','E3','B2'],
                    mel:  ['E4',null,'B3',null,'G3',null,'E3',null],
                    pads: [['E2','B2','G2'],null,null,null,['E2','B2','G2'],null,null,null],
                    kick: [1,0,0,0,0,0,0,0], hat: [0,0,1,0,0,0,1,0]
                },
                {
                    bass: ['C2',null,'C2',null,'D2',null,'C2',null],
                    arp:  ['C3','G3','E3','C4','E3','G3','C3','G2'],
                    mel:  ['C4',null,'G3',null,'E3',null,'C3',null],
                    pads: [['C2','G2','E2'],null,null,null,['C2','G2','E2'],null,null,null],
                    kick: [1,0,0,0,0,0,0,0], hat: [0,0,1,0,0,0,1,0]
                },
                {
                    bass: ['A1',null,'A1',null,'B1',null,'A1',null],
                    arp:  ['A2','E3','C3','A3','C3','E3','A2','E2'],
                    mel:  ['A3',null,'E3',null,'C3',null,'A2',null],
                    pads: [['A1','E2','C2'],null,null,null,['A1','E2','C2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [0,0,1,0,0,0,1,0]
                },
                {
                    bass: ['G2',null,'G2',null,'A2',null,'G2',null],
                    arp:  ['G2','D3','B2','G3','B2','D3','G2','D2'],
                    mel:  ['G3',null,'D3',null,'B2',null,'G2',null],
                    pads: [['G1','D2','B1'],null,null,null,['G1','D2','B1'],null,null,null],
                    kick: [1,0,0,0,0,0,0,0], hat: [0,0,1,0,0,0,1,0]
                }
            ]
        },
        { // Song 3: "Beyond Orbit" – C-Lydian cosmic synthwave, Stages 7-8
            name: 'Beyond Orbit', tempo: 135, bossTempo: 162,
            bassType: 'sawtooth', arpType: 'sawtooth', melType: 'triangle',
            bars: [
                {
                    bass: ['C2',null,'C2','G2','C2',null,'G2',null],
                    arp:  ['C4','E4','G4','C5','G4','E4','C4','G3'],
                    mel:  ['C5',null,'G4',null,'E4',null,'C4',null],
                    pads: [['C2','G2','E2','B2'],null,null,null,['C2','G2','E2','B2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [1,1,1,1,1,1,1,1]
                },
                {
                    bass: ['A1',null,'A1','E2','A1',null,'E2',null],
                    arp:  ['A3','C4','E4','A4','E4','C4','A3','E3'],
                    mel:  ['A4',null,'E4',null,'C4',null,'A3',null],
                    pads: [['A1','E2','C2','G2'],null,null,null,['A1','E2','C2','G2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [1,1,1,1,1,1,1,1]
                },
                {
                    bass: ['F1',null,'F1','C2','F1',null,'C2',null],
                    arp:  ['F3','A3','C4','F4','C4','A3','F3','C3'],
                    mel:  ['F4',null,'C4',null,'A3',null,'F3',null],
                    pads: [['F1','C2','A1','E2'],null,null,null,['F1','C2','A1','E2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,0], hat: [1,1,1,1,1,1,1,1]
                },
                {
                    bass: ['G1',null,'G1','D2','G1',null,'D2',null],
                    arp:  ['G3','B3','D4','G4','D4','B3','G3','D3'],
                    mel:  ['G4',null,'D4',null,'B3',null,'G3',null],
                    pads: [['G1','D2','B1','F#2'],null,null,null,['G1','D2','B1','F#2'],null,null,null],
                    kick: [1,0,0,0,1,0,0,1], hat: [1,1,1,1,1,1,1,1]
                }
            ]
        }
    ],
    currentSongIndex: 0,
    currentBar: 0,

    init() {
        if (this.ctx) return; // already initialized
        
        try {
            // Support both standard and legacy prefixes
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            // SFX Gain Node
            this.sfxVolumeNode = this.ctx.createGain();
            this.sfxVolumeNode.gain.value = 0.35; // Default volume 35%
            this.sfxVolumeNode.connect(this.ctx.destination);
            
            // Music Gain Node
            this.musicVolumeNode = this.ctx.createGain();
            this.musicVolumeNode.gain.value = 0.25; // Default volume 25%
            this.musicVolumeNode.connect(this.ctx.destination);
            
            console.log("Synthesizer audio context activated.");
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser:", e);
        }
    },

    resumeContext() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    setSFXVolume(percent) {
        if (!this.sfxVolumeNode) return;
        this.sfxVolumeNode.gain.value = percent / 100 * 0.5; // caps max volume
    },

    setMusicVolume(percent) {
        if (!this.musicVolumeNode) return;
        this.musicVolumeNode.gain.value = percent / 100 * 0.4; // caps max volume
    },

    /* ----------------------------------------------------
       SFX SYNTHESIZERS
       ---------------------------------------------------- */
    
    // Pitch Slide Laser (Normal / Spread Weapon)
    playShootNormal() {
        if (!this.ctx || !this.sfxEnabled) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        // Quick sweep down
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.13);
    },

    // High frequency Sci-Fi Laser (Laser Weapon)
    playShootLaser() {
        if (!this.ctx || !this.sfxEnabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
    },

    // Heavy bass thump (Mitchell cannons / Boss cannons)
    playShootHeavy() {
        if (!this.ctx || !this.sfxEnabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.22);

        gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.23);
    },

    chargeOsc: null,
    chargeGain: null,

    playChargeUp() {
        if (!this.ctx || !this.sfxEnabled) return;
        if (this.chargeOsc) return; // already playing
        
        this.chargeOsc = this.ctx.createOscillator();
        this.chargeGain = this.ctx.createGain();
        
        this.chargeOsc.type = 'sine';
        this.chargeOsc.frequency.setValueAtTime(150, this.ctx.currentTime);
        // Ramp up over 1.0 second (our charge duration)
        this.chargeOsc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 1.0);
        
        this.chargeGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.chargeGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.0);
        
        this.chargeOsc.connect(this.chargeGain);
        this.chargeGain.connect(this.sfxVolumeNode);
        
        this.chargeOsc.start();
    },

    stopChargeUp() {
        if (this.chargeOsc) {
            try {
                this.chargeOsc.stop();
            } catch(e) {}
            this.chargeOsc = null;
        }
        this.chargeGain = null;
    },

    playChargeFire() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.stopChargeUp();
        
        // Massive energy blast sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.45);
        
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
        
        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.46);
    },

    // Noise Generator helper for explosions and loops
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    // Normal Explosion (White noise band-pass sweep)
    playExplosionScout() {
        if (!this.ctx || !this.sfxEnabled) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 4.0;
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolumeNode);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.26);
    },

    // Heavy Explosion (Longer noise filter sweep)
    playExplosionBomber() {
        if (!this.ctx || !this.sfxEnabled) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.65);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.65);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolumeNode);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.66);
    },

    // Boss Explosion Rumble (Several overlapping low frequency noise sweeps)
    playExplosionBoss() {
        if (!this.ctx || !this.sfxEnabled) return;
        
        let delay = 0;
        const triggerRumble = (timeOffset, pitch) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(pitch, this.ctx.currentTime + timeOffset);
            osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + timeOffset + 0.8);
            
            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 180;
            
            gain.gain.setValueAtTime(0.0, this.ctx.currentTime + timeOffset);
            gain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + timeOffset + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + timeOffset + 0.8);
            
            osc.connect(lowpass);
            lowpass.connect(gain);
            gain.connect(this.sfxVolumeNode);
            
            osc.start(this.ctx.currentTime + timeOffset);
            osc.stop(this.ctx.currentTime + timeOffset + 0.85);
        };

        // Chain multiple small rumbles for chain-reaction effect
        for (let i = 0; i < 5; i++) {
            triggerRumble(i * 0.22, 110 - i * 12);
        }

        // Add a massive final white noise blast
        setTimeout(() => {
            if (!this.ctx) return;
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer();
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 1.4);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.4);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxVolumeNode);
            noise.start();
            noise.stop(this.ctx.currentTime + 1.5);
        }, 1000);
    },

    // Aerodynamic Loop maneuver "Whoosh"
    playLoopSwoosh() {
        if (!this.ctx || !this.sfxEnabled) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 2.5;
        // Sweeps up then sweeps down
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);
        filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.8);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.65, this.ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolumeNode);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.85);
    },

    // Power-up chime (sweet chord arpeggio)
    playPowerUp() {
        if (!this.ctx || !this.sfxEnabled) return;

        const notes = [261.63, 329.63, 392.00, 523.25]; // C Major Chord
        const time = this.ctx.currentTime;
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + idx * 0.06);
            
            gain.gain.setValueAtTime(0, time + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.2, time + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, time + idx * 0.06 + 0.25);
            
            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            
            osc.start(time + idx * 0.06);
            osc.stop(time + idx * 0.06 + 0.27);
        });
    },

    // Damage impact alert
    playPlayerDamage() {
        if (!this.ctx || !this.sfxEnabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxVolumeNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    },

    /* ----------------------------------------------------
       MULTI-LAYER MUSIC TRACKER
       ---------------------------------------------------- */
    noteToFreq(note) {
        const notes = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        const parts = note.match(/^([A-G]#?)([0-9])$/);
        if (!parts) return 440;
        
        const key = parts[1];
        const octave = parseInt(parts[2]);
        const keyIdx = notes[key];
        
        const a4Index = 9 + 4 * 12;
        const targetIndex = keyIdx + octave * 12;
        const steps = targetIndex - a4Index;
        
        return 440 * Math.pow(2, steps / 12);
    },

    // Percussion: deep kick drum
    playKick() {
        if (!this.ctx || !this.musicEnabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.55, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(this.musicVolumeNode);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    },

    // Percussion: short hi-hat noise
    playHiHat(vol = 0.10) {
        if (!this.ctx || !this.musicEnabled) return;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.06), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.055);
        src.connect(filter); filter.connect(gain); gain.connect(this.musicVolumeNode);
        src.start(); src.stop(this.ctx.currentTime + 0.07);
    },

    // Chord pad: held chord tones with slight chorus
    playPad(notes, stepDur) {
        if (!this.ctx || !this.musicEnabled) return;
        const time = this.ctx.currentTime;
        const padDur = stepDur * 4.5;
        notes.forEach(note => {
            const freq = this.noteToFreq(note);
            [1.0, 1.005].forEach(detune => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq * detune, time);
                gain.gain.setValueAtTime(0.0, time);
                gain.gain.linearRampToValueAtTime(0.065, time + 0.05);
                gain.gain.setValueAtTime(0.055, time + padDur - 0.08);
                gain.gain.linearRampToValueAtTime(0.0, time + padDur);
                osc.connect(gain); gain.connect(this.musicVolumeNode);
                osc.start(time); osc.stop(time + padDur + 0.1);
            });
        });
    },

    // Arpeggio pluck: bright short note
    playArp(note, type, stepDur) {
        if (!this.ctx || !this.musicEnabled || !note) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.Q.value = 1.8;
        filter.frequency.value = this.noteToFreq(note) * 1.5;
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(this.noteToFreq(note), time);
        gain.gain.setValueAtTime(0.09, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 0.65);
        osc.connect(filter); filter.connect(gain); gain.connect(this.musicVolumeNode);
        osc.start(time); osc.stop(time + stepDur * 0.7);
    },

    playStep() {
        if (!this.ctx || !this.musicEnabled) return;

        const song = this.songs[this.currentSongIndex];
        const bar  = song.bars[this.currentBar];
        const beat = this.currentBeat;
        const time = this.ctx.currentTime;
        const stepDur = 60 / this.tempo / 2;

        const bassNote = bar.bass[beat];
        const arpNote  = bar.arp[beat];
        const melNote  = bar.mel[beat];
        const padChord = bar.pads[beat];
        const isKick   = bar.kick[beat];
        const isHat    = bar.hat[beat];

        // 1. Bass line
        if (bassNote) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(520, time);
            filter.frequency.exponentialRampToValueAtTime(140, time + stepDur * 0.88);
            osc.type = song.bassType;
            osc.frequency.setValueAtTime(this.noteToFreq(bassNote), time);
            gain.gain.setValueAtTime(0.30, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 0.92);
            osc.connect(filter); filter.connect(gain); gain.connect(this.musicVolumeNode);
            osc.start(time); osc.stop(time + stepDur);
        }

        // 2. Arpeggio
        if (arpNote) this.playArp(arpNote, song.arpType, stepDur);

        // 3. Pad chord (sustained harmony)
        if (padChord) this.playPad(padChord, stepDur);

        // 4. Melody lead
        if (melNote) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = song.melType;
            osc.frequency.setValueAtTime(this.noteToFreq(melNote), time);
            gain.gain.setValueAtTime(0.0, time);
            gain.gain.linearRampToValueAtTime(0.17, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 1.85);
            osc.connect(gain); gain.connect(this.musicVolumeNode);
            osc.start(time); osc.stop(time + stepDur * 1.9);
        }

        // 5. Percussion
        if (isKick) this.playKick();
        if (isHat)  this.playHiHat();

        // Advance sequencer
        this.currentBeat = (this.currentBeat + 1) % 8;
        if (this.currentBeat === 0) {
            this.currentBar = (this.currentBar + 1) % song.bars.length;
        }
    },

    // Switch to a new song (stage-aware)
    setSong(index) {
        const clamped = Math.max(0, Math.min(index, this.songs.length - 1));
        if (clamped === this.currentSongIndex) return;
        this.currentSongIndex = clamped;
        this.currentBar  = 0;
        this.currentBeat = 0;
        const song = this.songs[clamped];
        this.tempo = song.tempo;
        if (this.musicIntervalId) {
            this.stopMusic();
            this.startMusic();
        }
    },

    startMusic() {
        this.resumeContext();
        if (this.musicIntervalId) return;
        const stepDurationMs = (60 / this.tempo / 2) * 1000;
        this.musicIntervalId = setInterval(() => {
            this.playStep();
        }, stepDurationMs);
    },

    stopMusic() {
        if (this.musicIntervalId) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
        }
    },

    setBossTempo() {
        const song = this.songs[this.currentSongIndex];
        this.tempo = song.bossTempo || 148;
        if (this.musicIntervalId) { this.stopMusic(); this.startMusic(); }
    },

    resetTempo() {
        const song = this.songs[this.currentSongIndex];
        this.tempo = song.tempo || 120;
        if (this.musicIntervalId) { this.stopMusic(); this.startMusic(); }
    }
};
