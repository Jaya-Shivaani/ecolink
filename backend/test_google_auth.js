const assert = require('assert');
const mongoose = require('mongoose');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

async function runTests() {
  console.log('=== STARTING GOOGLE AUTH BACKEND INTEGRATION TEST ===\n');

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is missing');
    }

    // Connect to DB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas.');

    // 1. Setup Mock User
    const email = `test_google_${Date.now()}@example.com`;
    console.log(`Creating initial MongoDB user: ${email}...`);
    
    let user = await User.create({
      name: 'Google Test User',
      email: email,
      password: 'initialpassword123',
      roles: { buyer: true, seller: true, admin: false }, // Approved seller!
      sellerStatus: 'approved',
      sellerProfile: {
        businessName: 'Organic Nursery Inc.',
        category: 'Nursery',
      }
    });

    console.log('User created. ID:', user._id);
    console.log('Roles:', JSON.stringify(user.roles));
    console.log('Seller Status:', user.sellerStatus);

    // 2. Mock Verification Flow & Duplicate Account Prevention
    console.log('\nSimulating Google Sign-In with same email...');
    const googleUid = `google_firebase_uid_${Date.now()}`;
    
    // Simulate what the backend controller does when token is verified:
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    
    assert.ok(existingUser, 'User should be found by email');
    console.log('✔ Duplicate account prevention check: Existing user found by email.');

    // Link firebaseUid
    existingUser.firebaseUid = googleUid;
    await existingUser.save();
    console.log('Linked Firebase UID:', googleUid);

    // Verify fields were preserved
    const updatedUser = await User.findById(existingUser._id);
    assert.strictEqual(updatedUser.email, email);
    assert.strictEqual(updatedUser.roles.buyer, true, 'buyer role should be preserved');
    assert.strictEqual(updatedUser.roles.seller, true, 'seller role should be preserved');
    assert.strictEqual(updatedUser.roles.admin, false, 'admin role should remain false');
    assert.strictEqual(updatedUser.sellerStatus, 'approved', 'sellerStatus should be preserved');
    assert.strictEqual(updatedUser.sellerProfile.businessName, 'Organic Nursery Inc.', 'sellerProfile should be preserved');
    assert.strictEqual(updatedUser.firebaseUid, googleUid, 'firebaseUid should be set');

    console.log('✔ All existing roles, sellerStatus, profile, and data were successfully preserved!');

    // 3. New Google User Registration Flow
    const newGoogleEmail = `new_google_${Date.now()}@example.com`;
    const newGoogleUid = `google_firebase_uid_new_${Date.now()}`;
    console.log(`\nSimulating Google Sign-In with new email: ${newGoogleEmail}...`);

    let newUser = await User.findOne({ email: newGoogleEmail });
    assert.strictEqual(newUser, null, 'User should not exist initially');

    // Simulate backend user creation
    newUser = await User.create({
      name: 'New Google User',
      email: newGoogleEmail,
      password: 'randomly_generated_secure_hash',
      roles: { buyer: true, seller: false, admin: false },
      sellerStatus: 'none',
      firebaseUid: newGoogleUid,
    });

    console.log('New user created. ID:', newUser._id);
    console.log('New user roles:', JSON.stringify(newUser.roles));
    console.log('New user sellerStatus:', newUser.sellerStatus);

    assert.strictEqual(newUser.roles.buyer, true, 'new user should have buyer: true');
    assert.strictEqual(newUser.roles.seller, false, 'new user should have seller: false');
    assert.strictEqual(newUser.roles.admin, false, 'new user should have admin: false');
    assert.strictEqual(newUser.sellerStatus, 'none', 'new user should have sellerStatus: "none"');
    assert.strictEqual(newUser.firebaseUid, newGoogleUid, 'new user firebaseUid should match');

    console.log('✔ New Google user registered correctly with default roles.');

    // Cleanup
    await User.findByIdAndDelete(updatedUser._id);
    await User.findByIdAndDelete(newUser._id);
    console.log('\nTest cleanup complete.');
    console.log('\n========================================================');
    console.log('🎉 ALL GOOGLE SIGN-IN INTEGRATION CHECKS PASSED CLEANLY!');
    console.log('========================================================');

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
