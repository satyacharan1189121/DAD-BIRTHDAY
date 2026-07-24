/* -------------------------------------------------------------
   GLOBAL STATE & CONSTANTS
   ------------------------------------------------------------- */
const CONFIG = {
    bpm: 110,
    candleCount: 5,
    colors: ['#FFE066', '#FF8DA1', '#8A2BE2', '#FF4B72', '#00F0FF', '#D4AF37'],
    defaultImages: {
        1: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
        2: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=600',
        3: 'https://images.unsplash.com/photo-1488998460677-94aea064d115?auto=format&fit=crop&q=80&w=600',
        4: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600'
    }
};

let audioCtx = null;
let musicPlaying = false;
let currentNoteIndex = 0;
let synthTimer = null;
let delayNode = null;
let outputGainNode = null;

let isEditMode = false;
let activeCandles = 5;
let loveCount = 0;
let userHasInteracted = false;

// Customizations storage object
let customizations = {
    title: "Happy Birthday, Dad!",
    subtitle: "To the man who built our world with love, strength, and guidance.",
    message: "Thank you for being my anchor, my teacher, and my biggest supporter. Every single day, your wisdom guides me and your kindness inspires me. Today is a celebration of the incredible person you are. Here's to a year filled with laughter, perfect health, and everything that brings you joy. I love you, Dad!",
    gallery: {
        1: { title: "The Guide", desc: "For showing the path when the world seemed dark, guiding with patience and endless wisdom.", img: "" },
        2: { title: "The Protector", desc: "A shield against life's storms, standing strong and keeping us safe in a warm embrace.", img: "" },
        3: { title: "The Mentor", desc: "Teaching life's greatest lessons not by words, but by the beautiful way you lead by example.", img: "" },
        4: { title: "The Hero", desc: "No cape needed. You are, and will always be, my absolute favorite superhero.", img: "" }
    }
};

/* -------------------------------------------------------------
   INITIALIZATION
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadCustomizations();
    initBackgroundSparkles();
    initConfettiEngine();
    setupEventListeners();
    setup3DTiltEffect();
});

/* -------------------------------------------------------------
   EVENT LISTENERS SETUP
   ------------------------------------------------------------- */
function setupEventListeners() {
    // 1. Envelope opening flow
    const openBtn = document.getElementById('open-btn');
    const envelope = document.getElementById('envelope');
    
    openBtn.addEventListener('click', handleEnvelopeOpening);
    envelope.addEventListener('click', handleEnvelopeOpening);

    // 2. Music Player
    const musicBtn = document.getElementById('music-btn');
    musicBtn.addEventListener('click', toggleMusic);

    // 3. Candle Interactions
    const candles = document.querySelectorAll('.candle');
    candles.forEach(candle => {
        candle.addEventListener('click', () => extinguishCandle(candle));
    });

    const blowBtn = document.getElementById('blow-btn');
    blowBtn.addEventListener('click', blowAllCandles);

    const resetCandlesBtn = document.getElementById('reset-candles-btn');
    resetCandlesBtn.addEventListener('click', relightCandles);

    // Cake Cutting Button
    const cutBtn = document.getElementById('cut-btn');
    if (cutBtn) {
        cutBtn.addEventListener('click', cutCake);
    }

    // 4. Action Buttons
    document.getElementById('balloon-btn').addEventListener('click', releaseBalloons);
    document.getElementById('confetti-btn').addEventListener('click', triggerConfettiBlast);
    document.getElementById('love-btn').addEventListener('click', sendLoveHearts);

    // 5. Dynamic photo upload listeners
    const uploaders = document.querySelectorAll('.image-uploader-input');
    uploaders.forEach(uploader => {
        uploader.addEventListener('change', handlePhotoUpload);
    });

    // 6. Direct editable text changes: auto-save on blur
    const editables = document.querySelectorAll('[data-editable]');
    editables.forEach(editable => {
        editable.setAttribute('contenteditable', 'true');
        editable.addEventListener('blur', () => {
            saveAllCustomizations();
        });
    });

    // Track initial interaction to activate Audio Context safely
    window.addEventListener('click', () => {
        userHasInteracted = true;
        document.getElementById('audio-toast').classList.add('hidden');
    }, { once: true });
}

