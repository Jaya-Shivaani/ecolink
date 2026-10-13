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

async function runReviewTests() {
  console.log('\n==================================================');
  console.log('TESTING DYNAMIC RATINGS & REVIEWS FEATURE');
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
  const sellerToken = sellerLogin.data.token;
  const sellerHeaders = { Authorization: `Bearer ${sellerToken}` };

  // 2. Login Buyer (buyer@ecolink.com)
  const buyerLogin = await makeRequest('POST', '/auth/login', {
    email: 'buyer@ecolink.com',
    password: 'password123',
  });
  assert(buyerLogin.status === 200, 'Buyer logged in');
  const buyerToken = buyerLogin.data.token;
  const buyerHeaders = { Authorization: `Bearer ${buyerToken}` };

  // 3. Get Ananya's product
  const productsRes = await makeRequest('GET', '/products');
  const allProducts = productsRes.data.products || productsRes.data;
  const sellerProduct = allProducts.find(
    (p) => (p.seller?._id || p.seller)?.toString() === sellerLogin.data._id.toString()
  );
  assert(!!sellerProduct, `Found product owned by Ananya: "${sellerProduct?.name}"`);

  // 4. Buyer creates an order for sellerProduct
  const createOrderRes = await makeRequest('POST', '/orders', {
    orderItems: [{
      product: sellerProduct._id,
      qty: 1,
      name: sellerProduct.name,
      price: sellerProduct.price,
    }],
    shippingAddress: {
      address: '77 Green Street',
      city: 'Kovilpatti',
      postalCode: '628501',
      country: 'India',
      phoneNumber: '9876543210',
    },
    paymentMethod: 'COD',
    totalPrice: sellerProduct.price,
  }, buyerHeaders);

  assert(createOrderRes.status === 201 && createOrderRes.data.order?._id, 'Buyer created order successfully');
  const orderId = createOrderRes.data.order._id;
  const orderStatus = createOrderRes.data.order.status; // Default is 'Placed'
  console.log(`Created Order ${orderId} with status: "${orderStatus}"`);

  // --- TEST CASE 5: Direct review attempt while order is "Placed" (MUST FAIL) ---
  const reviewPlacedRes = await makeRequest('POST', '/reviews', {
    orderId,
    productId: sellerProduct._id,
    rating: 5,
    comment: 'Great plant, loved the packaging!',
  }, buyerHeaders);

  assert(
    reviewPlacedRes.status === 400 &&
    reviewPlacedRes.data.message &&
    reviewPlacedRes.data.message.includes('delivered orders'),
    `Review rejected when order status is "Placed" (400: "${reviewPlacedRes.data.message}")`
  );

  // --- TEST CASE 6: Seller updates status to "Processing" -> Review still blocked ---
  await makeRequest('PUT', `/orders/${orderId}/status`, { status: 'Processing' }, sellerHeaders);
  const reviewProcessingRes = await makeRequest('POST', '/reviews', {
    orderId,
    productId: sellerProduct._id,
    rating: 5,
    comment: 'Plant arrived in great condition!',
  }, buyerHeaders);

  assert(
    reviewProcessingRes.status === 400 &&
    reviewProcessingRes.data.message &&
    reviewProcessingRes.data.message.includes('Processing'),
    `Review rejected when order status is "Processing" (400: "${reviewProcessingRes.data.message}")`
  );

  // --- TEST CASE 7: Seller updates status to "Dispatched" -> Review still blocked ---
  await makeRequest('PUT', `/orders/${orderId}/status`, { status: 'Dispatched' }, sellerHeaders);
  const reviewDispatchedRes = await makeRequest('POST', '/reviews', {
    orderId,
    productId: sellerProduct._id,
    rating: 5,
    comment: 'Plant arrived in great condition!',
  }, buyerHeaders);

  assert(
    reviewDispatchedRes.status === 400 &&
    reviewDispatchedRes.data.message &&
    reviewDispatchedRes.data.message.includes('Dispatched'),
    `Review rejected when order status is "Dispatched" (400)`
  );

  // --- TEST CASE 8: Seller marks order "Delivered" ---
  const deliverRes = await makeRequest('PUT', `/orders/${orderId}/status`, { status: 'Delivered' }, sellerHeaders);
  assert(deliverRes.status === 200 && deliverRes.data.order?.status === 'Delivered', 'Seller successfully marked order as Delivered');

  // --- TEST CASE 9: Invalid rating (< 1 or > 5) rejected ---
  const invalidRatingRes = await makeRequest('POST', '/reviews', {
    orderId,
    productId: sellerProduct._id,
    rating: 6,
    comment: 'Awesome product!',
  }, buyerHeaders);
  assert(invalidRatingRes.status === 400, 'Rating of 6 rejected with 400');

  // --- TEST CASE 10: Buyer reviews product with valid rating, comment, and images ---
  const submitReviewRes = await makeRequest('POST', '/reviews', {
    orderId,
    productId: sellerProduct._id,
    rating: 5,
    comment: 'Exceptional quality! Leaves are vibrant green and healthy. Safely delivered with zero plastic.',
    images: ['/uploads/test-leaf.jpg', '/uploads/test-pot.jpg'],
  }, buyerHeaders);

  assert(
    submitReviewRes.status === 201 && submitReviewRes.data.success === true,
    'Buyer successfully submitted 5-star review for delivered order (201 Created)',
    submitReviewRes
  );
  const createdReviewId = submitReviewRes.data.review?._id;

  // --- TEST CASE 11: Duplicate review for same product and order rejected ---
  const duplicateReviewRes = await makeRequest('POST', '/reviews', {
    orderId,
    productId: sellerProduct._id,
    rating: 4,
    comment: 'Trying to review again.',
  }, buyerHeaders);

  assert(
    duplicateReviewRes.status === 400 &&
    duplicateReviewRes.data.message &&
    duplicateReviewRes.data.message.includes('already submitted a review'),
    'Duplicate review for the same delivered order item blocked (400: "already submitted a review")'
  );

  // --- TEST CASE 12: GET /api/products/:productId/reviews returns reviews, average rating & distribution ---
  const getReviewsRes = await makeRequest('GET', `/products/${sellerProduct._id}/reviews`);
  assert(
    getReviewsRes.status === 200 &&
    getReviewsRes.data.count >= 1 &&
    getReviewsRes.data.averageRating > 0 &&
    getReviewsRes.data.ratingDistribution &&
    getReviewsRes.data.ratingDistribution['5'] >= 1,
    `Product reviews retrieved with averageRating: ${getReviewsRes.data.averageRating}, count: ${getReviewsRes.data.count}`,
    getReviewsRes.data
  );

  // --- TEST CASE 13: Product document average rating and reviewCount updated ---
  const getProdRes = await makeRequest('GET', `/products/${sellerProduct._id}`);
  assert(
    getProdRes.status === 200 &&
    getProdRes.data.product?.rating > 0 &&
    getProdRes.data.product?.totalReviews >= 1,
    `Product model rating dynamically updated in DB (rating: ${getProdRes.data.product?.rating}, totalReviews: ${getProdRes.data.product?.totalReviews})`
  );

  // --- TEST CASE 14: Buyer edits their review (PUT /api/reviews/:id) ---
  const editReviewRes = await makeRequest('PUT', `/reviews/${createdReviewId}`, {
    rating: 4,
    comment: 'Updated review: Plant is doing great, sprouted a new leaf!',
    images: ['/uploads/test-leaf-update.jpg'],
  }, buyerHeaders);

  assert(
    editReviewRes.status === 200 &&
    editReviewRes.data.review?.rating === 4 &&
    editReviewRes.data.review?.comment.includes('sprouted a new leaf'),
    'Buyer successfully edited their review to 4 stars and new comment'
  );

  // --- TEST CASE 15: Another user cannot edit the buyer\'s review ---
  const unauthorizedEditRes = await makeRequest('PUT', `/reviews/${createdReviewId}`, {
    rating: 1,
    comment: 'Malicious edit by someone else',
  }, sellerHeaders);

  assert(
    unauthorizedEditRes.status === 403,
    'Non-owner blocked from editing review (403 Forbidden)'
  );

  console.log('\n==================================================');
  console.log(`SUMMARY: ${testsPassed} / ${testsTotal} TESTS PASSED`);
  console.log('==================================================\n');

  process.exit(testsPassed === testsTotal ? 0 : 1);
}

runReviewTests();
