const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreDisplay = document.getElementById('scoreDisplay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScore');

// Game Variables
let bird;
let pipes;
let score;
let highScore = localStorage.getItem('flappyHighScore') || 0; // Load high score
let gameSpeed;
let gravity;
let flapStrength;
let pipeWidth;
let pipeGap;
let pipeFrequency; // Frames between pipe spawns
let frameCount;
let gameState; // 'start', 'playing', 'over'
let animationFrameId;

// Bird Class (using object literal for simplicity here)
function createBird() {
    return {
        x: 80,
        y: canvas.height / 2 - 15,
        width: 40, // Slightly wider for a less 'stick-like' feel
        height: 30,
        velocityY: 0,
        rotation: 0, // For visual tilt
        color: '#FFD700', // Gold color
        wingColor: '#FFA500' // Orange wing detail
    };
}

// Pipe Object
function createPipe(x) {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    return {
        x: x,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        width: pipeWidth,
        passed: false,
        color: '#2E8B57', // Sea green pipes
        capColor: '#228B22' // Forest green caps
    };
}

// --- Game Logic ---

function initGame() {
    // Constants
    gravity = 0.4; // Increased slightly
    flapStrength = 7.5; // Stronger flap
    gameSpeed = 2.5;  // Moderate speed
    pipeWidth = 60; // Wider pipes
    pipeGap = 150; // Generous gap
    pipeFrequency = 90; // Spawn pipes every 1.5 seconds at 60fps

    // State Reset
    bird = createBird();
    pipes = [];
    score = 0;
    frameCount = 0;
    gameState = 'start';

    // Initial Pipe
    pipes.push(createPipe(canvas.width + 50)); // Start first pipe further off-screen

    // Update UI
    scoreDisplay.textContent = `Score: ${score}`;
    highScoreDisplay.textContent = highScore;
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex'; // Show start screen initially
    scoreDisplay.style.display = 'none'; // Hide score during start/game over
}

function startGame() {
    gameState = 'playing';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    scoreDisplay.style.display = 'block'; // Show score during play
    gameLoop();
}

function endGame() {
    gameState = 'over';
    cancelAnimationFrame(animationFrameId); // Stop the game loop
    finalScoreDisplay.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore); // Save high score
        highScoreDisplay.textContent = highScore;
    }
    gameOverScreen.style.display = 'flex';
    scoreDisplay.style.display = 'none';
}

function flap() {
    if (gameState === 'playing') {
        bird.velocityY = -flapStrength;
        bird.rotation = -0.5; // Tilt up slightly on flap (radians)
        // Optional: Add flap sound here
    }
}