/* -------------------------------------------------------------
   ENVELOPE TRANSITION LOGIC
   ------------------------------------------------------------- */
function handleEnvelopeOpening() {
    const envelope = document.getElementById('envelope');
    const landingScreen = document.getElementById('landing-screen');
    const mainDashboard = document.getElementById('main-dashboard');
    const openBtn = document.getElementById('open-btn');

    if (envelope.classList.contains('open')) return;

    // Trigger Audio Context initialization
    initAudioContext();

    // Visual envelope opening states
    envelope.classList.add('open');
    openBtn.style.opacity = '0';
    openBtn.style.pointerEvents = 'none';

    // Play sweet opening chime
    setTimeout(() => {
        playChime();
        envelope.classList.add('open-fully');
    }, 600);

    // Transition to main dashboard screen
    setTimeout(() => {
        landingScreen.classList.remove('active');
        mainDashboard.classList.add('active');
        
        // Trigger page elements entrance confetti
        setTimeout(() => {
            triggerConfettiBlast();
            // Start background music automatically (allowed since user clicked to open card)
            startMusic();
        }, 1000);
    }, 2000);
}

/* -------------------------------------------------------------
   WEB AUDIO API SYNTHESIZED MUSIC BOX
   ------------------------------------------------------------- */
function initAudioContext() {
    if (audioCtx) return;
    
    // Create AudioContext (supporting vendor prefixes)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Create a sweet high-quality delay effect to sound like a music box
    delayNode = audioCtx.createDelay(2.0);
    const feedbackNode = audioCtx.createGain();
    
    // 3/8 note delay at 110bpm is ~409ms
    delayNode.delayTime.value = 0.409; 
    feedbackNode.gain.value = 0.35; // Soft feedback loop

    outputGainNode = audioCtx.createGain();
    outputGainNode.gain.value = 0.15; // Set music volume soft

    // Wire: Synth -> outputGainNode -> destination
    // Synth -> delayNode -> feedbackNode -> delayNode
    // delayNode -> outputGainNode
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(outputGainNode);
    outputGainNode.connect(audioCtx.destination);
}

// Melody definitions: { note, dur: beats }
// Happy Birthday Melody in F Major (3/4 Waltz)
const melodyNotes = [
    { note: "C4", dur: 0.75 }, { note: "C4", dur: 0.25 }, { note: "D4", dur: 1 }, { note: "C4", dur: 1 }, { note: "F4", dur: 1 }, { note: "E4", dur: 2 },
    { note: "C4", dur: 0.75 }, { note: "C4", dur: 0.25 }, { note: "D4", dur: 1 }, { note: "C4", dur: 1 }, { note: "G4", dur: 1 }, { note: "F4", dur: 2 },
    { note: "C4", dur: 0.75 }, { note: "C4", dur: 0.25 }, { note: "C5", dur: 1 }, { note: "A4", dur: 1 }, { note: "F4", dur: 1 }, { note: "E4", dur: 1 }, { note: "D4", dur: 2 },
    { note: "Bb4", dur: 0.75 }, { note: "Bb4", dur: 0.25 }, { note: "A4", dur: 1 }, { note: "F4", dur: 1 }, { note: "G4", dur: 1 }, { note: "F4", dur: 2 }
];

const noteFreqs = {
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "Bb4": 466.16, "C5": 523.25
};

function playNote(freq, startTime, duration) {
    if (!audioCtx) return;

    // Create oscillator and envelope gain
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Use Triangle wave mixed with a bit of Sine to emulate music box tines
    osc.type = 'triangle';
    
    // Set frequency
    osc.frequency.setValueAtTime(freq, startTime);

    // Apply envelope for plucking sound: Instant attack, long exponential decay
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.8, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);

    osc.connect(gain);
    gain.connect(outputGainNode);
    // Connect to spatial delay node
    gain.connect(delayNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

function playChime() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
        playNote(freq, now + idx * 0.1, 1.2);
    });
}

