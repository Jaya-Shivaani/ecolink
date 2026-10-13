// Central Product Image Resolution Utility for EcoLink Marketplace
// Directly links and resolves the user's product images in src/assets/products
// Prefers WebP format (90%+ smaller) with PNG fallback

import fallbackPlaceholder from '../assets/products/product-placeholder.png';

// Dynamically import all user PNG assets
const localModules = import.meta.glob('../assets/products/*.png', { eager: true, import: 'default' });

// Dynamically import all optimized WebP assets (preferred)
const webpModules = import.meta.glob('../assets/products/*.webp', { eager: true, import: 'default' });

// Fast lookup dictionary for filenames and basenames
// WebP entries overwrite PNG entries for the same basename, so WebP is preferred
const ASSET_CACHE = {};

// First, load all PNG assets
for (const [key, modUrl] of Object.entries(localModules)) {
  const fileName = key.split('/').pop().toLowerCase();
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  ASSET_CACHE[fileName] = modUrl;
  ASSET_CACHE[baseName] = modUrl;
  // Support both hyphen and underscore variants
  ASSET_CACHE[baseName.replace(/-/g, '_')] = modUrl;
  ASSET_CACHE[baseName.replace(/_/g, '-')] = modUrl;
}

// Then, load WebP assets (overrides PNGs for shared basenames)
for (const [key, modUrl] of Object.entries(webpModules)) {
  const fileName = key.split('/').pop().toLowerCase();
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  ASSET_CACHE[fileName] = modUrl;
  ASSET_CACHE[baseName] = modUrl; // Overwrites PNG entry — WebP preferred
  ASSET_CACHE[baseName.replace(/-/g, '_')] = modUrl;
  ASSET_CACHE[baseName.replace(/_/g, '-')] = modUrl;
}

// Normalized Product Name to User PNG Asset mapping
const PRODUCT_IMAGE_MAP = {
  'medicinal neem plant': 'medicinal-neem-plant.png',
  'english ivy (air purifier)': 'english-ivy.png',
  'english ivy': 'english-ivy.png',
  'fiddle leaf fig': 'fiddle-leaf-fig.png',
  'aloe vera plant (large)': 'aloe-vera-plant.png',
  'aloe vera plant': 'aloe-vera-plant.png',
  'peace lily (indoor purifier)': 'peace-lily.png',
  'peace lily': 'peace-lily.png',
  'money plant (golden pothos)': 'money-plant.png',
  'money plant': 'money-plant.png',
  'moringa (drumstick) sapling': 'moringa-sapling.png',
  'moringa sapling': 'moringa-sapling.png',
  'curry leaf plant': 'curry-leaf-plant.png',
  'spider plant (chlorophytum)': 'spider-plant.png',
  'spider plant': 'spider-plant.png',
  'bougainvillea (magenta)': 'bougainvillea-magenta.png',
  'bougainvillea': 'bougainvillea-magenta.png',
  'handcrafted banana fibre bag': 'banana-fibre-bag.png',
  'banana fibre bag': 'banana-fibre-bag.png',
  'premium vermicompost pack (5kg)': 'vermicompost-pack.png',
  'vermicompost pack': 'vermicompost-pack.png',
  'coconut coir hanging planters': 'coconut-coir-planters.png',
  'coconut coir planters': 'coconut-coir-planters.png',
  'organic jeevamrit liquid fertilizer (1l)': 'jeevamrit-liquid.png',
  'organic jeevamrit liquid fertilizer': 'jeevamrit-liquid.png',
  'jeevamrit liquid': 'jeevamrit-liquid.png',
  'palm leaf dinner plates (pack of 25)': 'palm-leaf-plates.png',
  'palm leaf plates': 'palm-leaf-plates.png',
  'banana fibre pen holder (set of 2)': 'banana-fibre-penholder.png',
  'banana fibre pen holder': 'banana-fibre-penholder.png',
  'home compost maker kit': 'home-compost-kit.png',
  'home compost kit': 'home-compost-kit.png',
  'neem cake fertilizer (3kg)': 'neem_cake_fertilizer.png',
  'neem cake fertilizer': 'neem_cake_fertilizer.png',
  'reusable beeswax food wraps (set of 3)': 'beeswax-wraps.png',
  'beeswax wraps': 'beeswax-wraps.png',
  'rare organic holy basil (tulsi) seeds': 'tulsi-seeds.png',
  'holy basil seeds': 'tulsi-seeds.png',
  'tulsi seeds': 'tulsi-seeds.png',
  'heirloom tomato seed collection': 'heirloom-tomato-seeds.png',
  'heirloom tomato seeds': 'heirloom-tomato-seeds.png',
  'ashwagandha sapling (medicinal)': 'ashwagandha-sapling.png',
  'ashwagandha sapling': 'ashwagandha-sapling.png',
  'vetiver (khus) grass roots': 'vetiver-grass-roots.png',
  'vetiver grass roots': 'vetiver-grass-roots.png',
  'brahmi herb plant': 'brahmi-herb-plant.png',
  'marigold seed bomb pack (12 bombs)': 'marigold-seed-bombs.png',
  'marigold seed bombs': 'marigold-seed-bombs.png',
  'bottle gourd (lauki) seeds – heirloom': 'bottle-gourd-seeds.png',
  'bottle gourd seeds': 'bottle-gourd-seeds.png',
  'lemon grass plant (cymbopogon)': 'lemon-grass-plant.png',
  'lemon grass plant': 'lemon-grass-plant.png',
  'organic mint plant': 'organic-mint-plant.png',
  'organic monstera plant': 'organic-monstera-plant.png',
};

