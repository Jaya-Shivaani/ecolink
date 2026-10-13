const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = { raw: data };
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, data: { message: err.message } });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runSelfPurchaseTests() {
  console.log('\n==================================================');
  console.log('TESTING SELF-PURCHASE PREVENTION SECURITY RULES');
  console.log('==================================================\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message, details = '') {
    testsTotal++;
    if (condition) {
      console.log(`[PASS] Test Case ${testsTotal}: ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] Test Case ${testsTotal}: ${message} ${details ? '--> Details: ' + JSON.stringify(details) : ''}`);
    }
  }

  // 1. Login as Seller Ananya (who is both buyer and seller)
  const ananyaRes = await makeRequest('POST', '/auth/login', {
    email: 'ananya@ecolink.com',
    password: 'password123',
  });
  assert(ananyaRes.status === 200, 'Seller Ananya logged in successfully', ananyaRes);
  const tokenAnanya = ananyaRes.data.token;
  const userAnanya = ananyaRes.data;
  const headersAnanya = { Authorization: `Bearer ${tokenAnanya}` };

  // 2. Login as Buyer (buyer@ecolink.com)
  const buyerRes = await makeRequest('POST', '/auth/login', {
    email: 'buyer@ecolink.com',
    password: 'password123',
  });
  assert(buyerRes.status === 200, 'Buyer logged in successfully', buyerRes);
  const tokenBuyer = buyerRes.data.token;
  const headersBuyer = { Authorization: `Bearer ${tokenBuyer}` };

  // 3. Fetch products to get Ananya's product and another seller's product
  const productsRes = await makeRequest('GET', '/products');
  const allProducts = productsRes.data.products || productsRes.data;
  
  const ananyaProduct = allProducts.find(
    (p) => (p.seller?._id || p.seller)?.toString() === userAnanya._id.toString()
  );
  const otherProduct = allProducts.find(
    (p) => (p.seller?._id || p.seller)?.toString() !== userAnanya._id.toString()
  );

  assert(!!ananyaProduct, `Found product owned by Ananya: "${ananyaProduct?.name}" (ID: ${ananyaProduct?._id})`);
  assert(!!otherProduct, `Found product owned by another seller: "${otherProduct?.name}" (ID: ${otherProduct?._id})`);

  console.log(`\nAnanya's Product: ${ananyaProduct._id} (${ananyaProduct.name})`);
  console.log(`Other Seller's Product: ${otherProduct._id} (${otherProduct.name})\n`);

  // --- TEST CASE 1: Ananya attempts to add her OWN product to cart ---
  const cartSelfRes = await makeRequest('POST', '/cart', { productId: ananyaProduct._id, qty: 1 }, headersAnanya);
  assert(
    cartSelfRes.status === 400 && cartSelfRes.data.message === 'You cannot purchase your own product.',
    'Seller Ananya adding her own product to cart is blocked (400: "You cannot purchase your own product.")',
    cartSelfRes
  );

  // --- TEST CASE 2: External buyer adds Ananya's product to cart ---
  const cartOtherRes = await makeRequest('POST', '/cart', { productId: ananyaProduct._id, qty: 1 }, headersBuyer);
  assert(
    cartOtherRes.status === 200 || cartOtherRes.status === 201,
    'External buyer successfully adds Ananya\'s product to cart (200/201)',
    cartOtherRes
  );

  // --- TEST CASE 3: Direct order creation (POST /api/orders) with Ananya\'s own product ---
  const orderSelfRes = await makeRequest('POST', '/orders', {
    orderItems: [{ product: ananyaProduct._id, qty: 1, name: ananyaProduct.name, price: ananyaProduct.price }],
    shippingAddress: {
      address: '123 Ananya Garden Road',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: ananyaProduct.price,
  }, headersAnanya);
  assert(
    orderSelfRes.status === 400 &&
    orderSelfRes.data.message &&
    orderSelfRes.data.message.includes(`You cannot purchase your own product: "${ananyaProduct.name}"`),
    `Ananya creating COD order with her own product is blocked (400 naming "${ananyaProduct.name}")`,
    orderSelfRes
  );

  // --- TEST CASE 4: Razorpay order creation (POST /api/orders/razorpay/create-order) with Ananya\'s own product ---
  const rzpSelfRes = await makeRequest('POST', '/orders/razorpay/create-order', {
    orderItems: [{ product: ananyaProduct._id, qty: 1, name: ananyaProduct.name, price: ananyaProduct.price }],
    shippingAddress: {
      address: '123 Ananya Garden Road',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
    },
  }, headersAnanya);
  assert(
    rzpSelfRes.status === 400 &&
    rzpSelfRes.data.message &&
    rzpSelfRes.data.message.includes(`You cannot purchase your own product: "${ananyaProduct.name}"`),
    `Ananya creating Razorpay order with her own product is blocked (400 naming "${ananyaProduct.name}")`,
    rzpSelfRes
  );

  // --- TEST CASE 5: Razorpay payment verification (POST /api/orders/razorpay/verify-payment) with Ananya\'s own product ---
  const crypto = require('crypto');
  const rzpOrderId = 'order_fake_123';
  const rzpPaymentId = `pay_fake_${Date.now()}`;
  const validHmac = crypto.createHmac('sha256', 'XXiyxgKJW44NJDbwqC1WOZEE');
  validHmac.update(`${rzpOrderId}|${rzpPaymentId}`);
  const validSignature = validHmac.digest('hex');

  const rzpVerifySelfRes = await makeRequest('POST', '/orders/razorpay/verify-payment', {
    razorpay_order_id: rzpOrderId,
    razorpay_payment_id: rzpPaymentId,
    razorpay_signature: validSignature,
    orderItems: [{ product: ananyaProduct._id, qty: 1, name: ananyaProduct.name, price: ananyaProduct.price }],
    shippingAddress: {
      address: '123 Ananya Garden Road',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
    },
  }, headersAnanya);
  assert(
    rzpVerifySelfRes.status === 400 &&
    rzpVerifySelfRes.data.message &&
    rzpVerifySelfRes.data.message.includes(`You cannot purchase your own product: "${ananyaProduct.name}"`),
    `Ananya verifying payment with her own product is blocked before payment verification (400 naming "${ananyaProduct.name}")`,
    rzpVerifySelfRes
  );

  // --- TEST CASE 6: Mixed order: Ananya buys other seller's product AND her own product ---
  const mixedOrderRes = await makeRequest('POST', '/orders', {
    orderItems: [
      { product: otherProduct._id, qty: 1, name: otherProduct.name, price: otherProduct.price },
      { product: ananyaProduct._id, qty: 1, name: ananyaProduct.name, price: ananyaProduct.price },
    ],
    shippingAddress: {
      address: '123 Ananya Garden Road',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: otherProduct.price + ananyaProduct.price,
  }, headersAnanya);
  assert(
    mixedOrderRes.status === 400 &&
    mixedOrderRes.data.message &&
    mixedOrderRes.data.message.includes(`You cannot purchase your own product: "${ananyaProduct.name}"`),
    `Mixed order containing Ananya's own product is rejected entirely (400 naming "${ananyaProduct.name}")`,
    mixedOrderRes
  );

  // --- TEST CASE 7: Legitimate purchase: Ananya buys other seller's product only ---
  const validOrderRes = await makeRequest('POST', '/orders', {
    orderItems: [{ product: otherProduct._id, qty: 1, name: otherProduct.name, price: otherProduct.price }],
    shippingAddress: {
      address: '123 Ananya Garden Road',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: otherProduct.price,
  }, headersAnanya);
  assert(
    validOrderRes.status === 201 && validOrderRes.data.success === true,
    'Ananya successfully purchases other seller\'s product (201 Created)',
    validOrderRes
  );

  console.log('\n==================================================');
  console.log(`SUMMARY: ${testsPassed} / ${testsTotal} TESTS PASSED`);
  console.log('==================================================\n');

  process.exit(testsPassed === testsTotal ? 0 : 1);
}

runSelfPurchaseTests();
