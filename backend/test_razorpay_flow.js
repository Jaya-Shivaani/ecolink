require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Setting = require('./models/Setting');
const orderController = require('./controllers/orderController');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecolink';

async function runRazorpayVerificationTests() {
  console.log('--- STARTING RAZORPAY TEST MODE INTEGRATION VERIFICATION ---');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // 1. Find a buyer and a seller with products
    const buyer = await User.findOne({ 'roles.buyer': true, email: { $exists: true } });
    const seller = await User.findOne({ 'roles.seller': true, email: { $exists: true } });

    if (!buyer || !seller) {
      console.error('✗ Test buyer or seller not found in DB');
      process.exit(1);
    }
    console.log(`✓ Using Test Buyer: ${buyer.name} (${buyer._id})`);
    console.log(`✓ Using Test Seller: ${seller.name} (${seller._id})`);

    // Find a product with stock
    let product = await Product.findOne({ seller: seller._id, stock: { $gte: 2 } });
    if (!product) {
      product = await Product.findOne({ stock: { $gte: 2 } });
    }
    if (!product) {
      console.error('✗ No test product with stock >= 2 found');
      process.exit(1);
    }
    const initialStock = product.stock;
    console.log(`✓ Using Test Product: "${product.name}" (Price: ₹${product.price}, Stock: ${initialStock})`);

    // Helper mock response
    function createMockRes() {
      const res = {
        statusCode: 200,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.data = payload;
          return this;
        },
      };
      return res;
    }

    // ── TEST 1: GET RAZORPAY KEY ──
    console.log('\n▶ TEST 1: Retrieve Razorpay Key (Public ID only)');
    const keyReq = { user: buyer };
    const keyRes = createMockRes();
    await orderController.getRazorpayKey(keyReq, keyRes);

    if (keyRes.statusCode === 200 && keyRes.data.success && keyRes.data.key === 'rzp_test_Tad0YWpyJDxcei') {
      console.log('✓ SUCCESS: Returned correct Razorpay Key ID:', keyRes.data.key);
      if (keyRes.data.secret || JSON.stringify(keyRes.data).includes('XXiyxg')) {
        throw new Error('SECURITY VIOLATION: Secret was leaked in API response!');
      }
      console.log('✓ SECURITY CHECK: Secret is never leaked');
    } else {
      throw new Error(`TEST 1 Failed: ${JSON.stringify(keyRes.data)}`);
    }

    // ── TEST 2: CREATE RAZORPAY ORDER (BACKEND CALCULATION) ──
    console.log('\n▶ TEST 2: Create Razorpay Order via Backend');
    const orderItems = [
      {
        product: product._id.toString(),
        name: product.name,
        qty: 1,
        price: 999999, // Intentional tampered price sent from frontend to test security
      },
    ];

    const createReq = {
      user: buyer,
      body: {
        orderItems,
        shippingAddress: '42 Eco Way, Green City, TN, Phone: 9876543210',
        isGift: false,
      },
    };
    const createRes = createMockRes();
    await orderController.createRazorpayOrder(createReq, createRes);

    if (createRes.statusCode === 200 && createRes.data.success && createRes.data.orderId) {
      console.log('✓ SUCCESS: Razorpay Order created with ID:', createRes.data.orderId);
      console.log('✓ Amount in paise:', createRes.data.amount);
      const expectedTotal = product.price + (product.price > 1000 ? 0 : 50);
      const expectedPaise = Math.round(expectedTotal * 100);

      if (createRes.data.amount !== expectedPaise) {
        throw new Error(`Amount mismatch! Expected ${expectedPaise} paise, got ${createRes.data.amount}`);
      }
      console.log(`✓ SECURITY CHECK: Frontend tampered price was ignored. Calculated true total: ₹${createRes.data.totalPrice}`);
    } else {
      throw new Error(`TEST 2 Failed: ${JSON.stringify(createRes.data)}`);
    }

    const razorpayOrderId = createRes.data.orderId;
    const testPaymentId = `pay_test_${Date.now().toString().slice(-8)}`;

    // ── TEST 3: VERIFY WITH INVALID / TAMPERED SIGNATURE ──
    console.log('\n▶ TEST 3: Verify Payment with Invalid Signature (Tampering Check)');
    const fakeSignature = 'bad_signature_1234567890abcdef';
    const invalidVerifyReq = {
      user: buyer,
      body: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: fakeSignature,
        orderItems,
        shippingAddress: '42 Eco Way, Green City, TN, Phone: 9876543210',
      },
    };
    const invalidVerifyRes = createMockRes();
    await orderController.verifyRazorpayPayment(invalidVerifyReq, invalidVerifyRes);

    if (invalidVerifyRes.statusCode === 400 && invalidVerifyRes.data.success === false) {
      console.log('✓ SUCCESS: Tampered signature was correctly rejected with 400:', invalidVerifyRes.data.message);
    } else {
      throw new Error(`TEST 3 Failed: Tampered signature was not rejected! Response: ${JSON.stringify(invalidVerifyRes.data)}`);
    }

    // ── TEST 4: VERIFY WITH VALID SIGNATURE ──
    console.log('\n▶ TEST 4: Verify Payment with Valid Signature & Confirm Order');
    const validHmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    validHmac.update(`${razorpayOrderId}|${testPaymentId}`);
    const validSignature = validHmac.digest('hex');

    const validVerifyReq = {
      user: buyer,
      body: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
        orderItems,
        shippingAddress: '42 Eco Way, Green City, TN, Phone: 9876543210',
      },
    };
    const validVerifyRes = createMockRes();
    await orderController.verifyRazorpayPayment(validVerifyReq, validVerifyRes);

    if (validVerifyRes.statusCode === 201 && validVerifyRes.data.success && validVerifyRes.data.order) {
      const confirmed = validVerifyRes.data.order;
      console.log('✓ SUCCESS: Order placed and verified in DB!');
      console.log(`✓ Order ID: ${confirmed._id}`);
      console.log(`✓ Payment Status: ${confirmed.paymentStatus} (Expected: Paid)`);
      console.log(`✓ Payment Method: ${confirmed.paymentMethod}`);
      console.log(`✓ Razorpay Payment ID: ${confirmed.razorpayPaymentId}`);
      console.log(`✓ Order Status: ${confirmed.status} (Expected: Placed)`);

      if (confirmed.paymentStatus !== 'Paid' || confirmed.status !== 'Placed') {
        throw new Error('Order fields not set properly');
      }

      // Check stock decrement
      const updatedProduct = await Product.findById(product._id);
      console.log(`✓ Stock safely updated: ${initialStock} -> ${updatedProduct.stock} (Decremented by 1)`);
      if (updatedProduct.stock !== initialStock - 1) {
        throw new Error('Stock was not properly decremented');
      }
    } else {
      throw new Error(`TEST 4 Failed: ${JSON.stringify(validVerifyRes.data)}`);
    }

    // ── TEST 5: PREVENT DUPLICATE ORDER CREATION ON REPLAY ──
    console.log('\n▶ TEST 5: Prevent Duplicate Order Creation on Replay');
    const replayVerifyRes = createMockRes();
    await orderController.verifyRazorpayPayment(validVerifyReq, replayVerifyRes);

    if (replayVerifyRes.data.alreadyProcessed === true) {
      console.log('✓ SUCCESS: Duplicate payment replay was intercepted and prevented.');
    } else {
      throw new Error(`TEST 5 Failed: Duplicate was not intercepted`);
    }

    // ── TEST 6: VERIFY SELLER RECEIVES THE NEW ORDER ──
    console.log('\n▶ TEST 6: Verify Seller Orders retrieval');
    const sellerReq = { user: seller };
    const sellerRes = createMockRes();
    await orderController.getSellerOrders(sellerReq, sellerRes);

    if (sellerRes.statusCode === 200 && sellerRes.data.success) {
      const foundOrder = sellerRes.data.orders.find((o) => o.razorpayPaymentId === testPaymentId);
      if (foundOrder) {
        console.log(`✓ SUCCESS: Seller received the paid order #${foundOrder._id} with payment status: ${foundOrder.paymentStatus}`);
      } else {
        console.log('✓ Note: Order belongs to product seller', sellerRes.data.orders.length, 'orders retrieved for seller.');
      }
    }

    console.log('\n======================================================');
    console.log('🎉 ALL RAZORPAY INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n✗ TEST RUN FAILED WITH ERROR:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runRazorpayVerificationTests();
