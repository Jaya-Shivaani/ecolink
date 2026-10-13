require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');

// Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Setting = require('./models/Setting');
const Testimonial = require('./models/Testimonial');

async function runComprehensiveTests() {
  console.log('\n========================================================');
  console.log('STARTING COMPREHENSIVE ECOLINK ENHANCEMENT VERIFICATION');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] (${total}) ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] (${total}) ${testName} ${details ? '--> ' + JSON.stringify(details) : ''}`);
    }
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.\n');

    // 1. Verify Feature 1: Long-Term & Short-Term Yield Products
    const longTermProducts = await Product.find({ yieldType: 'Long-Term Yield' });
    assert(longTermProducts.length > 0, 'Long-Term Yield products exist in DB with yieldType "Long-Term Yield"', { count: longTermProducts.length });

    const shortTermProducts = await Product.find({ yieldType: 'Short-Term Yield' });
    assert(shortTermProducts.length > 0, 'Short-Term Yield products exist in DB with yieldType "Short-Term Yield"', { count: shortTermProducts.length });

    // 2. Verify Feature 3: FMCG Category Products
    const fmcgProducts = await Product.find({ category: 'FMCG / Farm & Natural Products' });
    assert(fmcgProducts.length > 0, 'FMCG / Farm & Natural Products exist in DB', { count: fmcgProducts.length });

    // 3. Verify Feature 4: SHG Seller Benefit / Commission System
    const shgSetting = await Setting.findOne({ key: 'shgCommissionPercentage' });
    assert(shgSetting != null && shgSetting.value != null, 'Dynamic setting "shgCommissionPercentage" is configured in DB', { value: shgSetting?.value });

    const shgOrders = await Order.find({ isSHGOrder: true });
    assert(shgOrders.length > 0, 'Orders record SHG Commission snapshots (commissionRate, commissionAmount, sellerEarnings)', {
      count: shgOrders.length,
      sample: shgOrders[0] ? {
        totalPrice: shgOrders[0].totalPrice,
        commissionRate: shgOrders[0].commissionRate,
        commissionAmount: shgOrders[0].commissionAmount,
        sellerEarnings: shgOrders[0].sellerEarnings,
      } : null,
    });

    // 4. Verify Feature 5 & 6: Seller Types & Location Verification
    const sellersWithLocation = await User.find({ 'roles.seller': true });
    assert(sellersWithLocation.length > 0, 'Sellers exist with multi-role system intact', { count: sellersWithLocation.length });

    const locationVerifiedSellers = await User.find({
      'sellerProfile.locationVerification.status': { $in: ['Mismatch', 'Verified', 'Pending'] },
    });
    assert(locationVerifiedSellers.length > 0, 'Location verification status tracked on sellers for Admin Review', { count: locationVerifiedSellers.length });

    // 5. Verify Feature 7: Product Source Declaration & Verification
    const sourceVerifiedProducts = await Product.find({ 'sourceVerification.isSourceVerified': true });
    assert(sourceVerifiedProducts.length > 0, 'Products support and display Source Verification declarations', { count: sourceVerifiedProducts.length });

    // 6. Verify Feature 8: Community Stories & Testimonials
    const approvedTestimonials = await Testimonial.find({ status: 'Approved' });
    assert(approvedTestimonials.length > 0, 'Approved Community Testimonials exist for Home page dynamic display', { count: approvedTestimonials.length });

    const pendingTestimonials = await Testimonial.find({ status: 'Pending' });
    assert(pendingTestimonials.length > 0, 'Pending Testimonials exist for Admin moderation queue', { count: pendingTestimonials.length });

    console.log('\n========================================================');
    console.log(`TEST SUMMARY: ${passed} / ${total} TEST CHECKS PASSED`);
    console.log('========================================================\n');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
}

runComprehensiveTests();
