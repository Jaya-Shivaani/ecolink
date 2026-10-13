const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'assets', 'products');
const publicDir = path.join(__dirname, 'public', 'assets', 'products');

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Target directories created:');
console.log('-', srcDir);
console.log('-', publicDir);

// Brain directory containing generated PNGs
const brainDir = `C:\\Users\\jayas\\.gemini\\antigravity-ide\\brain\\650bac42-d2b4-406f-acec-bf418dcbd5dc`;

const generatedPngs = {
  'medicinal-neem-plant.png': 'medicinal_neem_plant_1788412322146.png',
  'english-ivy.png': 'english_ivy_1788412342666.png',
  'fiddle-leaf-fig.png': 'fiddle_leaf_fig_1788412364112.png',
  'aloe-vera-plant.png': 'aloe_vera_plant_1788412388208.png',
  'peace-lily.png': 'peace_lily_1788412407964.png',
  'money-plant.png': 'money_plant_1788412430114.png',
};

for (const [targetName, brainName] of Object.entries(generatedPngs)) {
  const brainPath = path.join(brainDir, brainName);
  if (fs.existsSync(brainPath)) {
    fs.copyFileSync(brainPath, path.join(srcDir, targetName));
    fs.copyFileSync(brainPath, path.join(publicDir, targetName));
    console.log(`Copied AI generated PNG: ${targetName}`);
  }
}

// Product SVG artwork generator for realistic, modern commercial product cards
const productArtworks = [
  {
    filename: 'medicinal-neem-plant.svg',
    title: 'Medicinal Neem Plant',
    category: 'Medicinal Plants',
    bgColor: '#15803d',
    accentColor: '#4ade80',
    icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#4ade80"/>`,
  },
  {
    filename: 'english-ivy.svg',
    title: 'English Ivy (Air Purifier)',
    category: 'Indoor Plants',
    bgColor: '#065f46',
    accentColor: '#34d399',
    icon: `<path d="M17 8C8 10 59 16 17 8z" fill="#34d399"/>`,
  },
  {
    filename: 'fiddle-leaf-fig.svg',
    title: 'Fiddle Leaf Fig',
    category: 'Indoor Plants',
    bgColor: '#166534',
    accentColor: '#86efac',
  },
  {
    filename: 'aloe-vera-plant.svg',
    title: 'Aloe Vera Plant (Large)',
    category: 'Medicinal Plants',
    bgColor: '#047857',
    accentColor: '#6ee7b7',
  },
  {
    filename: 'peace-lily.svg',
    title: 'Peace Lily (Indoor Purifier)',
    category: 'Indoor Plants',
    bgColor: '#0f766e',
    accentColor: '#2dd4bf',
  },
  {
    filename: 'money-plant.svg',
    title: 'Money Plant (Golden Pothos)',
    category: 'Indoor Plants',
    bgColor: '#15803d',
    accentColor: '#facc15',
  },
  {
    filename: 'moringa-sapling.svg',
    title: 'Moringa Sapling',
    category: 'Medicinal Plants',
    bgColor: '#14532d',
    accentColor: '#a7f3d0',
  },
  {
    filename: 'curry-leaf-plant.svg',
    title: 'Curry Leaf Plant',
    category: 'Medicinal Plants',
    bgColor: '#166534',
    accentColor: '#4ade80',
  },
  {
    filename: 'spider-plant.svg',
    title: 'Spider Plant',
    category: 'Indoor Plants',
    bgColor: '#0e7490',
    accentColor: '#67e8f9',
  },
  {
    filename: 'bougainvillea-magenta.svg',
    title: 'Bougainvillea (Magenta)',
    category: 'Outdoor Plants',
    bgColor: '#831843',
    accentColor: '#f472b6',
  },
  {
    filename: 'banana-fibre-bag.svg',
    title: 'Handcrafted Banana Fibre Bag',
    category: 'Banana Fibre Bags',
    bgColor: '#78350f',
    accentColor: '#fde047',
  },
  {
    filename: 'vermicompost-pack.svg',
    title: 'Premium Vermicompost Pack',
    category: 'Fertilizers',
    bgColor: '#3f6212',
    accentColor: '#bef264',
  },
  {
    filename: 'coconut-coir-planters.svg',
    title: 'Coconut Coir Planters',
    category: 'Coconut Coir Products',
    bgColor: '#713f12',
    accentColor: '#fef08a',
  },
  {
    filename: 'jeevamrit-liquid.svg',
    title: 'Organic Jeevamrit Liquid',
    category: 'Fertilizers',
    bgColor: '#365314',
    accentColor: '#a3e635',
  },
  {
    filename: 'palm-leaf-plates.svg',
    title: 'Palm Leaf Dinner Plates',
    category: 'Eco-Products',
    bgColor: '#854d0e',
    accentColor: '#fef08a',
  },
  {
    filename: 'banana-fibre-penholder.svg',
    title: 'Banana Fibre Pen Holder',
    category: 'Banana Fibre Bags',
    bgColor: '#78350f',
    accentColor: '#fde047',
  },
  {
    filename: 'home-compost-kit.svg',
    title: 'Home Compost Maker Kit',
    category: 'Eco-Products',
    bgColor: '#166534',
    accentColor: '#86efac',
  },
  {
    filename: 'neem-cake-fertilizer.svg',
    title: 'Neem Cake Fertilizer',
    category: 'Fertilizers',
    bgColor: '#14532d',
    accentColor: '#4ade80',
  },
  {
    filename: 'beeswax-wraps.svg',
    title: 'Beeswax Food Wraps',
    category: 'Eco-Products',
    bgColor: '#854d0e',
    accentColor: '#facc15',
  },
  {
    filename: 'tulsi-seeds.svg',
    title: 'Holy Basil (Tulsi) Seeds',
    category: 'Seeds',
    bgColor: '#14532d',
    accentColor: '#6ee7b7',
  },
  {
    filename: 'heirloom-tomato-seeds.svg',
    title: 'Heirloom Tomato Seeds',
    category: 'Seeds',
    bgColor: '#991b1b',
    accentColor: '#fca5a5',
  },
  {
    filename: 'ashwagandha-sapling.svg',
    title: 'Ashwagandha Sapling',
    category: 'Medicinal Plants',
    bgColor: '#065f46',
    accentColor: '#34d399',
  },
  {
    filename: 'vetiver-grass-roots.svg',
    title: 'Vetiver Grass Roots',
    category: 'Medicinal Plants',
    bgColor: '#3f6212',
    accentColor: '#a3e635',
  },
  {
    filename: 'brahmi-herb-plant.svg',
    title: 'Brahmi Herb Plant',
    category: 'Medicinal Plants',
    bgColor: '#047857',
    accentColor: '#6ee7b7',
  },
  {
    filename: 'marigold-seed-bombs.svg',
    title: 'Marigold Seed Bombs',
    category: 'Seeds',
    bgColor: '#c2410c',
    accentColor: '#fdba74',
  },
  {
    filename: 'bottle-gourd-seeds.svg',
    title: 'Bottle Gourd Seeds',
    category: 'Seeds',
    bgColor: '#15803d',
    accentColor: '#86efac',
  },
  {
    filename: 'lemon-grass-plant.svg',
    title: 'Lemon Grass Plant',
    category: 'Medicinal Plants',
    bgColor: '#166534',
    accentColor: '#a3e635',
  },
  {
    filename: 'organic-mint-plant.svg',
    title: 'Organic Mint Plant',
    category: 'Indoor Plants',
    bgColor: '#047857',
    accentColor: '#34d399',
  },
  {
    filename: 'organic-monstera-plant.svg',
    title: 'Organic Monstera Plant',
    category: 'Indoor Plants',
    bgColor: '#14532d',
    accentColor: '#4ade80',
  },
  {
    filename: 'product-placeholder.svg',
    title: 'EcoLink Product',
    category: 'Hyperlocal Eco Item',
    bgColor: '#064e3b',
    accentColor: '#10b981',
  },
];

