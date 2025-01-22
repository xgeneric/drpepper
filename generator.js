// Ingredients database
const ingredients = {
  base: ['Carbonated Water', 'High Fructose Corn Syrup', 'Caramel Color'],
  flavors: ['Cherry', 'Vanilla', 'Plum', 'Almond', 'Amaretto', 'Cola', 'Pepper', 'Cinnamon', 'Licorice', 'Juniper'],
  acids: ['Phosphoric Acid', 'Citric Acid', 'Malic Acid'],
  preservatives: ['Sodium Benzoate', 'Potassium Sorbate']
};

// Initialize bubbles
function initBubbles() {
  const bubblesGroup = document.querySelector('.bubbles');
  const numBubbles = 20;

  for (let i = 0; i < numBubbles; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'bubble');
    circle.setAttribute('r', Math.random() * 3 + 2);
    circle.setAttribute('cx', Math.random() * 110 + 45);
    
    // Set random initial position and delay
    const delay = Math.random() * 3;
    circle.style.animation = `rise 3s ${delay}s infinite ease-in`;
    
    bubblesGroup.appendChild(circle);
  }
}

// Generate a random formula based on slider values
function generateFormula(sweetness, carbonation, complexity) {
  const formula = [...ingredients.base];
  
  // Add flavors based on complexity
  const numFlavors = Math.floor(complexity / 20) + 2;
  const shuffledFlavors = ingredients.flavors.sort(() => Math.random() - 0.5);
  formula.push(...shuffledFlavors.slice(0, numFlavors));
  
  // Add acids
  const numAcids = Math.floor(carbonation / 40) + 1;
  const shuffledAcids = ingredients.acids.sort(() => Math.random() - 0.5);
  formula.push(...shuffledAcids.slice(0, numAcids));
  
  // Add preservatives
  formula.push(ingredients.preservatives[0]);
  
  // Generate percentages
  const formulaWithAmounts = formula.map(ingredient => {
    let amount;
    if (ingredient === 'Carbonated Water') {
      amount = 90 - (carbonation / 10);
    } else if (ingredient === 'High Fructose Corn Syrup') {
      amount = sweetness / 10;
    } else {
      amount = (Math.random() * 2 + 0.1).toFixed(2);
    }
    return `${ingredient}: ${amount}%`;
  });
  
  return formulaWithAmounts.join('\n');
}

// Update carbonation visualization
function updateCarbonation(value) {
  const bubbles = document.querySelectorAll('.bubble');
  bubbles.forEach(bubble => {
    bubble.style.animationDuration = `${4 - (value / 40)}s`;
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  initBubbles();
  
  const sliders = {
    sweetness: document.getElementById('sweetness'),
    carbonation: document.getElementById('carbonation'),
    complexity: document.getElementById('complexity')
  };
  
  const generateBtn = document.getElementById('generate');
  const formulaOutput = document.getElementById('formula');
  
  // Update carbonation visualization when slider changes
  sliders.carbonation.addEventListener('input', (e) => {
    updateCarbonation(e.target.value);
  });
  
  generateBtn.addEventListener('click', () => {
    const formula = generateFormula(
      parseInt(sliders.sweetness.value),
      parseInt(sliders.carbonation.value),
      parseInt(sliders.complexity.value)
    );
    
    formulaOutput.textContent = formula;
    
    // Animate the liquid
    const liquid = document.querySelector('.liquid');
    liquid.style.animation = 'none';
    liquid.offsetHeight; // Trigger reflow
    liquid.style.animation = 'pulse 0.5s ease-in-out';
  });
});