function startMusic() {
    if (musicPlaying) return;
    
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    musicPlaying = true;
    currentNoteIndex = 0;
    
    document.getElementById('vinyl-record').classList.add('playing');
    document.querySelector('.icon-play').classList.add('hidden');
    document.querySelector('.icon-pause').classList.remove('hidden');

    scheduler();
}

function stopMusic() {
    musicPlaying = false;
    clearTimeout(synthTimer);
    
    document.getElementById('vinyl-record').classList.remove('playing');
    document.querySelector('.icon-play').classList.remove('hidden');
    document.querySelector('.icon-pause').classList.add('hidden');
}

function toggleMusic() {
    initAudioContext();
    if (musicPlaying) {
        stopMusic();
    } else {
        startMusic();
    }
}

// Simple scheduler for notes
function scheduler() {
    if (!musicPlaying || !audioCtx) return;

    const beatDuration = 60 / CONFIG.bpm; // Duration of one beat in seconds
    const currentNote = melodyNotes[currentNoteIndex];
    const duration = currentNote.dur * beatDuration;

    const freq = noteFreqs[currentNote.note];
    const playTime = audioCtx.currentTime + 0.05;

    // Play melody note
    playNote(freq, playTime, duration);

    // Dynamic accompaniment waltz beat (Soft bass note on 1, chord on 2 and 3)
    const beatIndex = currentNoteIndex % 6;
    if (beatIndex === 0) {
        // Root F3 (bass) on measure start
        playNote(174.61, playTime, beatDuration * 1.5);
    } else if (beatIndex === 2 || beatIndex === 4) {
        // Soft arpeggiated F chord (A3, C4)
        playNote(220.00, playTime, beatDuration * 0.8);
        playNote(261.63, playTime + 0.05, beatDuration * 0.8);
    }

    currentNoteIndex = (currentNoteIndex + 1) % melodyNotes.length;

    // Schedule next note trigger
    synthTimer = setTimeout(scheduler, duration * 1000);
}

/* -------------------------------------------------------------
   CAKE & CANDLES INTERACTIONS
   ------------------------------------------------------------- */
function extinguishCandle(candle) {
    if (candle.classList.contains('extinguished')) return;

    candle.classList.add('extinguished');
    candle.classList.remove('active');
    
    // Play light puff synth sound
    playPuffSound();

    // Trigger local particle smoke rise effect
    triggerSmokePuff(candle);

    // Update counts
    const activeList = document.querySelectorAll('.candle.active');
    activeCandles = activeList.length;
    updateCandleStats();

    if (activeCandles === 0) {
        handleAllCandlesBlown();
    }
}

function updateCandleStats() {
    const textVal = `${CONFIG.candleCount - activeCandles}/${CONFIG.candleCount}`;
    document.getElementById('candles-blown-count').innerText = textVal;
}

function playPuffSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Synthesis noise buffer for puff
    const bufferSize = audioCtx.sampleRate * 0.15; // 150ms buffer
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 2.0;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noise.start(now);
    noise.stop(now + 0.15);
}

