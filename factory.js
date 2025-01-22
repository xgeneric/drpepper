// Sound effects using audio synthesis for more reliability
class SoundEngine {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.3;
  }

  createMachinerySound() {
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const gainNode = this.context.createGain();

    osc1.type = 'sine';
    osc2.type = 'square';
    osc1.frequency.value = 50;
    osc2.frequency.value = 55;
    
    gainNode.gain.value = 0.1;
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    return { oscillators: [osc1, osc2], gain: gainNode };
  }

  createBottleFillSound() {
    const duration = 1;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filterNode = this.context.createBiquadFilter();

    oscillator.type = 'noise';
    filterNode.type = 'bandpass';
    filterNode.frequency.value = 2000;
    filterNode.Q.value = 1;

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);

    return { oscillator, gain: gainNode };
  }

  createConveyorSound() {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filterNode = this.context.createBiquadFilter();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 40;
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 200;

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.value = 0.05;

    return { oscillator, gain: gainNode };
  }

  createExplosionSound() {
    const duration = 1.5;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filterNode = this.context.createBiquadFilter();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 100;
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(1000, this.context.currentTime);
    filterNode.frequency.exponentialRampToValueAtTime(20, this.context.currentTime + duration);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);

    return { oscillator, gain: gainNode };
  }
}

class BottlingMachine {
  constructor() {
    this.running = false;
    this.bottleCount = 0;
    this.speed = 50;
    this.batchSize = 6;
    this.activeBottles = new Set();
    this.soundEngine = new SoundEngine();
    this.machineSounds = null;
    this.conveyorSound = null;
    
    this.elements = {
      start: document.getElementById('start'),
      stop: document.getElementById('stop'),
      status: document.getElementById('status'),
      bottleCount: document.getElementById('bottle-count'),
      speedControl: document.getElementById('speed'),
      batchControl: document.getElementById('batch-size'),
      bottlesContainer: document.querySelector('.bottles-container'),
      pipes: document.querySelectorAll('.pipe'),
      mixerBlades: document.querySelector('.mixer-blades'),
      explode: document.getElementById('explode'),
      factory: document.querySelector('.factory'),
      finishedProducts: document.querySelector('.finished-products'),
      robotArm: document.querySelector('.robot-arm'),
      labelingMachine: document.querySelector('.labeling-machine')
    };
    
    this.exploded = false;
    this.finishedDrinks = [];
    
    this.initUI();
  }
  
  initUI() {
    this.elements.start.addEventListener('click', () => this.startProduction());
    this.elements.stop.addEventListener('click', () => this.stopProduction());
    this.elements.speedControl.addEventListener('input', (e) => this.updateSpeed(e.target.value));
    this.elements.batchControl.addEventListener('input', (e) => this.updateBatchSize(e.target.value));
    
    // Initialize mixer blades
    for (let i = 0; i < 4; i++) {
      const blade = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      blade.setAttribute('x', '145');
      blade.setAttribute('y', '210');
      blade.setAttribute('width', '10');
      blade.setAttribute('height', '30');
      blade.setAttribute('fill', '#ddd');
      blade.setAttribute('transform', `rotate(${i * 90} 150 225)`);
      this.elements.mixerBlades.appendChild(blade);
    }
    
    this.elements.explode.addEventListener('click', () => this.explode());
  }
  
  startProduction() {
    if (this.running) return;
    
    // Initialize sounds
    this.machineSounds = this.soundEngine.createMachinerySound();
    this.conveyorSound = this.soundEngine.createConveyorSound();
    
    // Start the sounds
    this.machineSounds.oscillators.forEach(osc => osc.start());
    this.conveyorSound.oscillator.start();
    
    this.running = true;
    this.elements.start.disabled = true;
    this.elements.stop.disabled = false;
    this.elements.status.textContent = 'Running';
    
    this.elements.pipes.forEach(pipe => pipe.classList.add('active'));
    this.productionLoop();
  }
  