// Category fallback to user's PNG assets
const CATEGORY_IMAGE_MAP = {
  'Medicinal Plants': 'medicinal-neem-plant.png',
  'Indoor Plants': 'peace-lily.png',
  'Outdoor Plants': 'bougainvillea-magenta.png',
  'Seeds': 'tulsi-seeds.png',
  'Fertilizers': 'vermicompost-pack.png',
  'Banana Fibre Bags': 'banana-fibre-bag.png',
  'Coconut Coir Products': 'coconut-coir-planters.png',
  'Eco-Products': 'home-compost-kit.png',
};

/**
 * Returns a valid local image URL for a given product or product image string
 * @param {Object|String} product - Product object or image string
 * @returns {String} Local image path
 */
export const getProductImage = (product) => {
  const defaultFallback = ASSET_CACHE['product-placeholder.png'] || fallbackPlaceholder;
  if (!product) return defaultFallback;

  let rawImg = '';
  let name = '';
  let category = '';

  if (typeof product === 'string') {
    rawImg = product;
  } else if (typeof product === 'object') {
    name = product.name || '';
    category = product.category || '';
    if (Array.isArray(product.images) && product.images.length > 0) {
      rawImg = product.images[0];
    } else if (typeof product.image === 'string') {
      rawImg = product.image;
    }
  }

  // 1. If rawImg is a full remote web URL, base64 data URL, or uploaded file
  if (rawImg && (
    rawImg.startsWith('http://') ||
    rawImg.startsWith('https://') ||
    rawImg.startsWith('data:image/') ||
    rawImg.startsWith('/uploads/') ||
    rawImg.startsWith('blob:')
  )) {
    if (rawImg.startsWith('/uploads/') && import.meta.env.VITE_API_URL) {
      return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}${rawImg}`;
    }
    return rawImg;
  }

  // 2. Resolve by local asset filename / path — prefers WebP (via basename) over PNG
  if (rawImg) {
    const rawFile = rawImg.split('/').pop().toLowerCase();
    const rawBase = rawFile.replace(/\.[^/.]+$/, '');
    // Basename lookup resolves to WebP (preferred), fallback to exact filename (PNG)
    if (ASSET_CACHE[rawBase]) return ASSET_CACHE[rawBase];
    if (ASSET_CACHE[rawFile]) return ASSET_CACHE[rawFile];
    if (ASSET_CACHE[`${rawBase}.webp`]) return ASSET_CACHE[`${rawBase}.webp`];
    if (ASSET_CACHE[`${rawBase}.png`]) return ASSET_CACHE[`${rawBase}.png`];
  }

  // 3. Resolve by exact or partial product name — prefers WebP
  if (name) {
    const normalized = name.toLowerCase().trim();
    if (PRODUCT_IMAGE_MAP[normalized]) {
      const mappedFile = PRODUCT_IMAGE_MAP[normalized];
      const mappedBase = mappedFile.replace(/\.[^/.]+$/, '');
      // Try basename first (WebP), then exact filename (PNG fallback)
      if (ASSET_CACHE[mappedBase]) return ASSET_CACHE[mappedBase];
      if (ASSET_CACHE[mappedFile]) return ASSET_CACHE[mappedFile];
    }
    for (const [key, file] of Object.entries(PRODUCT_IMAGE_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        const fBase = file.replace(/\.[^/.]+$/, '');
        if (ASSET_CACHE[fBase]) return ASSET_CACHE[fBase];
        if (ASSET_CACHE[file]) return ASSET_CACHE[file];
      }
    }
  }

  // 4. Resolve by Category
  if (category && CATEGORY_IMAGE_MAP[category] && ASSET_CACHE[CATEGORY_IMAGE_MAP[category]]) {
    return ASSET_CACHE[CATEGORY_IMAGE_MAP[category]];
  }

  // 5. If rawImg is a public path, return it as fallback
  if (rawImg && rawImg.startsWith('/')) {
    return rawImg;
  }

  return defaultFallback;
};

export const PRODUCT_PLACEHOLDER = ASSET_CACHE['product-placeholder.png'] || fallbackPlaceholder;
export default getProductImage;