function triggerSmokePuff(candleElement) {
    const rect = candleElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    // Spawn 8 rising gray smoke dots on screen
    for (let i = 0; i < 8; i++) {
        const smoke = document.createElement('div');
        smoke.style.position = 'fixed';
        smoke.style.left = `${x}px`;
        smoke.style.top = `${y}px`;
        smoke.style.width = `${Math.random() * 8 + 6}px`;
        smoke.style.height = smoke.style.width;
        smoke.style.backgroundColor = 'rgba(180, 180, 180, 0.6)';
        smoke.style.borderRadius = '50%';
        smoke.style.pointerEvents = 'none';
        smoke.style.zIndex = '999';
        smoke.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
        
        document.body.appendChild(smoke);

        const targetX = (Math.random() - 0.5) * 40;
        const targetY = -40 - Math.random() * 40;

        requestAnimationFrame(() => {
            smoke.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.6)`;
            smoke.style.opacity = '0';
        });

        setTimeout(() => smoke.remove(), 800);
    }
}

function blowAllCandles() {
    const activeList = document.querySelectorAll('.candle.active');
    if (activeList.length === 0) return;

    activeList.forEach((candle, index) => {
        setTimeout(() => {
            extinguishCandle(candle);
        }, index * 180);
    });
}

function relightCandles() {
    const candles = document.querySelectorAll('.candle');
    candles.forEach(candle => {
        candle.classList.remove('extinguished');
        candle.classList.add('active');
    });
    activeCandles = CONFIG.candleCount;
    updateCandleStats();
    document.getElementById('reset-candles-btn').classList.add('hidden');
    
    // Hide cut status and knife
    document.getElementById('cake').classList.remove('cut');
    document.getElementById('cake-knife').classList.remove('active', 'cutting');
    document.getElementById('cut-btn').classList.add('hidden');
}

function handleAllCandlesBlown() {
    // Show Cut Cake button and activate knife
    document.getElementById('cut-btn').classList.remove('hidden');
    document.getElementById('cake-knife').classList.add('active');

    // Blow fanfare waltz chord
    playFanfare();

    // Trigger awesome full screen confetti blast
    triggerConfettiBlast();

    showToast("🎉 All candles blown! Now cut the cake!");
}

function playFanfare() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Play celebratory chord: F4, A4, C5, F5
    const chord = [349.23, 440.00, 523.25, 698.46];
    chord.forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
    });
}

function cutCake() {
    const knife = document.getElementById('cake-knife');
    const cake = document.getElementById('cake');
    const cutBtn = document.getElementById('cut-btn');
    const resetBtn = document.getElementById('reset-candles-btn');

    if (knife.classList.contains('cutting')) return;

    knife.classList.add('cutting');
    playCutSound();

    setTimeout(() => {
        cake.classList.add('cut');
        knife.classList.remove('active', 'cutting');
        cutBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        
        triggerConfettiBlast();
        showToast("🍰 Mmm, delicious! Cake cut successfully!");
    }, 1500);
}

function playCutSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.8);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.8);
}

/* -------------------------------------------------------------
   CONFETTI GENERATOR ENGINE
   ------------------------------------------------------------- */
let confettiCanvas, confettiCtx;
let confettiParticles = [];

function initConfettiEngine() {
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    
    resizeCanvas(confettiCanvas);
    window.addEventListener('resize', () => resizeCanvas(confettiCanvas));
}

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = -20 - Math.random() * 100;
        this.size = Math.random() * 8 + 6;
        this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        this.speedX = (Math.random() - 0.5) * 5;
        this.speedY = Math.random() * 4 + 4;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this.opacity = 1.0;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        
        // Horizontal swaying
        this.speedX += Math.sin(this.y / 20) * 0.05;

        // Fading when reaching lower third
        if (this.y > confettiCanvas.height * 0.7) {
            this.opacity -= 0.02;
        }
    }

    draw() {
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate(this.rotation * Math.PI / 180);
        confettiCtx.globalAlpha = Math.max(0, this.opacity);
        confettiCtx.fillStyle = this.color;
        
        // Random square, circle or ribbon shape
        if (this.size % 2 === 0) {
            confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            confettiCtx.beginPath();
            confettiCtx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            confettiCtx.fill();
        }
        
        confettiCtx.restore();
    }
}

function triggerConfettiBlast() {
    initAudioContext();
    // Generate 120 particles
    for (let i = 0; i < 120; i++) {
        confettiParticles.push(new ConfettiParticle());
    }

    // Start rendering frame loop if not already running
    if (confettiParticles.length === 120) {
        requestAnimationFrame(renderConfettiFrame);
    }
}

function renderConfettiFrame() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    // Filter out invisible particles
    confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height && p.opacity > 0);

    confettiParticles.forEach(p => {
        p.update();
        p.draw();
    });

    if (confettiParticles.length > 0) {
        requestAnimationFrame(renderConfettiFrame);
    }
}

/* -------------------------------------------------------------
   BACKGROUND SPARKLE DUST
   ------------------------------------------------------------- */
let bgCanvas, bgCtx;
let sparkles = [];

function initBackgroundSparkles() {
    bgCanvas = document.getElementById('bg-canvas');
    bgCtx = bgCanvas.getContext('2d');
    
    resizeCanvas(bgCanvas);
    window.addEventListener('resize', () => resizeCanvas(bgCanvas));

    // Generate initial ambient stars
    for (let i = 0; i < 50; i++) {
        sparkles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            size: Math.random() * 2 + 1,
            maxSize: Math.random() * 3 + 2,
            growth: Math.random() * 0.05 + 0.01,
            opacity: Math.random() * 0.5 + 0.2,
            state: Math.random() > 0.5 ? 1 : -1 // Glow pulsing direction
        });
    }

    // Connect mouse movement sparkles
    window.addEventListener('mousemove', (e) => {
        // Emit 2 sparkles on movement
        if (Math.random() < 0.3) {
            sparkles.push({
                x: e.clientX,
                y: e.clientY + window.scrollY,
                size: Math.random() * 2 + 2,
                maxSize: Math.random() * 4 + 4,
                growth: -0.08, // Fading size
                opacity: 1.0,
                state: -1,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5 - 0.5
            });
        }
    });

    requestAnimationFrame(renderBackgroundSparkles);
}

function renderBackgroundSparkles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Update & draw background sparkles
    sparkles = sparkles.filter(s => s.opacity > 0 && s.size > 0);

    sparkles.forEach(s => {
        // Update size/opacity based on state
        if (s.vx !== undefined) {
            // Mouse interactive trail
            s.x += s.vx;
            s.y += s.vy;
            s.size += s.growth;
            s.opacity += s.growth;
        } else {
            // Ambient stars glowing pulse
            s.size += s.growth * s.state;
            if (s.size > s.maxSize || s.size < 0.5) {
                s.state *= -1; // Reverse pulsation
            }
        }

        // Draw sparkle
        bgCtx.save();
        bgCtx.globalAlpha = Math.max(0, s.opacity);
        bgCtx.fillStyle = '#FFE066';
        bgCtx.beginPath();
        // Drawing a diamond sparkle shape
        bgCtx.moveTo(s.x, s.y - s.size);
        bgCtx.lineTo(s.x + s.size/2, s.y);
        bgCtx.lineTo(s.x, s.y + s.size);
        bgCtx.lineTo(s.x - s.size/2, s.y);
        bgCtx.closePath();
        bgCtx.fill();
        bgCtx.restore();
    });

    requestAnimationFrame(renderBackgroundSparkles);
}

/* -------------------------------------------------------------
   FLOATING ELEMENTS (BALLOONS & HEARTS)
   ------------------------------------------------------------- */
function releaseBalloons() {
    const balloonColors = ['#ff4d4d', '#ff4da6', '#cc33ff', '#33ccff', '#33ff99', '#ffff33', '#ff9933'];
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const balloon = document.createElement('div');
            balloon.className = 'floating-element';
            
            // Random styling properties
            const size = Math.random() * 40 + 50;
            const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
            const left = Math.random() * 90 + 5; // 5% to 95% width
            const duration = Math.random() * 3 + 5; // 5s to 8s flight
            const wobble = Math.random() * 40 - 20;

            balloon.innerHTML = `
                <svg width="${size}" height="${size * 1.3}" viewBox="0 0 100 130">
                    <defs>
                        <radialGradient id="balloonGrad-${i}" cx="35%" cy="35%" r="60%">
                            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
                            <stop offset="30%" stop-color="${color}"/>
                            <stop offset="100%" stop-color="#120c24"/>
                        </radialGradient>
                    </defs>
                    <!-- Balloon shape -->
                    <ellipse cx="50" cy="50" rx="40" ry="50" fill="url(#balloonGrad-${i})" />
                    <!-- Balloon knot -->
                    <polygon points="50,100 45,110 55,110" fill="${color}" />
                    <!-- String -->
                    <path d="M50,110 Q${50 + wobble},120 50,130" stroke="#a39db0" stroke-width="1.5" fill="none" />
                </svg>
            `;

            balloon.style.left = `${left}vw`;
            balloon.style.animation = `floatUp ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

            document.body.appendChild(balloon);
            setTimeout(() => balloon.remove(), duration * 1000);
        }, i * 200);
    }
    showToast("🎈 Balloons floated!");
}