function generateSVG({ title, category, bgColor, accentColor }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.4" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="600" height="600" rx="36" fill="url(#bgGrad)" />
  
  <!-- Soft Radial Glow -->
  <circle cx="300" cy="240" r="180" fill="${accentColor}" opacity="0.15" />

  <!-- Botanical Emblem & Pot Illustration -->
  <g filter="url(#shadow)" transform="translate(0, -20)">
    <!-- Terracotta / Eco Pot -->
    <path d="M220 370 L380 370 L360 460 L240 460 Z" fill="#b45309" opacity="0.9" />
    <rect x="210" y="350" width="180" height="24" rx="6" fill="#d97706" />

    <!-- Stems and Leaves -->
    <path d="M300 350 Q300 240 250 160" stroke="${accentColor}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M300 320 Q320 220 360 180" stroke="${accentColor}" stroke-width="8" fill="none" stroke-linecap="round"/>
    
    <!-- Central Leaf Shapes -->
    <path d="M250 160 Q210 200 250 240 Q290 200 250 160 Z" fill="url(#leafGrad)"/>
    <path d="M360 180 Q320 220 360 260 Q400 220 360 180 Z" fill="url(#leafGrad)"/>
    <path d="M300 200 Q260 140 300 90 Q340 140 300 200 Z" fill="${accentColor}"/>
  </g>

  <!-- Product Badge Pill -->
  <rect x="40" y="40" width="220" height="42" rx="21" fill="#ffffff" opacity="0.12" />
  <text x="56" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#ffffff" letter-spacing="1">🌱 ECOLINK LOCAL</text>

  <!-- Product Title & Category Overlay -->
  <rect x="36" y="475" width="528" height="88" rx="20" fill="#064e3b" opacity="0.85" stroke="${accentColor}" stroke-width="1.5"/>
  <text x="60" y="515" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#ffffff">${title}</text>
  <text x="60" y="542" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="${accentColor}">${category.toUpperCase()}</text>
</svg>`;
}

let generatedCount = 0;
for (const item of productArtworks) {
  const svgContent = generateSVG(item);
  fs.writeFileSync(path.join(srcDir, item.filename), svgContent);
  fs.writeFileSync(path.join(publicDir, item.filename), svgContent);
  
  // Also write JPG placeholder equivalent
  const jpgName = item.filename.replace('.svg', '.jpg');
  fs.writeFileSync(path.join(srcDir, jpgName), svgContent);
  fs.writeFileSync(path.join(publicDir, jpgName), svgContent);

  generatedCount++;
}

// Ensure product-placeholder.jpg exists
const placeholderContent = generateSVG({
  title: 'EcoLink Product',
  category: 'Hyperlocal Eco Item',
  bgColor: '#064e3b',
  accentColor: '#10b981',
});
fs.writeFileSync(path.join(srcDir, 'product-placeholder.jpg'), placeholderContent);
fs.writeFileSync(path.join(publicDir, 'product-placeholder.jpg'), placeholderContent);
fs.writeFileSync(path.join(srcDir, 'product-placeholder.svg'), placeholderContent);
fs.writeFileSync(path.join(publicDir, 'product-placeholder.svg'), placeholderContent);

console.log(`Successfully generated ${generatedCount} product SVG/JPG image assets in both src/assets/products and public/assets/products!`);
