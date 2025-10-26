// Available racers with your friends' names
const racers = [
    { id: 1, name: 'Keegan', color: '#FF6B6B', image: 'Keegan.png' },
    { id: 2, name: 'Adam', color: '#4ECDC4', image: 'Adam.png' },
    { id: 3, name: 'Matty', color: '#45B7D1', image: 'Matty.png' },
    { id: 4, name: 'Jajou', color: '#FFA07A', image: 'Jajou.png' },
    { id: 5, name: 'Kim', color: '#98D8C8', image: 'Kim.png' },
    { id: 6, name: 'Brad', color: '#F7DC6F', image: 'Brad.png' },
    { id: 7, name: 'Peach', color: '#BB8FCE', image: 'Peach.png' },
    { id: 8, name: 'Nate', color: '#85C1E2', image: 'Nate.png' }
];

let selectedRacers = [];
let selectedTrack = null;
let audioContext = null;
let backgroundMusic = null;

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const trackSelectionScreen = document.getElementById('track-selection-screen');
const raceScreen = document.getElementById('race-screen');
const winnerScreen = document.getElementById('winner-screen');
const racerGrid = document.getElementById('racer-grid');
const chooseTrackBtn = document.getElementById('choose-track-btn');
const raceTrack = document.getElementById('race-track');
const winnerDisplay = document.getElementById('winner-display');
const raceAgainBtn = document.getElementById('race-again-btn');
const newSelectionBtn = document.getElementById('new-selection-btn');

// Apply seasonal theme based on current date
function applySeasonalTheme() {
    const today = new Date();
    const month = today.getMonth(); // 0-11 (0 = January, 9 = October, 10 = November)
    const day = today.getDate();

    // Remove any existing seasonal themes
    document.body.classList.remove('theme-halloween', 'theme-thanksgiving');

    // October 1st through October 31st = Halloween
    if (month === 9) { // October
        document.body.classList.add('theme-halloween');
    }

    // November 1st onwards = Thanksgiving (through November)
    if (month === 10) { // November
        document.body.classList.add('theme-thanksgiving');
    }
}

// Initialize the game
function init() {
    createRacerCards();
    setupEventListeners();
    initAudio();
    applySeasonalTheme();
}

// Play beep sound
function playBeep(frequency, duration) {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Play countdown
function playCountdown() {
    playBeep(440, 0.2); // 3
    setTimeout(() => playBeep(440, 0.2), 1000); // 2
    setTimeout(() => playBeep(440, 0.2), 2000); // 1
    setTimeout(() => playBeep(880, 0.5), 3000); // GO!
}

// Play victory fanfare
function playVictory() {
    initAudio();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (major chord)
    notes.forEach((freq, i) => {
        setTimeout(() => playBeep(freq, 0.3), i * 150);
    });
    setTimeout(() => playBeep(1046.50, 0.8), 600); // Final high C
}

// Play fart sound
function playFart() {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Start background music
function startBackgroundMusic(theme) {
    stopBackgroundMusic();
    initAudio();

    const oscillators = [];
    const gainNodes = [];

    if (theme === 'cyberpunk') {
        // Cyberpunk: Dark electronic bassline with pulsing synths
        const notes = [110, 110, 165, 146.83, 110, 110, 196, 146.83]; // A, A, E, D, A, A, G, D
        const bass = createMelodyLoop(notes, 0.5, 'sawtooth', 0.08);
        const pulse = createPulse(220, 'square', 0.03, 4); // Pulsing high synth
        oscillators.push(...bass.oscillators, pulse.oscillator);
        gainNodes.push(bass.gainNode, pulse.gainNode);

    } else if (theme === 'forest') {
        // Forest: Peaceful nature melody
        const notes = [261.63, 293.66, 329.63, 349.23, 392, 349.23, 329.63, 293.66]; // C, D, E, F, G, F, E, D
        const melody = createMelodyLoop(notes, 0.8, 'sine', 0.06);
        const harmony = createMelodyLoop([523.25, 587.33, 659.25], 2.4, 'triangle', 0.03);
        oscillators.push(...melody.oscillators, ...harmony.oscillators);
        gainNodes.push(melody.gainNode, harmony.gainNode);

    } else if (theme === 'stripclub') {
        // Strip club: Sultry bass with rhythmic beat
        const notes = [130.81, 146.83, 164.81, 174.61, 196, 174.61, 164.81, 146.83]; // C, D, E, F, G, F, E, D (lower)
        const bass = createMelodyLoop(notes, 0.6, 'triangle', 0.07);
        const beat = createPulse(98, 'sine', 0.05, 2); // Deep beat
        oscillators.push(...bass.oscillators, beat.oscillator);
        gainNodes.push(bass.gainNode, beat.gainNode);
    }

    backgroundMusic = { oscillators, gainNodes };
}

// Create a melody loop
function createMelodyLoop(frequencies, noteDuration, waveType, volume) {
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = volume;

    const oscillators = [];

    frequencies.forEach((freq, index) => {
        const playNote = () => {
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();

            osc.connect(noteGain);
            noteGain.connect(gainNode);

            osc.frequency.value = freq;
            osc.type = waveType;

            // Envelope for each note
            noteGain.gain.setValueAtTime(0, audioContext.currentTime);
            noteGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.05);
            noteGain.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + noteDuration * 0.7);
            noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + noteDuration);

            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + noteDuration);
        };

        // Schedule notes to repeat
        const intervalId = setInterval(playNote, frequencies.length * noteDuration * 1000);
        setTimeout(playNote, index * noteDuration * 1000); // Initial note

        oscillators.push({ intervalId, playNote });
    });

    return { oscillators, gainNode };
}

