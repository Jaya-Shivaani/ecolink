const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

async function applyClassification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected.');

    const catalogPath = path.join(__dirname, 'product_classification.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

    let totalUpdated = 0;

    for (const cat of catalog.categories) {
      for (const prod of cat.products) {
        const result = await Product.updateMany(
          { name: prod.name },
          {
            $set: {
              category: cat.name,
              yieldType: cat.yieldType,
              description: prod.description,
              price: prod.price,
              images: [prod.image],
            }
          }
        );
        if (result.matchedCount > 0) {
          console.log(`✓ Updated "${prod.name}" -> Category: "${cat.name}", Yield: "${cat.yieldType}"`);
          totalUpdated += result.modifiedCount;
        } else {
          console.log(`? Product not found in DB: "${prod.name}"`);
        }
      }
    }

    console.log(`\nClassification applied successfully! Total updated records: ${totalUpdated}`);
    process.exit(0);
  } catch (err) {
    console.error('Error applying classification:', err);
    process.exit(1);
  }
}

applyClassification();