  stopProduction() {
    this.running = false;
    this.elements.start.disabled = false;
    this.elements.stop.disabled = true;
    this.elements.status.textContent = 'Stopping...';
    
    // Stop sounds gradually
    if (this.machineSounds) {
      this.machineSounds.gain.gain.linearRampToValueAtTime(0, this.soundEngine.context.currentTime + 0.5);
      setTimeout(() => {
        this.machineSounds.oscillators.forEach(osc => osc.stop());
      }, 500);
    }
    
    if (this.conveyorSound) {
      this.conveyorSound.gain.gain.linearRampToValueAtTime(0, this.soundEngine.context.currentTime + 0.5);
      setTimeout(() => {
        this.conveyorSound.oscillator.stop();
      }, 500);
    }
    
    this.elements.pipes.forEach(pipe => pipe.classList.remove('active'));
    
    setTimeout(() => {
      this.elements.status.textContent = 'Idle';
    }, 1000);
  }
  
  updateSpeed(value) {
    this.speed = value;
  }
  
  updateBatchSize(value) {
    this.batchSize = parseInt(value);
  }
  
  async createBottle() {
    if (this.exploded) return;

    const bottle = document.createElement('div');
    bottle.className = 'bottle empty';
    bottle.style.left = '150px';
    this.elements.bottlesContainer.appendChild(bottle);

    // Add subtle shine effect
    const shine = document.createElement('div');
    shine.className = 'shine';
    bottle.appendChild(shine);

    // Enhanced sound effects
    this.soundEngine.createBottleFillSound();

    // Animated robot arm movement
    const arm = this.elements.robotArm;
    arm.style.animation = 'moveArm 1s cubic-bezier(0.4, 0, 0.2, 1) forwards';

    // Wait for arm movement
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enhanced filling animation with particles
    bottle.classList.add('filling');
    for (let i = 0; i < 5; i++) {
      const droplet = document.createElement('div');
      droplet.className = 'droplet';
      bottle.appendChild(droplet);
    }

    const fillSound = this.soundEngine.createBottleFillSound();

    // Wait for fill
    await new Promise(resolve => setTimeout(resolve, 1500));
    bottle.classList.remove('filling');
    bottle.classList.add('filled');

    // Retract arm with smooth animation
    arm.style.animation = 'moveArmBack 1s cubic-bezier(0.4, 0, 0.2, 1) forwards';

    // Enhanced conveyor movement
    let position = 150;
    await new Promise(resolve => {
      const moveInterval = setInterval(() => {
        position += 2;
        bottle.style.transform = `translateX(${position}px) rotateY(${Math.sin(position/50) * 5}deg)`;

        if (position >= 300) {
          clearInterval(moveInterval);
          resolve();
        }
      }, 20);
    });

    // Enhanced labeling animation
    bottle.classList.add('labeling');
    const labelingMachine = this.elements.labelingMachine;
    labelingMachine.classList.add('active');

    // Create label shine effect
    const labelShine = document.createElement('div');
    labelShine.className = 'label-shine';
    bottle.appendChild(labelShine);

    await new Promise(resolve => setTimeout(resolve, 1000));
    bottle.classList.remove('labeling');
    bottle.classList.add('labeled');
    labelingMachine.classList.remove('active');

    // Final conveyor movement with enhanced animation
    const finalMoveInterval = setInterval(() => {
      position += 2;
      bottle.style.transform = `translateX(${position}px) rotateY(${Math.sin(position/50) * 5}deg)`;

      if (position > 800) {
        clearInterval(finalMoveInterval);
        bottle.remove();
        this.activeBottles.delete(bottle);
        if (!this.exploded) {
          this.addFinishedProduct();
        }
      }
    }, 50);

    this.activeBottles.add(bottle);
    this.bottleCount++;
    this.elements.bottleCount.textContent = this.bottleCount;
  }

  async productionLoop() {
    while (this.running) {
      for (let i = 0; i < this.batchSize; i++) {
        if (!this.running) break;
        await this.createBottle();
        await new Promise(resolve => setTimeout(resolve, 3000 - (this.speed * 20)));
      }
    }
  }

  addFinishedProduct() {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';

    const formula = generateFormula(
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 100)
    );

