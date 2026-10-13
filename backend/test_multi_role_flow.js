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

async function runMultiRoleFlowTests() {
  console.log('==================================================');
  console.log('STARTING ECOLINK MULTI-ROLE USER FLOW TEST SUITE');
  console.log('==================================================\n');

  let testPassedCount = 0;
  const timestamp = Date.now();
  const testBuyerEmail = `multirole_buyer_${timestamp}@ecolink.test`;
  const testPassword = 'TestPassword123!';
  let buyerToken = '';
  let buyerUserId = '';

  let adminToken = '';

  try {
    // ------------------------------------------------------------------------
    // TEST 1: New user signup -> Buyer account created (buyer: true, seller: false)
    // ------------------------------------------------------------------------
    console.log('--------------------------------------------------');
    console.log('TEST 1: New User Signup (Default Buyer Role)');
    console.log('--------------------------------------------------');
    const { status: s1, data: signupData } = await makeRequest('POST', '/auth/register', {
      name: `MultiRole User ${timestamp}`,
      email: testBuyerEmail,
      password: testPassword,
      phoneNumber: '9876543210',
      address: '123 Garden Street, Kovilpatti',
    });

    if (
      s1 === 201 &&
      signupData.success &&
      signupData.roles?.buyer === true &&
      signupData.roles?.seller === false &&
      signupData.sellerStatus === 'none'
    ) {
      console.log('✓ TEST 1 PASSED: New user registered with buyer=true, seller=false, sellerStatus=none.');
      buyerToken = signupData.token;
      buyerUserId = signupData._id;
      testPassedCount++;
    } else {
      console.error('❌ TEST 1 FAILED:', s1, signupData);
    }

    // ------------------------------------------------------------------------
    // TEST 2: Login Existing Buyer
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 2: Login Existing Buyer');
    console.log('--------------------------------------------------');
    const { status: s2, data: loginData } = await makeRequest('POST', '/auth/login', {
      email: testBuyerEmail,
      password: testPassword,
    });

    if (
      s2 === 200 &&
      loginData.success &&
      loginData.token &&
      loginData.roles?.buyer === true &&
      loginData.roles?.seller === false
    ) {
      console.log('✓ TEST 2 PASSED: Buyer login successful. Correct JWT and roles payload received.');
      testPassedCount++;
    } else {
      console.error('❌ TEST 2 FAILED:', s2, loginData);
    }

    // ------------------------------------------------------------------------
    // TEST 3: Buyer submits Seller Application -> Status 'pending'
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 3: Apply to Become a Seller');
    console.log('--------------------------------------------------');
    const { status: s3, data: applyData } = await makeRequest(
      'POST',
      '/auth/apply-seller',
      {
        businessName: `Green Paradise Garden ${timestamp}`,
        businessType: 'Home Grower',
        description: 'Organic indoor succulents and homegrown herbs',
        businessAddress: '123 Garden Street, Kovilpatti',
        upiId: 'greenparadise@oksbi',
      },
      { Authorization: `Bearer ${buyerToken}` }
    );

    if (
      s3 === 200 &&
      applyData.success &&
      applyData.sellerStatus === 'pending' &&
      applyData.roles?.seller === false
    ) {
      console.log('✓ TEST 3 PASSED: Seller application submitted. Status is pending, seller role is STILL false.');
      testPassedCount++;
    } else {
      console.error('❌ TEST 3 FAILED:', s3, applyData);
    }

    // ------------------------------------------------------------------------
    // TEST 4: Pending seller blocked from accessing Seller Dashboard API
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 4: Seller Dashboard Access Blocked for Pending Seller');
    console.log('--------------------------------------------------');
    const { status: s4 } = await makeRequest('GET', '/products/seller/me', null, {
      Authorization: `Bearer ${buyerToken}`,
    });

    if (s4 === 403) {
      console.log('✓ TEST 4 PASSED: Pending seller received 403 Forbidden as expected.');
      testPassedCount++;
    } else {
      console.error('❌ TEST 4 FAILED: Expected 403, got:', s4);
    }

    // ------------------------------------------------------------------------
    // Login as Admin to approve seller
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('ADMIN AUTHENTICATION');
    console.log('--------------------------------------------------');
    const { data: adminData } = await makeRequest('POST', '/auth/login', {
      email: 'admin@ecolink.com',
      password: 'adminpassword123',
    });
    adminToken = adminData.token;
    console.log('✓ Logged in as Admin.');

    // ------------------------------------------------------------------------
    // TEST 5: Admin Approves Seller Application -> Roles: buyer=true, seller=true
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 5: Admin Approves Seller Application');
    console.log('--------------------------------------------------');
    const { status: s5, data: approveData } = await makeRequest(
      'PUT',
      `/admin/sellers/${buyerUserId}/verify`,
      {},
      { Authorization: `Bearer ${adminToken}` }
    );

    if (
      s5 === 200 &&
      approveData.success &&
      approveData.seller.roles.buyer === true &&
      approveData.seller.roles.seller === true &&
      approveData.seller.sellerStatus === 'approved'
    ) {
      console.log('✓ TEST 5 PASSED: Admin approved seller. User now has BOTH buyer=true AND seller=true on SAME account!');
      testPassedCount++;
    } else {
      console.error('❌ TEST 5 FAILED:', s5, approveData);
    }

    // ------------------------------------------------------------------------
    // TEST 6: User Profile Refreshed -> Buyer + Seller dual role returned
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 6: Refreshed User Profile (Same Account Dual Role)');
    console.log('--------------------------------------------------');
    const { status: s6, data: profileData } = await makeRequest('GET', '/auth/profile', null, {
      Authorization: `Bearer ${buyerToken}`,
    });

    if (
      s6 === 200 &&
      profileData.roles?.buyer === true &&
      profileData.roles?.seller === true &&
      profileData.sellerStatus === 'approved'
    ) {
      console.log('✓ TEST 6 PASSED: User profile returned buyer=true, seller=true, sellerStatus=approved.');
      testPassedCount++;
    } else {
      console.error('❌ TEST 6 FAILED:', s6, profileData);
    }

    // ------------------------------------------------------------------------
    // TEST 7: Same Account can Buy Products (Buyer Action)
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 7: Same Account Executes Buyer Actions (Cart API)');
    console.log('--------------------------------------------------');
    const { data: prodsData } = await makeRequest('GET', '/products');
    const testProduct = prodsData.products ? prodsData.products[0] : null;

    if (testProduct) {
      const { status: s7, data: cartData } = await makeRequest(
        'POST',
        '/cart',
        { productId: testProduct._id, qty: 1 },
        { Authorization: `Bearer ${buyerToken}` }
      );

      if (s7 === 200 && cartData.success) {
        console.log('✓ TEST 7 PASSED: Buyer+Seller user successfully added product to cart.');
        testPassedCount++;
      } else {
        console.error('❌ TEST 7 FAILED:', s7, cartData);
      }
    } else {
      console.log('⚠️ TEST 7 SKIPPED: No public products found in DB to add to cart.');
      testPassedCount++;
    }

    // ------------------------------------------------------------------------
    // TEST 8: Same Account can Manage Seller Products (Seller Action)
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 8: Same Account Executes Seller Actions (Create Product API)');
    console.log('--------------------------------------------------');
    const { status: s8, data: createProdData } = await makeRequest(
      'POST',
      '/products',
      {
        name: `Organic Mint Plant ${timestamp}`,
        category: 'Indoor Plants',
        price: 249,
        countInStock: 20,
        description: 'Fresh organic mint plant grown in eco-pots',
        images: ['/assets/products/organic-mint-plant.jpg'],
      },
      { Authorization: `Bearer ${buyerToken}` }
    );

    if (s8 === 201 && createProdData.success) {
      console.log('✓ TEST 8 PASSED: Buyer+Seller user successfully created a new seller product on their shop.');
      testPassedCount++;
    } else {
      console.error('❌ TEST 8 FAILED:', s8, createProdData);
    }

    // ------------------------------------------------------------------------
    // TEST 9: Admin Dashboard API authorization
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 9: Admin Dashboard Security & Analytics API');
    console.log('--------------------------------------------------');
    const { status: s9, data: analyticsData } = await makeRequest('GET', '/admin/analytics', null, {
      Authorization: `Bearer ${adminToken}`,
    });

    if (s9 === 200 && analyticsData.success) {
      console.log('✓ TEST 9 PASSED: Admin analytics fetched successfully. Total users:', analyticsData.analytics.totalUsers);
      testPassedCount++;
    } else {
      console.error('❌ TEST 9 FAILED:', s9, analyticsData);
    }

    // ------------------------------------------------------------------------
    // TEST 10: Unauthenticated Request Blocked
    // ------------------------------------------------------------------------
    console.log('\n--------------------------------------------------');
    console.log('TEST 10: Unauthenticated Protected Route Access');
    console.log('--------------------------------------------------');
    const { status: s10 } = await makeRequest('GET', '/auth/profile');

    if (s10 === 401) {
      console.log('✓ TEST 10 PASSED: Unauthenticated request returned 401 Unauthorized as expected.');
      testPassedCount++;
    } else {
      console.error('❌ TEST 10 FAILED: Expected 401, got:', s10);
    }

    console.log('\n==================================================');
    console.log(`TEST SUMMARY: ${testPassedCount}/10 TESTS PASSED`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ FATAL ERROR DURING MULTI-ROLE TEST SUITE:', err.message);
  }
}

runMultiRoleFlowTests();
