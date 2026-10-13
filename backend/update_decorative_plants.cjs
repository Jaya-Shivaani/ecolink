const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const decorNames = [
      'Peace Lily (Indoor Purifier)',
      'Money Plant (Golden Pothos)',
      'English Ivy (Air Purifier)',
      'Spider Plant (Chlorophytum)',
      'Fiddle Leaf Fig',
      'Bougainvillea (Magenta)'
    ];

    const res = await Product.updateMany(
      { name: { $in: decorNames } },
      { $set: { yieldType: 'Decorative / Ornamental', category: 'Decorative / Ornamental Plants' } }
    );
    console.log('Updated count:', res.modifiedCount);

    const prods = await Product.find({
      $or: [
        { category: 'Decorative / Ornamental Plants' },
        { yieldType: 'Decorative / Ornamental' }
      ]
    });
    console.log('Decorative products now:');
    prods.forEach(p => console.log(`- ${p.name} | Category: ${p.category} | YieldType: ${p.yieldType}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
