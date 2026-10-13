const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'seed.js');
let seedContent = fs.readFileSync(seedPath, 'utf8');

const imageReplacements = [
  { old: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500', new: '/assets/products/medicinal-neem-plant.jpg' },
  { old: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=500', new: '/assets/products/english-ivy.jpg' },
  { old: 'https://images.unsplash.com/photo-1597055958611-38e9fc7e09b1?w=500', new: '/assets/products/fiddle-leaf-fig.jpg' },
  { old: 'https://images.unsplash.com/photo-1596547609652-9cb5d8d1e3d5?w=500', new: '/assets/products/aloe-vera-plant.jpg' },
  { old: 'https://images.unsplash.com/photo-1616961712951-c2a2fe5d78be?w=500', new: '/assets/products/peace-lily.jpg' },
  { old: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=500', new: '/assets/products/money-plant.jpg' },
  { old: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500', new: '/assets/products/moringa-sapling.jpg' },
  { old: 'https://images.unsplash.com/photo-1416879598555-460cefa61582?w=500', new: '/assets/products/curry-leaf-plant.jpg' },
  { old: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500', new: '/assets/products/spider-plant.jpg' },
  { old: 'https://images.unsplash.com/photo-1563241527-3004b7be0b43?w=500', new: '/assets/products/bougainvillea-magenta.jpg' },
  { old: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500', new: '/assets/products/banana-fibre-bag.jpg' },
  { old: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500', new: '/assets/products/vermicompost-pack.jpg' },
  { old: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=500', new: '/assets/products/jeevamrit-liquid.jpg' },
  { old: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500', new: '/assets/products/palm-leaf-plates.jpg' },
  { old: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', new: '/assets/products/banana-fibre-penholder.jpg' },
  { old: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', new: '/assets/products/home-compost-kit.jpg' },
  { old: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', new: '/assets/products/neem-cake-fertilizer.jpg' },
  { old: 'https://images.unsplash.com/photo-1563208724-bd7b4e4b069b?w=500', new: '/assets/products/beeswax-wraps.jpg' },
  { old: 'https://images.unsplash.com/photo-1598046187747-8149eb0b2f5c?w=500', new: '/assets/products/tulsi-seeds.jpg' },
  { old: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500', new: '/assets/products/heirloom-tomato-seeds.jpg' },
  { old: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500', new: '/assets/products/ashwagandha-sapling.jpg' },
  { old: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=500', new: '/assets/products/vetiver-grass-roots.jpg' },
  { old: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500', new: '/assets/products/brahmi-herb-plant.jpg' },
  { old: 'https://images.unsplash.com/photo-1490750967868-88df5691cc48?w=500', new: '/assets/products/marigold-seed-bombs.jpg' },
  { old: 'https://images.unsplash.com/photo-1571575173700-afb9492d6344?w=500', new: '/assets/products/bottle-gourd-seeds.jpg' },
  { old: 'https://images.unsplash.com/photo-1531236133604-4e7ea8b5fca0?w=500', new: '/assets/products/lemon-grass-plant.jpg' },
];

let replacedCount = 0;
for (const item of imageReplacements) {
  if (seedContent.includes(item.old)) {
    seedContent = seedContent.replaceAll(item.old, item.new);
    replacedCount++;
  }
}

// Special case for Coconut Coir Hanging Planters which re-used unsplash photo 1416879598555-460cefa61582
seedContent = seedContent.replace(
  `name: 'Coconut Coir Hanging Planters',\n        description: 'Set of 3 eco-friendly hanging planters made from tightly woven coconut coir. Great for vines and pothos.',\n        price: 450,\n        images: ['/assets/products/curry-leaf-plant.jpg']`,
  `name: 'Coconut Coir Hanging Planters',\n        description: 'Set of 3 eco-friendly hanging planters made from tightly woven coconut coir. Great for vines and pothos.',\n        price: 450,\n        images: ['/assets/products/coconut-coir-planters.jpg']`
);

fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log(`Replaced ${replacedCount} product image URLs in seed.js with local asset paths.`);