// Create a pulsing tone
function createPulse(frequency, waveType, volume, pulseRate) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = waveType;

    // Create pulsing effect
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    const pulseDuration = 1 / pulseRate;

    const pulse = () => {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + pulseDuration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0, now + pulseDuration);
    };

    pulse();
    const pulseInterval = setInterval(pulse, pulseDuration * 1000);

    oscillator.start();

    return { oscillator, gainNode, pulseInterval };
}

// Stop background music
function stopBackgroundMusic() {
    if (backgroundMusic) {
        try {
            // Stop all oscillators
            if (backgroundMusic.oscillators) {
                backgroundMusic.oscillators.forEach(osc => {
                    if (osc.intervalId) {
                        clearInterval(osc.intervalId);
                    }
                    if (osc.pulseInterval) {
                        clearInterval(osc.pulseInterval);
                    }
                    if (osc.stop) {
                        osc.stop();
                    }
                });
            }
        } catch (e) {
            // Already stopped
        }
        backgroundMusic = null;
    }
}

// Create racer selection cards
function createRacerCards() {
    racerGrid.innerHTML = '';

    racers.forEach(racer => {
        const card = document.createElement('div');
        card.className = 'racer-card';
        card.dataset.racerId = racer.id;

        // Check if image file exists, otherwise use colored circle with initial
        const avatarContent = `
            <div class="racer-avatar" style="background-color: ${racer.color}">
                <img src="${racer.image}" alt="${racer.name}" class="racer-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <span class="racer-initial" style="display: none;">${racer.name.charAt(0)}</span>
            </div>
            <div class="racer-name">${racer.name}</div>
        `;

        card.innerHTML = avatarContent;
        card.addEventListener('click', () => toggleRacer(racer.id));
        racerGrid.appendChild(card);
    });
}

// Toggle racer selection
function toggleRacer(racerId) {
    const card = document.querySelector(`[data-racer-id="${racerId}"]`);
    const racer = racers.find(r => r.id === racerId);

    if (selectedRacers.includes(racerId)) {
        selectedRacers = selectedRacers.filter(id => id !== racerId);
        card.classList.remove('selected');
    } else {
        selectedRacers.push(racerId);
        card.classList.add('selected');
    }

    updateStartButton();
}

// Update choose track button state
function updateStartButton() {
    chooseTrackBtn.disabled = selectedRacers.length < 2;
}

