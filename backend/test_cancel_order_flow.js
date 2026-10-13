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

async function runCancelOrderTests() {
  console.log('\n==================================================');
  console.log('TESTING DYNAMIC CANCEL ORDER FEATURE & INVENTORY RESTORATION');
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

  // 1. Login Seller (Ananya)
  const sellerLogin = await makeRequest('POST', '/auth/login', {
    email: 'ananya@ecolink.com',
    password: 'password123',
  });
  assert(sellerLogin.status === 200, 'Seller Ananya logged in');
  const sellerHeaders = { Authorization: `Bearer ${sellerLogin.data.token}` };

  // 2. Login Buyer (buyer@ecolink.com)
  const buyerLogin = await makeRequest('POST', '/auth/login', {
    email: 'buyer@ecolink.com',
    password: 'password123',
  });
  assert(buyerLogin.status === 200, 'Buyer logged in');
  const buyerHeaders = { Authorization: `Bearer ${buyerLogin.data.token}` };

  // 3. Login 2nd Buyer (different user)
  const buyer2Email = `buyer2_${Date.now()}@test.com`;
  const regBuyer2 = await makeRequest('POST', '/auth/register', {
    name: 'Different Buyer',
    email: buyer2Email,
    password: 'password123',
    phoneNumber: '9988776655',
  });
  const buyer2Headers = { Authorization: `Bearer ${regBuyer2.data.token}` };

  // 4. Fetch Ananya's product and note initial stock
  const productsRes = await makeRequest('GET', '/products');
  const allProducts = productsRes.data.products || productsRes.data;
  const sellerProduct = allProducts.find(
    (p) => (p.seller?._id || p.seller)?.toString() === sellerLogin.data._id.toString()
  );
  assert(!!sellerProduct, `Found product: "${sellerProduct?.name}"`);

  const initialProdRes = await makeRequest('GET', `/products/${sellerProduct._id}`);
  const initialStock = initialProdRes.data.product.stock;
  console.log(`Initial stock for "${sellerProduct.name}": ${initialStock}`);

  // --- FLOW 1: Placed -> Cancelled & Stock Restoration ---
  const order1Qty = 2;
  const createOrder1 = await makeRequest('POST', '/orders', {
    orderItems: [{
      product: sellerProduct._id,
      qty: order1Qty,
      name: sellerProduct.name,
      price: sellerProduct.price,
    }],
    shippingAddress: {
      address: '10 Organic Street',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: sellerProduct.price * order1Qty,
  }, buyerHeaders);

  assert(createOrder1.status === 201 && createOrder1.data.order?._id, 'Order 1 created with status "Placed"');
  const order1Id = createOrder1.data.order._id;

  // Verify stock decremented
  const afterOrder1Prod = await makeRequest('GET', `/products/${sellerProduct._id}`);
  assert(
    afterOrder1Prod.data.product.stock === initialStock - order1Qty,
    `Stock correctly decremented from ${initialStock} to ${afterOrder1Prod.data.product.stock}`
  );

  // Unauthorized cancel attempt by different buyer -> 403
  const unauthCancelRes = await makeRequest('PATCH', `/orders/${order1Id}/cancel`, {
    cancellationReason: 'Changed my mind',
  }, buyer2Headers);
  assert(unauthCancelRes.status === 403, 'Unauthorized buyer blocked from cancelling someone else\'s order (403)');

  // Buyer cancels Order 1
  const cancelOrder1Res = await makeRequest('PATCH', `/orders/${order1Id}/cancel`, {
    cancellationReason: 'Ordered by mistake',
    cancellationNote: 'Accidentally selected 2 units instead of 1',
  }, buyerHeaders);

  assert(
    cancelOrder1Res.status === 200 &&
    cancelOrder1Res.data.order?.status === 'Cancelled' &&
    cancelOrder1Res.data.order?.cancellationReason === 'Ordered by mistake',
    'Buyer successfully cancelled Order 1 (Status: Cancelled, reason stored)'
  );

  // Verify stock restored
  const afterCancel1Prod = await makeRequest('GET', `/products/${sellerProduct._id}`);
  assert(
    afterCancel1Prod.data.product.stock === initialStock,
    `Stock restored back to ${afterCancel1Prod.data.product.stock} (Initial: ${initialStock})`
  );

  // Attempt to cancel again -> 400 already cancelled
  const repeatCancelRes = await makeRequest('PATCH', `/orders/${order1Id}/cancel`, {
    cancellationReason: 'Changed my mind',
  }, buyerHeaders);
  assert(
    repeatCancelRes.status === 400 && repeatCancelRes.data.message.includes('already cancelled'),
    'Duplicate cancellation request blocked (400: "already cancelled")'
  );

  // Verify stock was NOT restored a second time (idempotency check)
  const afterRepeatCancelProd = await makeRequest('GET', `/products/${sellerProduct._id}`);
  assert(
    afterRepeatCancelProd.data.product.stock === initialStock,
    `Stock remains strictly ${initialStock} (idempotent restoration)`
  );

  // Seller attempts to process or ship the cancelled order -> 400
  const sellerUpdateCancelledRes = await makeRequest('PUT', `/orders/${order1Id}/status`, {
    status: 'Processing',
  }, sellerHeaders);
  assert(
    sellerUpdateCancelledRes.status === 400 && sellerUpdateCancelledRes.data.message.includes('cancelled order'),
    'Seller blocked from processing/shipping a cancelled order (400)'
  );

  // --- FLOW 2: Accepted status -> Cancellation allowed ---
  const createOrder2 = await makeRequest('POST', '/orders', {
    orderItems: [{
      product: sellerProduct._id,
      qty: 1,
      name: sellerProduct.name,
      price: sellerProduct.price,
    }],
    shippingAddress: {
      address: '20 Green Way',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: sellerProduct.price,
  }, buyerHeaders);
  const order2Id = createOrder2.data.order._id;

  // Seller updates to "Accepted"
  await makeRequest('PUT', `/orders/${order2Id}/status`, { status: 'Accepted' }, sellerHeaders);

  const cancelOrder2Res = await makeRequest('PATCH', `/orders/${order2Id}/cancel`, {
    cancellationReason: 'Found another product',
  }, buyerHeaders);
  assert(
    cancelOrder2Res.status === 200 && cancelOrder2Res.data.order?.status === 'Cancelled',
    'Order with status "Accepted" can be cancelled by buyer'
  );

  // --- FLOW 3: Processing status -> Cancellation allowed ---
  const createOrder3 = await makeRequest('POST', '/orders', {
    orderItems: [{
      product: sellerProduct._id,
      qty: 1,
      name: sellerProduct.name,
      price: sellerProduct.price,
    }],
    shippingAddress: {
      address: '30 Green Way',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: sellerProduct.price,
  }, buyerHeaders);
  const order3Id = createOrder3.data.order._id;

  // Seller updates to "Processing"
  await makeRequest('PUT', `/orders/${order3Id}/status`, { status: 'Processing' }, sellerHeaders);

  const cancelOrder3Res = await makeRequest('PATCH', `/orders/${order3Id}/cancel`, {
    cancellationReason: 'Delivery taking too long',
  }, buyerHeaders);
  assert(
    cancelOrder3Res.status === 200 && cancelOrder3Res.data.order?.status === 'Cancelled',
    'Order with status "Processing" can be cancelled by buyer'
  );

  // --- FLOW 4: Dispatched / Shipped status -> Cancellation BLOCKED ---
  const createOrder4 = await makeRequest('POST', '/orders', {
    orderItems: [{
      product: sellerProduct._id,
      qty: 1,
      name: sellerProduct.name,
      price: sellerProduct.price,
    }],
    shippingAddress: {
      address: '40 Green Way',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: sellerProduct.price,
  }, buyerHeaders);
  const order4Id = createOrder4.data.order._id;

  // Seller updates to "Dispatched"
  await makeRequest('PUT', `/orders/${order4Id}/status`, { status: 'Dispatched' }, sellerHeaders);

  const cancelDispatchedRes = await makeRequest('PATCH', `/orders/${order4Id}/cancel`, {
    cancellationReason: 'Changed my mind',
  }, buyerHeaders);
  assert(
    cancelDispatchedRes.status === 400 && cancelDispatchedRes.data.message.includes('Dispatched'),
    'Cancellation BLOCKED once order has reached "Dispatched" status (400)'
  );

  // --- FLOW 5: Delivered status -> Cancellation BLOCKED ---
  await makeRequest('PUT', `/orders/${order4Id}/status`, { status: 'Delivered' }, sellerHeaders);

  const cancelDeliveredRes = await makeRequest('PATCH', `/orders/${order4Id}/cancel`, {
    cancellationReason: 'Changed my mind',
  }, buyerHeaders);
  assert(
    cancelDeliveredRes.status === 400 && cancelDeliveredRes.data.message.includes('Delivered'),
    'Cancellation BLOCKED once order has reached "Delivered" status (400)'
  );

  console.log('\n==================================================');
  console.log(`SUMMARY: ${testsPassed} / ${testsTotal} TESTS PASSED`);
  console.log('==================================================\n');

  process.exit(testsPassed === testsTotal ? 0 : 1);
}

runCancelOrderTests();
