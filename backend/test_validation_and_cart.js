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

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING ECOLINK VALIDATION & SECURITY TESTS');
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

  // 1. Unauthenticated Cart POST -> 401
  const cartPostUnauth = await makeRequest('POST', '/cart', { productId: '507f1f77bcf86cd799439011', qty: 1 });
  assert(cartPostUnauth.status === 401, 'Guest calling POST /api/cart returns 401 Unauthorized', cartPostUnauth);

  // 2. Unauthenticated Cart GET -> 401
  const cartGetUnauth = await makeRequest('GET', '/cart');
  assert(cartGetUnauth.status === 401, 'Guest calling GET /api/cart returns 401 Unauthorized', cartGetUnauth);

  // Create test user for authenticated requests
  const testEmail = `valtest_${Date.now()}@ecolink.org`;
  const testPass = 'password123';
  let token = '';

  const regRes = await makeRequest('POST', '/auth/register', {
    name: 'Validation Tester',
    email: testEmail,
    password: testPass,
    phoneNumber: '9876543210',
  });

  if (regRes.data.token) {
    token = regRes.data.token;
  } else {
    console.error('Registration failed:', regRes);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Seller Application UPI = jjfbfdfds -> Must reject (400)
  const upiTest1 = await makeRequest(
    'POST',
    '/auth/apply-seller',
    { businessName: 'Eco Shop', businessType: 'Home Grower', upiId: 'jjfbfdfds' },
    authHeaders
  );
  assert(
    upiTest1.status === 400 && upiTest1.data.message && upiTest1.data.message.includes('valid UPI ID'),
    'Seller Application with UPI "jjfbfdfds" rejected with 400 ("Please enter a valid UPI ID (example@bankhandle).")',
    upiTest1
  );

  // 4. Seller Application UPI = example@ -> Must reject (400)
  const upiTest2 = await makeRequest(
    'POST',
    '/auth/apply-seller',
    { businessName: 'Eco Shop', businessType: 'Home Grower', upiId: 'example@' },
    authHeaders
  );
  assert(
    upiTest2.status === 400 && upiTest2.data.message && upiTest2.data.message.includes('valid UPI ID'),
    'Seller Application with UPI "example@" rejected with 400 ("Please enter a valid UPI ID (example@bankhandle).")',
    upiTest2
  );

  // 5. Seller Application UPI = @upi -> Must reject (400)
  const upiTest3 = await makeRequest(
    'POST',
    '/auth/apply-seller',
    { businessName: 'Eco Shop', businessType: 'Home Grower', upiId: '@upi' },
    authHeaders
  );
  assert(
    upiTest3.status === 400 && upiTest3.data.message && upiTest3.data.message.includes('valid UPI ID'),
    'Seller Application with UPI "@upi" rejected with 400 ("Please enter a valid UPI ID (example@bankhandle).")',
    upiTest3
  );

  // 6. Invalid seller form data (empty businessName) -> Must reject (400)
  const emptyNameTest = await makeRequest(
    'POST',
    '/auth/apply-seller',
    { businessName: '   ', businessType: 'Home Grower', upiId: 'example@oksbi' },
    authHeaders
  );
  assert(
    emptyNameTest.status === 400,
    'Seller Application with whitespace businessName rejected with 400',
    emptyNameTest
  );

  // 7. Seller Application UPI = example@oksbi -> Should pass (200)
  const validSellerTest = await makeRequest(
    'POST',
    '/auth/apply-seller',
    { businessName: 'GreenHaven Nursery', businessType: 'Home Grower', upiId: 'example@oksbi' },
    authHeaders
  );
  assert(
    validSellerTest.status === 200 && validSellerTest.data.success,
    'Seller Application with valid UPI "example@oksbi" passed successfully',
    validSellerTest
  );

  // 8. Add to cart quantity <= 0 -> Must reject (400)
  const productsRes = await makeRequest('GET', '/products');
  let sampleProduct = null;
  if (productsRes.data.products && productsRes.data.products.length > 0) {
    sampleProduct = productsRes.data.products[0];
  }

  if (sampleProduct) {
    const invalidQtyTest = await makeRequest(
      'POST',
      '/cart',
      { productId: sampleProduct._id, qty: 0 },
      authHeaders
    );
    assert(invalidQtyTest.status === 400, 'POST /api/cart with qty=0 returned 400 Bad Request', invalidQtyTest);

    // 9. Add to cart valid quantity -> Should succeed (200)
    const validQtyTest = await makeRequest(
      'POST',
      '/cart',
      { productId: sampleProduct._id, qty: 1 },
      authHeaders
    );
    assert(validQtyTest.status === 200 && validQtyTest.data.success, 'POST /api/cart with valid token & qty=1 succeeded', validQtyTest);
  }

  console.log(`\n==================================================`);
  console.log(`FINAL RESULT: ${testsPassed} / ${testsTotal} TEST CASES PASSED`);
  console.log(`==================================================\n`);
}

runTests();