// Setup event listeners
function setupEventListeners() {
    chooseTrackBtn.addEventListener('click', showTrackSelection);
    raceAgainBtn.addEventListener('click', raceAgain);
    newSelectionBtn.addEventListener('click', newSelection);

    // Add track selection listeners
    document.querySelectorAll('.track-card').forEach(card => {
        card.addEventListener('click', () => {
            const track = card.dataset.track;
            selectTrack(track);
        });
    });
}

// Show track selection screen
function showTrackSelection() {
    showScreen('track-selection');
}

// Select track and start race
function selectTrack(track) {
    selectedTrack = track;

    // Apply theme to body
    document.body.className = '';
    if (track === 'cyberpunk' || track === 'forest' || track === 'stripclub') {
        document.body.classList.add(`theme-${track}`);
    }

    // Start background music for this theme
    startBackgroundMusic(track);

    // Start the race
    startRace();
}

// Start the race
function startRace() {
    showScreen('race');
    setupRaceTrack();

    // Play countdown then start race
    playCountdown();
    setTimeout(animateRace, 3500); // Start after 3-2-1-GO countdown
}

// Setup race track with selected racers
function setupRaceTrack() {
    raceTrack.innerHTML = '<div class="finish-line"></div>';

    selectedRacers.forEach(racerId => {
        const racer = racers.find(r => r.id === racerId);
        const lane = document.createElement('div');
        lane.className = 'race-lane';
        lane.id = `lane-${racerId}`;

        lane.innerHTML = `
            <div class="racer-runner" data-racer-id="${racerId}">
                <div class="racer-avatar" style="background-color: ${racer.color}">
                    <img src="${racer.image}" alt="${racer.name}" class="racer-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="racer-initial" style="display: none;">${racer.name.charAt(0)}</span>
                </div>
            </div>
        `;

        raceTrack.appendChild(lane);
    });
}

// Animate parallax scrolling
function animateParallax(progress) {
    const bgLayer = document.querySelector('.parallax-bg');
    const midLayer = document.querySelector('.parallax-mid');
    const fgLayer = document.querySelector('.parallax-fg');

    if (bgLayer && midLayer && fgLayer) {
        // Different speeds for each layer to create depth
        const bgSpeed = progress * 15; // Slowest (15% movement)
        const midSpeed = progress * 40; // Medium (40% movement)
        const fgSpeed = progress * 80; // Fastest (80% movement)

        bgLayer.style.transform = `translateX(-${bgSpeed}%)`;
        midLayer.style.transform = `translateX(-${midSpeed}%)`;
        fgLayer.style.transform = `translateX(-${fgSpeed}%)`;
    }
}