function sendLoveHearts() {
    const heartSymbols = ['💖', '❤️', '💝', '💕', '💗'];
    loveCount += 15;
    document.getElementById('love-count').innerText = loveCount;

    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-element';
            
            const fontSize = Math.random() * 20 + 24; // 24px to 44px
            const left = Math.random() * 90 + 5;
            const duration = Math.random() * 2.5 + 3.5; // 3.5s to 6s
            
            heart.style.left = `${left}vw`;
            heart.style.fontSize = `${fontSize}px`;
            heart.innerText = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
            heart.style.animation = `floatUp ${duration}s ease-in-out forwards`;
            
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), duration * 1000);
        }, i * 120);
    }
}

/* -------------------------------------------------------------
   POLAROID GALLERY CARDS INTERACTIVE TILT
   ------------------------------------------------------------- */
function setup3DTiltEffect() {
    const elements = document.querySelectorAll('.tilt-3d, .polaroid-card');
    
    elements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            
            // Calculate tilt based on center of element (Max 8 degrees)
            const rotateX = ((yc - y) / yc) * 8;
            const rotateY = ((x - xc) / xc) * 8;
            
            const isPolaroid = el.classList.contains('polaroid-card');
            const translateZ = isPolaroid ? '15px' : '25px';
            const translateY = isPolaroid ? '-8px' : '0px';
            
            el.style.transform = `perspective(1200px) translateY(${translateY}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ})`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
}

