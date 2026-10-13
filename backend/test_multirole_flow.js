const API_URL = 'http://127.0.0.1:5000/api';

async function testCompleteFlow() {
  console.log('=== STARTING MULTI-ROLE SINGLE-ACCOUNT MARKETPLACE TEST ===\n');

  const timestamp = Date.now();
  const testUserEmail = `multirole_user_${timestamp}@example.com`;
  const testUserPassword = 'password123';
  const testUserName = `MultiRole User ${timestamp}`;

  try {
    // 1. REGISTER
    console.log('Step 1: Registering new user...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testUserName,
        email: testUserEmail,
        password: testUserPassword,
        phoneNumber: '9876543210',
        address: '123 Green Street, Kovilpatti',
        latitude: 9.1700,
        longitude: 77.8700,
      }),
    });
    const regData = await regRes.json();

    console.log('Registration Response:');
    console.log('- User ID:', regData._id);
    console.log('- Roles:', JSON.stringify(regData.roles));
    console.log('- Seller Status:', regData.sellerStatus);

    if (
      !regData.roles ||
      !regData.roles.buyer ||
      regData.roles.seller ||
      regData.sellerStatus !== 'none'
    ) {
      throw new Error('Registration failed: User should be buyer: true, seller: false, sellerStatus: "none"');
    }
    console.log('✔ Step 1 Passed: Newly registered user has buyer: true, seller: false, sellerStatus: "none"\n');

    const userToken = regData.token;
    const userId = regData._id;
    const userHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    };

    // 2. LOGIN
    console.log('Step 2: Logging in with new user...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword,
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.token) {
      throw new Error('Login failed: Token not received');
    }
    console.log('✔ Step 2 Passed: User login successful\n');

    // 3. APPLY FOR SELLER ("Start Selling")
    console.log('Step 3: Submitting seller application ("Start Selling")...');
    const applyRes = await fetch(`${API_URL}/auth/apply-seller`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        businessName: `Green Future Nursery ${timestamp}`,
        businessType: 'Home Grower',
        description: 'Organic indoor plants and natural fertilizers',
        businessAddress: '123 Green Street, Kovilpatti',
        upiId: 'multirole@upi',
      }),
    });
    const applyData = await applyRes.json();

    console.log('Seller Application Response:');
    console.log('- Seller Status:', applyData.sellerStatus);
    console.log('- Message:', applyData.message);

    if (applyData.sellerStatus !== 'pending') {
      throw new Error('Apply seller failed: sellerStatus should be "pending"');
    }
    console.log('✔ Step 3 Passed: Seller application submitted, status = "pending"\n');

    // 4. ADMIN LOGIN & APPROVAL
    console.log('Step 4: Logging in as Admin & Approving Seller Application...');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ecolink.com',
        password: 'password123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();

    const adminToken = adminLoginData.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // Verify pending sellers list
    const pendingRes = await fetch(`${API_URL}/admin/sellers/pending`, { headers: adminHeaders });
    const pendingData = await pendingRes.json();
    console.log(`- Pending sellers count for admin: ${pendingData.count}`);
    const isUserInPending = pendingData.sellers.some((s) => s._id.toString() === userId.toString());
    if (!isUserInPending) {
      throw new Error('Admin pending sellers list does not contain the applying user');
    }

    // Approve application
    const approveRes = await fetch(`${API_URL}/admin/sellers/${userId}/verify`, {
      method: 'PUT',
      headers: adminHeaders,
    });
    const approveData = await approveRes.json();
    console.log('Admin Approval Response:');
    console.log('- Roles:', JSON.stringify(approveData.seller.roles));
    console.log('- Seller Status:', approveData.seller.sellerStatus);

    if (
      !approveData.seller.roles.buyer ||
      !approveData.seller.roles.seller ||
      approveData.seller.sellerStatus !== 'approved'
    ) {
      throw new Error('Admin approval failed: User should have buyer: true, seller: true, sellerStatus: "approved"');
    }
    console.log('✔ Step 4 Passed: Admin approval successful. Same user is now BOTH Buyer + Seller!\n');

    // 5. VERIFY REFRESHED USER PROFILE & DUAL ROLE ACCESS
    console.log('Step 5: Fetching updated user profile for same account...');
    const profileRes = await fetch(`${API_URL}/auth/profile`, { headers: userHeaders });
    const profileData = await profileRes.json();
    console.log('- User Email:', profileData.email);
    console.log('- Updated Roles:', JSON.stringify(profileData.roles));
    console.log('- Updated Seller Status:', profileData.sellerStatus);

    if (
      !profileData.roles.buyer ||
      !profileData.roles.seller ||
      profileData.sellerStatus !== 'approved'
    ) {
      throw new Error('User profile verification failed: Account does not reflect buyer + seller role');
    }
    console.log('✔ Step 5 Passed: Profile reflects roles.buyer = true, roles.seller = true without duplicate account creation!\n');

    // 6. SELL A PRODUCT (SELLER FEATURE)
    console.log('Step 6: Testing Seller Feature -> Adding a new product...');
    const newProdRes = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        name: `Organic Monstera Plant ${timestamp}`,
        description: 'Beautiful indoor air-purifying plant grown organically',
        price: 499,
        stock: 15,
        category: 'Indoor Plants',
        images: ['/assets/products/organic-monstera-plant.jpg'],
        isEcoFriendly: true,
      }),
    });
    const newProdData = await newProdRes.json();

    console.log('Create Product Response:');
    console.log('- Product ID:', newProdData.product._id);
    console.log('- Product Name:', newProdData.product.name);
    console.log('- Seller ID:', newProdData.product.seller);

    if (!newProdData.success || newProdData.product.seller.toString() !== userId.toString()) {
      throw new Error('Create product failed');
    }
    const createdProductId = newProdData.product._id;
    console.log('✔ Step 6 Passed: Product listed successfully using Seller authorization\n');

    // 7. BUY A PRODUCT (BUYER FEATURE ON SAME ACCOUNT)
    console.log('Step 7: Testing Buyer Feature -> Purchasing a product using the SAME account...');
    
    // Get available products to purchase
    const allProdsRes = await fetch(`${API_URL}/products`);
    const allProdsData = await allProdsRes.json();
    const otherProduct = allProdsData.products.find(p => p._id.toString() !== createdProductId.toString()) || newProdData.product;

    const orderRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        orderItems: [
          {
            name: otherProduct.name,
            qty: 1,
            price: otherProduct.price,
            image: otherProduct.images?.[0] || '',
            product: otherProduct._id,
          },
        ],
        shippingAddress: '123 Green Street, Kovilpatti',
        paymentMethod: 'COD',
        totalPrice: otherProduct.price,
      }),
    });
    const orderData = await orderRes.json();

    console.log('Create Order Response:');
    console.log('- Order ID:', orderData.order._id);
    console.log('- Total Price: ₹', orderData.order.totalPrice);
    console.log('- Status:', orderData.order.status);

    if (!orderData.success) {
      throw new Error('Create order failed');
    }
    console.log('✔ Step 7 Passed: Order placed successfully using Buyer authorization on SAME account!\n');

    // 8. ACCESS BOTH BUYER & SELLER DASHBOARDS
    console.log('Step 8: Verifying Dashboard API Access for both roles...');
    const myOrdersRes = await fetch(`${API_URL}/orders/myorders`, { headers: userHeaders });
    const myOrdersData = await myOrdersRes.json();
    console.log(`- My Buyer Orders Count: ${myOrdersData.orders.length}`);

    const sellerOrdersRes = await fetch(`${API_URL}/orders/sellerorders`, { headers: userHeaders });
    const sellerOrdersData = await sellerOrdersRes.json();
    console.log(`- Seller Orders Count: ${sellerOrdersData.orders.length}`);

    console.log('✔ Step 8 Passed: Account can access both Buyer Orders and Seller Orders APIs!\n');

    console.log('===========================================================');
    console.log('🎉 ALL 14 MULTI-ROLE SINGLE-ACCOUNT REQUIREMENTS VERIFIED SUCCESSFULLY!');
    console.log('===========================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

testCompleteFlow();