// Animate the race
function animateRace() {
    const trackWidth = raceTrack.offsetWidth - 100; // Account for finish line and padding
    const raceDuration = 20000; // 20 seconds
    const updateInterval = 50; // Update every 50ms
    const totalUpdates = raceDuration / updateInterval;

    // Initialize each racer with base speed and position
    const racerData = {};
    selectedRacers.forEach(racerId => {
        racerData[racerId] = {
            position: 0,
            baseSpeed: Math.random() * 0.3 + 0.7, // Base speed between 0.7 and 1.0
            currentSpeed: 1.0,
            speedChangeCounter: 0,
            speedChangeCooldown: Math.floor(Math.random() * 20) + 10, // Random interval for speed changes
            powerUpActive: false,
            powerUpCounter: 0,
            poopSlowdown: false,
            poopCounter: 0
        };
    });

    let currentUpdate = 0;
    let winner = null;

    const raceInterval = setInterval(() => {
        currentUpdate++;

        // Update parallax based on race progress
        const raceProgress = currentUpdate / totalUpdates;
        animateParallax(raceProgress);

        selectedRacers.forEach(racerId => {
            const data = racerData[racerId];
            const runner = document.querySelector(`.racer-runner[data-racer-id="${racerId}"]`);

            // Random power-up activation (0.5% chance per update - reduced by 50%)
            if (!data.powerUpActive && !data.poopSlowdown && Math.random() < 0.005) {
                data.powerUpActive = true;
                data.powerUpCounter = 40; // Power-up lasts for 40 updates (~2 seconds)
                runner.classList.add('power-up-active');
                playBeep(1000, 0.1); // Power-up sound
            }

            // Random poop obstacle (0.5% chance per update - reduced by 50%)
            if (!data.poopSlowdown && !data.powerUpActive && Math.random() < 0.005) {
                data.poopSlowdown = true;
                data.poopCounter = 50; // Slowdown lasts for 50 updates (~2.5 seconds)
                runner.classList.add('poop-slowdown');
                playFart(); // Fart sound!
            }

            // Handle power-up duration
            if (data.powerUpActive) {
                data.powerUpCounter--;
                if (data.powerUpCounter <= 0) {
                    data.powerUpActive = false;
                    runner.classList.remove('power-up-active');
                }
            }

            // Handle poop slowdown duration
            if (data.poopSlowdown) {
                data.poopCounter--;
                if (data.poopCounter <= 0) {
                    data.poopSlowdown = false;
                    runner.classList.remove('poop-slowdown');
                }
            }

            // Randomly change speed to create excitement
            data.speedChangeCounter++;
            if (data.speedChangeCounter >= data.speedChangeCooldown) {
                // Random speed burst or slowdown
                const speedVariation = Math.random() * 0.8 + 0.6; // Between 0.6x and 1.4x
                data.currentSpeed = data.baseSpeed * speedVariation;
                data.speedChangeCounter = 0;
                data.speedChangeCooldown = Math.floor(Math.random() * 15) + 8; // New random interval
            }

            // Apply power-up boost or poop slowdown
            let finalSpeed = data.currentSpeed;
            if (data.powerUpActive) {
                finalSpeed *= 1.8; // 80% speed boost!
            } else if (data.poopSlowdown) {
                finalSpeed *= 0.3; // 70% slowdown!
            }

            // Update position based on current speed
            const speedIncrement = (trackWidth / totalUpdates) * finalSpeed;
            data.position = Math.min(data.position + speedIncrement, trackWidth);
            runner.style.left = data.position + 'px';

            // Check if this racer finished
            if (data.position >= trackWidth && !winner) {
                winner = racerId;
            }
        });

        if (currentUpdate >= totalUpdates || winner) {
            clearInterval(raceInterval);
            // If no winner determined (shouldn't happen), pick the one closest to finish
            if (!winner) {
                let maxPosition = 0;
                selectedRacers.forEach(racerId => {
                    if (racerData[racerId].position > maxPosition) {
                        maxPosition = racerData[racerId].position;
                        winner = racerId;
                    }
                });
            }
            setTimeout(() => showWinner(winner), 500);
        }
    }, updateInterval);
}

// Show the winner
function showWinner(winnerId) {
    const winner = racers.find(r => r.id === winnerId);

    // Stop background music and play victory
    stopBackgroundMusic();
    playVictory();

    winnerDisplay.innerHTML = `
        <div class="racer-avatar" style="background-color: ${winner.color}">
            <img src="${winner.image}" alt="${winner.name}" class="racer-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="racer-initial" style="display: none;">${winner.name.charAt(0)}</span>
        </div>
        <div class="racer-name">${winner.name}</div>
        <div class="winner-message">Congratulations! Time to pay up! 💸</div>
    `;

    showScreen('winner');
    createFireworks();
}

// Create fireworks animation
function createFireworks() {
    const container = document.getElementById('fireworks-container');
    container.innerHTML = ''; // Clear previous fireworks

    // Create 12 fireworks at different positions
    for (let i = 0; i < 12; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.textContent = '🍆';
        firework.style.left = Math.random() * 100 + '%';
        firework.style.animationDelay = Math.random() * 2 + 's';
        firework.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(firework);
    }
}

// Race again with same racers
function raceAgain() {
    startRace();
}

// New selection
function newSelection() {
    selectedRacers = [];
    document.querySelectorAll('.racer-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateStartButton();
    showScreen('selection');
}

// Show specific screen
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    if (screenName === 'selection') {
        selectionScreen.classList.add('active');
    } else if (screenName === 'track-selection') {
        trackSelectionScreen.classList.add('active');
    } else if (screenName === 'race') {
        raceScreen.classList.add('active');
    } else if (screenName === 'winner') {
        winnerScreen.classList.add('active');
    }
}

// Start the game when page loads
init();
