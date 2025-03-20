// Canvas setup
const effectsCanvas = document.getElementById('confetti-canvas');
const ctx = effectsCanvas.getContext('2d');

// Set canvas to full window size
function resizeCanvas() {
    effectsCanvas.width = window.innerWidth;
    effectsCanvas.height = window.innerHeight;
}

// Call resize on load and on window resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Arrays to store particles
let confetti = [];
let fireworks = [];
let particles = [];

// Colors using the app's theme
const colors = ['#7b6cf6', '#9e93f5', '#ffffff', '#4caf50', '#ff9800'];

// Confetti piece class
class ConfettiPiece {
    constructor() {
        this.x = Math.random() * effectsCanvas.width;
        this.y = -20 - Math.random() * 50;
        this.size = 3 + Math.random() * 5;
        this.speed = 1 + Math.random() * 3;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = -0.5 + Math.random() * 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
        this.alpha = 0.5 + Math.random() * 0.3;
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        this.alpha -= 0.005;
        return this.y < effectsCanvas.height && this.alpha > 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        if (this.color.startsWith('#')) {
            const rgb = hexToRgb(this.color);
            ctx.fillStyle = `rgba(${rgb}, ${this.alpha})`;
        } else {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
        }
        
        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Firework class
class Firework {
    constructor() {
        this.x = Math.random() * effectsCanvas.width;
        this.y = effectsCanvas.height;
        this.targetY = effectsCanvas.height * 0.2 + Math.random() * effectsCanvas.height * 0.5;
        this.speed = 5 + Math.random() * 5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.radius = 3;
        this.trail = [];
        this.maxTrail = 5;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        
        this.y -= this.speed;
        
        return this.y > this.targetY;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.fill();
        }
    }

    explode() {
        const particleCount = 50 + Math.floor(Math.random() * 50);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
    }
}

// Particle class (for firework explosion)
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.gravity = 0.1;
        this.fadeSpeed = 0.02 + Math.random() * 0.02;
        this.radius = 1 + Math.random() * 2;
    }

    update() {
        this.vy += this.gravity;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.alpha -= this.fadeSpeed;
        
        return this.alpha > 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(this.color)}, ${this.alpha})`;
        ctx.fill();
    }
}

// Utility function to convert hex to rgb
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Animation frame
let animationId = null;

function animate() {
    ctx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    
    // Update and draw confetti
    confetti = confetti.filter(piece => {
        piece.draw();
        return piece.update();
    });
    
    // Update and draw fireworks
    fireworks = fireworks.filter(firework => {
        firework.draw();
        const stillActive = firework.update();
        
        if (!stillActive) {
            firework.explode();
        }
        
        return stillActive;
    });
    
    // Update and draw particles
    particles = particles.filter(particle => {
        particle.draw();
        return particle.update();
    });
    
    // Continue animation if there's still active elements
    if (confetti.length > 0 || fireworks.length > 0 || particles.length > 0) {
        animationId = requestAnimationFrame(animate);
    } else {
        cancelAnimationFrame(animationId);
        animationId = null;
        ctx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    }
}

// Make these functions globally available
window.triggerConfetti = function() {
    for (let i = 0; i < 30; i++) {
        confetti.push(new ConfettiPiece());
    }
    
    if (!animationId) {
        animationId = requestAnimationFrame(animate);
    }
};

window.triggerFireworks = function() {
    const launchFireworks = () => {
        for (let i = 0; i < 3; i++) {
            fireworks.push(new Firework());
        }
        
        if (!animationId) {
            animationId = requestAnimationFrame(animate);
        }
    };
    
    for (let i = 0; i < 5; i++) {
        setTimeout(launchFireworks, i * 700);
    }
};