/* -------------------------------------------------------------
   PERSONALIZATION SYSTEM (EDITING & PERSISTING)
   ------------------------------------------------------------- */
// Handling Image Files Selection & Preview
function handlePhotoUpload(e) {
    const input = e.target;
    const targetIdx = input.getAttribute('data-target');
    const imgElement = document.getElementById(`gallery-img-${targetIdx}`);

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            imgElement.src = evt.target.result;
            // Cache uploaded image base64 data to memory customizations
            customizations.gallery[targetIdx].img = evt.target.result;
            
            // Auto save customizations immediately
            saveAllCustomizations();
            showToast(`📷 Photo ${targetIdx} updated successfully!`);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Save customizations to local storage
function saveAllCustomizations() {
    // 1. Fetch text values from page
    customizations.title = document.getElementById('wish-main-title').innerText.trim();
    customizations.subtitle = document.getElementById('wish-subtitle').innerText.trim();
    customizations.message = document.getElementById('personal-message').innerText.trim();

    // 2. Fetch gallery texts
    for (let i = 1; i <= 4; i++) {
        customizations.gallery[i].title = document.getElementById(`gallery-title-${i}`).innerText.trim();
        customizations.gallery[i].desc = document.getElementById(`gallery-desc-${i}`).innerText.trim();
        
        const currentSrc = document.getElementById(`gallery-img-${i}`).getAttribute('src');
        if (currentSrc && !currentSrc.startsWith('https://')) {
            customizations.gallery[i].img = currentSrc;
        }
    }

    // 3. Write to localStorage
    try {
        localStorage.setItem('dad_wish_customizations', JSON.stringify(customizations));
        showToast("💾 Customizations saved!");
    } catch(err) {
        console.error("Local storage error: ", err);
        showToast("⚠️ Save failed (image size too large).");
    }
}

// Load configurations from storage
function loadCustomizations() {
    const data = localStorage.getItem('dad_wish_customizations');
    if (!data) return;

    try {
        customizations = JSON.parse(data);
        
        // Apply main hero messages
        document.getElementById('wish-main-title').innerText = customizations.title;
        document.getElementById('wish-subtitle').innerText = customizations.subtitle;
        document.getElementById('personal-message').innerText = customizations.message;

        // Apply gallery content
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`gallery-title-${i}`).innerText = customizations.gallery[i].title;
            document.getElementById(`gallery-desc-${i}`).innerText = customizations.gallery[i].desc;
            
            // Set image
            const imgSource = customizations.gallery[i].img || CONFIG.defaultImages[i];
            document.getElementById(`gallery-img-${i}`).setAttribute('src', imgSource);
        }
    } catch(err) {
        console.error("Failed to parse customization data: ", err);
    }
}