function update() {
    if (gameState !== 'playing') return;

    frameCount++;

    // --- Bird Update ---
    bird.velocityY += gravity;
    bird.y += bird.velocityY;

    // Gradually return rotation to horizontal/downward
    if (bird.rotation < 0.9 && bird.velocityY > 0.5) { // Limit downward tilt
        bird.rotation += 0.03;
    }
     if (bird.rotation > -0.5 && bird.velocityY <= 0.5) { // Limit upward tilt recovery speed
        bird.rotation -= 0.03;
    }


    // Collision Check: Ground and Ceiling
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        // Optional: Add hit sound here
        endGame();
        return; // Stop update if game over
    }

    // --- Pipe Update ---
    // Move pipes
    pipes.forEach(pipe => {
        pipe.x -= gameSpeed;
    });

    // Remove off-screen pipes
    if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
        pipes.shift();
    }

    // Add new pipes
    if (frameCount % pipeFrequency === 0) {
        pipes.push(createPipe(canvas.width));
    }

    // Collision Check: Pipes
    pipes.forEach(pipe => {
        const birdRight = bird.x + bird.width;
        const birdBottom = bird.y + bird.height;
        const pipeRight = pipe.x + pipe.width;

        // Check for overlap on X axis
        if (birdRight > pipe.x && bird.x < pipeRight) {
            // Check for collision with top or bottom pipe
            if (bird.y < pipe.topHeight || birdBottom > pipe.bottomY) {
                // Optional: Add hit sound here
                endGame();
                return; // Stop update if game over
            }
        }

        // Score Check
        if (!pipe.passed && bird.x > pipeRight) {
            pipe.passed = true;
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            // Optional: Add score sound here
        }
    });
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background (already handled by CSS gradient, but could add more dynamic elements here if needed)
    // ctx.fillStyle = '#87CEEB'; // Sky
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = '#90EE90'; // Ground
    // ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Simple ground line

    // --- Draw Pipes ---
    pipes.forEach(pipe => {
        // Top Pipe Body
        const topGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        topGradient.addColorStop(0, pipe.color);
        topGradient.addColorStop(0.5, '#3CB371'); // Lighter middle for 3D effect
        topGradient.addColorStop(1, pipe.color);
        ctx.fillStyle = topGradient;
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);

        // Top Pipe Cap
        ctx.fillStyle = pipe.capColor;
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipe.width + 10, 20); // Cap overlaps slightly

        // Bottom Pipe Body
        const bottomGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        bottomGradient.addColorStop(0, pipe.color);
        bottomGradient.addColorStop(0.5, '#3CB371');
        bottomGradient.addColorStop(1, pipe.color);
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY);

         // Bottom Pipe Cap
        ctx.fillStyle = pipe.capColor;
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 20); // Cap overlaps slightly
    });

    // --- Draw Bird ---
    ctx.save(); // Save current state (important for transformations)
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2); // Translate origin to bird's center
    ctx.rotate(bird.rotation); // Rotate around the new origin

    // Bird Body (using gradients for a smoother look)
    const birdGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, bird.width / 1.5);
    birdGradient.addColorStop(0, '#FFFFE0'); // Lighter yellow center
    birdGradient.addColorStop(1, bird.color); // Gold edge
    ctx.fillStyle = birdGradient;
    // Draw ellipse instead of rectangle for a rounder bird
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#DAA520'; // Slightly darker outline
    ctx.lineWidth = 1;
    ctx.stroke();


    // Bird Wing (simple animated ellipse)
    ctx.fillStyle = bird.wingColor;
    const wingX = -bird.width / 6;
    const wingY = 0;
    const wingWidth = bird.width / 3;
    // Simulate flapping by changing wing height slightly based on velocity or frame count
    const wingHeight = bird.height / 3 + Math.sin(frameCount * 0.3) * 3; // Oscillate height
    ctx.beginPath();
    ctx.ellipse(wingX, wingY, wingWidth / 2, wingHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

     // Bird Eye
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.width / 4, -bird.height / 6, 2.5, 0, Math.PI * 2); // Position eye forward
    ctx.fill();
    ctx.fillStyle = 'white'; // Eye highlight
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 0.5, -bird.height / 6 - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();


    ctx.restore(); // Restore original canvas state (removes translation and rotation)

}

function gameLoop() {
    update();
    draw();

    if (gameState === 'playing') {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// --- Event Listeners ---
startButton.addEventListener('click', () => {
    initGame(); // Reset everything before starting
    startGame();
});

restartButton.addEventListener('click', () => {
    initGame(); // Reset everything before starting
    startGame();
});

// Keyboard and Click Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'start') {
            initGame();
            startGame();
        } else if (gameState === 'playing') {
            flap();
        } else if (gameState === 'over') {
            // Optional: Allow space to restart from game over screen
            // initGame();
            // startGame();
        }
         e.preventDefault(); // Prevent space from scrolling page
    }
});

canvas.addEventListener('click', () => {
     if (gameState === 'start') {
        initGame();
        startGame();
    } else if (gameState === 'playing') {
        flap();
    }
});

// --- Initial Setup ---
initGame(); // Set up the game in the 'start' state initially