    productCard.innerHTML = `
      <div class="product-can">
        <div class="can-highlight"></div>
        <div class="can-label">
          <div class="label-text">Dr Pepper</div>
          <div class="label-subtext">23 Flavors</div>
        </div>
        <div class="bubbles-overlay">
          ${Array(8).fill(0).map(() => `
            <div class="bubble" style="
              left: ${Math.random() * 100}%;
              width: ${Math.random() * 4 + 2}px;
              height: ${Math.random() * 4 + 2}px;
              animation-duration: ${Math.random() * 1 + 1}s;
              animation-delay: ${Math.random()}s;
            "></div>
          `).join('')}
        </div>
      </div>
      <div class="product-details">
        <div class="product-info">Batch #${this.bottleCount}</div>
        <div class="formula-text">${formula}</div>
        <button class="drink-btn">
          <span class="btn-text">Drink</span>
          <span class="btn-shine"></span>
        </button>
      </div>
    `;

    const drinkBtn = productCard.querySelector('.drink-btn');
    drinkBtn.addEventListener('click', () => this.drinkProduct(productCard));

    this.elements.finishedProducts.appendChild(productCard);
    this.finishedDrinks.push(productCard);
  }

  drinkProduct(productCard) {
    // Play drinking sound
    const drinkingSound = this.soundEngine.context.createOscillator();
    const gainNode = this.soundEngine.context.createGain();
    drinkingSound.type = 'sine';
    drinkingSound.frequency.setValueAtTime(800, this.soundEngine.context.currentTime);
    drinkingSound.frequency.exponentialRampToValueAtTime(200, this.soundEngine.context.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1, this.soundEngine.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.soundEngine.context.currentTime + 0.5);
    
    drinkingSound.connect(gainNode);
    gainNode.connect(this.soundEngine.masterGain);
    
    drinkingSound.start();
    drinkingSound.stop(this.soundEngine.context.currentTime + 0.5);

    // Animate and remove
    const can = productCard.querySelector('.product-can');
    can.classList.add('drink-animation');
    
    setTimeout(() => {
      productCard.remove();
      this.finishedDrinks = this.finishedDrinks.filter(drink => drink !== productCard);
    }, 1000);
  }

  async explode() {
    if (this.exploded) return;
    this.exploded = true;
    
    // Stop production and clear existing bottles
    if (this.running) {
      this.stopProduction();
    }
    
    // Remove all active bottles
    this.activeBottles.forEach(bottle => bottle.remove());
    this.activeBottles.clear();
    
    // Create explosion sound
    this.soundEngine.createExplosionSound();

    // Create particles
    const numParticles = 50;
    const particles = [];
    
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random particle type
      const types = ['tank', 'bottle', 'gear', 'metal'];
      particle.dataset.type = types[Math.floor(Math.random() * types.length)];
      
      // Random position within the factory
      const rect = this.elements.factory.getBoundingClientRect();
      particle.style.left = `${Math.random() * rect.width}px`;
      particle.style.top = `${Math.random() * rect.height}px`;
      
      // Random rotation and scale
      particle.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.5})`;
      
      this.elements.factory.appendChild(particle);
      particles.push(particle);
      
      // Apply random velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 30 + 20;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Animate particle
      let x = parseFloat(particle.style.left);
      let y = parseFloat(particle.style.top);
      let rotation = 0;
      
      const animate = () => {
        if (!particle.isConnected) return;
        x += vx;
        y += vy + 1; // Add gravity
        rotation += 10;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.transform = `rotate(${rotation}deg) scale(${Math.random() * 0.5 + 0.5})`;
        
        if (y < rect.height + 100) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };
      
      animate();
    }

    // Add smoke effect
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    this.elements.factory.appendChild(smoke);

    // Disable explosion button
    this.elements.explode.disabled = true;
  }
}

// Initialize machine when document is ready
document.addEventListener('DOMContentLoaded', () => {
  const machine = new BottlingMachine();
  
  // Add click handler to ensure audio context starts
  document.addEventListener('click', () => {
    if (machine.soundEngine.context.state === 'suspended') {
      machine.soundEngine.context.resume();
    }
  }, { once: true });
});

function generateFormula(flavor1, flavor2, flavor3) {
  return `Formula: ${flavor1} + ${flavor2} + ${flavor3}`;
}