// Reset modifications to original
function resetAllCustomizations() {
    if (confirm("Are you sure you want to reset all customizations and return to the default card?")) {
        localStorage.removeItem('dad_wish_customizations');
        location.reload();
    }
}

function setSaveStatus(msg, type) {
    const statusBox = document.getElementById('save-status');
    statusBox.innerText = msg;
    statusBox.className = `save-status ${type}`;
    setTimeout(() => {
        statusBox.innerText = '';
        statusBox.className = 'save-status';
    }, 4500);
}

/* -------------------------------------------------------------
   EXPORT STATIC WEBPAGE
   ------------------------------------------------------------- */
function exportStaticWebpage() {
    // Collect customized content directly from the DOM to ensure exact replica
    const mainTitle = document.getElementById('wish-main-title').innerText;
    const subTitle = document.getElementById('wish-subtitle').innerText;
    const message = document.getElementById('personal-message').innerText;

    // Get current HTML body, modify default images to inline base64 if present, remove control-panel
    const fullHtml = document.documentElement.outerHTML;

    // We can generate a completely clean self-contained HTML bundle containing styles, js, assets!
    // Fetch external CSS and JS text. Since we cannot perform fetch locally easily in browsers due to CORS,
    // we can construct the output by reading index.html code and embedding styles and script right inside it!
    // Let's create an offline downloadable string.
    
    // Instead of raw file requests, we will download index.html but with script variables prefilled with customizations,
    // so when opening the HTML file offline, it automatically loads their edits immediately!
    
    // Fetch assets content and inline it inside a <style> block, and app.js inside <script> block.
    // To make it fully self-contained, we can create a script that embeds 'dad_wish_customizations' JSON payload.
    // This is super cool! Let's download a modified page where customizations are baked into the page script itself.
    const bakedCustomizationScript = `<script>
        // Baked-in Customizations
        const bakedCustomizations = ${JSON.stringify(customizations)};
        localStorage.setItem('dad_wish_customizations', JSON.stringify(bakedCustomizations));
    </script>`;

    // We will do a simpler but extremely effective approach: download an HTML containing index.html, with a baked config script.
    // We fetch the current page HTML and replace standard loading with the baked state.
    let pageSource = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mainTitle} | A Birthday Wish</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        /* INLINED STYLES.CSS */
        ${Array.from(document.styleSheets[0]?.cssRules || []).map(r => r.cssText).join('\n')}
    </style>
</head>
<body>
    ${document.body.innerHTML}

    <script>
        // Baked configurations
        localStorage.setItem('dad_wish_customizations', JSON.stringify(${JSON.stringify(customizations)}));
        
        // Remove Personalization Panel for the recipient so it looks like a clean static gift!
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) controlPanel.remove();

        ${appJsSourceCodeString ? `// INLINED APP.JS CONTENT\n${appJsSourceCodeString}` : `// Fallback: load external script\nconst script = document.createElement('script');\nscript.src = 'app.js';\ndocument.body.appendChild(script);`}
    </script>
</body>
</html>`;

    // Trigger download of the HTML file
    const blob = new Blob([pageSource], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${mainTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_card.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📤 Static Card Exported! Share this file with your Dad!");
}

// Helper to inline JS. We'll retrieve it using a dummy string or fetch.
let appJsSourceCodeString = "";
function cacheAppJsSource() {
    try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "app.js", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                appJsSourceCodeString = xhr.responseText;
            }
        };
        xhr.send();
    } catch(err) {
        console.warn("Failed to cache app.js locally (expected under file:// protocol).");
    }
}
// Run cache fetch after a slight delay
setTimeout(cacheAppJsSource, 1000);

/* -------------------------------------------------------------
   TOAST HELPER
   ------------------------------------------------------------- */
function showToast(msg) {
    const toast = document.getElementById('audio-toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}
