const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

async function applyCustomOrganization() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully.');

    const configPath = path.join(__dirname, 'category_and_product_organization.json');
    if (!fs.existsSync(configPath)) {
      console.error('Config file not found:', configPath);
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    let totalUpdated = 0;

    console.log(`\nApplying organization for ${config.products.length} products...`);
    for (const prod of config.products) {
      const updateData = {
        category: prod.category,
        yieldType: prod.yieldType || '',
        price: prod.price,
        description: prod.description,
      };

      if (prod.image) {
        updateData.images = [prod.image];
      }

      const result = await Product.updateMany(
        { name: prod.name },
        { $set: updateData }
      );

      if (result.matchedCount > 0) {
        console.log(`✓ [Updated] "${prod.name}" -> Category: "${prod.category}", Yield: "${prod.yieldType}", Img: "${prod.image}"`);
        totalUpdated += result.modifiedCount;
      } else {
        console.log(`- [Not Found in DB] "${prod.name}"`);
      }
    }

    console.log(`\nFinished! Successfully updated ${totalUpdated} product records in database.`);
    process.exit(0);
  } catch (err) {
    console.error('Error applying organization:', err);
    process.exit(1);
  }
}

applyCustomOrganization();
